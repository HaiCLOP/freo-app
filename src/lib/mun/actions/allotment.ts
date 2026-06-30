"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { enforceMunRateLimit } from "../rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function runAIAllotment(conferenceId: string, committeeId: string) {
  await enforceMunRateLimit("allotment", conferenceId);
  const supabase = await createClient();

  // 1. Fetch unassigned delegates that requested this committee in their top 3 preferences
  const { data: delegates, error: delErr } = await supabase
    .from("mun_registrations")
    .select("id, delegate_name, delegate_school, experience_level, committee_pref_1, committee_pref_2, committee_pref_3")
    .eq("conference_id", conferenceId)
    .eq("status", "APPROVED")
    .is("portfolio_allotted", null)
    .or(`committee_pref_1.eq.${committeeId},committee_pref_2.eq.${committeeId},committee_pref_3.eq.${committeeId}`);

  if (delErr) throw new Error("Failed to fetch delegates: " + delErr.message);
  if (!delegates || delegates.length === 0) return { success: true, message: "No unassigned delegates for this committee", count: 0 };

  // 2. Fetch available portfolios for this committee
  const { data: portfolios, error: portErr } = await supabase
    .from("mun_portfolios")
    .select("id, name, capacity, is_featured")
    .eq("committee_id", committeeId);

  if (portErr) throw new Error("Failed to fetch portfolios: " + portErr.message);
  
  // Also get existing allotments to adjust capacities
  const { data: existingAllotments } = await supabase
    .from("mun_registrations")
    .select("portfolio_allotted")
    .eq("conference_id", conferenceId)
    .not("portfolio_allotted", "is", null);

  const filledCount: Record<string, number> = {};
  if (existingAllotments) {
    for (const a of existingAllotments) {
      if (a.portfolio_allotted) {
        filledCount[a.portfolio_allotted] = (filledCount[a.portfolio_allotted] || 0) + 1;
      }
    }
  }

  const availablePortfolios = portfolios.filter(p => {
    const current = filledCount[p.id] || 0;
    return current < p.capacity;
  }).map(p => ({
    ...p,
    available_spots: p.capacity - (filledCount[p.id] || 0)
  }));

  if (availablePortfolios.length === 0) {
    return { success: false, message: "No available portfolios in this committee", count: 0 };
  }

  // 3. Prepare AI Prompt
  const prompt = `
You are an expert Model United Nations (MUN) Executive Board member tasked with allotting portfolios to delegates.
You must return a JSON response ONLY.

Your goals:
1. Match delegates to a portfolio.
2. Ensure no portfolio exceeds its available_spots.
3. Prioritize 'ADVANCED' delegates for 'is_featured' portfolios.
4. Try to satisfy their preferences (Pref 1 is highest priority).

Delegates Data:
${JSON.stringify(delegates, null, 2)}

Available Portfolios Data:
${JSON.stringify(availablePortfolios, null, 2)}

Committee ID: ${committeeId}

Return a valid JSON array where each object has:
- registration_id (string)
- portfolio_id (string)

Return ONLY the JSON array, no markdown formatting.
  `;

  // 4. Call Gemini AI
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim();
    }
    
    const assignments: Array<{ registration_id: string, portfolio_id: string }> = JSON.parse(text);

    // 5. Save allotments to DB
    let count = 0;
    for (const assignment of assignments) {
      // Validate that both exist
      if (delegates.find(d => d.id === assignment.registration_id) && availablePortfolios.find(p => p.id === assignment.portfolio_id)) {
        await supabase
          .from("mun_registrations")
          .update({ portfolio_allotted: assignment.portfolio_id })
          .eq("id", assignment.registration_id);
        count++;
      }
    }

    return { success: true, count, message: `Successfully allotted ${count} delegates.` };

  } catch (error: any) {
    console.error("AI Allotment Error:", error);
    throw new Error("Failed to run AI allotment: " + error.message);
  }
}

export async function clearAllotments(conferenceId: string, committeeId: string) {
  const supabase = await createClient();
  
  // Find all registrations that have a portfolio in this committee
  const { data: portfolios } = await supabase
    .from("mun_portfolios")
    .select("id")
    .eq("committee_id", committeeId);
    
  if (!portfolios || portfolios.length === 0) return { success: true, count: 0 };
  
  const portfolioIds = portfolios.map(p => p.id);
  
  const { error, count } = await supabase
    .from("mun_registrations")
    .update({ portfolio_allotted: null })
    .in("portfolio_allotted", portfolioIds)
    .eq("conference_id", conferenceId);
    
  if (error) throw new Error("Failed to clear allotments: " + error.message);
  
  return { success: true, count: count || 0 };
}

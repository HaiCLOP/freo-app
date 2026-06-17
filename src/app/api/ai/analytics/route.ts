import { createClient } from "@/lib/supabase/server";
import { checkAiAnalyticsLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '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',
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting
    const limitStatus = await checkAiAnalyticsLimit(user.id);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: "Daily AI Analytics limit exceeded. Try again tomorrow." },
        { status: 429 }
      );
    }

    const { messages, contextData } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const systemPrompt = `You are Freo AI, a friendly and expert event analytics assistant for event creators.
You are analyzing the creator's real-time dashboard data. Be concise, encouraging, and insightful.

CRITICAL FORMATTING RULES — you MUST follow these:
- Do NOT use markdown. No #, ##, ###, **, *, -, or any markdown syntax at all.
- Write in clean, natural plain text paragraphs.
- Use line breaks to separate sections.
- When listing items, use simple numbered lists like "1." or write them as short sentences.
- Mention key numbers naturally in sentences, e.g. "You have 42 total registrations with a 78% approval rate."
- Keep responses short — 3 to 5 short paragraphs max.

Here is the creator's current dashboard data:
${JSON.stringify(contextData, null, 2)}

Only reference numbers that exist in the data above. Never make up statistics.
If asked about data you don't have, say so politely.`;

    const result = await generateText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      system: systemPrompt,
      messages: messages,
    });

    return new Response(result.text, { status: 200 });

  } catch (error) {
    console.error("AI Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to process AI query. Please check your API key or try again later." },
      { status: 500 }
    );
  }
}

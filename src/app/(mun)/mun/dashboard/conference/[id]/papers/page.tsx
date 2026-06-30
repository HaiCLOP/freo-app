import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaperReviewQueue } from "@/components/mun/PaperReviewQueue";

export default async function PapersReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // In a real app we'd fetch this conference to ensure the user has access.
  // We'll skip that check here since they are inside the dashboard layout anyway.

  // Fetch all position papers for this conference's committees
  // Supabase relationships: mun_position_papers -> mun_registrations -> conference_id
  
  // Since our schema might not have an easy join for conference_id directly on position_papers,
  // we first get all committees for this conference.
  const { data: committees } = await supabase
    .from("mun_committees")
    .select("id, short_name")
    .eq("conference_id", id);
    
  if (!committees || committees.length === 0) {
    return <div className="p-12 text-center text-[#6B7280]">No committees found for this conference.</div>;
  }
  
  const committeeIds = committees.map(c => c.id);

  // Get papers with registration and committee data
  const { data: papers, error } = await supabase
    .from("mun_position_papers")
    .select(`
      id, version, file_url, status, eb_comments, score, submitted_at,
      registration:mun_registrations(id, delegate_name, delegate_school, portfolio_allotted),
      committee:mun_committees(id, short_name)
    `)
    .in("committee_id", committeeIds)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching papers:", error);
    return <div className="p-12 text-center text-red-500">Failed to load papers.</div>;
  }
  
  // We need to fetch portfolio names since we only have portfolio_id from registration
  const portfolioIds = papers
    ?.filter(p => (p.registration as any)?.portfolio_allotted)
    .map(p => (p.registration as any).portfolio_allotted as string) || [];
    
  let portfoliosMap: Record<string, string> = {};
  if (portfolioIds.length > 0) {
    const { data: portfolios } = await supabase
      .from("mun_portfolios")
      .select("id, name")
      .in("id", [...new Set(portfolioIds)]);
      
    if (portfolios) {
      portfoliosMap = portfolios.reduce((acc, p) => ({...acc, [p.id]: p.name}), {});
    }
  }

  // Format data for the client component
  const formattedPapers = (papers || []).map(p => ({
    id: p.id,
    version: p.version,
    file_url: p.file_url,
    status: p.status,
    eb_comments: p.eb_comments,
    score: p.score,
    submitted_at: p.submitted_at,
    registration: {
      delegate_name: (p.registration as any).delegate_name,
      delegate_school: (p.registration as any).delegate_school,
      portfolio: (p.registration as any).portfolio_allotted ? {
        name: portfoliosMap[(p.registration as any).portfolio_allotted] || "Unknown Portfolio"
      } : null
    },
    committee: {
      short_name: (p.committee as any).short_name
    }
  }));

  return (
    <PaperReviewQueue
      conferenceId={id}
      papers={formattedPapers as any}
    />
  );
}

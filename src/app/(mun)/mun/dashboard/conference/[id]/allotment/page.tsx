import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllotmentDashboard } from "@/components/mun/AllotmentDashboard";

export default async function AllotmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch committees
  const { data: committees } = await supabase
    .from("mun_committees")
    .select("id, name, short_name")
    .eq("conference_id", id)
    .order("display_order");

  if (!committees || committees.length === 0) {
    return <div className="p-12 text-center text-[#6B7280]">No committees found.</div>;
  }

  // Fetch all registrations
  const { data: registrations } = await supabase
    .from("mun_registrations")
    .select("id, committee_pref_1, committee_pref_2, committee_pref_3, portfolio_allotted")
    .eq("conference_id", id)
    .eq("status", "APPROVED");

  // Fetch all portfolios
  const { data: portfolios } = await supabase
    .from("mun_portfolios")
    .select("id, committee_id, capacity");

  const committeesWithStats = committees.map(c => {
    // Delegates who requested this committee
    const totalDelegates = (registrations || []).filter(r => 
      r.committee_pref_1 === c.id || r.committee_pref_2 === c.id || r.committee_pref_3 === c.id
    ).length;

    // Portfolios for this committee
    const committeePortfolios = (portfolios || []).filter(p => p.committee_id === c.id);
    const capacity = committeePortfolios.reduce((sum, p) => sum + p.capacity, 0);

    // Assigned count
    const assignedCount = (registrations || []).filter(r => 
      r.portfolio_allotted && committeePortfolios.some(p => p.id === r.portfolio_allotted)
    ).length;

    return {
      ...c,
      stats: {
        total_delegates: totalDelegates,
        assigned_count: assignedCount,
        portfolio_capacity: capacity,
      }
    };
  });

  return (
    <AllotmentDashboard
      conferenceId={id}
      committees={committeesWithStats}
    />
  );
}

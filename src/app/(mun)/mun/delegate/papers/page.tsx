import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DelegatePaperUpload } from "@/components/mun/DelegatePaperUpload";

export default async function DelegatePapersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch delegate's active registration
  const { data: registration } = await supabase
    .from("mun_registrations")
    .select("id, portfolio_allotted")
    .eq("user_id", user.id)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!registration || !registration.portfolio_allotted) {
    return (
      <div className="neo-card bg-white p-12 text-center">
        <h2 className="text-xl font-bold text-[#1B1C20] mb-2">Portfolio Not Allotted Yet</h2>
        <p className="text-[#6B7280]">
          You can submit a position paper only after you have been assigned a portfolio.
        </p>
      </div>
    );
  }

  // Get the committee_id for this portfolio
  const { data: portfolio } = await supabase
    .from("mun_portfolios")
    .select("committee_id")
    .eq("id", registration.portfolio_allotted)
    .single();

  if (!portfolio) return null;

  // Fetch existing papers
  const { data: papers } = await supabase
    .from("mun_position_papers")
    .select("*")
    .eq("registration_id", registration.id)
    .eq("committee_id", portfolio.committee_id)
    .order("version", { ascending: false });

  return (
    <DelegatePaperUpload
      registrationId={registration.id}
      committeeId={portfolio.committee_id}
      papers={(papers || []) as any}
    />
  );
}

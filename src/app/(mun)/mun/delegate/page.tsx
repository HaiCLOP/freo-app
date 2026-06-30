import { createClient } from "@/lib/supabase/server";
import { Sparkles, CalendarDays, MapPin } from "lucide-react";

export default async function DelegateDashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch delegate's active registration
  const { data: registration } = await supabase
    .from("mun_registrations")
    .select(`
      *,
      conference:mun_conferences(name, org_name, date_start, date_end, venue, city),
      portfolio:mun_portfolios(id, name, committee_id),
      committee:mun_committees(id, name, short_name, type)
    `)
    .eq("user_id", user!.id)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!registration) return null; // Handled by layout

  const conf = registration.conference as any;
  const portfolio = registration.portfolio as any;

  // We need to fetch committee data if a portfolio is allotted
  let committeeData = null;
  if (portfolio && portfolio.committee_id) {
    const { data: cData } = await supabase
      .from("mun_committees")
      .select("name, short_name, type")
      .eq("id", portfolio.committee_id)
      .single();
    committeeData = cData;
  }

  const startDate = new Date(conf.date_start).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  const endDate = new Date(conf.date_end).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="neo-card bg-[#1B1C20] p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {registration.delegate_name}!</h1>
        <p className="text-[#C1C2C7]">Ready for {conf.name}?</p>
        
        <div className="flex flex-wrap gap-4 mt-6 text-sm">
          <span className="neo-badge bg-white/10 px-3 py-1.5 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#DDFE55]" />
            {startDate} - {endDate}
          </span>
          <span className="neo-badge bg-white/10 px-3 py-1.5 flex items-center gap-2">
            <MapPin size={14} className="text-[#DDFE55]" />
            {conf.venue}, {conf.city}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#1B1C20] mt-8 mb-4">Your Allotment</h2>

      {portfolio ? (
        <div className="neo-card bg-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 neo-badge bg-[#DDFE55]/20 flex items-center justify-center">
              <Sparkles className="text-[#A855F7]" size={24} />
            </div>
            <div>
              <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#6B7280] uppercase">
                {committeeData?.short_name}
              </span>
              <h3 className="text-2xl font-bold text-[#1B1C20] mt-1">{portfolio.name}</h3>
            </div>
          </div>
          <p className="text-[#6B7280] text-sm">
            You have been allotted <strong>{portfolio.name}</strong> in the <strong>{committeeData?.name}</strong>.
            Head over to the Committee Info tab to download your Background Guide and start preparing your position paper.
          </p>
        </div>
      ) : (
        <div className="neo-card bg-[#f9fafb] p-8 text-center border-dashed">
          <div className="w-12 h-12 bg-white neo-badge flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-[#9ca3af]" size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#1B1C20] mb-2">Awaiting Allotment</h3>
          <p className="text-[#6B7280] text-sm max-w-md mx-auto">
            The Executive Board is currently reviewing applications and assigning portfolios. 
            Check back soon to see your committee assignment!
          </p>
        </div>
      )}

    </div>
  );
}

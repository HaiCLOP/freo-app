import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Info, Download, BookOpen, Layers } from "lucide-react";

export default async function DelegateCommitteeInfoPage() {
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
          You can view committee information only after you have been assigned a portfolio.
        </p>
      </div>
    );
  }

  // Get the committee_id for this portfolio
  const { data: portfolio } = await supabase
    .from("mun_portfolios")
    .select("committee_id, name")
    .eq("id", registration.portfolio_allotted)
    .single();

  if (!portfolio) return null;

  // Fetch committee
  const { data: committee } = await supabase
    .from("mun_committees")
    .select("*")
    .eq("id", portfolio.committee_id)
    .single();

  if (!committee) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1B1C20] flex items-center gap-2">
            <Info size={24} className="text-[#DDFE55]" />
            Committee Information
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Everything you need to prepare for the {committee.short_name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="neo-card bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#1B1C20] uppercase">
                {committee.type.replace(/_/g, " ")}
              </span>
              <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#1B1C20] uppercase">
                {committee.session_format.replace(/_/g, " ")}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-[#1B1C20] mb-1">{committee.name}</h3>
            
            {committee.theme && (
              <p className="text-[#A855F7] font-bold text-sm mb-6">Theme: {committee.theme}</p>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-[#1B1C20] flex items-center gap-2">
                <Layers size={16} />
                Agenda Items
              </h4>
              <ul className="space-y-2">
                {committee.agenda_items && committee.agenda_items.length > 0 ? (
                  committee.agenda_items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
                      <span className="text-[#DDFE55] font-bold mt-0.5">▸</span>
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[#9ca3af]">No agenda items specified.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-6">
          <div className="neo-card bg-[#1B1C20] p-6 text-white">
            <h4 className="font-bold flex items-center gap-2 mb-4 text-[#DDFE55]">
              <BookOpen size={16} />
              Study Material
            </h4>
            
            <div className="space-y-3">
              {committee.bg_guide_url ? (
                <a 
                  href={committee.bg_guide_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full neo-btn bg-white text-[#1B1C20] px-4 py-3 font-bold text-sm flex items-center justify-between"
                >
                  Background Guide
                  <Download size={16} />
                </a>
              ) : (
                <div className="neo-badge bg-white/10 p-3 text-xs text-[#8E8F94]">
                  Background guide will be available soon.
                </div>
              )}

              {committee.study_guide_url && (
                <a 
                  href={committee.study_guide_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full neo-btn bg-[#f3f4f6] text-[#1B1C20] px-4 py-3 font-bold text-sm flex items-center justify-between"
                >
                  Study Guide
                  <Download size={16} />
                </a>
              )}
            </div>
          </div>

          <div className="neo-card bg-[#f9fafb] p-6">
            <h4 className="font-bold text-[#1B1C20] mb-2">Need Help?</h4>
            <p className="text-sm text-[#6B7280]">
              Reach out to your Executive Board if you have questions regarding the agenda or rules of procedure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

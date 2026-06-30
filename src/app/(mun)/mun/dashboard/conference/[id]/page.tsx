import { getConference } from "@/lib/mun/actions/conference";
import { CalendarDays, Users, Layers, Globe, CreditCard } from "lucide-react";

export default async function ConferenceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conf = await getConference(id);

  const stats = [
    { label: "Committees", value: conf.committees.length, icon: Layers, color: "#3B82F6" },
    { label: "Registrations", value: conf.registration_count, icon: Users, color: "#22C55E" },
    { label: "Max Delegates", value: conf.max_delegates, icon: Users, color: "#A855F7" },
    { label: "Fee", value: conf.delegate_fee > 0 ? `₹${conf.delegate_fee}` : "Free", icon: CreditCard, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="neo-card bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 neo-badge flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1B1C20]">{stat.value}</p>
              <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Conference dates */}
      <div className="neo-card bg-white p-6">
        <h3 className="font-bold text-[#1B1C20] mb-4 flex items-center gap-2">
          <CalendarDays size={16} />
          Key Dates
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Registration Opens", date: conf.registration_open },
            { label: "Registration Closes", date: conf.registration_close },
            { label: "Conference Start", date: conf.date_start },
            { label: "Conference End", date: conf.date_end },
          ].map((d) => (
            <div key={d.label}>
              <p className="text-[#6B7280] text-xs mb-1">{d.label}</p>
              <p className="font-semibold text-[#1B1C20]">
                {new Date(d.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Committees */}
      <div className="neo-card bg-white p-6">
        <h3 className="font-bold text-[#1B1C20] mb-4 flex items-center gap-2">
          <Layers size={16} />
          Committees ({conf.committees.length})
        </h3>
        {conf.committees.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No committees added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conf.committees.map((c) => (
              <div key={c.id} className="neo-badge bg-[#f3f4f6] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#1B1C20]">{c.short_name}</span>
                  <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-white text-[#6B7280] uppercase">
                    {c.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] truncate">{c.name}</p>
                <p className="text-xs text-[#9ca3af] mt-2">
                  {c.portfolios.length} portfolios · {c.max_delegates} max
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public link */}
      {conf.is_published && (
        <div className="neo-card bg-[#1B1C20] p-6 text-white">
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <Globe size={16} className="text-[#DDFE55]" />
            Public Registration Link
          </h3>
          <div className="flex items-center gap-3">
            <code className="bg-white/10 px-4 py-2 neo-badge text-sm text-[#DDFE55] flex-1 truncate">
              freo.haicloplabs.in/c/{conf.slug}
            </code>
            <button
              onClick={() => {}}
              className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-4 py-2 text-sm font-bold shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { getMyConferences } from "@/lib/mun/actions/conference";
import Link from "next/link";
import { Plus, Users, CalendarDays, MapPin, Globe, Archive } from "lucide-react";

export default async function MunDashboardPage() {
  const conferences = await getMyConferences();

  const active = conferences.filter((c) => !c.is_archived);
  const archived = conferences.filter((c) => c.is_archived);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1C20]">My Conferences</h1>
          <p className="text-[#6B7280] mt-1">
            {active.length} active conference{active.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/mun/dashboard/conference/new"
          className="neo-btn inline-flex items-center gap-2 bg-[#DDFE55] text-[#1B1C20] px-6 py-3 font-bold text-sm hover:bg-[#DDFE55]/90"
        >
          <Plus size={18} />
          New Conference
        </Link>
      </div>

      {/* Empty State */}
      {conferences.length === 0 && (
        <div className="neo-card bg-white p-16 text-center">
          <div className="w-20 h-20 bg-[#DDFE55]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarDays size={36} className="text-[#1B1C20]" />
          </div>
          <h3 className="text-xl font-bold text-[#1B1C20] mb-2">
            No conferences yet
          </h3>
          <p className="text-[#6B7280] max-w-md mx-auto mb-8">
            Create your first MUN conference and start managing registrations,
            committees, and portfolios — all in one place.
          </p>
          <Link
            href="/mun/dashboard/conference/new"
            className="neo-btn inline-flex items-center gap-2 bg-[#DDFE55] text-[#1B1C20] px-8 py-4 font-bold"
          >
            <Plus size={18} />
            Create Your First Conference
          </Link>
        </div>
      )}

      {/* Active Conferences Grid */}
      {active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {active.map((conf) => (
            <Link
              key={conf.id}
              href={`/mun/dashboard/conference/${conf.id}`}
              className="neo-card bg-white p-6 block group"
            >
              {/* Status badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`neo-badge px-3 py-1 text-xs font-bold uppercase ${
                    conf.is_published
                      ? "bg-[#22C55E]/10 text-[#22C55E]"
                      : "bg-[#FFA500]/10 text-[#FFA500]"
                  }`}
                >
                  {conf.is_published ? "Live" : "Draft"}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {new Date(conf.date_start).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" — "}
                  {new Date(conf.date_end).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Conference info */}
              <h3 className="text-lg font-bold text-[#1B1C20] mb-1 group-hover:text-[#DDFE55] transition-colors">
                {conf.name}
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">{conf.org_name}</p>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {conf.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {conf.max_delegates} max
                </span>
                {conf.delegate_fee > 0 && (
                  <span className="font-semibold text-[#1B1C20]">
                    ₹{conf.delegate_fee}
                  </span>
                )}
              </div>

              {/* Public link */}
              {conf.is_published && (
                <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex items-center gap-2 text-xs text-[#6B7280]">
                  <Globe size={12} />
                  <span className="truncate">freo.haicloplabs.in/c/{conf.slug}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-[#6B7280] flex items-center gap-2 mb-4">
            <Archive size={18} />
            Archived ({archived.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archived.map((conf) => (
              <Link
                key={conf.id}
                href={`/mun/dashboard/conference/${conf.id}`}
                className="neo-card bg-[#f3f4f6] p-5 block opacity-70 hover:opacity-100 transition-opacity"
              >
                <h3 className="font-bold text-[#1B1C20] mb-1">{conf.name}</h3>
                <p className="text-xs text-[#6B7280]">{conf.org_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

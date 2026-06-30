import { getConference } from "@/lib/mun/actions/conference";
import Link from "next/link";
import { Users, Shield, Layers, FileText, Award, Settings, QrCode, BarChart3, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "", label: "Overview", icon: BarChart3 },
  { href: "/delegates", label: "Delegates", icon: Users },
  { href: "/allotment", label: "Allotment", icon: Sparkles },
  { href: "/eb", label: "Executive Board", icon: Shield },
  { href: "/committees", label: "Committees", icon: Layers },
  { href: "/papers", label: "Position Papers", icon: FileText },
  { href: "/awards", label: "Awards", icon: Award },
  { href: "/checkin", label: "Check-in", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function ConferenceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let conf;
  try {
    conf = await getConference(id);
  } catch {
    return (
      <div className="neo-card bg-white p-12 text-center">
        <h2 className="text-xl font-bold text-[#1B1C20] mb-2">Conference not found</h2>
        <Link href="/mun/dashboard" className="text-sm text-[#6B7280] underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conference header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/mun/dashboard" className="text-xs text-[#6B7280] hover:text-[#1B1C20] transition-colors">
            ← Back to Conferences
          </Link>
          <h1 className="text-2xl font-bold text-[#1B1C20] mt-1">{conf.name}</h1>
          <p className="text-sm text-[#6B7280]">
            {conf.org_name} · {conf.city} ·{" "}
            {conf.committees.length} committee{conf.committees.length !== 1 ? "s" : ""} ·{" "}
            {conf.registration_count} registrations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`neo-badge px-3 py-1 text-xs font-bold uppercase ${conf.is_published ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#FFA500]/10 text-[#FFA500]"}`}>
            {conf.is_published ? "Live" : "Draft"}
          </span>
          {conf.is_published && (
            <Link
              href={`/c/${conf.slug}`}
              target="_blank"
              className="neo-badge px-3 py-1 text-xs font-medium text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-colors"
            >
              View Public Page →
            </Link>
          )}
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <nav className="flex gap-1 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = `/mun/dashboard/conference/${id}${item.href}`;
          return (
            <Link
              key={item.href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#1B1C20] hover:bg-[#f3f4f6] neo-badge transition-all whitespace-nowrap"
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}

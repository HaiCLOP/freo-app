import { getPublicConference } from "@/lib/mun/actions/conference";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Users, ExternalLink, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const conf = await getPublicConference(slug);
  if (!conf) return { title: "Conference Not Found" };
  return {
    title: `${conf.name} — Freo MUN`,
    description: conf.description || `Register for ${conf.name} by ${conf.org_name}`,
    openGraph: {
      title: conf.name,
      description: conf.description || `Register for ${conf.name}`,
      siteName: "Freo MUN",
    },
  };
}

export default async function PublicConferencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conf = await getPublicConference(slug);
  if (!conf) notFound();

  const now = new Date();
  const regOpen = new Date(conf.registration_open);
  const regClose = new Date(conf.registration_close);
  const isRegOpen = now >= regOpen && now <= regClose;

  const confStart = new Date(conf.date_start);
  const confEnd = new Date(conf.date_end);
  const daysUntil = Math.max(0, Math.ceil((confStart.getTime() - now.getTime()) / 86400000));

  return (
    <div className="min-h-screen bg-[#f5f1e4]">
      {/* Hero */}
      <header className="bg-[#1B1C20] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-2 text-sm text-[#8E8F94] mb-4">
            <Link href="/mun" className="hover:text-[#DDFE55] transition-colors">
              Freo MUN
            </Link>
            <ChevronRight size={14} />
            <span>{conf.org_name}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {conf.name}
          </h1>

          <p className="text-lg text-[#C1C2C7] max-w-2xl mb-8">
            {conf.description || `Join ${conf.name} hosted by ${conf.org_name}`}
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="neo-badge bg-white/10 px-4 py-2 flex items-center gap-2">
              <CalendarDays size={14} className="text-[#DDFE55]" />
              {confStart.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
              {" — "}
              {confEnd.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="neo-badge bg-white/10 px-4 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-[#DDFE55]" />
              {conf.venue}, {conf.city}
            </span>
            <span className="neo-badge bg-white/10 px-4 py-2 flex items-center gap-2">
              <Users size={14} className="text-[#DDFE55]" />
              {conf.registration_count} / {conf.max_delegates} delegates
            </span>
            {daysUntil > 0 && (
              <span className="neo-badge bg-[#DDFE55]/20 text-[#DDFE55] px-4 py-2 font-bold">
                {daysUntil} days to go
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10">
            {isRegOpen ? (
              <Link
                href={`/c/${slug}/register`}
                className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-10 py-4 font-bold text-lg inline-flex items-center gap-3"
              >
                Register Now
                {conf.delegate_fee > 0 && <span className="text-sm opacity-70">· ₹{conf.delegate_fee}</span>}
                <ExternalLink size={18} />
              </Link>
            ) : now < regOpen ? (
              <div className="neo-badge bg-white/10 px-6 py-3 text-[#C1C2C7]">
                Registration opens {regOpen.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
              </div>
            ) : (
              <div className="neo-badge bg-white/10 px-6 py-3 text-[#EF4444]">
                Registration closed
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Committees */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#2c2e2a] mb-8">Committees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conf.committees.map((c: Record<string, unknown>) => (
            <div key={c.id as string} className="neo-card bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-[#1B1C20]">
                  {c.short_name as string}
                </span>
                <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#6B7280] uppercase">
                  {(c.type as string).replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mb-3">{c.name as string}</p>
              {(c.agenda_items as string[])?.length > 0 && (
                <div className="space-y-1">
                  {(c.agenda_items as string[]).map((a, i) => (
                    <p key={i} className="text-xs text-[#9ca3af] flex items-start gap-2">
                      <span className="text-[#DDFE55] font-bold mt-0.5">▸</span>
                      {a}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-[#e5e7eb] text-xs text-[#9ca3af] flex justify-between">
                <span>{c.max_delegates as number} delegates max</span>
                <span>{(c.portfolio_type as string).replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B1C20] text-white py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-[#8E8F94]">
          <span>Powered by Freo MUN · HaiCLOP Labs</span>
          <Link href="/mun" className="hover:text-[#DDFE55] transition-colors">
            freo.haicloplabs.in/mun
          </Link>
        </div>
      </footer>
    </div>
  );
}

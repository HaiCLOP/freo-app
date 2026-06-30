"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarDays, MapPin, Users, ExternalLink, ChevronRight, Share2, Globe, Clock, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { CopyLinkButton } from "@/components/mun/CopyLinkButton";
import Image from "next/image";

export default function PublicConferenceClientPage({
  conf,
  slug,
  origin
}: {
  conf: any;
  slug: string;
  origin: string;
}) {
  const now = new Date();
  const regOpen = new Date(conf.registration_open);
  const regClose = new Date(conf.registration_close);
  const isRegOpen = now >= regOpen && now <= regClose;

  const confStart = new Date(conf.date_start);
  const confEnd = new Date(conf.date_end);
  const daysUntil = Math.max(0, Math.ceil((confStart.getTime() - now.getTime()) / 86400000));

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } as any }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans selection:bg-[#DDFE55] selection:text-[#1B1C20]">
      {/* Dynamic Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1B1C20]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/mun" className="text-white font-bold tracking-tight text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#DDFE55] text-[#1B1C20] flex items-center justify-center text-xs">
                MUN
              </div>
              Freo
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isRegOpen && (
              <Link
                href={`/c/${slug}/register`}
                className="bg-[#DDFE55] hover:bg-[#cbe849] text-[#1B1C20] px-5 py-2 font-bold text-sm transition-transform hover:-translate-y-0.5"
                style={{ borderRadius: "12px", boxShadow: "4px 4px 0px rgba(255,255,255,0.2)" }}
              >
                Register Now
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b-[8px] border-[#1B1C20]">
        {/* Dynamic Banner Background */}
        <div className="absolute inset-0 bg-[#1B1C20] z-0">
          {conf.banner_url && (
            <>
              <Image 
                src={conf.banner_url} 
                alt="Conference Banner" 
                fill 
                className="object-cover opacity-40 blur-[2px] mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1C20] via-transparent to-transparent z-10" />
            </>
          )}
          {/* Default Neobrutalist Pattern if no banner */}
          {!conf.banner_url && (
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#DDFE55 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
          )}
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-6xl mx-auto px-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white mb-6 uppercase tracking-wider">
            <span>Hosted by</span>
            <span className="text-[#DDFE55]">{conf.org_name}</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-6">
            {conf.name.toUpperCase()}
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-[#C1C2C7] max-w-3xl mb-10 leading-relaxed font-medium">
            {conf.description || `Experience diplomatic excellence at ${conf.name}. Join delegates from across the nation in an unforgettable Model UN conference.`}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 text-sm font-semibold mb-12">
            <div className="bg-[#DDFE55] text-[#1B1C20] px-6 py-3 rounded-2xl flex items-center gap-3 border-[3px] border-[#1B1C20] shadow-[4px_4px_0px_#1B1C20]">
              <CalendarDays size={18} />
              {confStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              {" — "}
              {confEnd.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="bg-white text-[#1B1C20] px-6 py-3 rounded-2xl flex items-center gap-3 border-[3px] border-[#1B1C20] shadow-[4px_4px_0px_#1B1C20]">
              <MapPin size={18} />
              {conf.venue}, {conf.city}
            </div>
            <div className="bg-[#B9B8FF] text-[#1B1C20] px-6 py-3 rounded-2xl flex items-center gap-3 border-[3px] border-[#1B1C20] shadow-[4px_4px_0px_#1B1C20]">
              <Users size={18} />
              {conf.max_delegates} Seats Maximum
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6">
            {isRegOpen ? (
              <Link
                href={`/c/${slug}/register`}
                className="bg-[#DDFE55] hover:bg-[#cbe849] text-[#1B1C20] px-10 py-5 font-black text-xl flex items-center gap-4 transition-all hover:-translate-y-1 border-[4px] border-[#1B1C20] shadow-[6px_6px_0px_#1B1C20]"
              >
                SECURE YOUR PORTFOLIO
                <ArrowRight size={24} />
              </Link>
            ) : now < regOpen ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-5 text-white font-bold text-lg rounded-2xl flex items-center gap-3">
                <Clock size={20} className="text-[#DDFE55]" />
                Registrations Open {regOpen.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
              </div>
            ) : (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 px-8 py-5 text-white font-bold text-lg rounded-2xl flex items-center gap-3">
                <ShieldCheck size={20} className="text-red-400" />
                Registrations Closed
              </div>
            )}
            
            {conf.delegate_fee > 0 ? (
               <div className="text-white/80 font-medium">
                 Registration Fee: <span className="text-[#DDFE55] font-bold text-lg">₹{conf.delegate_fee}</span>
               </div>
            ) : (
               <div className="text-[#DDFE55] font-bold text-lg px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                 Free to Attend
               </div>
            )}
          </motion.div>
        </motion.div>
      </header>

      {/* Committees Showcase */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="mb-16 md:flex md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-black text-[#1B1C20] tracking-tighter mb-4">THE COUNCILS</h2>
            <p className="text-xl text-[#6B7280] font-medium leading-relaxed">
              Carefully curated committees designed to challenge your diplomacy, critical thinking, and negotiation skills.
            </p>
          </div>
          <div className="hidden md:block">
             <div className="px-6 py-3 bg-[#f3f4f6] rounded-full text-sm font-bold text-[#1B1C20] border-2 border-[#1B1C20]">
               {conf.committees.length} COMMITTEES
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {conf.committees.map((c: any, index: number) => (
            <motion.div 
              key={c.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white p-8 rounded-3xl border-[3px] border-[#1B1C20] shadow-[8px_8px_0px_#1B1C20] hover:shadow-[12px_12px_0px_#1B1C20] hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-3xl font-black text-[#1B1C20] tracking-tight group-hover:text-[#4F46E5] transition-colors">
                  {c.short_name}
                </span>
                <span className="px-3 py-1 text-xs font-black bg-[#E0E7FF] text-[#4F46E5] uppercase border border-[#4F46E5] rounded-lg">
                  {c.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-lg text-[#1B1C20] font-bold leading-snug mb-6">{c.name}</p>
              
              {c.agenda_items?.length > 0 && (
                <div className="space-y-3 mb-6 bg-[#f8fafc] p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase">Agenda</p>
                  {c.agenda_items.map((a: string, i: number) => (
                    <p key={i} className="text-sm font-medium text-[#334155] leading-relaxed">
                      {a}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t-2 border-dashed border-gray-200 flex items-center justify-between text-sm font-bold text-gray-500">
                <span className="flex items-center gap-1.5"><Users size={16} /> {c.max_delegates} Max</span>
                <span>{c.portfolio_type.replace(/_/g, " ")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Share & Footer */}
      <footer className="bg-[#1B1C20] text-white pt-20 pb-10 border-t-[8px] border-[#DDFE55]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20 border-b border-white/20 pb-20">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-4xl font-black tracking-tight mb-4 text-[#DDFE55]">Ready to deliberate?</h3>
              <p className="text-lg text-[#C1C2C7] font-medium">Invite your delegation. Share the link with your circuit.</p>
            </div>
            <div>
              <CopyLinkButton link={`${origin}/c/${slug}`} />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-[#8E8F94]">
            <p>© {new Date().getFullYear()} {conf.org_name}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><Globe size={16} /> freo.haicloplabs.in/mun</span>
              <span>Built with Freo</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

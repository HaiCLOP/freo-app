"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/* ── design tokens ─────────────────────────────────────────────────── */
const ACCENT = "#CDFE00";        // Electric chartreuse
const ACCENT_DIM = "#9ABF00";
const BG = "#09090B";
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.06)";

/* ── feature data ──────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "🏛️", title: "Dynamic Committee Engine", desc: "50+ templates — UN bodies, Indian Parliament, fictional worlds. Or build from scratch. No hardcoded lists.", tag: "Core" },
  { icon: "🤖", title: "AI Portfolio Allotment", desc: "Constraint-optimization across preferences, school caps, and experience. One-click. No spreadsheets.", tag: "AI" },
  { icon: "⚡", title: "Live Session Engine", desc: "Roll call, speakers list, moderated caucus, voting, crisis injection — all real-time, all native.", tag: "Real-time" },
  { icon: "📝", title: "Registration & Payments", desc: "Custom forms, UPI screenshot verification, Kanban delegate pipeline, Google Sheets sync.", tag: "Ops" },
  { icon: "📄", title: "Position Papers & Awards", desc: "Upload, review, score. Nominate awards per committee. Auto-generate certificates.", tag: "Workflow" },
  { icon: "🔒", title: "Production-Grade Security", desc: "Row-level isolation, rate limiting, encrypted storage, 48-hour EB invite expiry.", tag: "Security" },
];

const STATS = [
  { value: "50+", label: "Committee Templates" },
  { value: "193", label: "UN Member States" },
  { value: "12", label: "Tables with RLS" },
  { value: "7", label: "Award Categories" },
];

/* ── magnetic button component ─────────────────────────────────────── */
function MagneticButton({ children, className = "", href }: { children: React.ReactNode; className?: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.a>
  );
}

/* ── glow card component ──────────────────────────────────────────── */
function GlowCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        position: "relative",
        overflow: "hidden",
      }}
      className="mun-feature-card"
    >
      {/* Glow follow cursor */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT}15, transparent 70%)`,
            left: mousePos.x - 100,
            top: mousePos.y - 100,
            pointerEvents: "none",
            transition: "left 0.05s, top 0.05s",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span style={{ fontSize: "2rem" }}>{feature.icon}</span>
          <span style={{
            fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
            color: ACCENT, background: `${ACCENT}12`, padding: "0.25rem 0.65rem", borderRadius: "999px",
            border: `1px solid ${ACCENT}30`,
          }}>
            {feature.tag}
          </span>
        </div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", margin: "0 0 0.5rem 0", lineHeight: 1.3 }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ── main page ─────────────────────────────────────────────────────── */
export default function MUNLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 2rem", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: scrolled ? "rgba(9,9,11,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
          transition: "background 0.3s, backdrop-filter 0.3s, border 0.3s",
        }}
      >
        <Link href="/mun" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: ACCENT, letterSpacing: "-0.03em" }}>Freo</span>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.2)", padding: "0.15rem 0.45rem",
            borderRadius: "4px", letterSpacing: "0.05em",
          }}>MUN</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>Log in</Link>
          <Link
            href="/mun/dashboard"
            style={{
              background: ACCENT, color: "#000", fontWeight: 700, fontSize: "0.85rem",
              padding: "0.55rem 1.3rem", borderRadius: "8px", textDecoration: "none",
              border: "none", cursor: "pointer", letterSpacing: "-0.01em",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 24px ${ACCENT}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "6rem 1.5rem 4rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient background glows */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}08, transparent 70%)`,
          filter: "blur(80px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none",
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.78rem", fontWeight: 600,
            color: ACCENT, background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}25`, borderRadius: "999px",
            padding: "0.45rem 1.2rem", marginBottom: "2rem",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
          India&apos;s First MUN-Native Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.04em",
            margin: "0 0 1.5rem 0", maxWidth: "14ch",
          }}
        >
          Conference management,{" "}
          <span style={{ color: ACCENT, display: "inline-block" }}>reimagined.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.45)",
            maxWidth: "40ch", lineHeight: 1.7, margin: "0 0 2.5rem 0",
          }}
        >
          Dynamic committees. AI-powered allotment. Live sessions with real-time crisis injection.
          Automated certificates. Built by people who actually do MUN.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}
        >
          <MagneticButton
            href="/mun/dashboard"
            className="mun-cta-primary"
          >
            Create Your Conference
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: "0.5rem" }}>
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </MagneticButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            position: "absolute", bottom: "2rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ width: 1, height: 24, background: `linear-gradient(to bottom, ${ACCENT}60, transparent)` }}
          />
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "3rem 2rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        maxWidth: 900, margin: "0 auto", gap: "2rem",
        textAlign: "center",
      }}>
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: ACCENT, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.4rem", fontWeight: 500 }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* ── Features Grid ──────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: "4rem" }}
        >
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800,
            letterSpacing: "-0.03em", margin: "0 0 0.75rem 0",
          }}>
            Everything a Sec-Gen needs
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", maxWidth: "40ch", margin: "0 auto" }}>
            From committee creation to certificate delivery. Zero spreadsheets. Zero manual work.
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${CARD_BORDER}`,
        }}>
          {FEATURES.map((f, i) => (
            <GlowCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────── */}
      <section style={{
        padding: "6rem 1.5rem", textAlign: "center",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}06, transparent 70%)`,
          filter: "blur(100px)", pointerEvents: "none",
        }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
            letterSpacing: "-0.04em", margin: "0 0 1rem 0",
          }}>
            Ready to run your MUN?
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", maxWidth: "35ch", margin: "0 auto 2rem", lineHeight: 1.7 }}>
            Set up your conference in under 10 minutes. Free to start. No credit card.
          </p>
          <MagneticButton href="/mun/dashboard" className="mun-cta-primary">
            Start Building
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: "0.5rem" }}>
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </MagneticButton>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "2rem", textAlign: "center",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
        fontSize: "0.78rem", color: "rgba(255,255,255,0.3)",
      }}>
        <span>© {new Date().getFullYear()} HaiCLOP Labs — Freo MUN</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Terms</Link>
        </div>
      </footer>

      {/* ── Inline Styles ──────────────────────────────────────── */}
      <style>{`
        .mun-cta-primary {
          display: inline-flex; align-items: center;
          background: ${ACCENT}; color: #000;
          font-weight: 700; font-size: 0.95rem;
          padding: 0.85rem 2rem; border-radius: 12px;
          text-decoration: none; cursor: pointer;
          transition: box-shadow 0.2s;
          letter-spacing: -0.01em;
        }
        .mun-cta-primary:hover {
          box-shadow: 0 0 40px ${ACCENT}35;
        }
        .mun-feature-card {
          border-radius: 0 !important;
          transition: background 0.3s;
        }
        .mun-feature-card:hover {
          background: rgba(255,255,255,0.06) !important;
        }
        @media (max-width: 768px) {
          .mun-cta-primary { padding: 0.75rem 1.5rem; font-size: 0.9rem; }
        }
      `}</style>
    </div>
  );
}

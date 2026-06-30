"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Ticket,
  QrCode,
  BarChart3,
  Shield,
  Zap,
  Palette,
  ArrowRight,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Ticket,
    title: "Digital Ticketing",
    description:
      "Generate beautiful, branded digital tickets with unique QR codes for every attendee.",
    color: "#8ed462",
    detail: "Each ticket is unique, tamper-proof, and scannable.",
  },
  {
    icon: QrCode,
    title: "QR Scanner",
    description:
      "Our dedicated mobile scanner validates tickets instantly at the venue gate.",
    color: "#2ba0ff",
    detail: "Works offline. Syncs when connection returns.",
  },
  {
    icon: Shield,
    title: "Payment Verification",
    description:
      "We verify every payment against your bank before confirming registration.",
    color: "#ff705d",
    detail: "Screenshot fraud? Not on our watch.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Real-time dashboards with check-in rates, ticket velocity, and revenue.",
    color: "#f5e211",
    detail: "Know your audience before they walk in.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Fully customizable registration pages with your logo and colors.",
    color: "#8ed462",
    detail: "Your event, your brand. Zero watermarks.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "All registrations sync to Google Sheets and Drive in real-time.",
    color: "#2ba0ff",
    detail: "Export anytime, no lock-in.",
  },
];

export function HorizontalFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!scrollRef.current || !containerRef.current) return;

      const scrollWidth =
        scrollRef.current.scrollWidth - containerRef.current.offsetWidth;

      gsap.to(scrollRef.current, {
        x: -scrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${scrollWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="w-full overflow-hidden bg-[#f5f1e4] relative"
    >
      {/* Fixed header text - visible during scroll */}
      <div className="absolute top-8 left-0 right-0 z-30 px-8 pointer-events-none">
        <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase bg-[#8ed462] px-4 py-2 neo-badge">
          Features
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-8 px-8 py-[120px] pt-[160px] min-h-screen"
        style={{ width: `${features.length * 450 + 200}px` }}
      >
        {/* Intro card */}
        <div className="w-[400px] shrink-0">
          <h2 className="font-inter font-bold text-[48px] md:text-[64px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05]">
            Everything
            <br />
            you need.
          </h2>
          <p className="font-inter text-[18px] text-[#80827f] leading-[1.6] mt-4 max-w-[350px]">
            Scroll to explore the tools that power thousands of events.
          </p>
          <div className="flex items-center gap-2 mt-6 text-[#80827f]">
            <ArrowRight size={20} />
            <span className="font-inter font-bold text-[13px] uppercase tracking-wider">
              Keep scrolling
            </span>
          </div>
        </div>

        {/* Feature cards */}
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0.5, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.8 }}
            className="w-[380px] md:w-[420px] shrink-0 bg-white p-8 neo-border neo-shadow-lg group hover:-translate-y-3 hover:-translate-x-3 hover:shadow-[12px_12px_0px_#2c2e2a] transition-all duration-300 relative cursor-crosshair"
          >
            {/* Dynamic expanding background on hover */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0"
              style={{ backgroundColor: feature.color }}
            />
            
            <div className="relative z-10">
              <div
                className="w-16 h-16 neo-border flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300"
                style={{ backgroundColor: feature.color }}
              >
                <feature.icon size={28} color="#2c2e2a" className="group-hover:animate-pulse" />
              </div>
              <h3 className="font-inter font-bold text-[24px] text-[#2c2e2a] mb-3 group-hover:underline decoration-4 underline-offset-4" style={{ textDecorationColor: feature.color }}>
                {feature.title}
              </h3>
            <p className="font-inter text-[16px] text-[#80827f] leading-[1.6] mb-4">
              {feature.description}
            </p>
            <div
              className="inline-block px-3 py-1.5 font-inter font-bold text-[12px] uppercase tracking-wider neo-badge"
              style={{ backgroundColor: `${feature.color}30`, color: "#2c2e2a" }}
            >
              {feature.detail}
            </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

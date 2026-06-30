"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function ScannerShowcase() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".scanner-phone", {
        x: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 60%",
        },
      });

      gsap.from(".scanner-text", {
        x: -60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 60%",
        },
      });
    },
    { scope: container }
  );

  return (
    <section
      id="creators"
      ref={container}
      className="w-full py-[120px] px-4 overflow-hidden bg-[#f5f1e4]"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Text block */}
        <div className="flex-1">
          <div className="scanner-text">
            <span className="inline-block font-inter font-bold text-[13px] text-white tracking-[0.2em] uppercase mb-4 bg-[#ff705d] px-4 py-2 neo-badge">
              Scanner App
            </span>
          </div>
          <h2 className="scanner-text font-inter font-bold text-[42px] md:text-[64px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mb-6">
            Your bouncer,
            <br />
            <span className="text-[#80827f]">in your pocket.</span>
          </h2>
          <p className="scanner-text font-inter text-[17px] md:text-[19px] text-[#80827f] leading-[1.7] mb-8 max-w-[480px]">
            The Freo Scanner is a dedicated Flutter app for your event team.
            Point it at any QR ticket — green means go, red means no. It&apos;s
            that simple.
          </p>
          <div className="scanner-text flex flex-col gap-4">
            {[
              {
                icon: Wifi,
                color: "#8ed462",
                text: "Real-time validation against your live database",
              },
              {
                icon: WifiOff,
                color: "#2ba0ff",
                text: "Offline mode — syncs when connection returns",
              },
              {
                icon: CheckCircle2,
                color: "#8ed462",
                text: "Instant green/red visual + sound feedback",
              },
              {
                icon: XCircle,
                color: "#ff705d",
                text: "Automatically flags duplicate scans",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className="w-8 h-8 neo-border flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  <item.icon size={16} color="#2c2e2a" strokeWidth={2.5} />
                </div>
                <span className="font-inter font-medium text-[16px] text-[#2c2e2a] pt-1">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Phone mockup - neobrutalist style */}
        <div className="scanner-phone flex-1 flex justify-center">
          <div className="w-[280px] md:w-[320px] bg-[#2c2e2a] p-4 neo-border-thick neo-shadow-xl relative">
            {/* Floating badge */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-5 -right-5 bg-[#f5e211] font-inter font-bold text-[12px] text-[#2c2e2a] px-3 py-1.5 neo-badge rotate-3 z-20"
            >
              FLUTTER APP
            </motion.div>

            <div className="bg-[#1a1c19] overflow-hidden border-2 border-white/10">
              {/* Scanner header */}
              <div className="px-4 py-4 border-b-2 border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-[#8ed462] border-2 border-white/20 flex items-center justify-center">
                    <span className="text-[#2c2e2a] font-bold text-[10px]">
                      F
                    </span>
                  </div>
                  <span className="text-white font-inter font-bold text-[13px] uppercase tracking-wider">
                    Freo Scanner
                  </span>
                </div>
                <span className="text-white/40 font-inter text-[11px]">
                  TEDx Nagpur 2026
                </span>
              </div>

              {/* QR scan area */}
              <div className="mx-4 my-4 bg-[#2c2e2a] border-2 border-white/20 aspect-square flex items-center justify-center relative overflow-hidden">
                <motion.div
                  animate={{ y: [-50, 50, -50] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute left-3 right-3 h-[3px] bg-[#8ed462] shadow-[0_0_15px_#8ed462]"
                />
                <div className="w-[55%] h-[55%] border-3 border-white/30" />
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-5 h-5 border-t-3 border-l-3 border-[#8ed462]" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t-3 border-r-3 border-[#8ed462]" />
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b-3 border-l-3 border-[#8ed462]" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-3 border-r-3 border-[#8ed462]" />
              </div>

              {/* Scan results */}
              <div className="px-4 pb-4 flex flex-col gap-2">
                {[
                  { name: "Amit Srivastava", status: "Verified", ok: true },
                  { name: "Priya Mehta", status: "Verified", ok: true },
                  { name: "Unknown Ticket", status: "Rejected", ok: false },
                ].map((scan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.0 + i * 0.2 }}
                    className="flex items-center justify-between bg-[#2c2e2a] border-2 border-white/10 px-3 py-2.5"
                  >
                    <span className="text-white/80 font-inter font-medium text-[11px]">
                      {scan.name}
                    </span>
                    <span
                      className={`font-inter text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                        scan.ok
                          ? "text-[#2c2e2a] bg-[#8ed462]"
                          : "text-white bg-[#ff705d]"
                      }`}
                    >
                      {scan.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

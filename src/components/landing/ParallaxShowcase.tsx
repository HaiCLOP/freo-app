"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export function ParallaxShowcase() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y3 = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [-5, 5]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [3, -3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.95]);

  return (
    <section
      ref={container}
      className="w-full py-[160px] px-4 overflow-hidden relative"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#2ba0ff] text-white px-4 py-2 neo-badge">
            See it in action
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            One platform.
            <br />
            <span className="text-[#80827f]">Every angle.</span>
          </h2>
        </motion.div>

        {/* Parallax image grid */}
        <div className="relative h-[600px] md:h-[700px]">
          {/* Main center card */}
          <motion.div
            style={{ y: y2, scale, rotate: rotate1 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[500px] z-20"
          >
            <div className="neo-border-thick neo-shadow-xl bg-white p-3">
              <Image
                src="/dashboard-art.png"
                alt="Freo dashboard"
                width={500}
                height={350}
                className="w-full h-auto neo-border"
              />
              <div className="p-3">
                <span className="font-inter font-bold text-[14px] text-[#2c2e2a] uppercase tracking-wider">
                  Analytics Dashboard
                </span>
              </div>
            </div>
          </motion.div>

          {/* Left floating card */}
          <motion.div
            style={{ y: y1, rotate: rotate2 }}
            className="absolute left-[2%] md:left-[8%] top-[10%] w-[200px] md:w-[280px] z-10"
          >
            <div className="neo-border bg-[#8ed462] p-3 neo-shadow-lg">
              <div className="bg-white neo-border p-4">
                <div className="font-inter font-bold text-[36px] text-[#2c2e2a]">
                  1,247
                </div>
                <div className="font-inter font-bold text-[12px] text-[#80827f] uppercase tracking-wider">
                  Tickets sold today
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right floating card */}
          <motion.div
            style={{ y: y3, rotate: rotate1 }}
            className="absolute right-[2%] md:right-[8%] top-[15%] w-[180px] md:w-[250px] z-10"
          >
            <div className="neo-border bg-[#ff705d] p-3 neo-shadow-lg">
              <div className="bg-white neo-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-[#8ed462]" />
                  <span className="font-inter font-bold text-[11px] text-[#2c2e2a] uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <div className="font-inter font-bold text-[28px] text-[#2c2e2a]">
                  100%
                </div>
                <div className="font-inter text-[12px] text-[#80827f]">
                  Payment accuracy
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom left stat */}
          <motion.div
            style={{ y: y3 }}
            className="absolute left-[5%] md:left-[15%] bottom-[5%] w-[180px] md:w-[220px] z-10"
          >
            <div className="neo-border bg-[#f5e211] p-3 neo-shadow">
              <div className="bg-white neo-border p-3">
                <div className="font-inter font-bold text-[24px] text-[#2c2e2a]">
                  893
                </div>
                <div className="font-inter text-[11px] text-[#80827f] uppercase tracking-wider font-bold">
                  Scanned in
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom right floating element */}
          <motion.div
            style={{ y: y1 }}
            className="absolute right-[5%] md:right-[12%] bottom-[10%] z-10"
          >
            <div className="neo-border bg-[#2ba0ff] px-5 py-3 neo-shadow">
              <span className="font-inter font-bold text-[14px] text-white uppercase tracking-wider">
                ⚡ Real-time sync
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

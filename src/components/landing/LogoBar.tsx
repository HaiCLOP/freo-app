"use client";

import { motion } from "framer-motion";

const logos = [
  "HERBALIFE",
  "TEDx",
  "ROTARY",
  "IEEE",
  "GOOGLE DSC",
  "STARTUP INDIA",
  "VNIT",
  "IIT BOMBAY",
];

export function LogoBar() {
  return (
    <section className="w-full py-[50px] px-4 bg-[#f5e211] neo-border border-x-0">
      <div className="max-w-[1200px] mx-auto">
        <p className="font-inter font-bold text-[13px] text-[#2c2e2a] text-center mb-[24px] tracking-[0.2em] uppercase">
          Trusted by event creators across India
        </p>
        <div className="overflow-hidden relative">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 whitespace-nowrap"
          >
            {[...logos, ...logos].map((logo, i) => (
              <span
                key={`${logo}-${i}`}
                className="font-inter font-bold text-[28px] md:text-[36px] text-[#2c2e2a]/20 select-none hover:text-[#2c2e2a] transition-colors duration-300 cursor-default shrink-0"
              >
                {logo}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

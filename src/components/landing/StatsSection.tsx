"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const increment = Math.ceil(end / 60);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  {
    value: 50000,
    suffix: "+",
    label: "Tickets issued",
    description: "Across live events in 12+ cities",
    color: "#8ed462",
  },
  {
    value: 200,
    suffix: "+",
    label: "Events powered",
    description: "From workshops to mega conferences",
    color: "#2ba0ff",
  },
  {
    value: 99,
    suffix: "%",
    label: "Check-in accuracy",
    description: "Zero duplicate entries at the gate",
    color: "#ff705d",
  },
  {
    value: 15,
    prefix: "₹",
    suffix: "L+",
    label: "Revenue tracked",
    description: "Verified, transparent payments",
    color: "#f5e211",
  },
];

export function StatsSection() {
  return (
    <section className="w-full py-[120px] px-4 bg-[#2c2e2a] relative overflow-hidden">
      {/* Decorative neo elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-4 border-[#8ed462] opacity-20 rotate-12" />
      <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-[#ff705d] opacity-20 -rotate-6" />
      <div className="absolute top-1/2 left-[5%] w-10 h-10 bg-[#f5e211] opacity-10 rotate-45" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-white tracking-[-0.04em] leading-[1.05]">
            Numbers that
            <br />
            <span className="text-[#8ed462]">speak volumes.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-[#3a3c38] p-6 md:p-8 border-4 border-white/10 text-center hover:border-white/30 transition-colors"
            >
              <div
                className="w-3 h-3 mx-auto mb-4"
                style={{ backgroundColor: stat.color }}
              />
              <div className="font-inter font-bold text-[36px] md:text-[52px] text-white tracking-[-0.03em] leading-none mb-2">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix || ""}
                />
              </div>
              <div className="font-inter font-bold text-[15px] text-white mb-1 uppercase tracking-wider">
                {stat.label}
              </div>
              <div className="font-inter text-[13px] text-[#80827f]">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

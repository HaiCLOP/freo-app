"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words =
  "We built Freo because event creators deserve better than spreadsheets and fake payment screenshots. One platform. Zero chaos.".split(
    " "
  );

export function ScrollTextReveal() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.8", "end 0.2"],
  });

  return (
    <section
      ref={container}
      className="w-full py-[160px] px-4 bg-[#2c2e2a] relative overflow-hidden"
    >
      {/* Decorative neo blocks */}
      <motion.div
        style={{ rotate: useTransform(scrollYProgress, [0, 1], [0, 90]) }}
        className="absolute top-20 right-[10%] w-16 h-16 border-4 border-[#8ed462] opacity-20"
      />
      <motion.div
        style={{ rotate: useTransform(scrollYProgress, [0, 1], [0, -60]) }}
        className="absolute bottom-20 left-[8%] w-12 h-12 border-4 border-[#ff705d] opacity-20"
      />

      <div className="max-w-[1000px] mx-auto">
        <p className="font-inter font-bold text-[32px] sm:text-[42px] md:text-[56px] lg:text-[64px] leading-[1.15] tracking-[-0.03em] flex flex-wrap gap-x-[0.3em] gap-y-1">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);

  return (
    <motion.span
      style={{ opacity, y }}
      className="text-white inline-block transition-colors"
    >
      {children}
    </motion.span>
  );
}

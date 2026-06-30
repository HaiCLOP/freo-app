"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export function CTABanner() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".cta-headline-word", {
        y: 100,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
        },
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} className="w-full py-[100px] px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-[#8ed462] neo-border-thick neo-shadow-xl p-10 md:p-[80px] relative overflow-hidden">
          {/* Decorative neo blocks */}
          <div className="absolute top-6 right-6 w-20 h-20 border-4 border-[#2c2e2a] rotate-12 opacity-20" />
          <div className="absolute bottom-6 left-6 w-14 h-14 border-4 border-[#2c2e2a] -rotate-6 opacity-20" />
          <div className="absolute top-1/2 right-[15%] w-8 h-8 bg-[#f5e211] border-3 border-[#2c2e2a] rotate-45 opacity-30" />

          {/* Illustration */}
          <div className="absolute -bottom-2 -right-2 w-[200px] md:w-[300px] opacity-20 pointer-events-none hidden md:block">
            <Image
              src="/event-people.png"
              alt=""
              width={300}
              height={300}
              className="w-full h-auto"
            />
          </div>

          <div className="relative z-10">
            <h2 className="font-inter font-bold text-[36px] sm:text-[52px] md:text-[80px] text-[#2c2e2a] tracking-[-0.04em] leading-[1] mb-6 overflow-hidden">
              <span className="cta-headline-word inline-block">
                Ready&nbsp;to&nbsp;make
              </span>
              <br />
              <span className="cta-headline-word inline-block">
                your&nbsp;events
              </span>
              <br />
              <span className="cta-headline-word inline-block [-webkit-text-stroke:3px_#2c2e2a] text-[#8ed462]">
                effortless?
              </span>
            </h2>
            <p className="font-inter font-medium text-[17px] md:text-[20px] text-[#2c2e2a]/70 max-w-[500px] mb-10">
              Join hundreds of event creators who switched to Freo and never
              looked back.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#2c2e2a] text-white px-8 py-4 font-inter font-bold text-[16px] uppercase tracking-wider neo-btn">
                Start for free →
              </button>
              <button className="bg-white text-[#2c2e2a] px-8 py-4 font-inter font-bold text-[16px] uppercase tracking-wider neo-btn">
                Talk to sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

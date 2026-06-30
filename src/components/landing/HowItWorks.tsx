"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Create your event",
    description:
      "Set up your event in minutes. Add your logo, custom fields, ticket tiers, and payment details.",
    accent: "#8ed462",
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Get a beautiful, branded registration page. Share a single link across WhatsApp, Instagram, or email.",
    accent: "#2ba0ff",
  },
  {
    number: "03",
    title: "Verify payments",
    description:
      "Attendees register and upload payment proof. Freo automatically verifies every transaction for you.",
    accent: "#ff705d",
  },
  {
    number: "04",
    title: "Scan at the door",
    description:
      "Use the Freo Scanner app to validate QR tickets in real-time. No spreadsheets, no confusion.",
    accent: "#f5e211",
  },
];

export function HowItWorks() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".how-line", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 1,
        },
      });
    },
    { scope: container }
  );

  return (
    <section
      id="how-it-works"
      ref={container}
      className="w-full py-[120px] px-4 bg-[#f5f1e4]"
    >
      <div className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#2ba0ff] px-4 py-2 neo-badge text-white">
            How it works
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            Four steps to
            <br />
            <span className="text-[#80827f]">a flawless event.</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="how-line absolute left-[32px] md:left-[40px] top-0 bottom-0 w-[4px] bg-[#2c2e2a]" />

          <div className="flex flex-col gap-[60px]">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="flex gap-6 md:gap-10 items-start relative"
              >
                {/* Number box */}
                <div
                  className="w-16 h-16 md:w-20 md:h-20 neo-border flex items-center justify-center shrink-0 font-inter font-bold text-[20px] md:text-[26px] text-[#2c2e2a] relative z-10 neo-shadow"
                  style={{ backgroundColor: step.accent }}
                >
                  {step.number}
                </div>

                <div className="pt-2 md:pt-4 flex-1">
                  <h3 className="font-inter font-bold text-[24px] md:text-[32px] text-[#2c2e2a] mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="font-inter text-[16px] md:text-[18px] text-[#80827f] leading-[1.6] max-w-[500px]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

export function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for cursor glow + parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 25 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);

  useGSAP(
    () => {
      gsap.from(".hero-word", {
        y: 140,
        opacity: 0,
        rotateX: 30,
        duration: 1.2,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.5,
      });

      gsap.from(".hero-subtext", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 1.2,
      });

      gsap.from(".hero-cta-group", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 1.5,
      });

      gsap.from(".hero-badge", {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        delay: 1.8,
      });

      gsap.from(".hero-image", {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 1.0,
      });

      // Floating shapes entrance
      gsap.from(".hero-shape", {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(2)",
        delay: 1.6,
      });
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      className="w-full min-h-screen pt-[130px] pb-[60px] px-4 overflow-hidden relative"
    >
      {/* Cursor glow */}
      <motion.div
        style={{ x: smoothX, y: smoothY }}
        className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-multiply"
        aria-hidden
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,#8ed462_0%,#f5e211_40%,transparent_70%)] blur-[80px]" />
      </motion.div>

      {/* Scattered floating shapes */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-28 left-[6%] w-14 h-14 bg-[#f5e211] neo-border hidden lg:block z-0"
      />
      <motion.div
        animate={{ y: [6, -10, 6], rotate: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-52 right-[7%] w-10 h-10 bg-[#ff705d] neo-border hidden lg:block z-0"
      />
      <motion.div
        animate={{ y: [-5, 12, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-[42%] left-[3%] w-7 h-7 bg-[#2ba0ff] neo-border rotate-45 hidden lg:block z-0"
      />
      <motion.div
        animate={{ y: [4, -8, 4], x: [-3, 3, -3] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-[55%] right-[5%] w-16 h-5 bg-[#8ed462] neo-border hidden lg:block z-0"
      />
      <motion.div
        animate={{ rotate: [45, 90, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-[30%] right-[14%] w-5 h-5 bg-[#2c2e2a] hidden lg:block z-0"
      />
      <motion.div
        animate={{ y: [10, -6, 10], rotate: [-5, 5, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="hero-shape absolute top-[68%] left-[7%] w-10 h-3 bg-[#ff705d] neo-border hidden lg:block z-0"
      />

      {/* Main content */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="max-w-[1200px] w-full mx-auto relative z-10"
      >
        {/* Badge */}
        <div className="hero-badge flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#8ed462] px-4 py-2 font-inter font-bold text-[13px] text-[#2c2e2a] uppercase tracking-wider neo-badge">
            <div className="w-2 h-2 bg-[#2c2e2a] animate-pulse" />
            Now with real-time QR scanning
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="font-inter font-bold text-[#2c2e2a] text-[48px] sm:text-[72px] md:text-[100px] lg:text-[130px] leading-[0.95] tracking-[-0.05em] overflow-hidden">
            <span className="hero-word inline-block">Event&nbsp;</span>
            <span className="hero-word inline-block">registration</span>
            <br />
            <span className="hero-word inline-block text-[#8ed462] [-webkit-text-stroke:3px_#2c2e2a]">
              reimagined.
            </span>
          </h1>

          <p className="hero-subtext mt-8 font-inter font-medium text-[#80827f] text-[17px] md:text-[20px] max-w-[600px] mx-auto leading-relaxed">
            The premium platform for managing your paid events. Collect
            registrations, verify payments, and issue digital tickets — all in
            one beautiful flow.
          </p>
        </div>

        {/* CTA Group */}
        <div className="hero-cta-group flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button className="bg-[#2c2e2a] text-white px-8 py-4 font-inter font-bold text-[16px] uppercase tracking-wider neo-btn">
            Create your first event →
          </button>
          <button className="bg-[#f5e211] text-[#2c2e2a] px-8 py-4 font-inter font-bold text-[16px] uppercase tracking-wider neo-btn">
            ▶ Watch demo
          </button>
        </div>
      </motion.div>

      {/* Hero Illustration */}
      <motion.div
        ref={imageRef}
        style={{ y: imageY, scale: imageScale }}
        className="hero-image mt-16 flex justify-center max-w-[1200px] mx-auto relative z-10"
      >
        <div className="relative neo-border-thick neo-shadow-xl bg-[#f5f1e4] p-4 max-w-[900px] w-full group overflow-hidden">
          <Image
            src="/hero-scanner.png"
            alt="Freo QR Scanner illustration"
            width={900}
            height={500}
            className="w-full h-auto neo-border group-hover:scale-[1.02] transition-transform duration-500"
            priority
          />
          {/* Floating neo-badges */}
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [3, 6, 3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-5 -right-5 bg-[#ff705d] text-white font-inter font-bold text-[13px] px-4 py-2 neo-badge z-30 shadow-[4px_4px_0px_#2c2e2a]"
          >
            100% FREE
          </motion.div>
          <motion.div
            animate={{ y: [5, -5, 5], rotate: [-2, -5, -2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -bottom-4 -left-4 bg-[#2ba0ff] text-white font-inter font-bold text-[12px] px-3 py-1.5 neo-badge z-30 shadow-[4px_4px_0px_#2c2e2a]"
          >
            50,000+ tickets issued
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom marquee tape — below hero image, clean separation */}
      <div className="mt-16 -mx-4 overflow-hidden bg-[#2c2e2a] neo-border border-x-0 py-4 rotate-[-1deg] scale-x-105">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-10"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 shrink-0">
              <span className="font-inter font-black text-[22px] text-[#8ed462] uppercase tracking-wider">
                DIGITAL TICKETS
              </span>
              <span className="text-[#f5e211] text-lg">✦</span>
              <span className="font-inter font-black text-[22px] text-white uppercase tracking-wider">
                QR SCANNER
              </span>
              <span className="text-[#ff705d] text-lg">★</span>
              <span className="font-inter font-black text-[22px] text-[#f5e211] uppercase tracking-wider">
                LIVE ANALYTICS
              </span>
              <span className="text-[#2ba0ff] text-lg">◆</span>
              <span className="font-inter font-black text-[22px] text-[#ff705d] uppercase tracking-wider">
                PAYMENT VERIFY
              </span>
              <span className="text-[#8ed462] text-lg">●</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

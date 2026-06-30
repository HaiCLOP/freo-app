"use client";

import Link from "next/link";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { motion } from "framer-motion";

export function Nav() {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
        delay: 0.2,
      }}
      className="fixed top-0 left-0 right-0 z-50 w-full px-4 pt-5"
    >
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between bg-white neo-border px-5 py-3 neo-shadow">
        <Link href="/" className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: -5, scale: 1.1 }}
            className="w-11 h-11 bg-[#8ed462] neo-border flex items-center justify-center cursor-pointer"
          >
            <span className="text-[#2c2e2a] font-inter font-bold text-xl">
              F
            </span>
          </motion.div>
          <span className="font-inter font-bold text-[20px] text-[#2c2e2a] tracking-[-0.02em]">
            FREO
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {[
            { label: "Features", href: "/features" },
            { label: "Pricing", href: "/pricing" },
            { label: "About", href: "/about" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-inter font-bold text-[14px] text-[#2c2e2a] uppercase tracking-wider hover:text-[#ff705d] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          <Link href="/login">
            <button className="hidden sm:flex items-center gap-2 bg-[#f5e211] text-[#2c2e2a] px-5 py-[10px] font-inter font-bold text-[14px] uppercase tracking-wider neo-btn">
              Dashboard →
            </button>
          </Link>
        </div>
      </nav>
    </motion.div>
  );
}

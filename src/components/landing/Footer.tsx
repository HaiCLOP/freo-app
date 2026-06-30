"use client";

import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Scanner App", href: "/features#scanner" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Community", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full bg-[#2c2e2a] pt-[80px] pb-[40px] px-4 border-t-4 border-[#8ed462]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-[80px]">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-[#8ed462] border-3 border-white/20 flex items-center justify-center">
                <span className="text-[#2c2e2a] font-inter font-bold text-xl">
                  F
                </span>
              </div>
              <span className="font-inter font-bold text-[20px] text-white tracking-[-0.02em]">
                FREO
              </span>
            </div>
            <p className="font-inter text-[14px] text-[#80827f] leading-[1.6] max-w-[220px]">
              Event registration, reimagined. Built for creators who demand
              premium quality.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-inter font-bold text-[13px] text-white mb-4 tracking-[0.2em] uppercase">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-inter text-[14px] text-[#80827f] hover:text-[#8ed462] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t-[3px] border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-inter text-[14px] text-[#80827f]">
            © 2026 Freo Events. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            {["Twitter", "GitHub", "Instagram"].map((s) => (
              <a
                key={s}
                href="#"
                className="font-inter font-bold text-[12px] text-[#80827f] hover:text-white uppercase tracking-wider transition-colors px-3 py-1.5 border-2 border-[#80827f]/30 hover:border-white/50"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

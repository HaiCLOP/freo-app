"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Mehta",
    role: "Event Manager, TEDx Nagpur",
    quote:
      "Freo completely transformed how we handle registrations. We went from spreadsheet chaos to a seamless ticketing flow overnight.",
    rating: 5,
    color: "#8ed462",
  },
  {
    name: "Arjun Desai",
    role: "Co-founder, Startup Grind Pune",
    quote:
      "The QR scanner alone is worth it. Check-in used to take 45 minutes. With Freo, we processed 300 people in under 10.",
    rating: 5,
    color: "#2ba0ff",
  },
  {
    name: "Sneha Kulkarni",
    role: "President, IEEE VNIT",
    quote:
      "Custom branding was a game-changer for us. Our registration page looked like it was built by a professional agency.",
    rating: 5,
    color: "#ff705d",
  },
];

export function Testimonials() {
  return (
    <section className="w-full py-[120px] px-4 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#ff705d] text-white px-4 py-2 neo-badge">
            Testimonials
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            Loved by creators
            <br />
            <span className="text-[#80827f]">across India.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 50, rotate: i === 1 ? 0 : i === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: i === 1 ? 0 : i === 0 ? -1 : 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="bg-white p-8 neo-card relative"
            >
              {/* Colored top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[6px]"
                style={{ backgroundColor: t.color }}
              />
              <div className="flex gap-1 mb-6 mt-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={20} fill="#f5e211" color="#2c2e2a" strokeWidth={2.5} />
                ))}
              </div>
              <p className="font-inter text-[17px] text-[#2c2e2a] leading-[1.7] mb-8">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 neo-border flex items-center justify-center"
                  style={{ backgroundColor: t.color }}
                >
                  <span className="font-inter font-bold text-[#2c2e2a] text-[18px]">
                    {t.name[0]}
                  </span>
                </div>
                <div>
                  <div className="font-inter font-bold text-[15px] text-[#2c2e2a]">
                    {t.name}
                  </div>
                  <div className="font-inter text-[13px] text-[#80827f]">
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

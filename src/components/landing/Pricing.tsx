"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for small workshops and meetups under 100 people.",
    features: [
      "Up to 100 registrations",
      "Basic QR tickets",
      "Email confirmations",
      "1 event at a time",
      "Community support",
    ],
    cta: "Get started free →",
    bg: "#ffffff",
    accent: "#e0dbce",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/mo",
    description: "For serious event creators who need full control.",
    features: [
      "Unlimited registrations",
      "Custom branding & forms",
      "Real-time QR scanner app",
      "Google Sheets + Drive sync",
      "Payment verification",
      "Live analytics dashboard",
      "Priority email support",
    ],
    cta: "Start 14-day trial →",
    bg: "#8ed462",
    accent: "#8ed462",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organisations running multiple high-volume events.",
    features: [
      "Everything in Pro",
      "Multi-event management",
      "Team accounts & roles",
      "Dedicated account manager",
      "Custom integrations (API)",
      "SLA & uptime guarantee",
      "On-site setup support",
    ],
    cta: "Contact sales →",
    bg: "#ffffff",
    accent: "#2ba0ff",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="w-full py-[120px] px-4 bg-[#f5f1e4]">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#f5e211] px-4 py-2 neo-badge">
            Pricing
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            Simple, honest
            <br />
            <span className="text-[#80827f]">pricing.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className={`p-8 neo-border relative ${
                plan.popular
                  ? "neo-shadow-color-green bg-white -mt-4 md:-mt-8"
                  : "neo-shadow bg-white"
              }`}
              style={{
                borderColor: plan.popular ? "#8ed462" : "#2c2e2a",
                borderWidth: plan.popular ? "4px" : "3px",
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-6 bg-[#8ed462] text-[#2c2e2a] font-inter font-bold text-[12px] px-4 py-1.5 uppercase tracking-wider neo-badge">
                  Most popular
                </div>
              )}
              <div className="mb-6 mt-2">
                <h3 className="font-inter font-bold text-[22px] text-[#2c2e2a] mb-1 uppercase tracking-wider">
                  {plan.name}
                </h3>
                <p className="font-inter text-[14px] text-[#80827f]">
                  {plan.description}
                </p>
              </div>
              <div className="mb-8">
                <span className="font-inter font-bold text-[52px] text-[#2c2e2a] tracking-[-0.04em] leading-none">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="font-inter font-bold text-[18px] text-[#80827f]">
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-[3px] bg-[#2c2e2a] mb-6" />

              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 font-inter text-[15px] text-[#2c2e2a]"
                  >
                    <div
                      className="w-5 h-5 neo-border flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: plan.accent }}
                    >
                      <Check size={12} color="#2c2e2a" strokeWidth={3} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-4 font-inter font-bold text-[15px] uppercase tracking-wider neo-btn ${
                  plan.popular
                    ? "bg-[#2c2e2a] text-white"
                    : "bg-white text-[#2c2e2a]"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

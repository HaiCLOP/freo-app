"use client";

import { motion } from "framer-motion";
import {
  Ticket,
  QrCode,
  BarChart3,
  Shield,
  Zap,
  Palette,
} from "lucide-react";

const features = [
  {
    icon: Ticket,
    title: "Digital Ticketing",
    description:
      "Generate beautiful, branded digital tickets with unique QR codes for every attendee. No paper, no chaos.",
    color: "#8ed462",
    shadow: "neo-shadow-color-green",
  },
  {
    icon: QrCode,
    title: "Real-time QR Scanner",
    description:
      "Our dedicated mobile scanner app validates tickets instantly at the venue gate. Works offline too.",
    color: "#2ba0ff",
    shadow: "neo-shadow-color-blue",
  },
  {
    icon: Shield,
    title: "Payment Verification",
    description:
      "Screenshot fraud is over. We verify every payment against your bank before confirming a registration.",
    color: "#ff705d",
    shadow: "neo-shadow-color-coral",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Watch real-time dashboards with check-in rates, ticket velocity, revenue tracking, and audience demographics.",
    color: "#f5e211",
    shadow: "neo-shadow-color-yellow",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Your event, your brand. Fully customizable registration pages with your logo, colors, and custom form fields.",
    color: "#8ed462",
    shadow: "neo-shadow-color-green",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "All registrations sync to Google Sheets and Drive in real-time. Export data anytime, no lock-in.",
    color: "#2ba0ff",
    shadow: "neo-shadow-color-blue",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="w-full py-[120px] px-4">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#8ed462] px-4 py-2 neo-badge">
            Features
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            Everything you need.
            <br />
            <span className="text-[#80827f]">Nothing you don&apos;t.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`bg-white p-8 neo-border ${feature.shadow} cursor-default group hover:translate-x-[-3px] hover:translate-y-[-3px] transition-transform duration-200`}
            >
              <div
                className="w-16 h-16 neo-border flex items-center justify-center mb-6 group-hover:rotate-[-5deg] transition-transform duration-300"
                style={{ backgroundColor: feature.color }}
              >
                <feature.icon size={28} color="#2c2e2a" />
              </div>
              <h3 className="font-inter font-bold text-[22px] text-[#2c2e2a] mb-3">
                {feature.title}
              </h3>
              <p className="font-inter text-[16px] text-[#80827f] leading-[1.6]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

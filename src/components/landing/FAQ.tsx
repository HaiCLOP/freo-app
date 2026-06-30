"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Is Freo free to use?",
    a: "Yes! Our Starter plan is completely free for events with up to 100 registrations. You only need to upgrade when you want advanced features like custom branding, payment verification, or unlimited attendees.",
  },
  {
    q: "How does payment verification work?",
    a: "When attendees register, they can upload a screenshot of their payment. Freo can automatically verify transactions against your bank records or payment gateway, eliminating screenshot fraud and manual checking.",
  },
  {
    q: "Can I use my own branding?",
    a: "Absolutely. On the Pro plan, you can upload your logo, choose your brand colors, and customize every field on the registration form. Your attendees will see a fully branded experience — no Freo watermarks.",
  },
  {
    q: "How does the QR scanner work?",
    a: "We provide a dedicated mobile scanner app (built in Flutter) that your check-in team downloads. It connects to your event in real-time — scan a QR code, and the attendee is instantly validated and checked in. It even works offline and syncs when back online.",
  },
  {
    q: "Where does my data go?",
    a: "All registration data is securely stored in Supabase (our database). Additionally, every registration auto-syncs to a Google Sheet and uploaded files go to Google Drive, so you always have a backup you control. No lock-in, ever.",
  },
  {
    q: "Can I run multiple events at the same time?",
    a: "On the Pro plan, you can run one event at a time. For multiple concurrent events with team accounts, check out the Enterprise plan. We'll set you up with a dedicated account manager.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-[120px] px-4">
      <div className="max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[80px]"
        >
          <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#f5e211] px-4 py-2 neo-badge">
            FAQ
          </span>
          <h2 className="font-inter font-bold text-[42px] md:text-[72px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] mt-8">
            Got questions?
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full flex items-center justify-between bg-white px-6 py-5 text-left neo-border transition-all ${
                  openIndex === i
                    ? "neo-shadow-color-green"
                    : "neo-shadow"
                }`}
              >
                <span className="font-inter font-bold text-[17px] text-[#2c2e2a] pr-4">
                  {faq.q}
                </span>
                <div className="w-8 h-8 neo-border bg-[#f5e211] flex items-center justify-center shrink-0">
                  {openIndex === i ? (
                    <Minus size={16} strokeWidth={3} />
                  ) : (
                    <Plus size={16} strokeWidth={3} />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-5 font-inter text-[16px] text-[#80827f] leading-[1.7] bg-[#f5f1e4] border-x-[3px] border-b-[3px] border-[#2c2e2a]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, honest pricing for Freo. Start free, upgrade when you're ready. No hidden fees, no surprises.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f5f1e4] overflow-hidden">
      <Nav />

      {/* Page header */}
      <section className="w-full pt-[140px] pb-[40px] px-4 text-center">
        <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#f5e211] px-4 py-2 neo-badge">
          Pricing
        </span>
        <h1 className="font-inter font-bold text-[48px] md:text-[90px] text-[#2c2e2a] tracking-[-0.05em] leading-[0.95] mt-8">
          Pay for what
          <br />
          <span className="text-[#80827f]">you actually use.</span>
        </h1>
        <p className="mt-6 font-inter text-[18px] md:text-[20px] text-[#80827f] max-w-[550px] mx-auto leading-relaxed">
          Start free. Upgrade when you&apos;re ready. No hidden fees, no lock-in
          contracts.
        </p>
      </section>

      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  );
}

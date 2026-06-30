import { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ScannerShowcase } from "@/components/landing/ScannerShowcase";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore all of Freo's powerful features — digital ticketing, real-time QR scanning, payment verification, live analytics, and more.",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#f5f1e4] overflow-hidden">
      <Nav />

      {/* Page header */}
      <section className="w-full pt-[140px] pb-[60px] px-4 text-center">
        <span className="inline-block font-inter font-bold text-[13px] text-[#2c2e2a] tracking-[0.2em] uppercase mb-4 bg-[#8ed462] px-4 py-2 neo-badge">
          Features
        </span>
        <h1 className="font-inter font-bold text-[48px] md:text-[90px] text-[#2c2e2a] tracking-[-0.05em] leading-[0.95] mt-8">
          Built for creators
          <br />
          <span className="text-[#80827f]">who demand more.</span>
        </h1>
        <p className="mt-6 font-inter text-[18px] md:text-[20px] text-[#80827f] max-w-[600px] mx-auto leading-relaxed">
          Every feature is designed to save you time, eliminate fraud, and make
          your attendees say &ldquo;wow&rdquo;.
        </p>
      </section>

      <FeaturesGrid />
      <HowItWorks />
      <ScannerShowcase />
      <CTABanner />
      <Footer />
    </main>
  );
}

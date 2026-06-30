import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { LogoBar } from "@/components/landing/LogoBar";
import { HorizontalFeatures } from "@/components/landing/HorizontalFeatures";
import { ScrollTextReveal } from "@/components/landing/ScrollTextReveal";
import { ScannerShowcase } from "@/components/landing/ScannerShowcase";
import { ParallaxShowcase } from "@/components/landing/ParallaxShowcase";
import { StatsSection } from "@/components/landing/StatsSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f1e4] overflow-hidden">
      <Nav />
      <Hero />
      <LogoBar />
      <HorizontalFeatures />
      <ScrollTextReveal />
      <ScannerShowcase />
      <ParallaxShowcase />
      <StatsSection />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}

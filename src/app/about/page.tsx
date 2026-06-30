import { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import { StatsSection } from "@/components/landing/StatsSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Freo — the team behind the premium event registration platform trusted by creators across India.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f5f1e4] overflow-hidden">
      <Nav />

      {/* Page header */}
      <section className="w-full pt-[140px] pb-[60px] px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <span className="inline-block font-inter font-bold text-[13px] text-white tracking-[0.2em] uppercase mb-4 bg-[#2ba0ff] px-4 py-2 neo-badge">
              About us
            </span>
            <h1 className="font-inter font-bold text-[48px] md:text-[80px] text-[#2c2e2a] tracking-[-0.05em] leading-[0.95] mt-8">
              We believe events
              <br />
              <span className="text-[#80827f]">deserve better tools.</span>
            </h1>
            <p className="mt-8 font-inter text-[18px] text-[#80827f] leading-[1.7] max-w-[520px]">
              Freo was born out of frustration. We watched brilliant event
              creators drown in spreadsheets, chase fake payment screenshots,
              and lose hours at check-in desks. We knew there had to be a better
              way.
            </p>
            <p className="mt-4 font-inter text-[18px] text-[#80827f] leading-[1.7] max-w-[520px]">
              So we built one. A platform that handles registration, payment
              verification, and ticket scanning — so creators can focus on what
              they do best: creating unforgettable experiences.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="neo-border-thick neo-shadow-xl bg-white p-4 max-w-[450px] rotate-2">
              <Image
                src="/event-people.png"
                alt="Freo community illustration"
                width={450}
                height={450}
                className="w-full h-auto neo-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="w-full py-[100px] px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-inter font-bold text-[42px] md:text-[64px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] text-center mb-16">
            What drives us.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Creators first",
                desc: "Every decision we make starts with: does this make the creator's life easier? If not, we don't ship it.",
                color: "#8ed462",
                emoji: "🎯",
              },
              {
                title: "No BS pricing",
                desc: "We don't hide fees in the fine print. Start free, pay when you grow. Cancel anytime, export everything.",
                color: "#f5e211",
                emoji: "💰",
              },
              {
                title: "Indian-first",
                desc: "Built for the Indian event ecosystem — UPI screenshots, WhatsApp sharing, Google Sheets exports. We get it.",
                color: "#ff705d",
                emoji: "🇮🇳",
              },
            ].map((value, i) => (
              <div
                key={value.title}
                className="bg-white p-8 neo-card"
              >
                <div
                  className="w-16 h-16 neo-border flex items-center justify-center mb-6 text-[28px]"
                  style={{ backgroundColor: value.color }}
                >
                  {value.emoji}
                </div>
                <h3 className="font-inter font-bold text-[24px] text-[#2c2e2a] mb-3">
                  {value.title}
                </h3>
                <p className="font-inter text-[16px] text-[#80827f] leading-[1.6]">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="w-full py-[100px] px-4 bg-white border-y-4 border-[#2c2e2a]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-inter font-bold text-[42px] md:text-[64px] text-[#2c2e2a] tracking-[-0.04em] leading-[1.05] text-center mb-16">
            Our journey.
          </h2>
          <div className="flex flex-col gap-10 relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-[4px] bg-[#e0dbce]" />
            {[
              {
                date: "Jan 2026",
                title: "The idea is born",
                desc: "After watching TEDx Nagpur struggle with paper tickets, Freo was conceptualized.",
                color: "#8ed462",
              },
              {
                date: "Mar 2026",
                title: "First beta launch",
                desc: "Launched with 3 early-access event creators. 500 tickets issued in the first week.",
                color: "#2ba0ff",
              },
              {
                date: "May 2026",
                title: "Scanner app ships",
                desc: "Built the Flutter-based QR scanner app with offline support. Game changer for check-ins.",
                color: "#ff705d",
              },
              {
                date: "Jun 2026",
                title: "50,000 tickets milestone",
                desc: "Crossed 50K tickets issued and 200+ events powered across 12 Indian cities.",
                color: "#f5e211",
              },
            ].map((item) => (
              <div key={item.date} className="flex gap-6 items-start relative">
                <div
                  className="w-10 h-10 neo-border flex items-center justify-center shrink-0 relative z-10 text-[12px] font-bold text-[#2c2e2a]"
                  style={{ backgroundColor: item.color }}
                >
                  ●
                </div>
                <div>
                  <span className="font-inter font-bold text-[13px] text-[#80827f] uppercase tracking-wider">
                    {item.date}
                  </span>
                  <h3 className="font-inter font-bold text-[22px] text-[#2c2e2a] mb-1 mt-1">
                    {item.title}
                  </h3>
                  <p className="font-inter text-[16px] text-[#80827f] leading-[1.6] max-w-[500px]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatsSection />
      <Testimonials />
      <CTABanner />
      <Footer />
    </main>
  );
}

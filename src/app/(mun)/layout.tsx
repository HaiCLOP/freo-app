import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freo MUN — India's First MUN-Native Platform",
  description:
    "Dynamic committees, AI-powered portfolio allotment, live sessions, and automated certificates. Conference management, reimagined.",
  keywords: [
    "MUN", "Model United Nations", "conference management", "Freo MUN",
    "MUN platform", "India MUN", "delegate management", "portfolio allotment",
  ],
  openGraph: {
    title: "Freo MUN — Conference Management, Reimagined",
    description: "Dynamic committees. AI allotment. Live sessions. Built by people who actually do MUN.",
    siteName: "Freo MUN",
    type: "website",
  },
};

export default function MUNLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { getPublicConference } from "@/lib/mun/actions/conference";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Users, ExternalLink, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const conf = await getPublicConference(slug);
  if (!conf) return { title: "Conference Not Found" };
  return {
    title: `${conf.name} — Freo MUN`,
    description: conf.description || `Register for ${conf.name} by ${conf.org_name}`,
    openGraph: {
      title: conf.name,
      description: conf.description || `Register for ${conf.name}`,
      siteName: "Freo MUN",
    },
  };
}

import { headers } from "next/headers";
import PublicConferenceClientPage from "./client-page";

export default async function PublicConferencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conf = await getPublicConference(slug);
  if (!conf) notFound();

  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  return <PublicConferenceClientPage conf={conf} slug={slug} origin={origin} />;
}

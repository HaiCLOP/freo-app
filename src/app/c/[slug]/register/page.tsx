import { getPublicConference } from "@/lib/mun/actions/conference";
import { notFound } from "next/navigation";
import { RegistrationForm } from "@/components/mun/RegistrationForm";
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
    title: `Register — ${conf.name} — Freo MUN`,
    description: `Register for ${conf.name} by ${conf.org_name}`,
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conf = await getPublicConference(slug);
  if (!conf) notFound();

  const now = new Date();
  const regClose = new Date(conf.registration_close);
  const regOpen = new Date(conf.registration_open);

  if (now < regOpen || now > regClose) {
    return (
      <div className="min-h-screen bg-[#f5f1e4] flex items-center justify-center p-6">
        <div className="neo-card bg-white p-12 max-w-lg text-center">
          <h2 className="text-2xl font-bold text-[#1B1C20] mb-2">
            Registration {now < regOpen ? "Not Yet Open" : "Closed"}
          </h2>
          <p className="text-[#6B7280]">
            {now < regOpen
              ? `Registration opens ${regOpen.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}`
              : "The registration window for this conference has ended."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm
      conference={{
        id: conf.id,
        name: conf.name,
        org_name: conf.org_name,
        delegate_fee: conf.delegate_fee,
        banner_url: conf.banner_url || null,
        upi_id: conf.upi_id || null,
        upi_qr_url: conf.upi_qr_url || null,
        razorpay_link: conf.razorpay_link || null,
        committees: conf.committees,
      }}
    />
  );
}

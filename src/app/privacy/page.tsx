import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/freologo.png" alt="Freo Logo" width={40} height={40} className="rounded-xl object-contain bg-[#1B1C20] p-1 shadow-lg" />
            <span className="font-bold text-3xl tracking-tight font-[family-name:var(--font-fredoka)]">Freo</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                Welcome to Freo, an event registration platform developed and maintained by HaiCLOP Labs ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <p>We collect personal information that you voluntarily provide to us when registering for an event or creating an account, including:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Personal Details:</strong> Name, phone number, and email address.</li>
                <li><strong>Payment Information:</strong> Transaction references (UTR IDs) and payment screenshots.</li>
                <li><strong>Event Data:</strong> Custom fields required by event creators, such as Referral IDs or specific attendee requirements.</li>
                <li><strong>Creator Data:</strong> Account credentials and settings for event organizers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Facilitate event registrations and issue digital tickets.</li>
                <li>Verify payments submitted to event creators.</li>
                <li>Send transactional emails (e.g., confirmations, approvals, and rejections).</li>
                <li>Provide event creators with attendee analytics and exportable attendee lists via Google Sheets.</li>
                <li>Improve the Freo platform and ensure security.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
              <p>
                As an attendee, the information you submit during registration is shared directly with the specific event creator. We do not sell, rent, or trade your personal information to third parties. Event creators are responsible for handling your data in accordance with their own privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p>
                We implement robust, industry-standard security measures, including Row Level Security (RLS) via Supabase, to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact HaiCLOP Labs at: <strong>haicloplabs@gmail.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

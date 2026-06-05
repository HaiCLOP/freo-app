import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p>
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and HaiCLOP Labs ("we," "us" or "our"), concerning your access to and use of the Freo application and website. By accessing Freo, you agree that you have read, understood, and agree to be bound by all of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Role</h2>
              <p>
                Freo is a technology platform that facilitates event registration and digital ticketing. <strong>HaiCLOP Labs does not host, organize, or manage the events listed on the platform.</strong> We simply provide the software tools for event creators to collect registrations and manage their attendees. All disputes regarding event cancellations, refunds, or quality must be taken up directly with the respective event creator.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>For Attendees:</strong> You agree to provide accurate, current, and complete information during the registration process. You are strictly prohibited from submitting fraudulent payment screenshots or UTR IDs.</li>
                <li><strong>For Creators:</strong> You agree to use the platform legally and ethically. You are solely responsible for verifying payments, issuing approvals, and managing your event's operations. You must not use Freo to host illegal or unauthorized events.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payments and Fees</h2>
              <p>
                Freo currently facilitates payments through direct UPI transfers to the event creator. HaiCLOP Labs does not process, hold, or touch any funds. The financial transaction occurs directly between the attendee and the event creator outside of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
              <p>
                Unless otherwise indicated, the Freo platform is our proprietary property. All source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or controlled by HaiCLOP Labs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Modifications and Interruptions</h2>
              <p>
                We reserve the right to change, modify, or remove the contents of the platform at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Information</h2>
              <p>
                In order to resolve a complaint regarding the platform or to receive further information regarding use of the platform, please contact us at: <strong>events@haicloplabs.in</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

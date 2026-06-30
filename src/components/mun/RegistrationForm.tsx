"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EXPERIENCE_LEVELS } from "@/lib/mun/constants";
import { CheckCircle2, Upload, ChevronDown } from "lucide-react";

interface RegisterPageProps {
  conference: {
    id: string;
    name: string;
    org_name: string;
    delegate_fee: number;
    banner_url?: string | null;
    upi_id?: string | null;
    upi_qr_url?: string | null;
    razorpay_link?: string | null;
    committees: Array<{
      id: string;
      name: string;
      short_name: string;
      allow_observer: boolean;
      allow_press: boolean;
    }>;
  };
}

export function RegistrationForm({ conference }: RegisterPageProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [regType, setRegType] = useState<"delegate" | "observer" | "press">("delegate");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const router = useRouter();

  const hasObserver = conference.committees.some((c) => c.allow_observer);
  const hasPress = conference.committees.some((c) => c.allow_press);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("registration_type", regType);

    // Handle screenshot upload
    if (screenshotFile && conference.delegate_fee > 0) {
      fd.set("payment_screenshot", screenshotFile);
    }

    startTransition(async () => {
      try {
        const { submitRegistration } = await import("@/lib/mun/actions/registration");
        await submitRegistration(conference.id, fd);
        setSuccess(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          // Parse Zod validation errors for friendly display
          try {
            const parsed = JSON.parse(err.message);
            if (Array.isArray(parsed)) {
              const messages = parsed.map((e: { path?: string[]; message?: string }) => {
                const field = e.path?.join(".") || "field";
                const label = field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                return `${label}: ${e.message}`;
              });
              setError(messages.join("\n"));
              return;
            }
          } catch {
            // Not JSON, use raw message
          }
          setError(err.message);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f1e4] flex items-center justify-center p-6">
        <div className="neo-card bg-white p-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#22C55E]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B1C20] mb-2">Registration Submitted!</h2>
          <p className="text-[#6B7280] mb-6">
            You&apos;ll receive a confirmation email shortly. The organizers will review your application.
          </p>
          <button
            onClick={() => router.push(`/c/${window.location.pathname.split("/")[2]}`)}
            className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm"
          >
            Back to Conference
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e4] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {conference.banner_url && (
          <div className="mb-8 rounded-xl overflow-hidden neo-badge bg-white p-2">
            <img 
              src={conference.banner_url} 
              alt={`${conference.name} Banner`} 
              className="w-full h-auto max-h-64 object-cover rounded-lg border-2 border-[#1B1C20]"
            />
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#1B1C20] mb-2">{conference.name}</h1>
          <p className="text-[#6B7280] font-bold text-lg">{conference.org_name}</p>
        </div>

        {error && (
          <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium mb-6">
            {error.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>
            ))}
          </div>
        )}

        {/* Registration type toggle */}
        {(hasObserver || hasPress) && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRegType("delegate")}
              className={`neo-badge px-4 py-2 text-sm font-bold transition-colors ${
                regType === "delegate" ? "bg-[#1B1C20] text-[#DDFE55]" : "bg-white text-[#6B7280]"
              }`}
            >
              Delegate
            </button>
            {hasObserver && (
              <button
                type="button"
                onClick={() => setRegType("observer")}
                className={`neo-badge px-4 py-2 text-sm font-bold transition-colors ${
                  regType === "observer" ? "bg-[#1B1C20] text-[#DDFE55]" : "bg-white text-[#6B7280]"
                }`}
              >
                Observer
              </button>
            )}
            {hasPress && (
              <button
                type="button"
                onClick={() => setRegType("press")}
                className={`neo-badge px-4 py-2 text-sm font-bold transition-colors ${
                  regType === "press" ? "bg-[#1B1C20] text-[#DDFE55]" : "bg-white text-[#6B7280]"
                }`}
              >
                Press
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="neo-card bg-white p-8 space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Full Name *</label>
              <input name="delegate_name" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Email *</label>
              <input name="delegate_email" type="email" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Phone *</label>
              <input name="delegate_phone" type="tel" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">School / Institution *</label>
              <input name="delegate_school" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Grade / Year</label>
              <input name="delegate_grade" className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">MUN Experience *</label>
              <div className="relative">
                <select name="experience_level" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] appearance-none">
                  <option value="">Select experience level</option>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Committee preferences (delegates only) */}
          {regType === "delegate" && (
            <div className="space-y-4">
              <h3 className="font-bold text-[#1B1C20]">Committee Preferences</h3>
              {[1, 2, 3].map((n) => (
                <div key={n}>
                  <label className="block text-sm font-bold text-[#1B1C20] mb-2">
                    {n === 1 ? "1st" : n === 2 ? "2nd" : "3rd"} Preference {n === 1 ? "*" : "(optional)"}
                  </label>
                  <div className="relative">
                    <select
                      name={`committee_pref_${n}`}
                      required={n === 1}
                      className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] appearance-none"
                    >
                      <option value="">Select committee</option>
                      {conference.committees.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.short_name} — {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment */}
          {conference.delegate_fee > 0 && (
            <div className="space-y-6 pt-6 border-t-2 border-dashed border-[#1B1C20]">
              <h3 className="font-black text-xl uppercase text-[#1B1C20]">
                Payment — ₹{conference.delegate_fee}
              </h3>

              {conference.razorpay_link && (
                <a 
                  href={conference.razorpay_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn bg-[#1B1C20] text-white px-6 py-4 font-bold text-sm w-full block text-center mb-6 hover:bg-gray-800 transition-colors"
                >
                  Pay via Razorpay
                </a>
              )}

              {(conference.upi_qr_url || conference.upi_id) && (
                <div className="bg-[#DDFE55]/20 p-6 neo-badge border-2 border-[#1B1C20]">
                  <h4 className="font-bold text-[#1B1C20] mb-4 text-center">Scan to Pay</h4>
                  
                  {conference.upi_qr_url && (
                    <div className="flex justify-center mb-6">
                      <div className="neo-badge bg-white p-4">
                        <img src={conference.upi_qr_url} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                      </div>
                    </div>
                  )}

                  {conference.upi_id && (
                    <div className="text-center mb-4">
                      <p className="text-sm text-[#6B7280] font-bold mb-1">UPI ID</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="bg-white neo-badge px-4 py-2 font-mono font-bold text-[#1B1C20]">{conference.upi_id}</code>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(conference.upi_id!);
                            alert("UPI ID copied!");
                          }}
                          className="neo-badge bg-[#1B1C20] text-white px-3 py-2 text-xs font-bold hover:bg-gray-800"
                        >
                          COPY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1B1C20] mb-2">UTR / Transaction ID *</label>
                  <input name="payment_utr" required className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" placeholder="e.g. 123456789012" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1B1C20] mb-2">Payment Screenshot *</label>
                  <label className="neo-badge bg-white border-2 border-dashed border-[#1B1C20] p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={20} className="text-[#1B1C20]" />
                    <span className="text-sm font-bold text-[#1B1C20]">
                      {screenshotFile ? screenshotFile.name : "Click to upload screenshot"}
                    </span>
                    <input
                      type="file"
                      name="payment_screenshot"
                      required
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="neo-btn bg-[#1B1C20] text-[#DDFE55] px-10 py-5 font-black text-lg w-full disabled:opacity-50 mt-8 uppercase hover:bg-gray-900 transition-colors"
          >
            {isPending ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

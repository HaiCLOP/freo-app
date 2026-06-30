"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Settings,
  Users,
  FileText,
  CreditCard,
  Rocket,
  UserPlus,
} from "lucide-react";

const STEPS = [
  { label: "Conference Info", icon: Building2 },
  { label: "Settings", icon: Settings },
  { label: "Committees", icon: Users },
  { label: "Registration Form", icon: FileText },
  { label: "Payments", icon: CreditCard },
  { label: "Review & Publish", icon: Rocket },
  { label: "Invite EB", icon: UserPlus },
];

export default function NewConferencePage() {
  const [step, setStep] = useState(0);
  const [conferenceId, setConferenceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    // Merge into state
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    setFormState((prev) => ({ ...prev, ...raw }));

    // Date Sanitization Check
    const regOpen = new Date(raw.registration_open);
    const regClose = new Date(raw.registration_close);
    const startDate = new Date(raw.date_start);
    const endDate = new Date(raw.date_end);

    if (regOpen >= regClose) {
      setError("Registration Opens must be before Registration Closes.");
      return;
    }
    if (regClose >= startDate) {
      setError("Registration Closes must be before the Conference Start Date.");
      return;
    }
    if (startDate >= endDate) {
      setError("Conference Start Date must be before the End Date.");
      return;
    }

    if (!conferenceId) {
      // Create conference on first step
      startTransition(async () => {
        try {
          const { createConference } = await import("@/lib/mun/actions/conference");
          const conf = await createConference(fd);
          setConferenceId(conf.id);
          next();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to create conference");
        }
      });
    } else {
      startTransition(async () => {
        try {
          const { updateConference } = await import("@/lib/mun/actions/conference");
          await updateConference(conferenceId, fd);
          next();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to update conference");
        }
      });
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!conferenceId) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const { updateConference, uploadMunBanner } = await import("@/lib/mun/actions/conference");
        await updateConference(conferenceId, fd);
        
        const bannerFile = fd.get("banner") as File;
        if (bannerFile && bannerFile.size > 0) {
          await uploadMunBanner(conferenceId, fd);
        }
        
        next();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update settings");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.label}
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#1B1C20] text-[#DDFE55] neo-badge"
                  : isDone
                    ? "bg-[#DDFE55]/20 text-[#1B1C20] neo-badge cursor-pointer"
                    : "bg-[#f3f4f6] text-[#9ca3af] neo-badge cursor-not-allowed"
              }`}
            >
              {isDone ? <Check size={14} /> : <Icon size={14} />}
              <span className="hidden lg:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Step 1: Conference Info */}
      {step === 0 && (
        <form onSubmit={handleStep1Submit} className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Conference Info</h2>
          <p className="text-[#6B7280]">
            Set up the basics — conference name, organization, and location.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Conference Name *</label>
              <input
                name="name"
                required
                defaultValue={formState.name}
                placeholder="e.g. DESMUN 2026"
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Organization *</label>
              <input
                name="org_name"
                required
                defaultValue={formState.org_name}
                placeholder="e.g. Delhi Public School, RK Puram"
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">City *</label>
              <input
                name="city"
                required
                defaultValue={formState.city}
                placeholder="e.g. New Delhi"
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Venue *</label>
              <input
                name="venue"
                required
                defaultValue={formState.venue}
                placeholder="e.g. Auditorium Block, DPS RKP"
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Start Date *</label>
              <input
                name="date_start"
                type="datetime-local"
                required
                defaultValue={formState.date_start}
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">End Date *</label>
              <input
                name="date_end"
                type="datetime-local"
                required
                defaultValue={formState.date_end}
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Registration Opens *</label>
              <input
                name="registration_open"
                type="datetime-local"
                required
                defaultValue={formState.registration_open}
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Registration Closes *</label>
              <input
                name="registration_close"
                type="datetime-local"
                required
                defaultValue={formState.registration_close}
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Max Delegates</label>
              <input
                name="max_delegates"
                type="number"
                min={1}
                defaultValue={formState.max_delegates || "100"}
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Delegate Fee (₹)</label>
              <input
                name="delegate_fee"
                type="number"
                min={0}
                defaultValue={formState.delegate_fee || "0"}
                placeholder="0 for free"
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={formState.description}
                placeholder="Tell delegates about your conference..."
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Next"}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Settings */}
      {step === 1 && (
        <form onSubmit={handleSettingsSubmit} className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Conference Settings</h2>
          <p className="text-[#6B7280]">Additional details — refund policy, payment links, social links.</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Refund Policy</label>
              <textarea
                name="refund_policy"
                rows={3}
                placeholder="e.g. No refunds after allotment. 50% refund before..."
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Conference Banner (Google Drive)</label>
              <div className="neo-badge w-full px-4 py-3 bg-[#f3f4f6] flex items-center justify-between">
                <input
                  name="banner"
                  type="file"
                  accept="image/*"
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1B1C20] file:text-[#DDFE55] hover:file:bg-[#333] cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">Requires Google Account integration in Global Settings. Will be stored in "MUN Banners".</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Razorpay Payment Link (optional)</label>
              <input
                name="razorpay_link"
                type="url"
                placeholder="https://rzp.io/l/..."
                className="neo-badge w-full px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
              />
              <p className="text-xs text-[#9ca3af] mt-1">Leave blank to use UPI screenshot verification</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prev} className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm inline-flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="submit" disabled={isPending} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {isPending ? "Saving..." : "Next"} <ChevronRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Committees (placeholder — will navigate to committee editor) */}
      {step === 2 && (
        <div className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Add Committees</h2>
          <p className="text-[#6B7280]">
            Use the Dynamic Committee Engine to add committees. You can add more later from the conference dashboard.
          </p>
          <div className="bg-[#f3f4f6] neo-badge p-6 text-center text-sm text-[#6B7280]">
            Committee builder will be available on the conference dashboard.
            <br />Skip this step to set up committees after creating the conference.
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={prev} className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm inline-flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" onClick={next} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Registration Form Builder (placeholder) */}
      {step === 3 && (
        <div className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Registration Form</h2>
          <p className="text-[#6B7280]">
            A powerful drag-and-drop form builder allows you to fully customize delegate data collection.
          </p>
          <div className="bg-[#f3f4f6] neo-badge p-6 space-y-3">
            <p className="text-sm font-bold text-[#1B1C20]">Basic Fields Included:</p>
            {["Full Name", "Email", "Phone"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <Check size={14} className="text-[#22C55E]" />
                <span className="text-[#1B1C20] font-medium">{f}</span>
                <span className="text-[#9ca3af] text-xs ml-auto">Locked</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-[#6B7280]">
                You can add Custom Dropdowns, File Uploads, Grid Choices, and more in the <span className="font-bold">Form Builder Tab</span> inside the Conference Dashboard.
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={prev} className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm inline-flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" onClick={next} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Payments */}
      {step === 4 && (
        <div className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Payment Configuration</h2>
          <p className="text-[#6B7280]">
            Payment settings have been saved from Step 1. You can update the Razorpay link and refund policy from Settings.
          </p>
          <div className="bg-[#f3f4f6] neo-badge p-6 space-y-2 text-sm">
            <p><strong>Fee:</strong> ₹{formState.delegate_fee || "0"} {Number(formState.delegate_fee || 0) === 0 ? "(Free Event)" : ""}</p>
            <p><strong>Method:</strong> UPI Screenshot + UTR Verification</p>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={prev} className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm inline-flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" onClick={next} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Review & Publish */}
      {step === 5 && (
        <div className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">Review & Publish</h2>
          <p className="text-[#6B7280]">Your conference is saved as a draft. Publish it to make the registration page live.</p>

          <div className="bg-[#f3f4f6] neo-badge p-6 space-y-2 text-sm">
            <p><strong>Name:</strong> {formState.name}</p>
            <p><strong>Org:</strong> {formState.org_name}</p>
            <p><strong>City:</strong> {formState.city}</p>
            <p><strong>Venue:</strong> {formState.venue}</p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => conferenceId && router.push(`/mun/dashboard/conference/${conferenceId}`)}
              className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!conferenceId) return;
                startTransition(async () => {
                  const { publishConference } = await import("@/lib/mun/actions/conference");
                  await publishConference(conferenceId);
                  next();
                });
              }}
              className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Rocket size={16} />
              {isPending ? "Publishing..." : "Publish Conference"}
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Invite EB */}
      {step === 6 && (
        <div className="neo-card bg-white p-8 space-y-6">
          <h2 className="text-2xl font-bold text-[#1B1C20]">🎉 Conference Created!</h2>
          <p className="text-[#6B7280]">
            Your conference is live. Now invite your Executive Board members.
          </p>

          <div className="flex gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => conferenceId && router.push(`/mun/dashboard/conference/${conferenceId}/eb`)}
              className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-bold text-sm inline-flex items-center gap-2"
            >
              <UserPlus size={16} />
              Invite EB Members
            </button>
            <button
              type="button"
              onClick={() => conferenceId && router.push(`/mun/dashboard/conference/${conferenceId}`)}
              className="neo-btn bg-white text-[#1B1C20] px-6 py-3 font-bold text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

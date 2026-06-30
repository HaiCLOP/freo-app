"use client";

import { useState, useTransition } from "react";
import { updateConference } from "@/lib/mun/actions/conference";
import { Save, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SettingsForm({ conference }: { conference: any }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Format dates for datetime-local input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    
    // Add missing boolean states
    if (!fd.has("is_published")) fd.append("is_published", "false");

    startTransition(async () => {
      try {
        await updateConference(conference.id, fd);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to update settings");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="neo-card bg-white p-8 border-[3px] border-[#1B1C20] shadow-[8px_8px_0px_#1B1C20] space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 neo-badge flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-[#DDFE55]/20 text-[#1B1C20] p-4 neo-badge font-bold text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* General Info */}
      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase text-[#1B1C20] border-b-2 border-[#1B1C20] pb-2">General Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Conference Name *</label>
            <input name="name" defaultValue={conference.name} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Organization Name *</label>
            <input name="org_name" defaultValue={conference.org_name} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Description</label>
            <textarea name="description" defaultValue={conference.description} rows={3} className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium resize-none" />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase text-[#1B1C20] border-b-2 border-[#1B1C20] pb-2">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">City *</label>
            <input name="city" defaultValue={conference.city} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Venue *</label>
            <input name="venue" defaultValue={conference.venue} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
        </div>
      </section>

      {/* Dates & Capacity */}
      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase text-[#1B1C20] border-b-2 border-[#1B1C20] pb-2">Dates & Capacity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Registration Opens *</label>
            <input name="registration_open" type="datetime-local" defaultValue={formatDateForInput(conference.registration_open)} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Registration Closes *</label>
            <input name="registration_close" type="datetime-local" defaultValue={formatDateForInput(conference.registration_close)} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Conference Start *</label>
            <input name="date_start" type="datetime-local" defaultValue={formatDateForInput(conference.date_start)} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Conference End *</label>
            <input name="date_end" type="datetime-local" defaultValue={formatDateForInput(conference.date_end)} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Total Max Delegates *</label>
            <input name="max_delegates" type="number" min={1} defaultValue={conference.max_delegates} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
        </div>
      </section>

      {/* Media & Branding */}
      <section className="space-y-4 pt-4 border-t-2 border-dashed border-[#1B1C20]">
        <h2 className="text-xl font-black uppercase text-[#1B1C20] border-b-2 border-[#1B1C20] pb-2">Media & Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Event Banner Image</label>
            {conference.banner_url && (
              <div className="mb-4">
                <img src={conference.banner_url} alt="Current Banner" className="w-full h-48 object-cover neo-badge" />
                <p className="text-xs text-gray-500 mt-2">Upload a new image below to replace this banner.</p>
              </div>
            )}
            <input name="banner_file" type="file" accept="image/*" className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-[#1B1C20] file:text-white hover:file:bg-gray-800" />
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="space-y-4 pt-4 border-t-2 border-dashed border-[#1B1C20]">
        <h2 className="text-xl font-black uppercase text-[#1B1C20] border-b-2 border-[#1B1C20] pb-2">Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Delegate Fee (INR) *</label>
            <input name="delegate_fee" type="number" min={0} defaultValue={conference.delegate_fee} required className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Razorpay Payment Link</label>
            <input name="razorpay_link" type="url" defaultValue={conference.razorpay_link || ""} placeholder="https://rzp.io/..." className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          
          <div className="md:col-span-2 pt-4 border-t border-dashed border-gray-300">
            <h3 className="text-lg font-bold text-[#1B1C20] mb-4">UPI Custom Payment (Optional)</h3>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">UPI ID (e.g. freo@upi)</label>
            <input name="upi_id" type="text" defaultValue={conference.upi_id || ""} placeholder="freo@upi" className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">UPI QR Code Image</label>
            {conference.upi_qr_url && (
              <div className="mb-4">
                <img src={conference.upi_qr_url} alt="Current UPI QR" className="w-32 h-32 object-cover neo-badge" />
              </div>
            )}
            <input name="upi_qr_file" type="file" accept="image/*" className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-[#1B1C20] file:text-white hover:file:bg-gray-800" />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Refund Policy</label>
            <textarea name="refund_policy" defaultValue={conference.refund_policy || ""} rows={2} placeholder="E.g. No refunds within 7 days of event." className="neo-badge w-full px-4 py-2 bg-gray-50 font-medium resize-none" />
          </div>
        </div>
      </section>
      
      {/* Visibility */}
      <section className="space-y-4 pt-4 border-t-2 border-dashed border-[#1B1C20]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" value="true" defaultChecked={conference.is_published} className="w-5 h-5 accent-[#1B1C20] border-2 border-[#1B1C20] rounded-none bg-white" />
          <div>
            <div className="font-bold text-[#1B1C20]">Publish Conference</div>
            <div className="text-sm text-gray-500">Make this conference visible to delegates and open for registration.</div>
          </div>
        </label>
      </section>

      <div className="pt-6">
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full sm:w-auto neo-btn bg-[#DDFE55] text-[#1B1C20] px-8 py-3 font-black flex items-center justify-center gap-2 hover:bg-[#cbe849] transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isPending ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>
    </form>
  );
}

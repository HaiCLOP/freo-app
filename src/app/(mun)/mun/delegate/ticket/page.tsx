import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrCode, CheckCircle2, Clock, MapPin, CalendarDays, CreditCard } from "lucide-react";
// We use a simple placeholder for the QR code for now, can be upgraded with qrcode.react
import { QRCodeSVG } from "qrcode.react";

export default async function DelegateTicketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch delegate's active registration
  const { data: registration } = await supabase
    .from("mun_registrations")
    .select(`
      *,
      conference:mun_conferences(name, org_name, date_start, date_end, venue, city),
      portfolio:mun_portfolios(name, committee:mun_committees(short_name))
    `)
    .eq("user_id", user.id)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!registration) return null;

  const conf = registration.conference as any;
  const portfolio = registration.portfolio as any;

  const startDate = new Date(conf.date_start).toLocaleDateString("en-IN", { month: "long", day: "numeric" });
  
  // The QR token would normally be generated at approval. If missing, we'll just use the ID.
  const qrValue = registration.qr_token || registration.id;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1B1C20] flex items-center gap-2">
          <QrCode size={24} className="text-[#A855F7]" />
          My Ticket & Pass
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Present this QR code at the registration desk on the day of the conference.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pass Card */}
        <div className="neo-card bg-white overflow-hidden flex flex-col">
          <div className="bg-[#1B1C20] p-6 text-white text-center">
            <span className="neo-badge bg-[#DDFE55] text-[#1B1C20] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              DELEGATE PASS
            </span>
            <h3 className="text-2xl font-bold">{conf.name}</h3>
            <p className="text-sm text-[#8E8F94] mt-1">{conf.org_name}</p>
          </div>
          
          <div className="p-8 flex-1 flex flex-col items-center justify-center border-b-2 border-dashed border-[#e5e7eb]">
            <div className="bg-white p-4 neo-badge shadow-sm">
              <QRCodeSVG value={qrValue} size={180} level="M" />
            </div>
            <p className="text-xs text-[#9ca3af] mt-4 font-mono">
              ID: {registration.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
          
          <div className="p-6 bg-[#f9fafb]">
            <h4 className="font-bold text-[#1B1C20] text-lg text-center mb-1">
              {registration.delegate_name}
            </h4>
            <p className="text-sm text-[#6B7280] text-center mb-4">
              {registration.delegate_school}
            </p>
            
            <div className="flex justify-between items-center bg-white neo-badge p-3">
              <div>
                <p className="text-[10px] text-[#9ca3af] font-bold uppercase">Committee</p>
                <p className="text-sm font-bold text-[#1B1C20]">{portfolio?.committee?.short_name || "TBA"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#9ca3af] font-bold uppercase">Portfolio</p>
                <p className="text-sm font-bold text-[#1B1C20]">{portfolio?.name || "TBA"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details & Payment */}
        <div className="space-y-6">
          <div className="neo-card bg-white p-6 space-y-4">
            <h4 className="font-bold text-[#1B1C20] flex items-center gap-2">
              <MapPin size={16} /> Venue Details
            </h4>
            <div className="pl-6 space-y-2 text-sm text-[#6B7280]">
              <p>{conf.venue}</p>
              <p>{conf.city}</p>
              <p className="flex items-center gap-1 mt-2 text-[#1B1C20] font-bold">
                <CalendarDays size={14} /> Starts {startDate}
              </p>
            </div>
          </div>

          <div className="neo-card bg-white p-6 space-y-4">
            <h4 className="font-bold text-[#1B1C20] flex items-center gap-2">
              <CreditCard size={16} /> Payment Status
            </h4>
            
            {registration.payment_amount > 0 ? (
              <div className="flex items-center justify-between p-3 neo-badge bg-[#f9fafb]">
                <div>
                  <p className="text-sm font-bold text-[#1B1C20]">₹{registration.payment_amount}</p>
                  <p className="text-xs text-[#6B7280]">Delegate Fee</p>
                </div>
                {registration.payment_verified ? (
                  <span className="neo-badge px-3 py-1 text-xs font-bold bg-[#22C55E]/10 text-[#22C55E] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="neo-badge px-3 py-1 text-xs font-bold bg-[#FFA500]/10 text-[#FFA500] flex items-center gap-1">
                    <Clock size={12} /> Pending Verification
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 neo-badge bg-[#22C55E]/10 text-[#22C55E] text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Free Registration
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

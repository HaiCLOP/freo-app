export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, MapPin, IndianRupee, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { submitRegistration } from "./actions";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: event.name,
    description: `Register for ${event.name} on Freo.`,
  };
}

export default async function PublicEventPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ success?: string, error?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*, creators(name)")
    .eq("slug", resolvedParams.slug)
    .eq("is_active", true)
    .single();

  if (!event) {
    notFound();
  }

  if (resolvedSearchParams.success) {
    return (
      <div className="min-h-screen bg-[#1d1d1f] flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#ddfe55]/5 blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#ddfe55]/5 blur-[120px]" />
        </div>
        
        <div className="max-w-md w-full bg-[#2a2b2f]/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl p-10 text-center relative z-10">
          <div className="w-24 h-24 bg-[#ddfe55]/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(221,254,85,0.15)] animate-in zoom-in-50 duration-700">
            <CheckCircle2 className="w-12 h-12 text-[#ddfe55]" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-4 tracking-tight">Registration Received!</h1>
          <p className="text-[#a1a1aa] mb-10 leading-relaxed text-[15px]">
            Your details and payment screenshot have been submitted to the organizer. You'll receive a confirmation email with your digital ticket once they approve it.
          </p>
          <div className="bg-black/20 p-5 rounded-2xl text-[14px] text-[#ddfe55]/80 font-medium border border-white/5 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            A copy of this receipt has been sent to your email.
          </div>
        </div>
        
        {/* Footer Branding */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center text-sm font-medium text-[#71717a] relative z-10">
          <div className="flex items-center gap-2 justify-center">
            Powered by <span className="font-bold text-white font-[family-name:var(--font-fredoka)]">Freo</span> &middot; Built by <a href="https://haicloplabs.in" target="_blank" rel="noopener noreferrer" className="font-bold text-[#ddfe55] hover:text-[#ddfe55]/80 hover:underline transition-colors">HaiCLOP Labs</a>
          </div>
          <div className="flex gap-6 text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    );
  }

  // Check total capacity (do not count rejected registrations)
  const { count: totalRegistrations } = await supabase
    .from("registrations")
    .select("*", { count: 'exact', head: true })
    .eq("event_id", event.id)
    .neq("status", "rejected");

  const isSoldOut = (totalRegistrations || 0) >= event.max_capacity;

  // Check daily phase limit
  let isDailyLimitReached = false;
  let todayCount = 0;
  const dailyLimit = event.daily_reg_limit || 100;

  if (event.phase_registration && !isSoldOut) {
    // Count registrations made today (IST timezone)
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istNow = new Date(nowStr);
    
    // Create Date objects representing 00:00:00 and 23:59:59 in IST
    const todayStart = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0);
    const todayEnd = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999);

    const { count: todayRegistrations } = await supabase
      .from("registrations")
      .select("*", { count: 'exact', head: true })
      .eq("event_id", event.id)
      .neq("status", "rejected")
      .gte("registered_at", todayStart.toISOString())
      .lte("registered_at", todayEnd.toISOString());

    todayCount = todayRegistrations || 0;
    isDailyLimitReached = todayCount >= dailyLimit;
  }

  const spotsRemaining = event.max_capacity - (totalRegistrations || 0);
  const dailySpotsRemaining = dailyLimit - todayCount;

  const formConfig = event.form_config || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner */}
      <div className="w-full h-64 md:h-96 relative bg-gray-900">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.name} fill className="object-cover opacity-70" priority />
        ) : (
          <div className="absolute inset-0 brand-gradient opacity-80"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">{event.name}</h1>
          <p className="text-white/80 font-medium flex items-center gap-2">
            Organized by {(event.creators as any)?.name || "Creator"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-8 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-6">
          {resolvedSearchParams.error && (
             <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-3">
               <AlertCircle className="w-5 h-5" />
               Failed to submit registration. Please try again.
             </div>
          )}

          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <div className="bg-white p-6 md:p-8">
              {isSoldOut ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Event Sold Out</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
                    We're sorry, but this event has reached its maximum capacity. No further registrations can be accepted at this time.
                  </p>
                </div>
              ) : isDailyLimitReached ? (
                /* Phase-wise: Daily limit reached */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Today&apos;s Slots Are Full</h2>
                  <p className="text-gray-500 mb-6 leading-relaxed max-w-md mx-auto">
                    This event uses phase-wise registration. Today&apos;s {dailyLimit} registration slots have been filled.
                  </p>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 max-w-sm mx-auto space-y-4">
                    <div className="flex items-center justify-center gap-2 text-amber-800 font-semibold">
                      <Clock className="w-5 h-5" />
                      Registration reopens tomorrow
                    </div>
                    <p className="text-sm text-amber-700">
                      Come back after <strong>12:00 AM IST</strong> to register. {spotsRemaining} spots are still available overall.
                    </p>
                    <div className="w-full bg-amber-100 rounded-full h-2.5 mt-3">
                      <div 
                        className="bg-amber-500 h-2.5 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, ((totalRegistrations || 0) / event.max_capacity) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-amber-600">
                      {totalRegistrations || 0} / {event.max_capacity} total registrations
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Details</h2>
                  <p className="text-gray-500 mb-8">{event.description}</p>

                  {/* Phase registration info banner */}
                  {event.phase_registration && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900">Phase-wise Registration Active</p>
                        <p className="text-amber-700 mt-0.5">
                          {dailySpotsRemaining} of {dailyLimit} slots remaining today &middot; {spotsRemaining} total spots left
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <form 
                    action={async (formData) => {
                      "use server";
                      await submitRegistration(event.id, event.slug, formData);
                    }} 
                    className="space-y-6"
                  >
                    {/* Dynamic Fields */}
                    {formConfig.map((field: any) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-gray-700 font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" ? (
                          <Input 
                            id={field.id} 
                            name={field.id} 
                            type={field.type === "phone" ? "tel" : field.type} 
                            placeholder={field.placeholder} 
                            required={field.required} 
                            className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 py-6"
                          />
                        ) : field.type === "dropdown" ? (
                          <Select name={field.id} required={field.required}>
                            <SelectTrigger className="rounded-xl bg-gray-50/50 py-6">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.split(',').map((opt: string) => (
                                <SelectItem key={opt.trim()} value={opt.trim()}>{opt.trim()}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-center space-x-3 bg-gray-50/50 p-4 rounded-xl border border-input">
                            <Switch id={field.id} name={field.id} required={field.required} />
                            <Label htmlFor={field.id} className="text-sm font-normal text-gray-600 cursor-pointer">{field.placeholder || "Yes, I agree"}</Label>
                          </div>
                        ) : field.type === "file" ? (
                          <Input 
                            id={field.id} 
                            name={field.id} 
                            type="file" 
                            required={field.required} 
                            className="rounded-xl bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          />
                        ) : null}
                      </div>
                    ))}

                    <hr className="my-8 border-gray-100" />

                    {/* Mandatory Payment Section */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">Payment Verification</h3>
                      <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 text-sm text-yellow-800 leading-relaxed">
                        Please ensure you have sent <strong>₹{event.price}</strong> to the UPI details shown on the right before submitting this form.
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="utr_id" className="text-gray-700 font-medium">UTR / Transaction ID <span className="text-red-500">*</span></Label>
                        <Input 
                          id="utr_id" 
                          name="utr_id" 
                          placeholder="e.g. 123456789012" 
                          required 
                          className="rounded-xl bg-gray-50/50 focus-visible:ring-primary/20 py-6 font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_screenshot" className="text-gray-700 font-medium">Payment Screenshot <span className="text-red-500">*</span></Label>
                        <Input 
                          id="payment_screenshot" 
                          name="payment_screenshot" 
                          type="file" 
                          accept="image/*"
                          required 
                          className="rounded-xl bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>
                    </div>

                    <SubmitButton 
                      className="w-full py-6 text-base font-semibold rounded-xl bg-gray-900 hover:bg-primary transition-all duration-300 text-white shadow-md hover:shadow-primary/25 mt-8"
                      pendingText="Submitting..."
                    >
                      Submit Registration
                    </SubmitButton>
                  </form>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Event Info Widget */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden sticky top-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date & Time</p>
                    <p className="font-semibold text-gray-900">{new Date(event.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Venue</p>
                    <p className="font-semibold text-gray-900">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Entry Fee</p>
                    <p className="font-bold text-2xl text-gray-900">₹{event.price}</p>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />
              
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pay via UPI</p>
                {event.upi_qr_url && (
                  <div className="w-48 h-48 mx-auto relative rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <Image src={event.upi_qr_url} alt="UPI QR" fill className="object-cover" />
                  </div>
                )}
                <div className="bg-gray-50 py-3 px-4 rounded-xl border border-gray-100 inline-block font-mono text-sm font-medium text-gray-900">
                  {event.upi_id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-16 pb-8 flex flex-col items-center gap-4 text-center text-sm font-medium text-gray-500">
        <div className="flex items-center gap-2 justify-center">
          Powered by <span className="font-bold text-gray-900 font-[family-name:var(--font-fredoka)]">Freo</span> &middot; Built by <a href="https://haicloplabs.in" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">HaiCLOP Labs</a>
        </div>
        <div className="flex gap-4 text-xs">
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

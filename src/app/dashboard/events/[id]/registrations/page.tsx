export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Search, Clock, ExternalLink, IndianRupee, TrendingUp } from "lucide-react";
import Link from "next/link";
import { approveRegistration, rejectRegistration, updateEventDetails } from "./actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { getFileUrls } from "@/lib/storage";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaymentScreenshot } from "@/components/dashboard/payment-screenshot";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { RealtimeRegistrations } from "@/components/dashboard/realtime-registrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default async function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("creator_id", user.id)
    .single();

  if (!event) {
    redirect("/dashboard/events");
  }

  // 2. Fetch Registrations
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  // Generate viewable URLs for all screenshots (Google Drive or Supabase Storage)
  const pathsToSign = registrations
    ?.map(r => r.payment_screenshot_url)
    .filter(Boolean) as string[] || [];
    
  let signedUrlMap: Record<string, string> = {};
  
  if (pathsToSign.length > 0) {
    signedUrlMap = await getFileUrls(user.id, pathsToSign);
  }

  const totalRegistrations = registrations?.filter(r => r.status !== 'rejected').length || 0;
  const pendingRegistrations = registrations?.filter(r => r.status === 'pending').length || 0;
  const approvedRegistrations = registrations?.filter(r => r.status === 'approved').length || 0;
  const waitlistedRegistrations = registrations?.filter(r => r.status === 'waitlisted').length || 0;

  const ticketPrice = event.price || 0;
  const collectedRevenue = approvedRegistrations * ticketPrice;
  const pendingRevenue = pendingRegistrations * ticketPrice;
  const projectedRevenue = (approvedRegistrations + pendingRegistrations) * ticketPrice;

  // Format date for datetime-local input
  const eventDateObj = new Date(event.date);
  const localDateStr = new Date(eventDateObj.getTime() - (eventDateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#f5f5f7]">
              <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">Manage Registrations</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[#86868b] text-lg font-medium">{event.name}</p>
              <Dialog>
                <DialogTrigger render={<Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#86868b] hover:text-[#1d1d1f] rounded-full" />}>
                  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Event Details</DialogTitle>
                    <DialogDescription>
                      Update the public details of your event. This will be reflected immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <form action={updateEventDetails.bind(null, event.id)}>
                    <div className="py-4 space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Event Name</Label>
                        <Input id="name" name="name" defaultValue={event.name} required className="mt-1.5 rounded-xl bg-gray-50/50" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date & Time</Label>
                          <Input id="date" name="date" type="datetime-local" defaultValue={localDateStr} required className="mt-1.5 rounded-xl bg-gray-50/50" />
                        </div>
                        <div>
                          <Label htmlFor="venue" className="text-sm font-medium text-gray-700">Venue</Label>
                          <Input id="venue" name="venue" defaultValue={event.venue} required className="mt-1.5 rounded-xl bg-gray-50/50" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price" className="text-sm font-medium text-gray-700">Ticket Price (INR)</Label>
                          <div className="relative mt-1.5">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input id="price" name="price" type="number" min="0" step="1" defaultValue={event.price} required className="pl-9 rounded-xl bg-gray-50/50" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="max_capacity" className="text-sm font-medium text-gray-700">Maximum Capacity</Label>
                          <Input id="max_capacity" name="max_capacity" type="number" min="1" defaultValue={event.max_capacity} required className="mt-1.5 rounded-xl bg-gray-50/50" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea id="description" name="description" defaultValue={event.description} required className="mt-1.5 rounded-xl bg-gray-50/50 min-h-[100px]" />
                      </div>

                      <div>
                        <Label htmlFor="organizer_name" className="text-sm font-medium text-gray-700">
                          Custom Organizer Name <span className="text-gray-400 font-normal">(Optional)</span>
                        </Label>
                        <Input 
                          id="organizer_name" 
                          name="organizer_name" 
                          defaultValue={event.organizer_name || ""} 
                          placeholder="Overrides the default creator name"
                          className="mt-1.5 rounded-xl bg-gray-50/50" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose render={<Button type="button" variant="outline" className="rounded-xl" />}>
                        Cancel
                      </DialogClose>
                      <SubmitButton pendingText="Saving..." className="rounded-xl">Save Changes</SubmitButton>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {event.google_sheet_id && (
            <Link href={`https://docs.google.com/spreadsheets/d/${event.google_sheet_id}`} target="_blank">
              <Button variant="outline" className="rounded-full bg-[#f5f5f7]/50 text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] font-medium h-11 px-6 shadow-sm transition-all">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Google Sheet
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Pending Approvals</p>
              <div className="p-2 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{pendingRegistrations}</h3>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
             <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Approved</p>
              <div className="p-2 bg-[#34c759]/10 text-[#34c759] rounded-full">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{approvedRegistrations}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
             <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Waitlisted</p>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-full">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{waitlistedRegistrations}</h3>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
             <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Total Received</p>
              <div className="p-2 bg-[#0066cc]/10 text-[#0066cc] rounded-full">
                <Search className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{totalRegistrations} <span className="text-[#86868b] text-2xl font-medium">/ {event.max_capacity}</span></h3>
          </CardContent>
        </Card>
      </div>

      <RealtimeRegistrations eventId={event.id} />

      {/* Revenue Dashboard */}
      {ticketPrice > 0 && (
        <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm p-7">
          <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f] mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Revenue Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-wider mb-2">Collected</p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-[#34c759]" />
                <span className="text-3xl font-semibold text-[#1d1d1f]">{collectedRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-wider mb-2">Pending</p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-[#ffcc00]" />
                <span className="text-3xl font-semibold text-[#1d1d1f]">{pendingRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#86868b] uppercase tracking-wider mb-2">Projected</p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-[#0066cc]" />
                <span className="text-3xl font-semibold text-[#1d1d1f]">{projectedRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registrations List */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">All Registrations</h2>
            <p className="text-[#86868b] text-[15px] font-medium">Review and process payments</p>
          </div>
          <ExportCsvButton data={registrations || []} eventName={event.name} />
        </div>

        <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm overflow-hidden">
          <div className="divide-y divide-[#f5f5f7]">
            {registrations?.length === 0 ? (
               <div className="p-16 text-center text-[#86868b] font-medium">
                 No registrations received yet.
               </div>
            ) : (
              registrations?.map((reg) => (
                <div key={reg.id} className="p-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#f5f5f7]/50 transition-colors group">
                  
                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{reg.full_name}</h3>
                      {reg.status === 'pending' && <Badge variant="secondary" className="bg-[#ff3b30]/10 text-[#ff3b30] border-0 rounded-full px-3 py-0.5 text-xs font-semibold">Pending</Badge>}
                      {reg.status === 'approved' && <Badge variant="secondary" className="bg-[#34c759]/10 text-[#34c759] border-0 rounded-full px-3 py-0.5 text-xs font-semibold">Approved</Badge>}
                      {reg.status === 'rejected' && <Badge variant="secondary" className="bg-[#86868b]/10 text-[#86868b] border-0 rounded-full px-3 py-0.5 text-xs font-semibold">Rejected</Badge>}
                      {reg.status === 'waitlisted' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0 rounded-full px-3 py-0.5 text-xs font-semibold">Waitlisted</Badge>}
                    </div>
                    <div className="text-[15px] text-[#86868b] flex flex-wrap gap-x-5 gap-y-1">
                      <span>Email: <span className="text-[#1d1d1f] font-medium">{reg.email}</span></span>
                      <span>Phone: <span className="text-[#1d1d1f] font-medium">{reg.phone}</span></span>
                    </div>
                    <div className="text-[14px] text-[#86868b] mt-3 flex items-center">
                      UTR ID: <code className="ml-2 bg-[#f5f5f7] px-2.5 py-1 rounded-md text-[#1d1d1f] font-mono tracking-wider text-sm border border-[#e5e5ea]">{reg.utr_id}</code>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div className="w-32 h-20 relative rounded-xl overflow-hidden border border-[#e5e5ea] bg-[#f5f5f7] flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    {(() => {
                      const url = reg.payment_screenshot_url;
                      if (!url) return <div className="w-full h-full flex items-center justify-center text-[11px] font-medium text-[#86868b] uppercase tracking-wider">No Image</div>;
                      
                      let displayUrl = signedUrlMap[url] || url;
                      
                      // Convert Google Drive view links to raw image links
                      if (displayUrl.includes("drive.google.com")) {
                        const match = displayUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                          displayUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                        }
                      }

                      return (
                        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                          <PaymentScreenshot src={displayUrl} />
                        </a>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:pl-4">
                    {reg.status === 'pending' || reg.status === 'waitlisted' ? (
                      <>
                        <form action={approveRegistration.bind(null, reg.id, eventId)}>
                          <SubmitButton size="sm" className="bg-[#34c759] hover:bg-[#2eb050] text-white rounded-full px-5 h-9 font-medium transition-colors shadow-sm" pendingText="Approving...">
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                          </SubmitButton>
                        </form>
                        <form action={rejectRegistration.bind(null, reg.id, eventId)}>
                          <SubmitButton variant="outline" size="sm" className="text-[#ff3b30] border-[#ff3b30]/20 hover:bg-[#ff3b30]/10 rounded-full px-5 h-9 font-medium transition-colors" pendingText="Rejecting...">
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                          </SubmitButton>
                        </form>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="rounded-full px-6 h-9 opacity-50 bg-[#f5f5f7] border-transparent font-medium">
                        Processed
                      </Button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

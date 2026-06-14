export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, Share, Copy, Pencil } from "lucide-react";
import { DeleteEventButton } from "@/components/dashboard/delete-event-button";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all events with registration count
  const { data: events } = await supabase
    .from("events")
    .select("*, registrations(count)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const totalEvents = events?.length || 0;

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Your Events</h1>
          <p className="text-[#86868b] mt-1 font-medium">Manage your events, forms, and tracking URLs.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-[#1d1d1f] hover:bg-[#333336] text-white rounded-full h-11 px-6 font-medium shadow-sm transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {totalEvents === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-[#f5f5f7] shadow-sm">
          <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">No events found</h3>
          <p className="text-[#86868b] mb-8 max-w-sm mx-auto font-medium">Create your first event to start accepting registrations.</p>
          <Link href="/dashboard/events/new">
            <Button className="bg-[#1d1d1f] hover:bg-[#333336] text-white rounded-full h-12 px-8 font-medium">
              Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#f5f5f7] bg-[#f5f5f7]/30">
                  <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider">Event Name</th>
                  <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider">Date</th>
                  <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Price</th>
                  <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Registrations</th>
                  <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {events?.map((event) => (
                  <tr key={event.id} className="hover:bg-[#f5f5f7]/50 transition-colors group">
                    <td className="py-5 px-7">
                      <div className="font-semibold text-[#1d1d1f] text-[15px]">
                        {event.name}
                      </div>
                      <Link href={`/e/${event.slug}`} target="_blank" className="text-[13px] text-[#0066cc] hover:underline mt-0.5 inline-flex items-center group-hover:opacity-100 opacity-60 transition-opacity">
                        <Share className="w-3 h-3 mr-1" />
                        /e/{event.slug}
                      </Link>
                    </td>
                    <td className="py-5 px-7 text-[#86868b] font-medium text-[15px]">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-5 px-7 text-[#1d1d1f] font-medium text-right text-[15px]">
                      ₹{event.price}
                    </td>
                    <td className="py-5 px-7 text-right">
                       <span className="inline-flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f] text-[13px] font-semibold px-3 py-1 rounded-full group-hover:bg-white border border-transparent group-hover:border-[#e5e5ea] transition-all">
                          {event.registrations?.[0]?.count || 0}
                       </span>
                    </td>
                    <td className="py-5 px-7 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-white border border-transparent hover:border-[#e5e5ea] transition-all" title="Edit Event Details">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/dashboard/events/${event.id}/form-builder`}>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-white border border-transparent hover:border-[#e5e5ea] transition-all" title="Edit Form">
                            <Settings2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-white border border-transparent hover:border-[#e5e5ea] transition-all" title="Copy Link">
                          <Copy className="w-4 h-4" />
                        </button>
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GlobalRegistrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch events with registration counts
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      name,
      slug,
      registrations (
        id,
        status
      )
    `)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (!events) {
    return null;
  }

  // Aggregate stats
  let totalPending = 0;
  let totalApproved = 0;
  
  const eventsWithStats = events.map(event => {
    const regs = event.registrations || [];
    const pending = regs.filter((r: any) => r.status === 'pending').length;
    const approved = regs.filter((r: any) => r.status === 'approved').length;
    
    totalPending += pending;
    totalApproved += approved;
    
    return {
      ...event,
      pendingCount: pending,
      approvedCount: approved,
      totalCount: regs.length
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Workload Hub</h1>
        <p className="text-gray-500 mt-1">Overview of registrations across all your events.</p>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Total Pending Approvals</p>
              <div className="p-2 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{totalPending}</h3>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7">
             <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium text-[#86868b]">Total Approved</p>
              <div className="p-2 bg-[#DDFE55]/20 text-[#1B1C20] rounded-full">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight">{totalApproved}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Select Event to Manage</h2>
        
        {eventsWithStats.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm p-16 text-center">
             <div className="w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-6">
               <CalendarDays className="w-8 h-8 text-[#86868b]" />
             </div>
             <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">No events found</h3>
             <p className="text-[#86868b] mb-8">Create an event to start collecting registrations.</p>
             <Link href="/dashboard/events/new">
                <Button className="bg-[#1d1d1f] hover:bg-[#333336] text-white font-medium shadow-none rounded-full h-12 px-8 transition-all">
                  Create Event
                </Button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {eventsWithStats.map(event => (
              <Card key={event.id} className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-[#1d1d1f] mb-4 truncate">{event.name}</h3>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#86868b]">Pending</span>
                      <span className="font-semibold text-[#ff3b30]">{event.pendingCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#86868b]">Approved</span>
                      <span className="font-semibold text-[#34c759]">{event.approvedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#86868b]">Total</span>
                      <span className="font-semibold text-[#1d1d1f]">{event.totalCount}</span>
                    </div>
                  </div>

                  <Link href={`/dashboard/events/${event.id}/registrations`} className="w-full">
                    <Button variant="outline" className="w-full rounded-[16px] border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#1B1C20] group-hover:bg-[#1B1C20] group-hover:text-white transition-all">
                      Manage Registrations
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

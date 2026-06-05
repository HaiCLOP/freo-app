export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = resolvedSearchParams.filter || "ongoing";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch events
  const { data: events } = await supabase
    .from("events")
    .select("*, registrations(count)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const totalEvents = events?.length || 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const ongoingEvents = events?.filter(e => {
    const eventDate = new Date(e.date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay >= today;
  }) || [];

  const completedEvents = events?.filter(e => {
    const eventDate = new Date(e.date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay < today;
  }) || [];

  const activeEvents = filter === "completed" ? completedEvents : ongoingEvents;

  // Fetch registrations
  let totalRegistrations = 0;
  let pendingApprovals = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let totalRevenue = 0;

  let heatmapCounts = Array(48).fill(0);
  let maxHeatmapCount = 0;

  if (activeEvents && activeEvents.length > 0) {
    const eventIds = activeEvents.map(e => e.id);
    
    const { data: registrations } = await supabase
      .from("registrations")
      .select("status, event_id, registered_at")
      .in("event_id", eventIds);

    if (registrations) {
      totalRegistrations = registrations.length;
      pendingApprovals = registrations.filter(r => r.status === "pending").length;
      
      const approvedRegs = registrations.filter(r => r.status === "approved");
      const rejectedRegs = registrations.filter(r => r.status === "rejected");
      
      approvedCount = approvedRegs.length;
      rejectedCount = rejectedRegs.length;
 
      const eventPriceMap = activeEvents.reduce((acc, event) => {
        acc[event.id] = event.price || 0;
        return acc;
      }, {} as Record<string, number>);
 
      approvedRegs.forEach(reg => {
        totalRevenue += eventPriceMap[reg.event_id] || 0;
      });
 
      // Calculate Heatmap Data
      registrations.forEach(reg => {
        if (!reg.registered_at) return;
        const date = new Date(reg.registered_at);
        const col = date.getMonth(); // 0-11
        // Assign to one of 4 rows based on the day of the month
        const day = date.getDate();
        let row = Math.floor((day - 1) / 7);
        if (row > 3) row = 3; // Cap at 4th row for days 29-31
        
        const index = row * 12 + col;
        heatmapCounts[index]++;
      });
 
      maxHeatmapCount = Math.max(...heatmapCounts);
    }
  }

  // Calculate percentages for the UI
  let approvedPct = 0;
  let pendingPct = 0;
  let rejectedPct = 0;

  if (totalRegistrations > 0) {
    approvedPct = Math.round((approvedCount / totalRegistrations) * 100);
    pendingPct = Math.round((pendingApprovals / totalRegistrations) * 100);
    rejectedPct = 100 - approvedPct - pendingPct;
  }
  const upcomingEventsCount = events?.filter(e => {
    const eventDate = new Date(e.date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay >= today;
  }).length || 0;
  const pastEventsCount = totalEvents - upcomingEventsCount;
  const upcomingPct = totalEvents > 0 ? Math.round((upcomingEventsCount / totalEvents) * 100) : 0;
  const pastPct = totalEvents > 0 ? 100 - upcomingPct : 0;

  return (
    <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
      {/* Left Column (Metrics + Recent Events) */}
      <div className="flex-1 space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">Overview</h1>
          <p className="text-[#86868b] mt-2 text-lg font-medium">Your events and performance at a glance.</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-[#1d1d1f] hover:bg-[#333336] text-white shadow-sm transition-all rounded-full h-12 px-7 font-medium">
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
            <p className="text-[15px] font-medium text-[#86868b] mb-2">Total Events</p>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">{activeEvents.length}</h3>
            <div className="flex items-center text-sm font-medium text-[#34c759]">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              <span>{filter === "completed" ? "Completed events" : "Active and running"}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
            <p className="text-[15px] font-medium text-[#86868b] mb-2">Total Registrations</p>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">{totalRegistrations}</h3>
            <div className={`flex items-center text-sm font-medium ${approvedCount > 0 ? 'text-[#34c759]' : 'text-[#86868b]'}`}>
              {approvedCount > 0 && <TrendingUp className="w-4 h-4 mr-1.5" />}
              <span>{approvedCount > 0 ? `${approvedCount} approved` : 'Awaiting signups'}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
            <p className="text-[15px] font-medium text-[#86868b] mb-2">Total Revenue</p>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">₹{totalRevenue.toLocaleString("en-IN")}</h3>
             <div className="flex items-center text-sm font-medium text-[#34c759]">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              <span>{totalRevenue > 0 ? "Growing steadily" : "No revenue yet"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
          <CardContent className="p-7">
            <p className="text-[15px] font-medium text-[#86868b] mb-2">Pending Approvals</p>
            <h3 className="text-4xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">{pendingApprovals}</h3>
            <div className={`flex items-center text-sm font-medium ${pendingApprovals > 0 ? 'text-[#ff3b30]' : 'text-[#86868b]'}`}>
              {pendingApprovals > 0 ? (
                 <>
                   <div className="w-2 h-2 rounded-full bg-[#ff3b30] mr-2 animate-pulse"></div>
                   <span>Action required</span>
                 </>
              ) : (
                <span>All caught up</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Recent Events</h2>
          <Link href="/dashboard/events" className="text-[#0066cc] hover:text-[#004499] text-[15px] font-medium flex items-center transition-colors">
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {totalEvents === 0 ? (
           <div className="bg-[#f5f5f7]/50 rounded-[32px] p-16 text-center border border-[#f5f5f7]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <Calendar className="w-6 h-6 text-[#86868b]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">No events found</h3>
            <p className="text-[#86868b] mb-8 max-w-sm mx-auto font-medium">Create an event to see it appear in your dashboard.</p>
            <Link href="/dashboard/events/new">
              <Button className="bg-[#1d1d1f] hover:bg-[#333336] text-white rounded-full h-12 px-8 font-medium">
                Create Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#f5f5f7] bg-white">
                    <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider">Event Name</th>
                    <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider">Date</th>
                    <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Price</th>
                    <th className="py-5 px-7 text-[13px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Registrations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {activeEvents.slice(0, 5).map((event) => (
                    <tr key={event.id} className="hover:bg-[#f5f5f7]/50 transition-colors group">
                      <td className="py-5 px-7">
                        <Link href={`/dashboard/events/${event.id}/registrations`} className="font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors text-[15px]">
                          {event.name}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Right Column (Dark Analytics Dashboard) */}
      <div className="w-full xl:w-[400px] shrink-0 bg-[#1B1C20] rounded-[32px] text-white p-8 flex flex-col gap-8 shadow-xl">
        {/* Header Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#2A2B31] rounded-full p-1.5">
            <Link 
              href="/dashboard?filter=ongoing" 
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${filter === "ongoing" ? "bg-white text-[#1B1C20] shadow-sm" : "text-[#86868b] hover:text-white"}`}
            >
              Ongoing
            </Link>
            <Link 
              href="/dashboard?filter=completed" 
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${filter === "completed" ? "bg-white text-[#1B1C20] shadow-sm" : "text-[#86868b] hover:text-white"}`}
            >
              Completed
            </Link>
          </div>
          <div className="bg-[#2A2B31] hover:bg-[#333336] cursor-pointer transition-colors px-5 py-2.5 rounded-full text-sm font-bold text-white flex items-center gap-2">
            2026
            <ChevronRight className="w-4 h-4 rotate-90 text-[#86868b]" />
          </div>
        </div>
        
        {/* Heatmap Area */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-3xl font-semibold tracking-tight">{totalRegistrations > 0 ? `${totalRegistrations}` : '0'} <span className="text-lg font-medium text-[#86868b]">Recorded Registrations</span></h3>
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Overall</span>
          </div>
          {/* Real Heatmap Grid */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="flex flex-col justify-between text-[10px] text-[#86868b] font-medium py-1">
              <span>1 week</span><span>2 week</span><span>3 week</span><span>4 week</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 opacity-90">
              {heatmapCounts.map((count, i) => {
                let colorClass = 'bg-[#2A2B31]';
                if (count > 0) {
                  const intensity = maxHeatmapCount > 0 ? count / maxHeatmapCount : 0;
                  if (intensity > 0.8) colorClass = 'bg-[#DDFE55]';
                  else if (intensity > 0.4) colorClass = 'bg-[#DDFE55]/60';
                  else colorClass = 'bg-[#86868b]';
                }
                return (
                  <div key={i} className={`w-full aspect-square rounded-[4px] ${colorClass}`} title={`${count} registrations`}></div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-4 text-[11px] text-[#86868b] uppercase font-bold tracking-wider pl-12 pr-4">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Jun</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="pt-8 border-t border-[#2A2B31]/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[17px] font-semibold">Event Status Timeline</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-[#86868b]">
              <span className="flex items-center gap-1.5"><div className="w-2 h-3 bg-[#DDFE55] rounded-full"></div> Upcoming</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-3 bg-[#86868b] rounded-full"></div> Past</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 h-14">
            {upcomingPct > 0 && (
              <div className="h-14 bg-[#DDFE55] rounded-xl shadow-[0_0_20px_rgba(221,254,85,0.2)] z-10 transition-all" style={{ width: `${upcomingPct}%` }}></div>
            )}
            {pastPct > 0 && (
              <div className="h-12 bg-[#86868b] rounded-xl opacity-80 transition-all" style={{ width: `${pastPct}%` }}></div>
            )}
            {totalEvents === 0 && (
               <div className="h-12 bg-[#2A2B31] rounded-xl w-full"></div>
            )}
          </div>
          <div className="flex justify-between mt-4 text-[13px] text-[#86868b] font-medium px-2">
            {totalEvents > 0 ? (
               <>
                 <span>{upcomingPct}% Upcoming ({upcomingEventsCount})</span>
                 <span>{pastPct}% Past ({pastEventsCount})</span>
               </>
            ) : (
               <span>No events scheduled</span>
            )}
          </div>
        </div>
        
        {/* Circular Chart */}
        <div className="pt-8 border-t border-[#2A2B31]/60 flex-1 flex flex-col">
          <h3 className="text-[17px] font-semibold mb-6">Registration Breakdown</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center relative my-4">
            {/* CSS-based Donut Chart */}
            <div className="w-48 h-48 rounded-full bg-[#1B1C20] relative flex items-center justify-center transition-all duration-1000"
                 style={{
                   background: totalRegistrations > 0 
                     ? `conic-gradient(#DDFE55 0% ${approvedPct}%, white ${approvedPct}% ${approvedPct + pendingPct}%, #86868b ${approvedPct + pendingPct}% 100%)`
                     : `conic-gradient(#2A2B31 0% 100%)`
                 }}>
              <div className="w-36 h-36 bg-[#1B1C20] rounded-full flex items-center justify-center z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <span className="text-4xl font-bold">{totalRegistrations > 0 ? approvedPct : 0}<span className="text-2xl text-[#86868b]">%</span></span>
              </div>
            </div>
            
            {/* Chart Lines (Simulated with absolute positioning) */}
            {totalRegistrations > 0 && (
              <>
                <div className="absolute top-[10%] right-[10%] text-xs text-[#86868b] font-medium border-b border-[#86868b] border-dashed pb-1 pr-6 text-right w-24">{pendingPct}%</div>
                <div className="absolute bottom-[20%] right-[5%] text-xs text-[#86868b] font-medium border-b border-[#86868b] border-dashed pb-1 pl-6 text-left w-20">{rejectedPct}%</div>
                <div className="absolute bottom-[10%] left-[5%] text-xs text-[#86868b] font-medium border-b border-[#86868b] border-dashed pb-1 pl-6 text-left w-20">{approvedPct}%</div>
              </>
            )}
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-[13px] font-semibold text-[#86868b] mt-auto pt-8">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-white"><div className="w-2 h-4 bg-[#DDFE55] rounded-full"></div> Approved</span>
              <span className="text-white">{totalRegistrations > 0 ? approvedPct : 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-white"><div className="w-2 h-4 bg-white rounded-full"></div> Pending</span>
              <span className="text-white">{totalRegistrations > 0 ? pendingPct : 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-white"><div className="w-2 h-4 bg-[#86868b] rounded-full"></div> Rejected</span>
              <span className="text-white">{totalRegistrations > 0 ? rejectedPct : 0}%</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="flex items-center gap-2.5 text-white"><div className="w-2 h-4 bg-[#2A2B31] rounded-full"></div> Total</span>
              <span className="text-white">{totalRegistrations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

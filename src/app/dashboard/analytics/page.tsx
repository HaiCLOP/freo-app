export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics | Freo",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all events for this creator
  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, date, price, capacity, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">No analytics yet</h2>
        <p className="text-[#86868b] max-w-sm">Create your first event and start collecting registrations to see analytics here.</p>
      </div>
    );
  }

  const eventIds = events.map((e) => e.id);

  // Fetch ALL registrations for this creator's events
  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, status, event_id, registered_at, checked_in")
    .in("event_id", eventIds);

  const regs = registrations || [];

  // --- Compute all analytics server-side ---

  // 1. Top-level KPIs
  const totalRegistrations = regs.length;
  const approvedCount = regs.filter((r) => r.status === "approved").length;
  const rejectedCount = regs.filter((r) => r.status === "rejected").length;
  const pendingCount = regs.filter((r) => r.status === "pending").length;
  const checkedInCount = regs.filter((r) => r.checked_in === true).length;

  const eventPriceMap: Record<string, number> = {};
  events.forEach((e) => {
    eventPriceMap[e.id] = e.price || 0;
  });

  const totalRevenue = regs
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + (eventPriceMap[r.event_id] || 0), 0);

  const checkInRate =
    approvedCount > 0 ? Math.round((checkedInCount / approvedCount) * 100) : 0;
  const approvalRate =
    totalRegistrations > 0
      ? Math.round((approvedCount / totalRegistrations) * 100)
      : 0;

  // 2. Registration trend (last 30 days, grouped by day)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const trendData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    trendData.push({ date: key, count: 0 });
  }

  regs.forEach((r) => {
    if (!r.registered_at) return;
    const d = new Date(r.registered_at);
    if (d >= thirtyDaysAgo) {
      const key = d.toISOString().split("T")[0];
      const entry = trendData.find((t) => t.date === key);
      if (entry) entry.count++;
    }
  });

  // 3. Peak registration hours (0-23)
  const hourCounts = Array(24).fill(0);
  regs.forEach((r) => {
    if (!r.registered_at) return;
    const hour = new Date(r.registered_at).getHours();
    hourCounts[hour]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // 4. Per-event breakdown
  const perEvent = events.map((e) => {
    const eventRegs = regs.filter((r) => r.event_id === e.id);
    const approved = eventRegs.filter((r) => r.status === "approved").length;
    const checkedIn = eventRegs.filter((r) => r.checked_in === true).length;
    const revenue = approved * (e.price || 0);
    return {
      id: e.id,
      name: e.name,
      date: e.date,
      total: eventRegs.length,
      approved,
      pending: eventRegs.filter((r) => r.status === "pending").length,
      rejected: eventRegs.filter((r) => r.status === "rejected").length,
      checkedIn,
      capacity: e.capacity || 0,
      revenue,
      fillRate:
        e.capacity && e.capacity > 0
          ? Math.round((eventRegs.length / e.capacity) * 100)
          : null,
    };
  });

  // 5. Day-of-week distribution
  const dayOfWeekCounts = Array(7).fill(0);
  regs.forEach((r) => {
    if (!r.registered_at) return;
    const day = new Date(r.registered_at).getDay();
    dayOfWeekCounts[day]++;
  });

  return (
    <AnalyticsDashboard
      kpis={{
        totalRegistrations,
        approvedCount,
        rejectedCount,
        pendingCount,
        checkedInCount,
        totalRevenue,
        checkInRate,
        approvalRate,
        totalEvents: events.length,
      }}
      trendData={trendData}
      hourCounts={hourCounts}
      peakHour={peakHour}
      perEvent={perEvent}
      dayOfWeekCounts={dayOfWeekCounts}
    />
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  IndianRupee,
  ScanLine,
  Percent,
  ChevronRight,
  Sparkles,
  X,
  Send,
  Loader2,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

// --- Types ---
interface KPIs {
  totalRegistrations: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  checkedInCount: number;
  totalRevenue: number;
  checkInRate: number;
  approvalRate: number;
  totalEvents: number;
}

interface EventBreakdown {
  id: string;
  name: string;
  date: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  checkedIn: number;
  capacity: number;
  revenue: number;
  fillRate: number | null;
}

interface Props {
  kpis: KPIs;
  trendData: { date: string; count: number }[];
  hourCounts: number[];
  peakHour: number;
  perEvent: EventBreakdown[];
  dayOfWeekCounts: number[];
}

// --- Helpers ---
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Component ---
export function AnalyticsDashboard({
  kpis,
  trendData,
  hourCounts,
  peakHour,
  perEvent,
  dayOfWeekCounts,
}: Props) {
  const maxTrend = Math.max(...trendData.map((t) => t.count), 1);
  const maxHour = Math.max(...hourCounts, 1);
  const maxDayCount = Math.max(...dayOfWeekCounts, 1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          contextData: { kpis, trendData, hourCounts, peakHour, perEvent, dayOfWeekCounts },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      
      const data = await res.text();
      setMessages([...newMessages, { id: Date.now().toString(), role: "assistant", content: data }]);
    } catch (err) {
      setMessages([...newMessages, { id: Date.now().toString(), role: "assistant", content: "Sorry, there was an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">
          Analytics
        </h1>
        <p className="text-[#86868b] mt-2 text-lg font-medium">
          Insights across {kpis.totalEvents} event
          {kpis.totalEvents !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Registrations"
          value={kpis.totalRegistrations.toLocaleString("en-IN")}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          sub={`${kpis.approvedCount} approved`}
          positive={kpis.approvedCount > 0}
        />
        <KpiCard
          label="Total Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="w-5 h-5" />}
          iconBg="bg-green-50"
          iconColor="text-[#34c759]"
          sub="From approved registrations"
          positive={kpis.totalRevenue > 0}
        />
        <KpiCard
          label="Check-in Rate"
          value={`${kpis.checkInRate}%`}
          icon={<ScanLine className="w-5 h-5" />}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          sub={`${kpis.checkedInCount} scanned at door`}
          positive={kpis.checkedInCount > 0}
        />
        <KpiCard
          label="Approval Rate"
          value={`${kpis.approvalRate}%`}
          icon={<Percent className="w-5 h-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          sub={`${kpis.pendingCount} still pending`}
          positive={kpis.approvalRate > 50}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registration Trend (30 days) */}
        <Card className="lg:col-span-2 rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
                  Registration Trend
                </h3>
                <p className="text-[13px] text-[#86868b] font-medium mt-0.5">
                  Last 30 days
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#34c759]">
                <TrendingUp className="w-4 h-4" />
                {trendData.reduce((s, t) => s + t.count, 0)} total
              </div>
            </div>

            <div className="flex items-end gap-[3px] h-40">
              {trendData.map((d, i) => {
                const h = maxTrend > 0 ? (d.count / maxTrend) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 group relative"
                    title={`${formatShortDate(d.date)}: ${d.count}`}
                  >
                    <div
                      className="w-full rounded-t-[3px] transition-all duration-300 group-hover:opacity-70"
                      style={{
                        height: `${Math.max(h, 2)}%`,
                        backgroundColor:
                          d.count > 0 ? "#1B1C20" : "#f5f5f7",
                      }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1B1C20] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {formatShortDate(d.date)}: {d.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[11px] text-[#86868b] font-medium">
              <span>{formatShortDate(trendData[0].date)}</span>
              <span>
                {formatShortDate(
                  trendData[Math.floor(trendData.length / 2)].date
                )}
              </span>
              <span>
                {formatShortDate(trendData[trendData.length - 1].date)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7 h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
                Peak Hours
              </h3>
              <p className="text-[13px] text-[#86868b] font-medium mt-0.5">
                Busiest at{" "}
                <span className="text-[#1d1d1f] font-bold">
                  {formatHour(peakHour)}
                </span>
              </p>
            </div>
            <div className="flex-1 flex items-end gap-[3px]">
              {hourCounts.map((count, h) => {
                const height = maxHour > 0 ? (count / maxHour) * 100 : 0;
                const isPeak = h === peakHour && count > 0;
                return (
                  <div
                    key={h}
                    className="flex-1 group relative"
                    title={`${formatHour(h)}: ${count}`}
                  >
                    <div
                      className="w-full rounded-t-[2px] transition-all duration-300"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                        backgroundColor: isPeak
                          ? "#DDFE55"
                          : count > 0
                          ? "#1B1C20"
                          : "#f5f5f7",
                      }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1B1C20] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {formatHour(h)}: {count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[11px] text-[#86868b] font-medium">
              <span>12 AM</span>
              <span>12 PM</span>
              <span>11 PM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day of Week + Status Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Day of Week */}
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">
              Registrations by Day
            </h3>
            <p className="text-[13px] text-[#86868b] font-medium mb-6">
              Which day of the week gets the most signups
            </p>
            <div className="space-y-3">
              {DAYS.map((day, i) => {
                const pct =
                  maxDayCount > 0
                    ? Math.round((dayOfWeekCounts[i] / maxDayCount) * 100)
                    : 0;
                const isMax = pct === 100 && dayOfWeekCounts[i] > 0;
                return (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-10 text-[13px] font-semibold text-[#86868b] shrink-0">
                      {day}
                    </span>
                    <div className="flex-1 h-6 bg-[#f5f5f7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 1)}%`,
                          backgroundColor: isMax ? "#DDFE55" : "#1B1C20",
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-[13px] font-bold text-[#1d1d1f]">
                      {dayOfWeekCounts[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-7 h-full flex flex-col">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">
              Status Breakdown
            </h3>
            <p className="text-[13px] text-[#86868b] font-medium mb-6">
              Overall registration statuses
            </p>
            <div className="flex-1 flex flex-col justify-center gap-5">
              <StatusRow
                label="Approved"
                count={kpis.approvedCount}
                total={kpis.totalRegistrations}
                color="#34c759"
              />
              <StatusRow
                label="Pending"
                count={kpis.pendingCount}
                total={kpis.totalRegistrations}
                color="#ff9500"
              />
              <StatusRow
                label="Rejected"
                count={kpis.rejectedCount}
                total={kpis.totalRegistrations}
                color="#ff3b30"
              />
              <StatusRow
                label="Checked In"
                count={kpis.checkedInCount}
                total={kpis.totalRegistrations}
                color="#0066cc"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Event Table */}
      <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm bg-white overflow-hidden">
        <div className="p-7 pb-4">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
            Event Performance
          </h3>
          <p className="text-[13px] text-[#86868b] font-medium mt-0.5">
            Detailed breakdown per event
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-y border-[#f5f5f7]">
                <th className="py-4 px-7 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">Event</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Regs</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Approved</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Pending</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Checked In</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Revenue</th>
                <th className="py-4 px-4 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider text-right">Fill</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {perEvent.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-[#f5f5f7]/50 transition-colors group"
                >
                  <td className="py-4 px-7">
                    <p className="font-semibold text-[#1d1d1f] text-[14px]">
                      {ev.name}
                    </p>
                    <p className="text-[12px] text-[#86868b] font-medium mt-0.5">
                      {new Date(ev.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-[14px] text-[#1d1d1f]">{ev.total}</td>
                  <td className="py-4 px-4 text-right font-semibold text-[14px] text-[#34c759]">{ev.approved}</td>
                  <td className="py-4 px-4 text-right font-semibold text-[14px] text-[#ff9500]">{ev.pending}</td>
                  <td className="py-4 px-4 text-right font-semibold text-[14px] text-[#0066cc]">{ev.checkedIn}</td>
                  <td className="py-4 px-4 text-right font-semibold text-[14px] text-[#1d1d1f]">₹{ev.revenue.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-4 text-right">
                    {ev.fillRate !== null ? (
                      <span
                        className={`inline-flex items-center text-[12px] font-bold px-2.5 py-1 rounded-full ${
                          ev.fillRate >= 90
                            ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                            : ev.fillRate >= 50
                            ? "bg-[#ff9500]/10 text-[#ff9500]"
                            : "bg-[#34c759]/10 text-[#34c759]"
                        }`}
                      >
                        {ev.fillRate}%
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#86868b]">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Link
                      href={`/dashboard/events/${ev.id}/registrations`}
                      className="text-[#0066cc] hover:text-[#004499] transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>

      {/* AI Chat FAB */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#1B1C20] hover:bg-[#2a2b30] text-[#DDFE55] rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 hover:scale-105 flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 transition-transform group-hover:rotate-12" />
        </button>
      )}

      {/* AI Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[640px] bg-[#1B1C20] rounded-2xl shadow-2xl shadow-black/40 border border-white/[0.06] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DDFE55]/10 flex items-center justify-center">
                <Sparkles className="w-[18px] h-[18px] text-[#DDFE55]" />
              </div>
              <div>
                <h3 className="font-semibold text-[14px] text-white leading-tight">Freo AI</h3>
                <p className="text-[11px] text-white/40 font-medium">Ask anything about your data</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#DDFE55]/[0.07] flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-[#DDFE55]/50" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white/70 mb-1">How can I help?</p>
                  <p className="text-[13px] text-white/30 leading-relaxed">
                    I can analyze your event registrations, revenue, trends, and more.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {["How are my events doing?", "What's my peak hour?", "Summarize my data"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="text-[12px] px-3 py-1.5 rounded-full bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-colors border border-white/[0.06]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#DDFE55]/10 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <Sparkles className="w-3 h-3 text-[#DDFE55]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#DDFE55] text-[#1B1C20] font-medium rounded-tr-md'
                    : 'bg-white/[0.05] text-white/80 rounded-tl-md border border-white/[0.04]'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-[#DDFE55]/10 flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Sparkles className="w-3 h-3 text-[#DDFE55]" />
                </div>
                <div className="bg-white/[0.05] rounded-2xl rounded-tl-md px-4 py-3 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DDFE55]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DDFE55]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DDFE55]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your analytics..."
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#DDFE55]/30 focus:border-[#DDFE55]/20 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-[#DDFE55] hover:bg-[#c8e84d] disabled:opacity-30 disabled:hover:bg-[#DDFE55] text-[#1B1C20] flex items-center justify-center shrink-0 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// --- Sub-components ---

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  sub,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <Card className="rounded-[24px] border border-[#f5f5f7] shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
      <CardContent className="p-7">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[15px] font-medium text-[#86868b]">{label}</p>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}>
            {icon}
          </div>
        </div>
        <h3 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-1">
          {value}
        </h3>
        <div className={`flex items-center text-sm font-medium ${positive ? "text-[#34c759]" : "text-[#86868b]"}`}>
          {positive && <TrendingUp className="w-4 h-4 mr-1.5" />}
          <span>{sub}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="w-24 text-[14px] font-medium text-[#1d1d1f]">
        {label}
      </span>
      <div className="flex-1 h-3 bg-[#f5f5f7] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, 1)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="w-12 text-right text-[14px] font-bold text-[#1d1d1f]">
        {count}
      </span>
      <span className="w-10 text-right text-[12px] font-medium text-[#86868b]">
        {pct}%
      </span>
    </div>
  );
}

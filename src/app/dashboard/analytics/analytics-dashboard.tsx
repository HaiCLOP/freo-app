"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

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

// --- Colors (Fey-inspired, Freo-branded) ---
const C = {
  canvas: "#0b0b0b",
  card: "#131313",
  elevated: "#191919",
  accent: "#DDFE55",       // Freo brand green — maps to Fey's accent role
  blue: "#479ffa",         // Signal Blue — charts & interactive
  green: "#4ebe96",        // Tape Green — positive signals
  orange: "#ffa16c",       // Ember Orange — section labels only
  red: "#ff6b6b",          // Rejection / negative
  snow: "#ffffff",
  fog: "#868f97",
  ash: "#cccccc",
  slate: "#525252",
  platinum: "#e6e6e6",
};

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

  return (
    <div
      className="min-h-full -m-6 md:-m-10 p-6 md:p-10"
      style={{ backgroundColor: C.canvas }}
    >
      <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-700 pb-10">
        {/* Header */}
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: C.orange, letterSpacing: "0.05em" }}
          >
            Analytics
          </p>
          <h1
            className="text-4xl md:text-[48px] font-semibold"
            style={{
              color: C.snow,
              letterSpacing: "-0.08em",
              lineHeight: 1.1,
            }}
          >
            Performance
          </h1>
          <p
            className="mt-3 text-[15px]"
            style={{ color: C.fog, letterSpacing: "-0.05em" }}
          >
            Insights across {kpis.totalEvents} event
            {kpis.totalEvents !== 1 ? "s" : ""} — registration trends, revenue,
            and check-in rates.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Registrations"
            value={kpis.totalRegistrations.toLocaleString("en-IN")}
            sub={`${kpis.approvedCount} approved`}
          />
          <KpiCard
            label="Revenue"
            value={`₹${kpis.totalRevenue.toLocaleString("en-IN")}`}
            sub="From approved"
            valueColor={C.green}
          />
          <KpiCard
            label="Check-in Rate"
            value={`${kpis.checkInRate}%`}
            sub={`${kpis.checkedInCount} scanned`}
          />
          <KpiCard
            label="Approval Rate"
            value={`${kpis.approvalRate}%`}
            sub={`${kpis.pendingCount} pending`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Registration Trend (30 days) */}
          <div
            className="lg:col-span-2 rounded-2xl p-6 md:p-7"
            style={{ backgroundColor: C.card }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-[18px] font-semibold"
                  style={{
                    color: C.snow,
                    letterSpacing: "-0.05em",
                  }}
                >
                  Registration Trend
                </h3>
                <p
                  className="text-[12px] font-medium mt-1"
                  style={{ color: C.fog }}
                >
                  Last 30 days
                </p>
              </div>
              <span
                className="text-[12px] font-semibold"
                style={{ color: C.accent }}
              >
                {trendData.reduce((s, t) => s + t.count, 0)} total
              </span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-[2px] h-36">
              {trendData.map((d, i) => {
                const h = maxTrend > 0 ? (d.count / maxTrend) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 group relative"
                    title={`${formatShortDate(d.date)}: ${d.count}`}
                  >
                    <div
                      className="w-full rounded-t-[2px] transition-all duration-300 group-hover:opacity-70"
                      style={{
                        height: `${Math.max(h, 2)}%`,
                        backgroundColor:
                          d.count > 0
                            ? C.accent
                            : `${C.slate}40`,
                      }}
                    />
                    <div
                      className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                      style={{
                        backgroundColor: C.elevated,
                        color: C.snow,
                        border: `1px solid ${C.slate}`,
                      }}
                    >
                      {formatShortDate(d.date)}: {d.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="flex justify-between mt-3 text-[10px] font-medium"
              style={{ color: C.fog }}
            >
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
          </div>

          {/* Peak Hours */}
          <div
            className="rounded-2xl p-6 md:p-7 flex flex-col"
            style={{ backgroundColor: C.card }}
          >
            <div className="mb-6">
              <h3
                className="text-[18px] font-semibold"
                style={{
                  color: C.snow,
                  letterSpacing: "-0.05em",
                }}
              >
                Peak Hours
              </h3>
              <p
                className="text-[12px] font-medium mt-1"
                style={{ color: C.fog }}
              >
                Busiest at{" "}
                <span style={{ color: C.accent }} className="font-bold">
                  {formatHour(peakHour)}
                </span>
              </p>
            </div>
            <div className="flex-1 flex items-end gap-[2px]">
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
                          ? C.accent
                          : count > 0
                          ? `${C.accent}50`
                          : `${C.slate}30`,
                      }}
                    />
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                      style={{
                        backgroundColor: C.elevated,
                        color: C.snow,
                        border: `1px solid ${C.slate}`,
                      }}
                    >
                      {formatHour(h)}: {count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="flex justify-between mt-3 text-[10px] font-medium"
              style={{ color: C.fog }}
            >
              <span>12 AM</span>
              <span>12 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        </div>

        {/* Day of Week + Status Breakdown */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Day of Week */}
          <div
            className="rounded-2xl p-6 md:p-7"
            style={{ backgroundColor: C.card }}
          >
            <h3
              className="text-[18px] font-semibold mb-1"
              style={{ color: C.snow, letterSpacing: "-0.05em" }}
            >
              Registrations by Day
            </h3>
            <p
              className="text-[12px] font-medium mb-6"
              style={{ color: C.fog }}
            >
              Which day of the week gets the most signups
            </p>
            <div className="space-y-2.5">
              {DAYS.map((day, i) => {
                const pct =
                  maxDayCount > 0
                    ? Math.round((dayOfWeekCounts[i] / maxDayCount) * 100)
                    : 0;
                const isMax = pct === 100 && dayOfWeekCounts[i] > 0;
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span
                      className="w-8 text-[12px] font-medium shrink-0"
                      style={{ color: C.fog }}
                    >
                      {day}
                    </span>
                    <div
                      className="flex-1 h-5 rounded overflow-hidden"
                      style={{ backgroundColor: `${C.slate}30` }}
                    >
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: isMax ? C.accent : C.snow,
                          opacity: isMax ? 1 : 0.25,
                        }}
                      />
                    </div>
                    <span
                      className="w-7 text-right text-[12px] font-bold"
                      style={{ color: isMax ? C.accent : C.ash }}
                    >
                      {dayOfWeekCounts[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div
            className="rounded-2xl p-6 md:p-7 flex flex-col"
            style={{ backgroundColor: C.card }}
          >
            <h3
              className="text-[18px] font-semibold mb-1"
              style={{ color: C.snow, letterSpacing: "-0.05em" }}
            >
              Status Breakdown
            </h3>
            <p
              className="text-[12px] font-medium mb-6"
              style={{ color: C.fog }}
            >
              Overall registration statuses
            </p>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <StatusRow
                label="Approved"
                count={kpis.approvedCount}
                total={kpis.totalRegistrations}
                color={C.green}
              />
              <StatusRow
                label="Pending"
                count={kpis.pendingCount}
                total={kpis.totalRegistrations}
                color={C.orange}
              />
              <StatusRow
                label="Rejected"
                count={kpis.rejectedCount}
                total={kpis.totalRegistrations}
                color={C.red}
              />
              <StatusRow
                label="Checked In"
                count={kpis.checkedInCount}
                total={kpis.totalRegistrations}
                color={C.blue}
              />
            </div>
          </div>
        </div>

        {/* Per-Event Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: C.card,
            border: `1px solid ${C.slate}40`,
          }}
        >
          <div className="p-6 md:p-7 pb-4">
            <p
              className="text-[11px] font-medium uppercase tracking-wider mb-2"
              style={{ color: C.orange }}
            >
              Breakdown
            </p>
            <h3
              className="text-[18px] font-semibold"
              style={{ color: C.snow, letterSpacing: "-0.05em" }}
            >
              Event Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.slate}50` }}>
                  {[
                    { label: "Event", align: "left" },
                    { label: "Regs", align: "right" },
                    { label: "Approved", align: "right" },
                    { label: "Pending", align: "right" },
                    { label: "Checked In", align: "right" },
                    { label: "Revenue", align: "right" },
                    { label: "Fill", align: "right" },
                    { label: "", align: "right" },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`py-3 px-5 text-[11px] font-semibold uppercase tracking-wider ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                      style={{ color: C.fog }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perEvent.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    className="transition-colors group"
                    style={{
                      borderBottom:
                        idx < perEvent.length - 1
                          ? `1px solid ${C.slate}30`
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = C.elevated)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="py-4 px-5">
                      <p
                        className="font-semibold text-[14px]"
                        style={{ color: C.snow }}
                      >
                        {ev.name}
                      </p>
                      <p
                        className="text-[11px] font-medium mt-0.5"
                        style={{ color: C.fog }}
                      >
                        {new Date(ev.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td
                      className="py-4 px-5 text-right font-semibold text-[14px]"
                      style={{ color: C.snow }}
                    >
                      {ev.total}
                    </td>
                    <td
                      className="py-4 px-5 text-right font-semibold text-[14px]"
                      style={{ color: C.green }}
                    >
                      {ev.approved}
                    </td>
                    <td
                      className="py-4 px-5 text-right font-semibold text-[14px]"
                      style={{ color: C.orange }}
                    >
                      {ev.pending}
                    </td>
                    <td
                      className="py-4 px-5 text-right font-semibold text-[14px]"
                      style={{ color: C.blue }}
                    >
                      {ev.checkedIn}
                    </td>
                    <td
                      className="py-4 px-5 text-right font-semibold text-[14px]"
                      style={{ color: C.snow }}
                    >
                      ₹{ev.revenue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {ev.fillRate !== null ? (
                        <span
                          className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            border: `1px solid ${
                              ev.fillRate >= 90
                                ? C.red
                                : ev.fillRate >= 50
                                ? C.orange
                                : C.green
                            }`,
                            color:
                              ev.fillRate >= 90
                                ? C.red
                                : ev.fillRate >= 50
                                ? C.orange
                                : C.green,
                          }}
                        >
                          {ev.fillRate}%
                        </span>
                      ) : (
                        <span
                          className="text-[11px]"
                          style={{ color: C.fog }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <Link
                        href={`/dashboard/events/${ev.id}/registrations`}
                        style={{ color: C.fog }}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 md:p-6 transition-colors"
      style={{ backgroundColor: C.card }}
    >
      <p
        className="text-[12px] font-medium uppercase tracking-wider mb-3"
        style={{ color: C.fog }}
      >
        {label}
      </p>
      <h3
        className="text-[28px] md:text-[32px] font-semibold mb-1"
        style={{
          color: valueColor || C.snow,
          letterSpacing: "-0.05em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </h3>
      <p className="text-[12px] font-medium" style={{ color: C.fog }}>
        {sub}
      </p>
    </div>
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
    <div className="flex items-center gap-3">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className="w-20 text-[13px] font-medium"
        style={{ color: C.ash }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: `${C.slate}30` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, 1)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span
        className="w-8 text-right text-[13px] font-bold"
        style={{ color: C.snow }}
      >
        {count}
      </span>
      <span
        className="w-10 text-right text-[11px] font-medium"
        style={{ color: C.fog }}
      >
        {pct}%
      </span>
    </div>
  );
}

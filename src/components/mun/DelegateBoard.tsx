"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  Download,
  Mail,
  CreditCard,
  School,
} from "lucide-react";
import { REGISTRATION_STATUS_CONFIG } from "@/lib/mun/constants";

const COLUMNS = [
  { key: "PENDING", label: "Pending", icon: Clock, color: "#FFA500" },
  { key: "UNDER_REVIEW", label: "Under Review", icon: Eye, color: "#3B82F6" },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2, color: "#22C55E" },
  { key: "REJECTED", label: "Rejected", icon: XCircle, color: "#EF4444" },
  { key: "WAITLISTED", label: "Waitlisted", icon: Clock, color: "#A855F7" },
];

interface DelegateBoardProps {
  conferenceId: string;
  initialRegistrations: Record<string, unknown>[];
}

export function DelegateBoard({ conferenceId, initialRegistrations }: DelegateBoardProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Get unique schools for filter
  const schools = [...new Set(registrations.map((r) => r.delegate_school as string))].sort();

  // Filter registrations
  const filtered = registrations.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.delegate_name as string)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.delegate_email as string)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.delegate_school as string)?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSchool = !schoolFilter || (r.delegate_school as string) === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  const getColumnData = (status: string) =>
    filtered.filter((r) => r.status === status);

  const handleStatusChange = (regId: string, newStatus: string) => {
    startTransition(async () => {
      const { updateRegistrationStatus } = await import("@/lib/mun/actions/registration");
      await updateRegistrationStatus(regId, newStatus as never, conferenceId);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId ? { ...r, status: newStatus } : r
        )
      );
    });
  };

  const handleBulkAction = (status: string) => {
    if (selected.size === 0) return;
    startTransition(async () => {
      const { bulkUpdateStatus } = await import("@/lib/mun/actions/registration");
      await bulkUpdateStatus([...selected], status as never, conferenceId);
      setRegistrations((prev) =>
        prev.map((r) =>
          selected.has(r.id as string) ? { ...r, status } : r
        )
      );
      setSelected(new Set());
    });
  };

  const handlePaymentVerify = (regId: string, verified: boolean) => {
    startTransition(async () => {
      const { verifyPayment } = await import("@/lib/mun/actions/registration");
      await verifyPayment(regId, verified, conferenceId);
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId ? { ...r, payment_verified: verified } : r
        )
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B1C20] flex items-center gap-2">
            <Users size={20} />
            Delegate Management
          </h2>
          <p className="text-sm text-[#6B7280]">
            {registrations.length} total registration{registrations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1B1C20]">
              {selected.size} selected
            </span>
            <button
              onClick={() => handleBulkAction("APPROVED")}
              disabled={isPending}
              className="neo-badge px-3 py-1.5 text-xs font-bold bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors"
            >
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("REJECTED")}
              disabled={isPending}
              className="neo-badge px-3 py-1.5 text-xs font-bold bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="neo-badge px-3 py-1.5 text-xs font-bold bg-[#f3f4f6] text-[#6B7280]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search by name, email, or school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-badge w-full pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="neo-badge pl-10 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] appearance-none cursor-pointer"
          >
            <option value="">All Schools</option>
            {schools.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[400px]">
        {COLUMNS.map((col) => {
          const data = getColumnData(col.key);
          const Icon = col.icon;
          return (
            <div key={col.key} className="neo-badge bg-[#f9fafb] p-3 flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon size={14} style={{ color: col.color }} />
                <span className="text-xs font-bold text-[#1B1C20] uppercase tracking-wider">
                  {col.label}
                </span>
                <span
                  className="neo-badge px-1.5 py-0.5 text-[10px] font-bold ml-auto"
                  style={{ backgroundColor: `${col.color}15`, color: col.color }}
                >
                  {data.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                {data.map((reg) => (
                  <div
                    key={reg.id as string}
                    className={`neo-badge bg-white p-3 text-xs cursor-pointer transition-all hover:shadow-md ${
                      selected.has(reg.id as string) ? "ring-2 ring-[#DDFE55]" : ""
                    }`}
                    onClick={() => setExpandedCard(expandedCard === (reg.id as string) ? null : (reg.id as string))}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#1B1C20] truncate">
                          {reg.delegate_name as string}
                        </p>
                        <p className="text-[#9ca3af] truncate mt-0.5">
                          {reg.delegate_school as string}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selected.has(reg.id as string)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const next = new Set(selected);
                          if (next.has(reg.id as string)) next.delete(reg.id as string);
                          else next.add(reg.id as string);
                          setSelected(next);
                        }}
                        className="shrink-0 mt-0.5 w-4 h-4 accent-[#DDFE55]"
                      />
                    </div>

                    {/* Payment indicator */}
                    {(reg.payment_amount as number) > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <CreditCard size={10} />
                        <span className={reg.payment_verified ? "text-[#22C55E]" : "text-[#FFA500]"}>
                          ₹{reg.payment_amount as number} {reg.payment_verified ? "✓" : "unverified"}
                        </span>
                      </div>
                    )}

                    {/* Expanded details */}
                    {expandedCard === (reg.id as string) && (
                      <div className="mt-3 pt-3 border-t border-[#e5e7eb] space-y-2">
                        <p className="flex items-center gap-1.5 text-[#6B7280]">
                          <Mail size={10} />
                          {reg.delegate_email as string}
                        </p>
                        <p className="flex items-center gap-1.5 text-[#6B7280]">
                          <School size={10} />
                          Grade: {(reg.delegate_grade as string) || "N/A"}
                        </p>
                        <p className="text-[#6B7280]">
                          Experience: {reg.experience_level as string}
                        </p>

                        {/* Status actions */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {["APPROVED", "REJECTED", "WAITLISTED", "UNDER_REVIEW"].map((s) =>
                            s !== (reg.status as string) ? (
                              <button
                                key={s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(reg.id as string, s);
                                }}
                                disabled={isPending}
                                className="neo-badge px-2 py-1 text-[10px] font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
                                style={{
                                  backgroundColor: `${REGISTRATION_STATUS_CONFIG[s]?.color || "#ccc"}15`,
                                  color: REGISTRATION_STATUS_CONFIG[s]?.color || "#666",
                                }}
                              >
                                {REGISTRATION_STATUS_CONFIG[s]?.label || s}
                              </button>
                            ) : null
                          )}
                        </div>

                        {/* Payment verification */}
                        {(reg.payment_amount as number) > 0 && !(reg.payment_verified as boolean) && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePaymentVerify(reg.id as string, true);
                              }}
                              disabled={isPending}
                              className="neo-badge px-2 py-1 text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E]"
                            >
                              Verify Payment
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: View screenshot
                              }}
                              className="neo-badge px-2 py-1 text-[10px] font-bold bg-[#f3f4f6] text-[#6B7280]"
                            >
                              View Screenshot
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {data.length === 0 && (
                  <div className="text-center text-[10px] text-[#9ca3af] py-8">
                    No delegates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

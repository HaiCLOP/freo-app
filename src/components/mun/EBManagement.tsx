"use client";

import { useState, useTransition } from "react";
import { Shield, UserPlus, Mail, Clock, CheckCircle2, ChevronDown } from "lucide-react";
import { EBRoleType } from "@/lib/mun/types";
import { CHECKLIST_DEFAULTS } from "@/lib/mun/constants";

interface EBPageProps {
  conferenceId: string;
  members: Array<Record<string, unknown>>;
  checklists: Array<Record<string, unknown>>;
  committees: Array<{ id: string; name: string; short_name: string }>;
}

export function EBManagement({ conferenceId, members, checklists, committees }: EBPageProps) {
  const [isPending, startTransition] = useTransition();
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const { inviteEBMember } = await import("@/lib/mun/actions/conference");
        await inviteEBMember(conferenceId, fd);
        setShowInvite(false);
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to send invite");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1B1C20] flex items-center gap-2">
          <Shield size={20} />
          Executive Board
        </h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-6 py-2.5 font-bold text-sm inline-flex items-center gap-2"
        >
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      {error && (
        <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="neo-card bg-white p-6 space-y-4">
          <h3 className="font-bold text-[#1B1C20]">Invite EB Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Name *</label>
              <input name="name" required className="neo-badge w-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Email *</label>
              <input name="email" type="email" required className="neo-badge w-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Role *</label>
              <div className="relative">
                <select name="role_type" required className="neo-badge w-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] appearance-none">
                  {Object.entries(EBRoleType).map(([k, v]) => (
                    <option key={k} value={v}>{k.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1B1C20] mb-2">Committee</label>
              <div className="relative">
                <select name="committee_id" className="neo-badge w-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55] appearance-none">
                  <option value="">Conference-level (Sec-Gen/USG)</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>{c.short_name} — {c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-6 py-2.5 font-bold text-sm disabled:opacity-50">
              {isPending ? "Sending..." : "Send Invite"}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="neo-btn bg-white text-[#1B1C20] px-6 py-2.5 font-bold text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members list */}
      <div className="neo-card bg-white p-6">
        <h3 className="font-bold text-[#1B1C20] mb-4">Members ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No EB members invited yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id as string} className="neo-badge bg-[#f9fafb] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 neo-badge bg-[#DDFE55]/20 flex items-center justify-center text-[#1B1C20] font-bold text-sm">
                    {(m.name as string)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#1B1C20] text-sm">{m.name as string}</p>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Mail size={10} />
                      {m.email as string}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="neo-badge px-2 py-1 text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] uppercase">
                    {(m.role_type as string).replace(/_/g, " ")}
                  </span>
                  {m.accepted_at ? (
                    <span className="flex items-center gap-1 text-xs text-[#22C55E]">
                      <CheckCircle2 size={12} />
                      Accepted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[#FFA500]">
                      <Clock size={12} />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="neo-card bg-white p-6">
        <h3 className="font-bold text-[#1B1C20] mb-4">Pre-Conference Checklist</h3>
        <div className="space-y-2">
          {CHECKLIST_DEFAULTS.map((task) => {
            const match = checklists.find((c) => c.task_name === task);
            const done = match ? (match.is_completed as boolean) : false;
            return (
              <div key={task} className={`neo-badge p-3 flex items-center gap-3 transition-colors ${done ? "bg-[#22C55E]/5" : "bg-[#f9fafb]"}`}>
                <div className={`w-5 h-5 neo-badge flex items-center justify-center text-xs ${done ? "bg-[#22C55E] text-white" : "bg-white"}`}>
                  {done && "✓"}
                </div>
                <span className={`text-sm ${done ? "text-[#22C55E] line-through" : "text-[#1B1C20]"}`}>
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Sparkles, Trash2, ShieldAlert, Users, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

interface AllotmentDashboardProps {
  conferenceId: string;
  committees: Array<{
    id: string;
    name: string;
    short_name: string;
    stats: {
      total_delegates: number;
      assigned_count: number;
      portfolio_capacity: number;
    };
  }>;
}

export function AllotmentDashboard({ conferenceId, committees }: AllotmentDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<string>(committees[0]?.id || "");
  const [previewData, setPreviewData] = useState<Array<{ registration_id: string, portfolio_id: string, delegate_name: string, portfolio_name: string }> | null>(null);

  const handleRunAllotment = () => {
    if (!selectedCommittee) return;
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const { runAIAllotment } = await import("@/lib/mun/actions/allotment");
        const res = await runAIAllotment(conferenceId, selectedCommittee);
        if (res.success) {
          setSuccess(res.message);
          if (res.preview) setPreviewData(res.preview);
        } else {
          setError(res.message);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to run AI Allotment");
      }
    });
  };

  const handleConfirmAllotment = () => {
    if (!previewData || !selectedCommittee) return;
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const { confirmAllotment } = await import("@/lib/mun/actions/allotment");
        const res = await confirmAllotment(conferenceId, selectedCommittee, previewData.map(p => ({
          registration_id: p.registration_id,
          portfolio_id: p.portfolio_id
        })));
        if (res.success) {
          setSuccess(res.message);
          setPreviewData(null);
          window.location.reload();
        } else {
          setError(res.message);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to confirm allotments");
      }
    });
  };

  const handleClearAllotments = () => {
    if (!selectedCommittee) return;
    if (!confirm("Are you sure you want to clear ALL portfolio assignments for this committee? This cannot be undone.")) return;
    
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const { clearAllotments } = await import("@/lib/mun/actions/allotment");
        const res = await clearAllotments(conferenceId, selectedCommittee);
        setSuccess(`Cleared ${res.count} allotments.`);
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to clear allotments");
      }
    });
  };

  const selectedData = committees.find(c => c.id === selectedCommittee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B1C20] flex items-center gap-2">
            <Sparkles size={20} className="text-[#A855F7]" />
            AI Portfolio Allotment
          </h2>
          <p className="text-sm text-[#6B7280]">
            Automatically assign portfolios based on experience and preferences using Gemini 2.5 AI.
          </p>
        </div>
      </div>

      {error && (
        <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="neo-badge bg-green-50 text-green-700 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="neo-card bg-white p-6 space-y-6 md:col-span-1">
          <div>
            <label className="block text-sm font-bold text-[#1B1C20] mb-2">Select Committee</label>
            <div className="space-y-2">
              {committees.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommittee(c.id)}
                  className={`w-full text-left px-4 py-3 neo-badge text-sm transition-colors ${
                    selectedCommittee === c.id 
                      ? "bg-[#1B1C20] text-[#DDFE55] font-bold" 
                      : "bg-[#f9fafb] text-[#6B7280] hover:bg-[#f3f4f6]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{c.short_name}</span>
                    <span className="text-[10px] opacity-70 bg-white/20 px-1.5 py-0.5 neo-badge">
                      {c.stats.assigned_count}/{c.stats.total_delegates} assigned
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e5e7eb] space-y-3">
            <button
              onClick={handleRunAllotment}
              disabled={isPending || !selectedCommittee}
              className="w-full neo-btn bg-[#A855F7] text-white px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? "Running AI..." : "Run AI Allotment Engine"}
              <Sparkles size={16} />
            </button>
            <button
              onClick={handleClearAllotments}
              disabled={isPending || !selectedCommittee}
              className="w-full neo-btn bg-white text-[#EF4444] px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-50"
            >
              Clear All Assignments
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="neo-badge bg-[#f3f4f6] p-4 text-xs text-[#6B7280]">
            <strong className="text-[#1B1C20] flex items-center gap-1 mb-1">
              <ShieldAlert size={12} />
              AI Rules Engine:
            </strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>Prioritizes 1st preference</li>
              <li>Matches experience level to 'featured' portfolios</li>
              <li>Never exceeds portfolio capacity</li>
              <li>Ignores manually locked assignments</li>
            </ul>
          </div>
        </div>

        {/* Stats & Preview */}
        <div className="md:col-span-2 space-y-6">
          {selectedData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="neo-badge bg-white p-4">
                  <div className="flex items-center gap-2 text-[#3B82F6] mb-1">
                    <Users size={16} />
                    <span className="text-xs font-bold uppercase">Delegates</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1B1C20]">{selectedData.stats.total_delegates}</span>
                </div>
                <div className="neo-badge bg-white p-4">
                  <div className="flex items-center gap-2 text-[#22C55E] mb-1">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase">Assigned</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1B1C20]">{selectedData.stats.assigned_count}</span>
                </div>
                <div className="neo-badge bg-white p-4">
                  <div className="flex items-center gap-2 text-[#FFA500] mb-1">
                    <Layers size={16} />
                    <span className="text-xs font-bold uppercase">Capacity</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1B1C20]">{selectedData.stats.portfolio_capacity}</span>
                </div>
              </div>
              
              <div className="neo-card bg-white p-6">
                {previewData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#1B1C20]">Proposed AI Allotment</h3>
                      <button
                        onClick={handleConfirmAllotment}
                        disabled={isPending}
                        className="neo-btn bg-[#22C55E] text-white px-4 py-2 font-bold text-sm disabled:opacity-50"
                      >
                        {isPending ? "Saving..." : "Confirm & Publish Allotments"}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#e5e7eb]">
                            <th className="p-3 text-sm font-bold text-[#1B1C20]">Delegate</th>
                            <th className="p-3 text-sm font-bold text-[#1B1C20]">Assigned Portfolio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map(p => (
                            <tr key={p.registration_id} className="border-b border-[#f3f4f6]">
                              <td className="p-3 text-sm text-[#1B1C20]">{p.delegate_name}</td>
                              <td className="p-3 text-sm text-[#A855F7] font-bold">{p.portfolio_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-[#1B1C20] mb-4">Allotment Results preview will appear here</h3>
                    <p className="text-sm text-[#6B7280]">
                      Click "Run AI Allotment Engine" to generate a preview. Navigate to the <strong>Delegates</strong> tab later to make manual overrides.
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="neo-card bg-[#f9fafb] p-12 text-center text-[#9ca3af]">
              Select a committee to view allotment stats and controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { FileText, CheckCircle2, XCircle, Clock, FileWarning, Search, ExternalLink } from "lucide-react";
import { PaperStatus } from "@/lib/mun/types";

interface PaperReviewProps {
  conferenceId: string;
  papers: Array<{
    id: string;
    version: number;
    file_url: string;
    status: PaperStatus;
    eb_comments: string | null;
    score: number | null;
    submitted_at: string;
    registration: {
      delegate_name: string;
      delegate_school: string;
      portfolio: { name: string } | null;
    };
    committee: { short_name: string };
  }>;
}

export function PaperReviewQueue({ conferenceId, papers }: PaperReviewProps) {
  const [isPending, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<PaperStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [score, setScore] = useState<number | "">("");
  const [comments, setComments] = useState("");

  const filtered = papers.filter(p => {
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesSearch = !search || 
      p.registration.delegate_name.toLowerCase().includes(search.toLowerCase()) ||
      p.committee.short_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.registration.portfolio?.name.toLowerCase() || "").includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: PaperStatus) => {
    switch(status) {
      case "PENDING": return <Clock size={14} className="text-[#FFA500]" />;
      case "ACCEPTED": return <CheckCircle2 size={14} className="text-[#22C55E]" />;
      case "REJECTED": return <XCircle size={14} className="text-[#EF4444]" />;
      case "REVISION_REQUESTED": return <FileWarning size={14} className="text-[#3B82F6]" />;
    }
  };

  const submitReview = (paperId: string, status: PaperStatus) => {
    startTransition(async () => {
      try {
        const { reviewPositionPaper } = await import("@/lib/mun/actions/papers");
        await reviewPositionPaper(
          paperId, 
          status, 
          score === "" ? null : Number(score), 
          comments
        );
        window.location.reload();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to review paper");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B1C20] flex items-center gap-2">
            <FileText size={20} className="text-[#3B82F6]" />
            Position Paper Review Queue
          </h2>
          <p className="text-sm text-[#6B7280]">
            Review, score, and provide feedback on delegate submissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search by delegate, portfolio, or committee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neo-badge w-full pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#DDFE55]"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "ACCEPTED", "REVISION_REQUESTED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`neo-badge px-4 py-2 text-xs font-bold transition-colors ${
                filterStatus === status 
                  ? "bg-[#1B1C20] text-[#DDFE55]" 
                  : "bg-white text-[#6B7280]"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="neo-card bg-white p-12 text-center text-[#6B7280]">
            No position papers match your filters.
          </div>
        ) : (
          filtered.map(paper => (
            <div key={paper.id} className="neo-card bg-white p-6 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#6B7280] uppercase">
                      {paper.committee.short_name}
                    </span>
                    <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#f3f4f6] text-[#1B1C20] uppercase flex items-center gap-1">
                      {getStatusIcon(paper.status)}
                      {paper.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      v{paper.version} • {new Date(paper.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#1B1C20]">
                    {paper.registration.delegate_name}
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    {paper.registration.portfolio?.name || "Unassigned Portfolio"} • {paper.registration.delegate_school}
                  </p>

                  {/* Existing Review Data */}
                  {(paper.score !== null || paper.eb_comments) && reviewingId !== paper.id && (
                    <div className="mt-4 p-3 bg-[#f9fafb] neo-badge text-sm text-[#6B7280]">
                      {paper.score !== null && <p className="font-bold text-[#1B1C20] mb-1">Score: {paper.score}/10</p>}
                      {paper.eb_comments && <p>"{paper.eb_comments}"</p>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <a
                    href={paper.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="neo-btn bg-[#f3f4f6] text-[#1B1C20] px-4 py-2 font-bold text-xs flex items-center justify-center gap-2 w-full"
                  >
                    View Document <ExternalLink size={14} />
                  </a>
                  
                  {reviewingId !== paper.id ? (
                    <button
                      onClick={() => {
                        setReviewingId(paper.id);
                        setScore(paper.score ?? "");
                        setComments(paper.eb_comments || "");
                      }}
                      className="neo-btn bg-[#3B82F6] text-white px-4 py-2 font-bold text-xs w-full"
                    >
                      {paper.status === "PENDING" ? "Review & Score" : "Edit Review"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setReviewingId(null)}
                      className="neo-btn bg-white text-[#6B7280] px-4 py-2 font-bold text-xs w-full"
                    >
                      Cancel Review
                    </button>
                  )}
                </div>
              </div>

              {/* Review Form */}
              {reviewingId === paper.id && (
                <div className="mt-6 pt-6 border-t border-[#e5e7eb] space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/4">
                      <label className="block text-xs font-bold text-[#1B1C20] mb-2">Score (/10)</label>
                      <input 
                        type="number" 
                        min="0" max="10" step="0.5"
                        value={score}
                        onChange={(e) => setScore(e.target.value ? Number(e.target.value) : "")}
                        className="neo-badge w-full px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-[#1B1C20] mb-2">EB Comments / Feedback</label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide constructive feedback for the delegate..."
                        className="neo-badge w-full px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] min-h-[80px]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => submitReview(paper.id, "ACCEPTED")}
                      disabled={isPending}
                      className="neo-btn bg-[#22C55E] text-white px-4 py-2 font-bold text-xs flex-1 disabled:opacity-50"
                    >
                      Accept Paper
                    </button>
                    <button
                      onClick={() => submitReview(paper.id, "REVISION_REQUESTED")}
                      disabled={isPending}
                      className="neo-btn bg-[#3B82F6] text-white px-4 py-2 font-bold text-xs flex-1 disabled:opacity-50"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => submitReview(paper.id, "REJECTED")}
                      disabled={isPending}
                      className="neo-btn bg-[#EF4444] text-white px-4 py-2 font-bold text-xs flex-1 disabled:opacity-50"
                    >
                      Reject Paper
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

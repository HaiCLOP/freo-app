"use client";

import { useState, useTransition } from "react";
import { Upload, FileText, CheckCircle2, XCircle, Clock, FileWarning } from "lucide-react";
import { PaperStatus } from "@/lib/mun/types";

interface DelegatePaperProps {
  registrationId: string;
  committeeId: string;
  papers: Array<{
    id: string;
    version: number;
    file_url: string;
    status: PaperStatus;
    eb_comments: string | null;
    score: number | null;
    submitted_at: string;
  }>;
}

export function DelegatePaperUpload({ registrationId, committeeId, papers }: DelegatePaperProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setSuccess(false);

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const { uploadPositionPaper } = await import("@/lib/mun/actions/papers");
        await uploadPositionPaper(registrationId, committeeId, fd);
        setSuccess(true);
        setFile(null);
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  };

  const getStatusIcon = (status: PaperStatus) => {
    switch(status) {
      case "PENDING": return <Clock size={16} className="text-[#FFA500]" />;
      case "ACCEPTED": return <CheckCircle2 size={16} className="text-[#22C55E]" />;
      case "REJECTED": return <XCircle size={16} className="text-[#EF4444]" />;
      case "REVISION_REQUESTED": return <FileWarning size={16} className="text-[#3B82F6]" />;
    }
  };

  // If the latest paper is accepted, we don't need to show upload
  const latestPaper = papers[0];
  const canUpload = !latestPaper || latestPaper.status === "REVISION_REQUESTED" || latestPaper.status === "REJECTED";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1B1C20] flex items-center gap-2">
          <FileText size={24} className="text-[#3B82F6]" />
          Position Paper
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Submit your research paper before the conference begins. Max size 5MB (PDF only).
        </p>
      </div>

      {error && (
        <div className="neo-badge bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {canUpload && (
        <form onSubmit={handleUpload} className="neo-card bg-white p-8 space-y-4">
          <h3 className="font-bold text-[#1B1C20]">Upload New Submission</h3>
          
          <label className="neo-badge border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#f3f4f6] transition-colors">
            <Upload size={24} className="text-[#6B7280]" />
            <div className="text-center">
              <span className="text-sm font-bold text-[#1B1C20] block">
                {file ? file.name : "Click to select PDF"}
              </span>
              <span className="text-xs text-[#9ca3af]">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Only PDF files allowed, max 5MB"}
              </span>
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            disabled={isPending || !file}
            className="neo-btn bg-[#3B82F6] text-white px-6 py-3 font-bold text-sm w-full disabled:opacity-50"
          >
            {isPending ? "Uploading..." : "Submit Paper"}
          </button>
        </form>
      )}

      {papers.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-[#1B1C20]">Submission History</h3>
          
          {papers.map((paper, idx) => (
            <div key={paper.id} className="neo-card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="neo-badge px-2 py-0.5 text-xs font-bold bg-[#f3f4f6] text-[#1B1C20]">
                    Version {paper.version}
                  </span>
                  <span className="text-xs text-[#9ca3af]">
                    {new Date(paper.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-sm" style={{
                  color: paper.status === 'ACCEPTED' ? '#22C55E' : 
                         paper.status === 'REJECTED' ? '#EF4444' : 
                         paper.status === 'PENDING' ? '#FFA500' : '#3B82F6'
                }}>
                  {getStatusIcon(paper.status)}
                  {paper.status.replace(/_/g, " ")}
                </div>
              </div>

              {(paper.score !== null || paper.eb_comments) && (
                <div className="mt-4 p-4 bg-[#f9fafb] neo-badge text-sm text-[#6B7280]">
                  <h4 className="font-bold text-[#1B1C20] mb-2 flex items-center gap-2">
                    Executive Board Feedback
                    {paper.score !== null && (
                      <span className="neo-badge px-2 py-0.5 text-[10px] bg-[#DDFE55] text-[#1B1C20]">
                        Score: {paper.score}/10
                      </span>
                    )}
                  </h4>
                  {paper.eb_comments && <p>"{paper.eb_comments}"</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

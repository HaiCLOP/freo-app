"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function EventErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Public Event Page Error:", error);
  }, [error]);

  const isLargeFileError = error.message.toLowerCase().includes("body exceeded");

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-[#e5e5ea] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-3 tracking-tight">
          Oops! Something went wrong.
        </h2>
        
        <p className="text-[#86868b] mb-6 leading-relaxed">
          {isLargeFileError 
            ? "The payment screenshot you tried to upload is too large. Please compress the image or choose a smaller file (under 6MB) and try again."
            : error.message || "An unexpected server error occurred while processing your registration. Please try again."}
        </p>

        {error.digest && (
          <p className="text-xs text-[#86868b]/70 mb-8 font-mono bg-[#f5f5f7] p-2 rounded-lg">
            Error ID: {error.digest}
          </p>
        )}

        <Button 
          onClick={() => reset()}
          className="w-full bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 text-white h-12 rounded-xl text-[15px] font-medium transition-all shadow-sm"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

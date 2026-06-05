import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 font-fredoka">Loading...</h2>
        <p className="text-sm text-gray-500">Getting things ready</p>
      </div>
    </div>
  );
}

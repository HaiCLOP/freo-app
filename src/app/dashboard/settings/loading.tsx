import { Loader2 } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-[#DDFE55]/30 animate-pulse"></div>
          <Loader2 className="w-10 h-10 text-[#1B1C20] animate-spin relative z-10" />
        </div>
        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading settings...</p>
      </div>
    </div>
  );
}

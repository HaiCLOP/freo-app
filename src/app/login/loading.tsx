import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#DDFE55]">
      <div className="flex flex-col items-center gap-4 bg-white/20 p-8 rounded-[24px] backdrop-blur-sm border border-white/30 shadow-xl">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-white/50 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-[#1B1C20] animate-spin relative z-10" />
        </div>
        <h2 className="text-xl font-bold text-[#1B1C20] font-fredoka">Preparing...</h2>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

export function RealtimeRegistrations({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [notification, setNotification] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`registrations_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "registrations",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Show notification
          const name = payload.new.full_name || "Someone";
          setNotification({ name, id: payload.new.id });
          
          // Refresh the page data
          router.refresh();

          // Auto-hide after 5 seconds
          setTimeout(() => {
            setNotification((prev) => (prev?.id === payload.new.id ? null : prev));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border border-[#e5e5ea] shadow-lg rounded-2xl p-4 flex items-center gap-3 pr-8 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#34c759]" />
        <div className="bg-[#34c759]/10 text-[#34c759] p-2 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[#1d1d1f] font-semibold text-sm">New Registration!</h4>
          <p className="text-[#86868b] text-sm">{notification.name} just registered.</p>
        </div>
        <button 
          onClick={() => setNotification(null)}
          className="absolute right-3 top-3 text-[#86868b] hover:text-[#1d1d1f]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

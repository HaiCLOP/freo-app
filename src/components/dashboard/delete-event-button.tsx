"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteEvent } from "@/app/dashboard/events/actions";
import { useRouter } from "next/navigation";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteEvent(eventId);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event. It may have existing registrations.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
      title="Delete Event"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

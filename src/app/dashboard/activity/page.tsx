export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Search, Filter } from "lucide-react";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch events owned by the user to get their IDs and Names
  const { data: events } = await supabase
    .from("events")
    .select("id, name")
    .eq("creator_id", user.id);

  const eventIds = events?.map(e => e.id) || [];
  const eventMap = events?.reduce((acc, event) => {
    acc[event.id] = event.name;
    return acc;
  }, {} as Record<string, string>) || {};

  // Fetch all registrations for these events
  let registrations: any[] = [];
  if (eventIds.length > 0) {
    const { data: regs } = await supabase
      .from("registrations")
      .select("*")
      .in("event_id", eventIds)
      .order("registered_at", { ascending: false });
    registrations = regs || [];
  }

  // Function to get initials for avatar
  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";
  };

  // Function to generate a consistent color based on string
  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-100 text-blue-600", "bg-green-100 text-green-600", "bg-yellow-100 text-yellow-600", "bg-purple-100 text-purple-600", "bg-pink-100 text-pink-600", "bg-indigo-100 text-indigo-600"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Tracking</h1>
          <p className="text-gray-500 mt-1">Monitor recent registrations across all your events.</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-[#f5f5f7] shadow-sm overflow-hidden">
        {/* Table Header / Toolbar (Optional, keeping it minimal) */}
        <div className="px-8 py-5 border-b border-[#f5f5f7] flex items-center justify-between">
           <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Search activity..." className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-[#DDFE55]/50 transition-all w-64" />
           </div>
           <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
             <Filter className="w-4 h-4" />
             Filter
           </button>
        </div>

        <div className="divide-y divide-[#f5f5f7]">
          {registrations.length === 0 ? (
            <div className="p-16 text-center text-[#86868b] font-medium">
              No recent activity found.
            </div>
          ) : (
            registrations.map((reg) => (
              <div key={reg.id} className="p-4 md:px-8 flex items-center justify-between gap-6 hover:bg-[#f5f5f7]/50 transition-colors group">
                
                {/* User Info */}
                <div className="flex items-center gap-4 w-[30%]">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(reg.full_name)}`}>
                    {getInitials(reg.full_name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#1d1d1f] truncate">{reg.full_name}</h3>
                  </div>
                </div>

                {/* Email / Role substitute */}
                <div className="w-[30%] hidden md:block">
                   <p className="text-[14px] text-gray-500 truncate">{reg.email}</p>
                </div>

                {/* Event Name / Type substitute */}
                <div className="w-[20%] hidden md:block">
                   <p className="text-[14px] font-medium text-gray-700 truncate">{eventMap[reg.event_id] || "Unknown Event"}</p>
                </div>

                {/* Status */}
                <div className="w-[10%] flex justify-center">
                  {reg.status === 'approved' ? (
                    <Badge variant="secondary" className="bg-[#ccff00]/20 text-[#5a7300] border-0 rounded-full px-4 py-1 text-[13px] font-semibold whitespace-nowrap">
                      Active
                    </Badge>
                  ) : reg.status === 'pending' ? (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 rounded-full px-4 py-1 text-[13px] font-semibold whitespace-nowrap">
                      Pending
                    </Badge>
                  ) : (
                     <Badge variant="secondary" className="bg-red-50 text-red-600 border-0 rounded-full px-4 py-1 text-[13px] font-semibold whitespace-nowrap">
                      Rejected
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 w-[10%]">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all opacity-0 group-hover:opacity-100">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

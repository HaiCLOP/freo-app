"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/events", label: "Events", exact: true },
    { href: "/dashboard/activity", label: "Activity" },
    { href: "/dashboard/workload", label: "Workload" },
    { href: "/dashboard/progress", label: "Progress" },
  ];

  return (
    <div className="hidden md:flex h-20 border-b border-[#f5f5f7] px-10 items-center justify-between shrink-0">
      <div className="flex-1"></div>
      
      {/* Icons */}
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all">
          <Search className="w-[18px] h-[18px] stroke-[2.5]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-10 h-10 rounded-full flex items-center justify-center text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]">
            <Bell className="w-[18px] h-[18px] stroke-[2.5]" />
            <span className="absolute top-[8px] right-[10px] w-2 h-2 bg-[#DDFE55] rounded-full border border-white"></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-[#f5f5f7]">
            <div className="px-3 py-2 flex items-center justify-between">
              <h4 className="font-semibold text-[#1d1d1f]">Updates</h4>
              <span className="text-xs font-semibold bg-[#f5f5f7] px-2 py-0.5 rounded-full text-[#86868b]">3 New</span>
            </div>
            <DropdownMenuSeparator className="bg-[#f5f5f7]" />
            <div className="space-y-1">
              <DropdownMenuItem className="p-3 rounded-xl cursor-pointer hover:bg-[#f5f5f7] focus:bg-[#f5f5f7]">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1d1d1f]">Flutter Mobile App Setup</p>
                  <p className="text-xs text-[#86868b] leading-relaxed">The API endpoints are ready for the mobile app connection.</p>
                  <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mt-2">Just now</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 rounded-xl cursor-pointer hover:bg-[#f5f5f7] focus:bg-[#f5f5f7]">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1d1d1f]">System Maintenance</p>
                  <p className="text-xs text-[#86868b] leading-relaxed">Scheduled optimization will occur on Sunday at 2 AM.</p>
                  <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mt-2">2 hours ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 rounded-xl cursor-pointer hover:bg-[#f5f5f7] focus:bg-[#f5f5f7]">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1d1d1f]">New Event Registered</p>
                  <p className="text-xs text-[#86868b] leading-relaxed">A new user has requested approval for your upcoming seminar.</p>
                  <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mt-2">5 hours ago</p>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

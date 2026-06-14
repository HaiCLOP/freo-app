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
    { href: "/dashboard/analytics", label: "Analytics" },
  ];

  return (
    <div className="hidden md:flex h-20 border-b border-[#f5f5f7] px-10 items-center justify-between shrink-0">
      <div className="flex-1"></div>
    </div>
  );
}

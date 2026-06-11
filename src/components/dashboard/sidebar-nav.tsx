"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, HelpCircle, BarChart3 } from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/workload", label: "Workload", icon: Users },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <>
      <div className="text-[11px] font-semibold text-[#8E8F94] uppercase tracking-wider mb-3 px-4 shrink-0">Menu</div>
      
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact 
          ? pathname === link.href 
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] font-medium transition-all shrink-0 ${
              isActive 
                ? "bg-[#2A2B31] text-white" 
                : "text-[#8E8F94] hover:bg-[#2A2B31]/50 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            {link.label}
          </Link>
        );
      })}

      <div className="mt-6 mb-1 border-t border-[#2A2B31] mx-4 shrink-0"></div>

      <Link
        href="/dashboard/settings"
        className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] font-medium transition-all shrink-0 ${
          pathname?.startsWith("/dashboard/settings")
            ? "bg-[#2A2B31] text-white"
            : "text-[#8E8F94] hover:bg-[#2A2B31]/50 hover:text-white"
        }`}
      >
        <Settings className="w-5 h-5" />
        Settings
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[#8E8F94] hover:bg-[#2A2B31]/50 hover:text-white font-medium transition-all shrink-0"
      >
        <HelpCircle className="w-5 h-5" />
        Support
      </Link>
    </>
  );
}

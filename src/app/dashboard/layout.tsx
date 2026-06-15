import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, CalendarDays, Settings, Users, Sparkles, FolderKanban, BarChart3, HelpCircle, Search, Bell } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { TopNav } from "@/components/dashboard/top-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single();

  const handleSignOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-[#DDFE55] p-2 md:p-4 flex flex-col md:flex-row gap-4 font-sans selection:bg-[#DDFE55] selection:text-[#1B1C20]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-[260px] bg-[#1B1C20] text-white rounded-[24px] hidden md:flex flex-col shadow-xl z-20 shrink-0 h-full">
        <div className="h-24 flex flex-col justify-center px-8 shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/freologo.png" alt="Freo Logo" width={36} height={36} className="rounded-xl object-contain bg-white/10 p-0.5" />
            <span className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-fredoka)]">Freo</span>
          </div>
          <span className="text-[11px] text-[#8E8F94] font-medium tracking-wide mt-1">by HaiCLOP Labs</span>
        </div>
        
        <div className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="p-6 mt-auto shrink-0 flex flex-col gap-6">
          <div className="flex items-center justify-between group cursor-pointer hover:bg-[#2A2B31] p-2 -mx-2 rounded-[16px] transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#DDFE55] flex items-center justify-center text-[#1B1C20] font-bold uppercase shrink-0">
                {(creator?.name || user.email)[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white truncate">
                  {creator?.name || "John Doe"}
                </p>
                <p className="text-[12px] text-[#8E8F94] truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              <LogoutButton signOutAction={handleSignOut} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#5c5d62] font-medium">
            <Link href="/privacy" className="hover:text-[#DDFE55] transition-colors">Privacy Policy</Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-[#DDFE55] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white rounded-[24px] shadow-xl flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-20 bg-[#1B1C20] text-white px-6 flex items-center justify-between rounded-t-[24px]">
          <div className="flex flex-col justify-center mt-1">
            <div className="flex items-center gap-2">
              <Image src="/freologo.png" alt="Freo Logo" width={24} height={24} className="rounded-lg object-contain bg-white/10 p-0" />
              <span className="text-2xl font-bold tracking-tight text-white font-[family-name:var(--font-fredoka)]">Freo</span>
            </div>
            <span className="text-[10px] text-[#8E8F94] font-medium tracking-wide">by HaiCLOP Labs</span>
          </div>
          <LogoutButton signOutAction={handleSignOut} isMobile={true} />
        </header>



        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutDashboard, Plus, ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MUN Dashboard — Freo MUN",
  description: "Manage your Model UN conferences",
};

export default async function MunDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("name")
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
    <div className="h-screen overflow-hidden bg-[#DDFE55] p-2 md:p-4 flex flex-col md:flex-row gap-4 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-[260px] bg-[#1B1C20] text-white rounded-[24px] hidden md:flex flex-col shadow-xl z-20 shrink-0 h-full">
        <div className="h-24 flex flex-col justify-center px-8 shrink-0">
          <Link href="/mun" className="flex items-center gap-3 group">
            <Image
              src="/freologo.png"
              alt="Freo Logo"
              width={36}
              height={36}
              className="rounded-xl object-contain bg-white/10 p-0.5"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-fredoka)]">
                Freo
              </span>
              <span className="text-sm font-bold text-[#DDFE55] uppercase tracking-wider">
                MUN
              </span>
            </div>
          </Link>
          <span className="text-[11px] text-[#8E8F94] font-medium tracking-wide mt-1">
            Conference Management
          </span>
        </div>

        <div className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
          <Link
            href="/mun/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-[#C1C2C7] hover:bg-[#2A2B31] hover:text-white transition-all"
          >
            <LayoutDashboard size={18} />
            My Conferences
          </Link>
          <Link
            href="/mun/dashboard/conference/new"
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-[#DDFE55] hover:bg-[#DDFE55]/10 transition-all"
          >
            <Plus size={18} />
            Create Conference
          </Link>
          <div className="border-t border-white/10 my-4" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-[#8E8F94] hover:bg-[#2A2B31] hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
            Back to Freo
          </Link>
        </div>

        {/* User footer */}
        <div className="p-6 mt-auto shrink-0">
          <div className="flex items-center justify-between group cursor-pointer hover:bg-[#2A2B31] p-2 -mx-2 rounded-[16px] transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#DDFE55] flex items-center justify-center text-[#1B1C20] font-bold uppercase shrink-0">
                {(creator?.name || user.email)?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white truncate">
                  {creator?.name || "Organizer"}
                </p>
                <p className="text-[12px] text-[#8E8F94] truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} className="text-[#8E8F94]" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white rounded-[24px] shadow-xl flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-[#1B1C20] text-white px-4 flex items-center justify-between rounded-t-[24px]">
          <Link href="/mun" className="flex items-center gap-2">
            <Image src="/freologo.png" alt="Freo" width={24} height={24} className="rounded-lg" />
            <span className="text-xl font-bold font-[family-name:var(--font-fredoka)]">Freo</span>
            <span className="text-xs font-bold text-[#DDFE55] uppercase">MUN</span>
          </Link>
          <form action={handleSignOut}>
            <button type="submit" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <LogOut size={18} />
            </button>
          </form>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

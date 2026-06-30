import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Home, FileText, Info, QrCode } from "lucide-react";

export default async function DelegateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch delegate's active registration
  const { data: registration } = await supabase
    .from("mun_registrations")
    .select("*, conference:mun_conferences(name, org_name)")
    .eq("user_id", user.id)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!registration) {
    return (
      <div className="min-h-screen bg-[#f5f1e4] flex items-center justify-center p-6">
        <div className="neo-card bg-white p-12 text-center max-w-md">
          <h2 className="text-xl font-bold text-[#1B1C20] mb-2">No Active Registration</h2>
          <p className="text-[#6B7280] mb-6">
            We couldn't find an approved registration linked to your account. 
            If you registered recently, it might still be pending review.
          </p>
          <Link href="/mun" className="neo-btn bg-[#DDFE55] text-[#1B1C20] px-6 py-3 font-bold text-sm inline-block">
            Back to MUN Home
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/mun/delegate", label: "Dashboard", icon: Home },
    { href: "/mun/delegate/papers", label: "Position Papers", icon: FileText },
    { href: "/mun/delegate/info", label: "Committee Info", icon: Info },
    { href: "/mun/delegate/ticket", label: "My Ticket", icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-[#f5f1e4] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#1B1C20] flex flex-col md:min-h-screen">
        <div className="p-6 border-b border-[#1B1C20]">
          <Link href="/mun/delegate" className="font-bold text-xl text-[#1B1C20]">
            Delegate Portal
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <span className="neo-badge px-2 py-0.5 text-[10px] font-bold bg-[#DDFE55] text-[#1B1C20] uppercase truncate max-w-full">
              {(registration.conference as any).name}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-x-auto md:overflow-x-hidden flex md:flex-col gap-2 md:gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 neo-badge bg-transparent hover:bg-[#f3f4f6] text-[#6B7280] hover:text-[#1B1C20] transition-colors shrink-0 md:shrink"
              >
                <Icon size={18} />
                <span className="text-sm font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1B1C20] mt-auto">
          <div className="mb-4 px-2">
            <p className="text-sm font-bold text-[#1B1C20] truncate">{registration.delegate_name}</p>
            <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 neo-badge px-4 py-2 text-sm font-bold bg-white text-[#EF4444] hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

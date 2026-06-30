import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Conference Settings - Freo MUN" };

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("creator_id", user.id)
    .single();

  if (!conf) {
    redirect("/mun/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#1B1C20] mb-2 uppercase tracking-tight">Conference Settings</h1>
        <p className="text-gray-500 font-medium">Update the core details, dates, and payment links for your MUN.</p>
      </div>
      
      <SettingsForm conference={conf} />
    </div>
  );
}

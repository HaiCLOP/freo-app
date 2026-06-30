import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EBManagement } from "@/components/mun/EBManagement";
import { getConference } from "@/lib/mun/actions/conference";

export default async function EBPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conf = await getConference(id);

  // Get EB members
  const { data: members } = await supabase
    .from("mun_eb_members")
    .select("*")
    .eq("conference_id", id)
    .order("created_at");

  // Get checklists
  const { data: checklists } = await supabase
    .from("mun_eb_checklists")
    .select("*")
    .eq("conference_id", id);

  return (
    <EBManagement
      conferenceId={id}
      members={members ?? []}
      checklists={checklists ?? []}
      committees={conf.committees.map((c) => ({
        id: c.id,
        name: c.name,
        short_name: c.short_name,
      }))}
    />
  );
}

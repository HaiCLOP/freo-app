import { getRegistrations } from "@/lib/mun/actions/registration";
import { DelegateBoard } from "@/components/mun/DelegateBoard";
import { createClient } from "@/lib/supabase/server";

export default async function DelegatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registrations = await getRegistrations(id);
  const supabase = await createClient();

  const { data: committees } = await supabase
    .from("mun_committees")
    .select("id, name, short_name")
    .eq("conference_id", id);

  const { data: portfolios } = await supabase
    .from("mun_portfolios")
    .select("id, committee_id, name")
    .in("committee_id", committees?.map(c => c.id) || []);

  return (
    <DelegateBoard 
      conferenceId={id} 
      initialRegistrations={registrations} 
      committees={committees || []} 
      portfolios={portfolios || []} 
    />
  );
}

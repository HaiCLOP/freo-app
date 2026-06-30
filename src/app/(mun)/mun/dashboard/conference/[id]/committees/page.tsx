import { getConference } from "@/lib/mun/actions/conference";
import { notFound } from "next/navigation";
import { CommitteeManager } from "@/components/mun/committee-manager";

export default async function CommitteesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conf = await getConference(id);
  
  if (!conf) notFound();

  return (
    <CommitteeManager conferenceId={conf.id} committees={conf.committees} />
  );
}

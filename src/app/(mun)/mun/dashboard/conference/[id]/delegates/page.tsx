import { getRegistrations } from "@/lib/mun/actions/registration";
import { DelegateBoard } from "@/components/mun/DelegateBoard";

export default async function DelegatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registrations = await getRegistrations(id);

  return <DelegateBoard conferenceId={id} initialRegistrations={registrations} />;
}

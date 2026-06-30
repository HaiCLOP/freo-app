import { getLiveSession, createSession } from "@/lib/mun/actions/session";
import { getCommitteePortfolios } from "@/lib/mun/actions/conference";
import { LiveSessionClient } from "./client-page";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ committeeId: string }>;
}) {
  const { committeeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get active session
  let session = await getLiveSession(committeeId);
  
  if (!session) {
    // If Chair, create one
    // TODO: Verify if user is Chair. For now, we assume if they are here they have access.
    session = await createSession(committeeId);
  }

  // Get all portfolios in committee to show in the dropdown for Placards
  const portfolios = await getCommitteePortfolios(committeeId);

  return (
    <LiveSessionClient 
      session={session} 
      portfolios={portfolios} 
      committeeId={committeeId} 
    />
  );
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLiveSession(committeeId: string) {
  const supabase = await createClient();
  
  // Get active session
  const { data: session } = await supabase
    .from("mun_sessions")
    .select("*")
    .eq("committee_id", committeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!session) return null;

  // Get active speakers for this session
  const { data: speakers } = await supabase
    .from("mun_speakers")
    .select("*, mun_portfolios(name, short_name, image_url)")
    .eq("session_id", session.id)
    .order("added_at", { ascending: true });

  return {
    ...session,
    speakers: speakers || []
  };
}

export async function createSession(committeeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("mun_sessions")
    .insert({
      committee_id: committeeId,
      mode: "ROLL_CALL",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
  return data;
}

export async function updateSessionMode(sessionId: string, mode: string, committeeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mun_sessions")
    .update({ mode: mode, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function addSpeaker(sessionId: string, portfolioId: string, committeeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mun_speakers")
    .insert({
      session_id: sessionId,
      portfolio_id: portfolioId,
      status: 'WAITING'
    });

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function updateSpeakerStatus(speakerId: string, status: string, committeeId: string) {
  const supabase = await createClient();
  const updates: any = { status };
  
  if (status === 'SPEAKING') updates.started_at = new Date().toISOString();
  if (status === 'DONE') updates.ended_at = new Date().toISOString();

  const { error } = await supabase
    .from("mun_speakers")
    .update(updates)
    .eq("id", speakerId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function removeSpeaker(speakerId: string, committeeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mun_speakers")
    .delete()
    .eq("id", speakerId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function startTimer(sessionId: string, durationSeconds: number, committeeId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("mun_sessions")
    .update({ 
      speaker_time_seconds: durationSeconds,
      timer_started_at: new Date().toISOString(),
      timer_paused_remaining: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function pauseTimer(sessionId: string, committeeId: string, remainingSeconds: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mun_sessions")
    .update({ 
      timer_paused_remaining: remainingSeconds,
      timer_started_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

export async function resetTimer(sessionId: string, committeeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("mun_sessions")
    .update({ 
      timer_started_at: null,
      timer_paused_remaining: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/session/${committeeId}`);
}

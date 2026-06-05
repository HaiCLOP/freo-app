"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveFormConfig(eventId: string, config: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("events")
    .update({ form_config: config })
    .eq("id", eventId)
    .eq("creator_id", user.id); // Security check

  if (error) {
    console.error("Failed to save form config:", error);
    return { error: "Failed to save configuration." };
  }

  revalidatePath(`/dashboard/events/${eventId}/form-builder`);
  redirect(`/dashboard/events`); // Return to dashboard or events list after saving
}

export async function getFormConfig(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("events")
    .select("form_config")
    .eq("id", eventId)
    .eq("creator_id", user.id)
    .single();

  if (error) {
    console.error("Failed to get form config:", error);
    return null;
  }

  return data?.form_config || null;
}

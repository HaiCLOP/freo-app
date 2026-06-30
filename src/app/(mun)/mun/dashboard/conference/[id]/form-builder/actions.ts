"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveMunFormConfig(conferenceId: string, config: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Prevent JSONB storage bloat / DoS
  if (!Array.isArray(config) || config.length > 50) {
    return { error: "Form configuration exceeds maximum allowed fields (50)." };
  }
  if (JSON.stringify(config).length > 50000) {
    return { error: "Form configuration payload is too large." };
  }

  const { error } = await supabase
    .from("mun_conferences")
    .update({ custom_form_schema: config })
    .eq("id", conferenceId)
    .eq("creator_id", user.id); // Security check

  if (error) {
    console.error("Failed to save MUN form config:", error);
    return { error: "Failed to save configuration." };
  }

  // Check if there is a connected Google Sheet to sync headers
  const { data: eventData } = await supabase
    .from("mun_conferences")
    .select("google_sheet_id")
    .eq("id", conferenceId)
    .single();

  if (eventData?.google_sheet_id) {
    const { syncSheetHeaders } = await import("@/lib/google-sheets");
    await syncSheetHeaders(user.id, eventData.google_sheet_id, config);
  }

  revalidatePath(`/mun/dashboard/conference/${conferenceId}/form-builder`);
  return { success: true };
}

export async function getMunFormConfig(conferenceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mun_conferences")
    .select("custom_form_schema")
    .eq("id", conferenceId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to get MUN form config:", error);
    return null;
  }

  return { 
    custom_form_schema: data?.custom_form_schema || null
  };
}

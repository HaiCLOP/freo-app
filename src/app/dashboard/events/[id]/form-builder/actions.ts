"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveFormConfig(eventId: string, config: any[], settings?: any) {
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

  const updateData: any = { form_config: config };
  if (settings) {
    updateData.form_settings = settings;
  }

  const { error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .eq("creator_id", user.id); // Security check

  if (error) {
    console.error("Failed to save form config:", error);
    return { error: "Failed to save configuration." };
  }

  revalidatePath(`/dashboard/events/${eventId}/form-builder`);
  return { success: true };
}

export async function getFormConfig(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("events")
    .select("form_config, form_settings")
    .eq("id", eventId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to get form config:", error);
    return null;
  }

  return { 
    form_config: data?.form_config || null,
    form_settings: data?.form_settings || {} 
  };
}

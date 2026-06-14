"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateCreatorName(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name || name.trim().length < 2) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("creators")
    .update({ name: name.trim() })
    .eq("id", user.id);

  revalidatePath("/dashboard/settings");
}

export async function connectGoogleAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Instead of using Supabase Auth (which treats Google as a login provider),
  // we redirect to our custom OAuth flow to grab the tokens as API keys.
  redirect("/api/google/auth");
}

export async function disconnectGoogleAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("creators")
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_updated_at: null,
      google_drive_folder_id: null,
    })
    .eq("id", user.id);

  redirect("/dashboard/settings?success=google_disconnected");
}

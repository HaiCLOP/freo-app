"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

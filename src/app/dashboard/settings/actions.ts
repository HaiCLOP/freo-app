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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?next=/dashboard/settings`,
      scopes: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/dashboard/settings?error=google_connect_failed");
  }

  redirect(data.url);
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

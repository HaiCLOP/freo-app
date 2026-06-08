import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback handler.
 * Supabase redirects here after Google OAuth login.
 * We exchange the code for a session and store the Google tokens.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Store the Google OAuth tokens in the creators table
      // so we can use them later for Drive & Sheets operations
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      if (providerToken) {
        await supabase
          .from("creators")
          .update({
            google_access_token: providerToken,
            google_refresh_token: providerRefreshToken || null,
            google_token_updated_at: new Date().toISOString(),
          })
          .eq("id", data.session.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Authentication error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Authentication failed. The link may have expired or is invalid.`);
}

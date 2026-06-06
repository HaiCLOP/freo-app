import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/settings", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing Google Client credentials" }, { status: 500 });
  }

  const redirectUri = process.env.NODE_ENV === "production" 
    ? "https://freo.haicloplabs.in/api/google/callback"
    : "http://localhost:3000/api/google/callback";

  try {
    // Exchange code for tokens
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const { access_token, refresh_token } = data;

    // Save tokens to creators table
    const updatePayload: any = { google_access_token: access_token };
    
    // Only update refresh token if we got a new one
    if (refresh_token) {
      updatePayload.google_refresh_token = refresh_token;
    }

    const { error: dbError } = await supabase
      .from("creators")
      .update(updatePayload)
      .eq("id", user.id);

    if (dbError) throw dbError;

    return NextResponse.redirect(new URL("/dashboard/settings?success=google_connected", req.url));
  } catch (err) {
    console.error("Google Auth Callback Error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=google_auth_failed", req.url));
  }
}

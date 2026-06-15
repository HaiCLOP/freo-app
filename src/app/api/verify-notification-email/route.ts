import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  const rateLimitKey = ip !== "unknown" ? `verify_endpoint_${ip}` : `verify_global_fallback`;
  const { allowed } = await rateLimit(rateLimitKey, 10, 60_000); // 10 attempts per minute
  if (!allowed) {
    return NextResponse.redirect(new URL("/dashboard/progress?error=rate_limited", request.url));
  }

  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/progress?error=invalid_token", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to bypass RLS if user isn't logged in, or just to do lookups
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // 1. Find creator with this token
  const { data: creator, error } = await supabase
    .from("creators")
    .select("id, notification_email_token_expires_at")
    .eq("notification_email_token", token)
    .single();

  if (error || !creator) {
    return NextResponse.redirect(new URL("/dashboard/progress?error=invalid_token", request.url));
  }

  // 2. Check token expiry
  const expiresAt = new Date(creator.notification_email_token_expires_at);
  if (expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/dashboard/progress?error=expired", request.url));
  }

  // 3. Update the creator
  const { error: updateError } = await supabase
    .from("creators")
    .update({
      notification_email_verified: true,
      notification_email_token: null,
      notification_email_token_expires_at: null,
    })
    .eq("id", creator.id);

  if (updateError) {
    return NextResponse.redirect(new URL("/dashboard/progress?error=verification_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/progress?verified=true", request.url));
}

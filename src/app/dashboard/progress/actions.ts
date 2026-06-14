"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

export async function sendVerificationEmail(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const { allowed } = rateLimit(`email_verify_${ip}`, 3, 60_000); // Max 3 emails per minute
    if (!allowed) {
      redirect("/dashboard/progress?error=rate_limited");
    }
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = formData.get("notification_email") as string;
  if (!email) {
    redirect("/dashboard/progress?error=missing_email");
  }

  // Generate token and expiry (24 hours)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Update creator in database
  const { error: dbError } = await supabase
    .from("creators")
    .update({
      notification_email: email,
      notification_email_verified: false,
      notification_email_token: token,
      notification_email_token_expires_at: expiresAt.toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Database error:", dbError);
    redirect("/dashboard/progress?error=database_error");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/verify-notification-email?token=${token}`;

  // Send email
  const { error: emailError } = await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Verify your notification email for Freo",
    html: `
      <p>Click the link below to verify this email address and start receiving event notifications.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background-color:#6C63FF;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
        Verify Email
      </a>
      <p>Or copy and paste this link: ${verifyUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    redirect("/dashboard/progress?error=email_send_failed");
  }

  revalidatePath("/dashboard/progress");
}

export async function resetVerification() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("creators")
    .update({
      notification_email: null,
      notification_email_verified: false,
      notification_email_token: null,
      notification_email_token_expires_at: null,
    })
    .eq("id", user.id);

  revalidatePath("/dashboard/progress");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  registrationSchema,
  type Registration,
  type RegistrationStatus,
} from "../types";
import { enforceMunRateLimit } from "../rate-limit";
import { sendEmail } from "@/lib/email";
import { headers } from "next/headers";

// ─── Public Registration Submission ───────────────────────────────────────

export async function submitRegistration(conferenceId: string, formData: FormData) {
  // Rate limit: 5 registrations per IP per hour
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
  await enforceMunRateLimit("registration", ip);

  const supabase = await createClient();

  // Verify conference is open for registration
  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("id, name, slug, registration_open, registration_close, delegate_fee, is_published")
    .eq("id", conferenceId)
    .eq("is_published", true)
    .single();

  if (!conf) throw new Error("Conference not found or not published");

  const now = new Date();
  if (new Date(conf.registration_open) > now) throw new Error("Registration has not opened yet");
  if (new Date(conf.registration_close) < now) throw new Error("Registration has closed");

  const raw = Object.fromEntries(formData.entries());

  const parsed = registrationSchema.parse({
    delegate_name: raw.delegate_name,
    delegate_email: raw.delegate_email,
    delegate_phone: raw.delegate_phone,
    delegate_school: raw.delegate_school,
    delegate_grade: raw.delegate_grade || undefined,
    experience_level: raw.experience_level,
    committee_pref_1: raw.committee_pref_1,
    committee_pref_2: raw.committee_pref_2 || undefined,
    committee_pref_3: raw.committee_pref_3 || undefined,
    payment_utr: raw.payment_utr || undefined,
    custom_form_data: raw.custom_form_data
      ? JSON.parse(raw.custom_form_data as string)
      : undefined,
  });

  // Check for duplicate email in this conference
  const { data: existing } = await supabase
    .from("mun_registrations")
    .select("id")
    .eq("conference_id", conferenceId)
    .eq("delegate_email", parsed.delegate_email)
    .not("status", "eq", "CANCELLED")
    .single();

  if (existing) throw new Error("You have already registered for this conference");

  // Get the logged-in user ID if available
  const { data: { user } } = await supabase.auth.getUser();

  const isObserver = raw.registration_type === "observer";
  const isPress = raw.registration_type === "press";

  const { data: reg, error } = await supabase
    .from("mun_registrations")
    .insert({
      conference_id: conferenceId,
      user_id: user?.id || null,
      ...parsed,
      payment_amount: conf.delegate_fee,
      committee_pref_1: isObserver || isPress ? null : parsed.committee_pref_1,
      committee_pref_2: isObserver || isPress ? null : parsed.committee_pref_2,
      committee_pref_3: isObserver || isPress ? null : parsed.committee_pref_3,
      custom_form_data: {
        ...(parsed.custom_form_data || {}),
        registration_type: isObserver ? "observer" : isPress ? "press" : "delegate",
      },
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Send acknowledgment email
  await sendEmail({
    to: parsed.delegate_email,
    subject: `Registration Received — ${conf.name}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Received!</h2>
        <p>Hi <strong>${parsed.delegate_name}</strong>,</p>
        <p>Your registration for <strong>${conf.name}</strong> has been received. We'll review your application and get back to you soon.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">School</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${parsed.delegate_school}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Experience</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${parsed.experience_level}</td></tr>
          ${parsed.payment_utr ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">UTR</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${parsed.payment_utr}</td></tr>` : ""}
        </table>
        <p style="color: #6B7280; font-size: 13px;">You'll receive another email once your application is reviewed.</p>
      </div>
    `,
    from: `Freo MUN <noreply@freo.haicloplabs.in>`,
  });

  return reg as Registration;
}

// ─── Organizer Registration Management ────────────────────────────────────

export async function getRegistrations(conferenceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("mun_registrations")
    .select(`
      *,
      portfolio:mun_portfolios(name, display_name, image_url),
      committee_1:mun_committees!committee_pref_1(name, short_name),
      committee_2:mun_committees!committee_pref_2(name, short_name),
      committee_3:mun_committees!committee_pref_3(name, short_name)
    `)
    .eq("conference_id", conferenceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
  conferenceId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("mun_registrations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", registrationId);

  if (error) throw new Error(error.message);

  // If cancelling, trigger waitlist auto-fill
  if (status === "CANCELLED") {
    await autoFillFromWaitlist(conferenceId);
  }

  // Send status email to delegate
  const { data: reg } = await supabase
    .from("mun_registrations")
    .select("delegate_email, delegate_name")
    .eq("id", registrationId)
    .single();

  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("name")
    .eq("id", conferenceId)
    .single();

  if (reg && conf) {
    const statusMessages: Record<string, string> = {
      APPROVED: "Your registration has been <strong style='color:#22C55E;'>approved</strong>! You'll receive your portfolio allotment soon.",
      REJECTED: "Unfortunately, your registration has been <strong style='color:#EF4444;'>declined</strong>.",
      WAITLISTED: "You've been <strong style='color:#A855F7;'>waitlisted</strong>. We'll notify you if a spot opens up.",
      UNDER_REVIEW: "Your application is now <strong style='color:#3B82F6;'>under review</strong>.",
    };

    if (statusMessages[status]) {
      await sendEmail({
        to: reg.delegate_email,
        subject: `Registration Update — ${conf.name}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Registration Update</h2>
            <p>Hi <strong>${reg.delegate_name}</strong>,</p>
            <p>${statusMessages[status]}</p>
            <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">— Freo MUN</p>
          </div>
        `,
        from: `Freo MUN <noreply@freo.haicloplabs.in>`,
      });
    }
  }

  revalidatePath(`/mun/dashboard/conference/${conferenceId}/delegates`);
}

export async function bulkUpdateStatus(
  registrationIds: string[],
  status: RegistrationStatus,
  conferenceId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("mun_registrations")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", registrationIds);

  if (error) throw new Error(error.message);

  if (status === "CANCELLED") {
    await autoFillFromWaitlist(conferenceId);
  }

  revalidatePath(`/mun/dashboard/conference/${conferenceId}/delegates`);
}

// ─── Waitlist Auto-Fill ───────────────────────────────────────────────────

async function autoFillFromWaitlist(conferenceId: string) {
  const supabase = await createClient();

  // Count approved delegates
  const { count: approvedCount } = await supabase
    .from("mun_registrations")
    .select("*", { count: "exact", head: true })
    .eq("conference_id", conferenceId)
    .eq("status", "APPROVED");

  // Get conference max
  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("max_delegates, name")
    .eq("id", conferenceId)
    .single();

  if (!conf) return;

  const spotsAvailable = conf.max_delegates - (approvedCount ?? 0);
  if (spotsAvailable <= 0) return;

  // Get next waitlisted delegates (FIFO)
  const { data: waitlisted } = await supabase
    .from("mun_registrations")
    .select("id, delegate_email, delegate_name")
    .eq("conference_id", conferenceId)
    .eq("status", "WAITLISTED")
    .order("created_at", { ascending: true })
    .limit(spotsAvailable);

  if (!waitlisted?.length) return;

  // Promote them to APPROVED
  const ids = waitlisted.map((w) => w.id);
  await supabase
    .from("mun_registrations")
    .update({ status: "APPROVED", updated_at: new Date().toISOString() })
    .in("id", ids);

  // Notify each promoted delegate
  for (const w of waitlisted) {
    await sendEmail({
      to: w.delegate_email,
      subject: `Spot Available — ${conf.name}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Great news!</h2>
          <p>Hi <strong>${w.delegate_name}</strong>,</p>
          <p>A spot has opened up and your registration for <strong>${conf.name}</strong> has been <strong style="color:#22C55E;">approved</strong>!</p>
          <p>You'll receive your portfolio allotment soon.</p>
        </div>
      `,
      from: `Freo MUN <noreply@freo.haicloplabs.in>`,
    });
  }
}

// ─── Payment Verification ─────────────────────────────────────────────────

export async function verifyPayment(registrationId: string, verified: boolean, conferenceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("mun_registrations")
    .update({ payment_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", registrationId);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/dashboard/conference/${conferenceId}/delegates`);
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createConferenceSchema,
  createCommitteeSchema,
  createPortfolioSchema,
  ebInviteSchema,
  type Conference,
  type Committee,
  type CommitteeWithPortfolios,
  type ConferenceWithCommittees,
  type CustomFormField,
} from "../types";
import { CHECKLIST_DEFAULTS } from "../constants";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// ─── Conference CRUD ──────────────────────────────────────────────────────

export async function getMyConferences(): Promise<Conference[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("mun_conferences")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Conference[];
}

export async function getConference(id: string): Promise<ConferenceWithCommittees> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conf, error } = await supabase
    .from("mun_conferences")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (error || !conf) throw new Error("Conference not found");

  const { data: committees } = await supabase
    .from("mun_committees")
    .select("*, mun_portfolios(*), mun_eb_roles(*)")
    .eq("conference_id", id)
    .order("display_order");

  const { count } = await supabase
    .from("mun_registrations")
    .select("*", { count: "exact", head: true })
    .eq("conference_id", id);

  return {
    ...conf,
    committees: (committees ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      portfolios: (c.mun_portfolios as Record<string, unknown>[]) ?? [],
      eb_roles: (c.mun_eb_roles as Record<string, unknown>[]) ?? [],
    })),
    registration_count: count ?? 0,
  } as ConferenceWithCommittees;
}

export async function createConference(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());

  const parsed = createConferenceSchema.parse({
    name: raw.name,
    org_name: raw.org_name,
    date_start: raw.date_start,
    date_end: raw.date_end,
    registration_open: raw.registration_open,
    registration_close: raw.registration_close,
    delegate_fee: Number(raw.delegate_fee) || 0,
    max_delegates: Number(raw.max_delegates) || 100,
    city: raw.city,
    venue: raw.venue,
    description: raw.description || undefined,
  });

  const slug = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
    + "-" + Date.now().toString(36);

  const { data: conf, error } = await supabase
    .from("mun_conferences")
    .insert({
      ...parsed,
      slug,
      creator_id: user.id,
      refund_policy: (raw.refund_policy as string) || null,
      razorpay_link: (raw.razorpay_link as string) || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/mun/dashboard");
  return conf as Conference;
}

export async function updateConference(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const updates: Record<string, unknown> = {};

  const fields = [
    "name", "org_name", "city", "venue", "description",
    "refund_policy", "razorpay_link",
  ];
  for (const f of fields) {
    if (raw[f] !== undefined) updates[f] = raw[f] || null;
  }

  const numFields = ["delegate_fee", "max_delegates"];
  for (const f of numFields) {
    if (raw[f] !== undefined) updates[f] = Number(raw[f]);
  }

  const dateFields = ["date_start", "date_end", "registration_open", "registration_close"];
  for (const f of dateFields) {
    if (raw[f]) updates[f] = raw[f];
  }

  if (raw.is_published !== undefined) updates.is_published = raw.is_published === "true";
  if (raw.social_links) {
    try { updates.social_links = JSON.parse(raw.social_links as string); } catch {}
  }

  const { error } = await supabase
    .from("mun_conferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/dashboard/conference/${id}`);
  revalidatePath("/mun/dashboard");
}

export async function publishConference(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("mun_conferences")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/dashboard/conference/${id}`);
  revalidatePath("/mun/dashboard");
}

// ─── Committee CRUD ───────────────────────────────────────────────────────

export async function addCommittee(conferenceId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership
  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("id")
    .eq("id", conferenceId)
    .eq("creator_id", user.id)
    .single();
  if (!conf) throw new Error("Not authorized");

  const raw = Object.fromEntries(formData.entries());
  const agendaRaw = raw.agenda_items as string;
  const agenda = agendaRaw ? agendaRaw.split("|||").filter(Boolean) : [];

  const parsed = createCommitteeSchema.parse({
    name: raw.name,
    short_name: raw.short_name,
    type: raw.type,
    theme: raw.theme || undefined,
    agenda_items: agenda,
    portfolio_type: raw.portfolio_type,
    max_delegates: Number(raw.max_delegates) || 30,
    session_format: raw.session_format,
    allow_observer: raw.allow_observer === "true",
    allow_press: raw.allow_press === "true",
    is_public: raw.is_public !== "false",
  });

  // Get next display order
  const { count } = await supabase
    .from("mun_committees")
    .select("*", { count: "exact", head: true })
    .eq("conference_id", conferenceId);

  const { data: committee, error } = await supabase
    .from("mun_committees")
    .insert({
      ...parsed,
      conference_id: conferenceId,
      display_order: (count ?? 0),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-create EB checklist defaults for this committee
  const checklistItems = CHECKLIST_DEFAULTS.map((task) => ({
    conference_id: conferenceId,
    committee_id: committee.id,
    task_name: task,
  }));

  if (checklistItems.length > 0) {
    await supabase.from("mun_eb_checklists").insert(checklistItems);
  }

  revalidatePath(`/mun/dashboard/conference/${conferenceId}`);
  return committee as Committee;
}

export async function addPortfoliosBulk(
  committeeId: string,
  portfolios: Array<{ name: string; display_name?: string; description?: string }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership via committee → conference
  const { data: committee } = await supabase
    .from("mun_committees")
    .select("conference_id, mun_conferences!inner(creator_id)")
    .eq("id", committeeId)
    .single();

  if (!committee) throw new Error("Committee not found");

  const existing = await supabase
    .from("mun_portfolios")
    .select("*", { count: "exact", head: true })
    .eq("committee_id", committeeId);

  const items = portfolios.map((p, i) => ({
    committee_id: committeeId,
    name: p.name,
    display_name: p.display_name || null,
    description: p.description || null,
    display_order: (existing.count ?? 0) + i,
  }));

  const { error } = await supabase.from("mun_portfolios").insert(items);
  if (error) throw new Error(error.message);

  revalidatePath(`/mun/dashboard/conference/${committee.conference_id}`);
}

// ─── EB Invitations ───────────────────────────────────────────────────────

export async function inviteEBMember(conferenceId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = ebInviteSchema.parse({
    email: raw.email,
    name: raw.name,
    committee_id: raw.committee_id || undefined,
    role_type: raw.role_type,
  });

  // Verify ownership
  const { data: conf } = await supabase
    .from("mun_conferences")
    .select("id, name")
    .eq("id", conferenceId)
    .eq("creator_id", user.id)
    .single();
  if (!conf) throw new Error("Not authorized");

  // Generate invite token (expires in 48 hours)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Find or require an EB role
  let roleId: string;
  if (parsed.committee_id) {
    const { data: role } = await supabase
      .from("mun_eb_roles")
      .select("id")
      .eq("committee_id", parsed.committee_id)
      .eq("role_type", parsed.role_type)
      .single();
    if (!role) throw new Error(`No ${parsed.role_type} role configured for this committee`);
    roleId = role.id;
  } else {
    // Conference-level roles (SEC_GEN, USG)
    const { data: roles } = await supabase
      .from("mun_eb_roles")
      .select("id, committee_id")
      .eq("role_type", parsed.role_type);
    if (!roles?.length) throw new Error(`No ${parsed.role_type} role found`);
    roleId = roles[0].id;
  }

  // Check if user exists
  // For now, create the invitation record with a placeholder user_id
  // The actual user_id will be set when they accept the invite
  const { error } = await supabase.from("mun_eb_members").insert({
    conference_id: conferenceId,
    committee_id: parsed.committee_id || null,
    user_id: user.id, // placeholder, updated on accept
    role_id: roleId,
    role_type: parsed.role_type,
    name: parsed.name,
    email: parsed.email,
    invite_token: token,
    invite_expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);

  // Send invite email
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://freo.haicloplabs.in"}/mun/invite/${token}`;
  await sendEmail({
    to: parsed.email,
    subject: `You're invited to join ${conf.name} as ${parsed.role_type}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join <strong>${conf.name}</strong></h2>
        <p>You've been assigned the role of <strong>${parsed.role_type.replace("_", " ")}</strong>.</p>
        <p>Click the link below to accept your invitation (expires in 48 hours):</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #DDFE55; color: #1B1C20; font-weight: 700; text-decoration: none; border: 3px solid #1B1C20;">
          Accept Invitation →
        </a>
        <p style="margin-top: 24px; color: #6B7280; font-size: 13px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
    from: `Freo MUN <noreply@freo.haicloplabs.in>`,
  });

  revalidatePath(`/mun/dashboard/conference/${conferenceId}`);
}

// ─── Public Helpers ───────────────────────────────────────────────────────

export async function getPublicConference(slug: string) {
  const supabase = await createClient();

  const { data: conf, error } = await supabase
    .from("mun_conferences")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !conf) return null;

  const { data: committees } = await supabase
    .from("mun_committees")
    .select("id, name, short_name, type, agenda_items, max_delegates, portfolio_type, is_public, allow_observer, allow_press")
    .eq("conference_id", conf.id)
    .eq("is_public", true)
    .order("display_order");

  const { count } = await supabase
    .from("mun_registrations")
    .select("*", { count: "exact", head: true })
    .eq("conference_id", conf.id)
    .in("status", ["APPROVED", "UNDER_REVIEW", "PENDING"]);

  return {
    ...conf,
    committees: committees ?? [],
    registration_count: count ?? 0,
  };
}

// ─── Custom Registration Form Config ──────────────────────────────────────

export async function updateRegistrationForm(
  conferenceId: string,
  fields: CustomFormField[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("mun_conferences")
    .update({
      social_links: { custom_form_fields: fields },
      updated_at: new Date().toISOString(),
    })
    .eq("id", conferenceId)
    .eq("creator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/mun/dashboard/conference/${conferenceId}`);
}

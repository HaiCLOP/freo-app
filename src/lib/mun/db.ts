/**
 * Freo MUN — Database Access Layer
 * Typed Supabase queries. Admin client for RLS bypass in server actions.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  Conference, Committee, CommitteeWithPortfolios, ConferenceWithCommittees,
  Portfolio, Registration, RegistrationWithDetails, EBMember, EBRole,
  PositionPaper, Award, Session, SessionLog, RegistrationStatus, PaperStatus,
} from "./types";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

class MunDBError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "MunDBError";
  }
}

function fail(error: { message: string; code?: string }, ctx: string): never {
  console.error(`[MUN DB] ${ctx}:`, error.message, error.code);
  throw new MunDBError(`${ctx}: ${error.message}`, error.code);
}

// ─── Conference ───────────────────────────────────────────────────────────

export async function getConference(id: string): Promise<Conference | null> {
  const sb = await createClient();
  const { data } = await sb.from("mun_conferences").select("*").eq("id", id).single();
  return data;
}

export async function getConferenceBySlug(slug: string): Promise<Conference | null> {
  const admin = getAdminClient();
  const { data } = await admin.from("mun_conferences").select("*").eq("slug", slug).eq("is_published", true).single();
  return data;
}

export async function getConferenceWithCommittees(id: string): Promise<ConferenceWithCommittees | null> {
  const sb = await createClient();
  const { data: conf, error } = await sb.from("mun_conferences").select("*").eq("id", id).single();
  if (error || !conf) return null;
  const { data: committees } = await sb
    .from("mun_committees").select("*, mun_portfolios(*), mun_eb_roles(*)")
    .eq("conference_id", id).order("display_order");
  const { count } = await sb
    .from("mun_registrations").select("id", { count: "exact", head: true }).eq("conference_id", id);
  return {
    ...conf,
    committees: (committees || []).map((c: Record<string, unknown>) => ({
      ...c, portfolios: (c.mun_portfolios || []) as Portfolio[], eb_roles: (c.mun_eb_roles || []) as EBRole[],
    })) as CommitteeWithPortfolios[],
    registration_count: count || 0,
  };
}

export async function listCreatorConferences(creatorId: string): Promise<Conference[]> {
  const sb = await createClient();
  const { data } = await sb.from("mun_conferences").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
  return data || [];
}

export async function insertConference(conf: Omit<Conference, "id" | "created_at" | "updated_at">): Promise<Conference> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_conferences").insert(conf).select().single();
  if (error || !data) fail(error || { message: "No data" }, "insertConference");
  return data;
}

export async function updateConference(id: string, updates: Partial<Conference>): Promise<Conference> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_conferences").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error || !data) fail(error || { message: "No data" }, "updateConference");
  return data;
}

// ─── Committee ────────────────────────────────────────────────────────────

export async function getCommittee(id: string): Promise<CommitteeWithPortfolios | null> {
  const sb = await createClient();
  const { data } = await sb.from("mun_committees").select("*, mun_portfolios(*), mun_eb_roles(*)").eq("id", id).single();
  if (!data) return null;
  return { ...data, portfolios: (data.mun_portfolios || []) as Portfolio[], eb_roles: (data.mun_eb_roles || []) as EBRole[] } as CommitteeWithPortfolios;
}

export async function listCommittees(conferenceId: string): Promise<Committee[]> {
  const sb = await createClient();
  const { data } = await sb.from("mun_committees").select("*").eq("conference_id", conferenceId).order("display_order");
  return data || [];
}

export async function insertCommittee(committee: Omit<Committee, "id" | "created_at">): Promise<Committee> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_committees").insert(committee).select().single();
  if (error || !data) fail(error || { message: "No data" }, "insertCommittee");
  return data;
}

// ─── Portfolio ────────────────────────────────────────────────────────────

export async function insertPortfolios(portfolios: Omit<Portfolio, "id">[]): Promise<Portfolio[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_portfolios").insert(portfolios).select();
  if (error || !data) fail(error || { message: "No data" }, "insertPortfolios");
  return data;
}

// ─── Registration ─────────────────────────────────────────────────────────

export async function getRegistration(id: string): Promise<RegistrationWithDetails | null> {
  const sb = await createClient();
  const { data } = await sb.from("mun_registrations").select(`
    *, portfolio:mun_portfolios!portfolio_allotted(*),
    committee_1:mun_committees!committee_pref_1(*),
    committee_2:mun_committees!committee_pref_2(*),
    committee_3:mun_committees!committee_pref_3(*)
  `).eq("id", id).single();
  return data as RegistrationWithDetails | null;
}

export async function listRegistrations(
  conferenceId: string, filters?: { status?: RegistrationStatus; committeeId?: string }
): Promise<Registration[]> {
  const sb = await createClient();
  let q = sb.from("mun_registrations").select("*").eq("conference_id", conferenceId).order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.committeeId) {
    q = q.or(`committee_pref_1.eq.${filters.committeeId},committee_pref_2.eq.${filters.committeeId},committee_pref_3.eq.${filters.committeeId}`);
  }
  const { data } = await q;
  return data || [];
}

export async function insertRegistration(reg: Omit<Registration, "id" | "created_at" | "updated_at">): Promise<Registration> {
  const admin = getAdminClient();
  const { data, error } = await admin.from("mun_registrations").insert(reg).select().single();
  if (error || !data) fail(error || { message: "No data" }, "insertRegistration");
  return data;
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus, updates?: Partial<Registration>): Promise<Registration> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_registrations").update({ status, ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error || !data) fail(error || { message: "No data" }, "updateRegistrationStatus");
  return data;
}

export async function bulkUpdateRegistrationStatus(ids: string[], status: RegistrationStatus): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("mun_registrations").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) fail(error, "bulkUpdateRegistrationStatus");
}

// ─── EB Members ───────────────────────────────────────────────────────────

export async function getEBMember(userId: string, conferenceId: string): Promise<EBMember | null> {
  const sb = await createClient();
  const { data } = await sb.from("mun_eb_members").select("*").eq("user_id", userId).eq("conference_id", conferenceId).single();
  return data;
}

export async function getEBMemberByToken(token: string): Promise<EBMember | null> {
  const admin = getAdminClient();
  const { data } = await admin.from("mun_eb_members").select("*").eq("invite_token", token).gt("invite_expires_at", new Date().toISOString()).is("accepted_at", null).single();
  return data;
}

export async function listEBMembers(conferenceId: string): Promise<EBMember[]> {
  const sb = await createClient();
  const { data } = await sb.from("mun_eb_members").select("*").eq("conference_id", conferenceId);
  return data || [];
}

// ─── Position Papers ──────────────────────────────────────────────────────

export async function listPositionPapers(committeeId: string, status?: PaperStatus): Promise<PositionPaper[]> {
  const sb = await createClient();
  let q = sb.from("mun_position_papers").select("*").eq("committee_id", committeeId).order("submitted_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return data || [];
}

export async function insertPositionPaper(paper: Omit<PositionPaper, "id">): Promise<PositionPaper> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_position_papers").insert(paper).select().single();
  if (error || !data) fail(error || { message: "No data" }, "insertPositionPaper");
  return data;
}

// ─── Awards ───────────────────────────────────────────────────────────────

export async function listAwards(conferenceId: string): Promise<Award[]> {
  const sb = await createClient();
  const { data } = await sb.from("mun_awards").select("*").eq("conference_id", conferenceId);
  return data || [];
}

export async function insertAward(award: Omit<Award, "id" | "created_at">): Promise<Award> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_awards").insert(award).select().single();
  if (error || !data) fail(error || { message: "No data" }, "insertAward");
  return data;
}

// ─── Sessions ─────────────────────────────────────────────────────────────

export async function getActiveSession(committeeId: string): Promise<Session | null> {
  const sb = await createClient();
  const { data } = await sb.from("mun_sessions").select("*").eq("committee_id", committeeId).eq("is_active", true).single();
  return data;
}

export async function upsertSession(session: Partial<Session> & { committee_id: string }): Promise<Session> {
  const sb = await createClient();
  const { data, error } = await sb.from("mun_sessions").upsert({ ...session, updated_at: new Date().toISOString() }).select().single();
  if (error || !data) fail(error || { message: "No data" }, "upsertSession");
  return data;
}

export async function insertSessionLog(log: Omit<SessionLog, "id" | "created_at">): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from("mun_session_logs").insert(log);
  if (error) console.error("[MUN DB] insertSessionLog:", error.message);
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────

export async function verifyConferenceOwner(conferenceId: string): Promise<string> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new MunDBError("Unauthorized", "AUTH_REQUIRED");
  const conf = await getConference(conferenceId);
  if (!conf || conf.creator_id !== user.id) throw new MunDBError("Forbidden", "NOT_OWNER");
  return user.id;
}

export async function getCurrentUserRole(conferenceId: string): Promise<{ userId: string; member: EBMember | null; isOwner: boolean }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new MunDBError("Unauthorized", "AUTH_REQUIRED");
  const conf = await getConference(conferenceId);
  const member = await getEBMember(user.id, conferenceId);
  return { userId: user.id, member, isOwner: conf?.creator_id === user.id };
}

/**
 * Freo MUN — Core Types & Zod Schemas
 * Every MUN module imports from here. Types mirror the mun_ Supabase schema.
 */

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────

export const CommitteeType = {
  UN_GENERAL: "UN_GENERAL",
  UN_SPECIALIZED: "UN_SPECIALIZED",
  UN_SECURITY: "UN_SECURITY",
  INDIAN_PARLIAMENT: "INDIAN_PARLIAMENT",
  INDIAN_CABINET: "INDIAN_CABINET",
  INDIAN_SPECIALIZED: "INDIAN_SPECIALIZED",
  PRESS_CORP: "PRESS_CORP",
  FICTIONAL: "FICTIONAL",
  CRISIS: "CRISIS",
  JOINT_CRISIS: "JOINT_CRISIS",
  CUSTOM: "CUSTOM",
} as const;
export type CommitteeType = (typeof CommitteeType)[keyof typeof CommitteeType];

export const PortfolioType = {
  COUNTRY: "COUNTRY",
  PERSON: "PERSON",
  ROLE: "ROLE",
  TEAM: "TEAM",
  CUSTOM: "CUSTOM",
} as const;
export type PortfolioType = (typeof PortfolioType)[keyof typeof PortfolioType];

export const SessionFormat = {
  STANDARD: "STANDARD",
  CRISIS: "CRISIS",
  CONTINUOUS_CRISIS: "CONTINUOUS_CRISIS",
  HYBRID: "HYBRID",
} as const;
export type SessionFormat = (typeof SessionFormat)[keyof typeof SessionFormat];

export const RegistrationStatus = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  WAITLISTED: "WAITLISTED",
  CANCELLED: "CANCELLED",
} as const;
export type RegistrationStatus =
  (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const PaperStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  REJECTED: "REJECTED",
} as const;
export type PaperStatus = (typeof PaperStatus)[keyof typeof PaperStatus];

export const AwardType = {
  BEST_DELEGATE: "BEST_DELEGATE",
  OUTSTANDING: "OUTSTANDING",
  HIGH_COMMENDATION: "HIGH_COMMENDATION",
  VERBAL_MENTION: "VERBAL_MENTION",
  SPECIAL_MENTION: "SPECIAL_MENTION",
  BEST_POSITION_PAPER: "BEST_POSITION_PAPER",
  PARTICIPATION: "PARTICIPATION",
} as const;
export type AwardType = (typeof AwardType)[keyof typeof AwardType];

export const SessionMode = {
  ROLL_CALL: "ROLL_CALL",
  GSL: "GSL",
  MODERATED_CAUCUS: "MODERATED_CAUCUS",
  UNMODERATED_CAUCUS: "UNMODERATED_CAUCUS",
  VOTING: "VOTING",
  CRISIS_UPDATE: "CRISIS_UPDATE",
  ADJOURNMENT: "ADJOURNMENT",
  SUSPENDED: "SUSPENDED",
} as const;
export type SessionMode = (typeof SessionMode)[keyof typeof SessionMode];

export const DirectiveStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  MODIFIED: "MODIFIED",
  REJECTED: "REJECTED",
} as const;
export type DirectiveStatus =
  (typeof DirectiveStatus)[keyof typeof DirectiveStatus];

export const EBRoleType = {
  SEC_GEN: "SEC_GEN",
  USG: "USG",
  DIRECTOR: "DIRECTOR",
  CHAIR: "CHAIR",
  VICE_CHAIR: "VICE_CHAIR",
  RAPPORTEUR: "RAPPORTEUR",
  CRISIS_DIRECTOR: "CRISIS_DIRECTOR",
} as const;
export type EBRoleType = (typeof EBRoleType)[keyof typeof EBRoleType];

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  PRESENT_AND_VOTING: "PRESENT_AND_VOTING",
  ABSENT: "ABSENT",
} as const;
export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const VoteChoice = {
  IN_FAVOUR: "IN_FAVOUR",
  AGAINST: "AGAINST",
  ABSTAIN: "ABSTAIN",
  VETO: "VETO",
} as const;
export type VoteChoice = (typeof VoteChoice)[keyof typeof VoteChoice];

// ─── Database Row Types ───────────────────────────────────────────────────

export interface Conference {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  org_name: string;
  logo_url: string | null;
  date_start: string;
  date_end: string;
  registration_open: string;
  registration_close: string;
  delegate_fee: number;
  max_delegates: number;
  city: string;
  venue: string;
  description: string | null;
  social_links: Record<string, string> | null;
  is_published: boolean;
  is_archived: boolean;
  google_sheet_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Committee {
  id: string;
  conference_id: string;
  name: string;
  short_name: string;
  type: CommitteeType;
  theme: string | null;
  agenda_items: string[];
  portfolio_type: PortfolioType;
  max_delegates: number;
  session_format: SessionFormat;
  allow_observer: boolean;
  allow_press: boolean;
  bg_guide_url: string | null;
  study_guide_url: string | null;
  is_public: boolean;
  jcc_partner_id: string | null;
  display_order: number;
  created_at: string;
}

export interface Portfolio {
  id: string;
  committee_id: string;
  name: string;
  display_name: string | null;
  image_url: string | null;
  description: string | null;
  special_attrs: Record<string, unknown> | null;
  capacity: number;
  is_featured: boolean;
  display_order: number;
}

export interface EBRole {
  id: string;
  committee_id: string;
  title: string;
  role_type: EBRoleType;
  permissions: string[];
  max_count: number;
  is_internal: boolean;
}

export interface EBMember {
  id: string;
  conference_id: string;
  committee_id: string | null;
  user_id: string;
  role_id: string;
  role_type: EBRoleType;
  name: string;
  email: string;
  invited_at: string;
  accepted_at: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
}

export interface Registration {
  id: string;
  conference_id: string;
  user_id: string | null;
  delegate_name: string;
  delegate_email: string;
  delegate_phone: string;
  delegate_school: string;
  delegate_grade: string | null;
  experience_level: "NONE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: RegistrationStatus;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
  portfolio_allotted: string | null;
  payment_screenshot_url: string | null;
  payment_utr: string | null;
  payment_verified: boolean;
  payment_amount: number;
  custom_form_data: Record<string, unknown> | null;
  qr_ticket_url: string | null;
  qr_token: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PositionPaper {
  id: string;
  registration_id: string;
  committee_id: string;
  version: number;
  file_url: string;
  status: PaperStatus;
  eb_comments: string | null;
  score: number | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface Award {
  id: string;
  conference_id: string;
  committee_id: string;
  registration_id: string;
  type: AwardType;
  nominated_by: string | null;
  approved_by: string | null;
  certificate_url: string | null;
  emailed_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  committee_id: string;
  mode: SessionMode;
  is_active: boolean;
  current_speaker_id: string | null;
  speaker_time_seconds: number;
  total_time_seconds: number;
  timer_started_at: string | null;
  timer_paused_remaining: number | null;
  speakers_queue: string[];
  session_number: number;
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export interface Directive {
  id: string;
  session_id: string;
  committee_id: string;
  submitted_by: string;
  content: string;
  status: DirectiveStatus;
  response: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkingPaper {
  id: string;
  committee_id: string;
  session_id: string;
  title: string;
  content: string;
  authors: string[];
  is_published: boolean;
  promoted_to_resolution: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "file" | "number";
  required: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
}

export interface FacultyAdvisor {
  id: string;
  conference_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  school_name: string;
  is_verified: boolean;
  created_at: string;
}

export interface ConferenceRating {
  id: string;
  conference_id: string;
  registration_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface PressArticle {
  id: string;
  committee_id: string;
  author_id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  conference_id: string;
  committee_id: string;
  task_name: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
}

// ─── Zod Schemas (Input Validation) ───────────────────────────────────────

export const createConferenceSchema = z.object({
  name: z.string().min(3).max(200),
  org_name: z.string().min(2).max(200),
  date_start: z.string().min(1),
  date_end: z.string().min(1),
  registration_open: z.string().min(1),
  registration_close: z.string().min(1),
  delegate_fee: z.number().min(0).max(100000),
  max_delegates: z.number().min(1).max(10000),
  city: z.string().min(1).max(200),
  venue: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  social_links: z.record(z.string(), z.string().url()).optional(),
});

export const createCommitteeSchema = z.object({
  name: z.string().min(2).max(200),
  short_name: z.string().min(1).max(20),
  type: z.nativeEnum(CommitteeType),
  theme: z.string().max(200).optional(),
  agenda_items: z.array(z.string().max(500)).max(3),
  portfolio_type: z.nativeEnum(PortfolioType),
  max_delegates: z.number().min(1).max(500),
  session_format: z.nativeEnum(SessionFormat),
  allow_observer: z.boolean().default(false),
  allow_press: z.boolean().default(false),
  is_public: z.boolean().default(true),
});

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(200),
  display_name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  special_attrs: z.record(z.string(), z.unknown()).optional(),
  capacity: z.number().min(1).max(10).default(1),
  is_featured: z.boolean().default(false),
});

export const registrationSchema = z.object({
  delegate_name: z.string().min(2).max(200),
  delegate_email: z.string().email().max(254),
  delegate_phone: z.string().min(7, "Phone number too short").max(20, "Phone number too long").regex(/^[+]?[\d\s\-().]{7,20}$/, "Invalid phone number"),
  delegate_school: z.string().min(2).max(300),
  delegate_grade: z.string().max(50).optional(),
  experience_level: z.enum(["NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  committee_pref_1: z.string().uuid(),
  committee_pref_2: z.string().uuid().optional(),
  committee_pref_3: z.string().uuid().optional(),
  payment_utr: z.string().max(100).optional(),
  custom_form_data: z.record(z.string(), z.unknown()).optional(),
});

export const positionPaperSchema = z.object({
  registration_id: z.string().uuid(),
  committee_id: z.string().uuid(),
});

export const awardNominationSchema = z.object({
  committee_id: z.string().uuid(),
  registration_id: z.string().uuid(),
  type: z.nativeEnum(AwardType),
});

export const ebInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(200),
  committee_id: z.string().uuid().optional(),
  role_type: z.nativeEnum(EBRoleType),
});

// ─── Composite Types (for UI) ─────────────────────────────────────────────

export interface CommitteeWithPortfolios extends Committee {
  portfolios: Portfolio[];
  eb_roles: EBRole[];
}

export interface ConferenceWithCommittees extends Conference {
  committees: CommitteeWithPortfolios[];
  registration_count: number;
}

export interface RegistrationWithDetails extends Registration {
  portfolio?: Portfolio;
  committee_1?: Committee;
  committee_2?: Committee;
  committee_3?: Committee;
  position_papers?: PositionPaper[];
  awards?: Award[];
}

export interface SessionWithState extends Session {
  committee: Committee;
  attendance: Record<string, AttendanceStatus>;
  logs: SessionLog[];
}

export interface AllotmentResult {
  assignments: Array<{
    registration_id: string;
    portfolio_id: string;
    committee_id: string;
    preference_rank: number;
    confidence: number;
  }>;
  stats: {
    total_delegates: number;
    first_pref_percent: number;
    second_pref_percent: number;
    third_pref_percent: number;
    unmatched: number;
    conflicts_found: number;
  };
  conflicts: Array<{
    type: "SAME_SCHOOL_SAME_COMMITTEE" | "DUPLICATE_APPLICATION";
    delegate_ids: string[];
    details: string;
  }>;
}

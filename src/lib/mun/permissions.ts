/**
 * Freo MUN — RBAC Permission System
 * Implements the EB Permission Matrix from PRD Section 5.4
 */

import type { EBRoleType } from "./types";

export const Permission = {
  APPROVE_DELEGATES: "approve_delegates",
  RUN_ALLOTMENT: "run_allotment",
  CREATE_COMMITTEES: "create_committees",
  EDIT_COMMITTEE: "edit_committee",
  REVIEW_PAPERS: "review_papers",
  NOMINATE_AWARDS: "nominate_awards",
  FINALIZE_AWARDS: "finalize_awards",
  GENERATE_CERTIFICATES: "generate_certificates",
  INJECT_CRISIS: "inject_crisis",
  LIVE_SESSION_CONTROL: "live_session_control",
  VIEW_DELEGATE_LIST: "view_delegate_list",
  SUBMIT_PAPER: "submit_paper",
  VIEW_OWN_PORTFOLIO: "view_own_portfolio",
  DOWNLOAD_CERTIFICATE: "download_certificate",
  MANAGE_EB: "manage_eb",
  VIEW_PAYMENTS: "view_payments",
  BULK_ACTIONS: "bulk_actions",
  EXPORT_DATA: "export_data",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/** 'full' = unrestricted, 'committee' = scoped to their committee, 'limited' = restricted access, false = no access */
type PermLevel = "full" | "committee" | "limited" | false;

export const USG_CONFIGURABLE_PERMISSIONS: Permission[] = [
  Permission.RUN_ALLOTMENT,
  Permission.CREATE_COMMITTEES,
];

const MATRIX: Record<string, Record<Permission, PermLevel>> = {
  SEC_GEN: {
    approve_delegates: "full", run_allotment: "full", create_committees: "full",
    edit_committee: "full", review_papers: "full", nominate_awards: "full",
    finalize_awards: "full", generate_certificates: "full", inject_crisis: false,
    live_session_control: false, view_delegate_list: "full", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: "full",
    view_payments: "full", bulk_actions: "full", export_data: "full",
  },
  USG: {
    approve_delegates: "full", run_allotment: false, create_committees: false,
    edit_committee: "full", review_papers: "full", nominate_awards: "full",
    finalize_awards: false, generate_certificates: false, inject_crisis: false,
    live_session_control: false, view_delegate_list: "full", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: "full", bulk_actions: "full", export_data: "full",
  },
  DIRECTOR: {
    approve_delegates: "committee", run_allotment: false, create_committees: false,
    edit_committee: "committee", review_papers: "committee", nominate_awards: "committee",
    finalize_awards: false, generate_certificates: false, inject_crisis: "committee",
    live_session_control: false, view_delegate_list: "committee", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: false, bulk_actions: false, export_data: false,
  },
  CHAIR: {
    approve_delegates: false, run_allotment: false, create_committees: false,
    edit_committee: "committee", review_papers: "committee", nominate_awards: "committee",
    finalize_awards: false, generate_certificates: false, inject_crisis: "committee",
    live_session_control: "committee", view_delegate_list: "committee", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: false, bulk_actions: false, export_data: false,
  },
  VICE_CHAIR: {
    approve_delegates: false, run_allotment: false, create_committees: false,
    edit_committee: false, review_papers: "committee", nominate_awards: false,
    finalize_awards: false, generate_certificates: false, inject_crisis: "committee",
    live_session_control: "committee", view_delegate_list: "committee", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: false, bulk_actions: false, export_data: false,
  },
  RAPPORTEUR: {
    approve_delegates: false, run_allotment: false, create_committees: false,
    edit_committee: false, review_papers: false, nominate_awards: false,
    finalize_awards: false, generate_certificates: false, inject_crisis: false,
    live_session_control: "limited", view_delegate_list: "committee", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: false, bulk_actions: false, export_data: false,
  },
  CRISIS_DIRECTOR: {
    approve_delegates: false, run_allotment: false, create_committees: false,
    edit_committee: false, review_papers: false, nominate_awards: false,
    finalize_awards: false, generate_certificates: false, inject_crisis: "committee",
    live_session_control: "committee", view_delegate_list: "committee", submit_paper: false,
    view_own_portfolio: false, download_certificate: false, manage_eb: false,
    view_payments: false, bulk_actions: false, export_data: false,
  },
};

export function getPermissionLevel(role: EBRoleType | string, perm: Permission): PermLevel {
  return MATRIX[role]?.[perm] ?? false;
}

export function hasPermission(role: EBRoleType | string, perm: Permission): boolean {
  return getPermissionLevel(role, perm) !== false;
}

export function isCommitteeScoped(role: EBRoleType | string, perm: Permission): boolean {
  return getPermissionLevel(role, perm) === "committee";
}

/** Throws if role lacks the permission. Use in server actions. */
export function enforcePermission(
  role: EBRoleType | string,
  perm: Permission,
  ctx?: { committeeId?: string; memberCommitteeId?: string }
): void {
  const level = getPermissionLevel(role, perm);
  if (level === false) throw new Error(`Permission denied: '${role}' lacks '${perm}'`);
  if (level === "committee" && ctx?.committeeId && ctx?.memberCommitteeId && ctx.committeeId !== ctx.memberCommitteeId) {
    throw new Error(`Permission denied: '${perm}' is scoped to your committee only`);
  }
}

export function getPermissions(role: EBRoleType | string): Permission[] {
  const perms = MATRIX[role];
  if (!perms) return [];
  return (Object.entries(perms) as [Permission, PermLevel][]).filter(([, l]) => l !== false).map(([p]) => p);
}

export const DELEGATE_PERMISSIONS: Permission[] = [
  Permission.SUBMIT_PAPER, Permission.VIEW_OWN_PORTFOLIO, Permission.DOWNLOAD_CERTIFICATE,
];

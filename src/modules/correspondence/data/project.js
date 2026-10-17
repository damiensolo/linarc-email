// PLACEHOLDER DATA — Correspondence module: the project, "today", roles and limits. Shared by every correspondence-*
// screen (CLAUDE.md › Mock data; spec-to-prototype §3). Facts: docs/correspondence/spec.md; baseline: 00-plan.md §0.

/** The mock's "today" (local ISO). Every date in the module is relative to it, so the demo never goes stale. */
export const TODAY = '2026-10-16T10:30:00';

/** A date `days` from TODAY at `time` (local ISO, no zone). */
export function relDate(days, time = '17:00:00') {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T${time}`;
}

/** Calendar day of an ISO string, for same-day comparisons. */
export const dayOf = (iso) => (iso ? iso.slice(0, 10) : null);

export const PROJECT = Object.freeze({
  id: 'riverside-medical',
  code: 'RMC-04',
  name: 'Riverside Medical Center — North Tower Expansion',
  shortName: 'Riverside Medical Center',
  gc: 'Vanguard Construction Group',
  /** Mail to this address starts or joins a project thread (spec §4). */
  inboundAddress: 'rmc-04@mail.linarc.io',
});

/** The reply token that keeps a mailed reply in its thread (today's threading, spec §4). */
export const replyAddress = (threadId) => `reply+${threadId.toLowerCase().replace(/-/g, '_')}@mail.linarc.io`;

/** Attachments over this size go by secure link instead of being refused (today's limit is 20 MB; spec §5). */
export const MAIL_SIZE_LIMIT_MB = 20;

/** Secure link lifetime (D-43). */
export const LINK_LIFETIME_DAYS = 30;

/** Response due default: working days from sending (spec §7). */
export const RESPONSE_DUE_WORKING_DAYS = 3;

/**
 * Demo roles for the sandbox role switcher (spec §3, D-41). `personId` is who the viewer is; `internal` gates notes
 * and the Delivery tab; `canSeeCost` gates cost fields.
 */
export const ROLES = Object.freeze([
  { id: 'gc_pm', label: 'GC project manager', personId: 'usr-sarah', internal: true, canSeeCost: true },
  { id: 'gc_pe', label: 'GC project engineer', personId: 'usr-alex', internal: true, canSeeCost: false },
  { id: 'guest_sub', label: 'Subcontractor (guest)', personId: 'usr-dave', internal: false, canSeeCost: false },
]);

export const roleById = (id) => ROLES.find((r) => r.id === id) || ROLES[0];

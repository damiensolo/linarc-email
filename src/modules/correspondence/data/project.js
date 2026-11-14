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

/** Response due default: working days from sending (spec §7); the plain email case of CONTRACT_TURNAROUND. */
export const RESPONSE_DUE_WORKING_DAYS = 3;

/**
 * The contract's turnaround per record type, in working days (D-76, 2026-11-14): what the subcontract and the
 * owner contract say a party has to answer. Compose defaults Response due to it when the message is about a record;
 * plain email keeps three working days. A project sets these once (a settings page is outside the prototype).
 */
export const CONTRACT_TURNAROUND = Object.freeze({
  email: { days: 3, label: 'email' },
  drawing: { days: 3, label: 'a drawing markup' },
  rfi: { days: 7, label: 'an RFI', source: 'Subcontract §4.3' },
  submittal: { days: 10, label: 'a submittal', source: 'General conditions §3.12' },
  'change-order': { days: 14, label: 'a change order', source: 'Owner contract §7.2' },
});

/** The project calendar (D-76): working days are Monday to Friday; these dates are skipped too (holidays, site closures). */
export const PROJECT_HOLIDAYS = Object.freeze([
  { on: '2026-10-23', label: 'Site closed · crane lift (Level 2 steel)' },
  { on: '2026-11-11', label: 'Veterans Day' },
  { on: '2026-11-26', label: 'Thanksgiving' },
  { on: '2026-11-27', label: 'Day after Thanksgiving' },
]);
export const isWorkingDay = (date) => { const d = date instanceof Date ? date : new Date(date); if (d.getDay() === 0 || d.getDay() === 6) return false; const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; return !PROJECT_HOLIDAYS.some((h) => h.on === key); };

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

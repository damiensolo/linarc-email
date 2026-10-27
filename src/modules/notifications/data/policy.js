// PLACEHOLDER DATA — Notifications module: the policy the prototype applies (docs/notifications/spec.md §5, §9, §11). Severity
// rules per event type with the reason they produce, the project's fallback owner, the acknowledgment clock, the
// event families and persona presets of the preferences screen. Thresholds are demo defaults (Q-A6, Q-A7, Q-A10),
// never the product's; the proposal leaves them to product policy.

/** Project fallback role (spec §9): where an item with no eligible owner goes, and who is told at the ack deadline. */
export const FALLBACK = Object.freeze({ ownerId: 'usr-carlos', backupId: 'usr-sarah' });

/** Who triages mail that reached the project address with no record (spec §5, `thread_unmatched`). */
export const CORRESPONDENCE_OWNER = Object.freeze({ ownerId: 'usr-sarah', fallbackId: 'usr-alex' });

/** A Critical must be acknowledged within this many hours of its creation, or the fallback is told (Q-A7). */
export const ACK_HOURS = 4;

/** Resolved items stay in the All view this long (spec §6). */
export const RESOLVED_RETENTION_DAYS = 30;

/** Event families of the preferences matrix (spec §11); `demo: false` rows have no events in this prototype. */
export const EVENT_FAMILIES = Object.freeze([
  { id: 'correspondence', label: 'Correspondence', demo: true },
  { id: 'rfis', label: 'RFIs and Submittals', demo: true },
  { id: 'documents', label: 'Drawings and documents', demo: true },
  { id: 'field', label: 'Field and safety', demo: false },
  { id: 'financials', label: 'Financials', demo: false },
  { id: 'contracts', label: 'Contracts', demo: false },
  { id: 'scheduling', label: 'Scheduling', demo: false },
  { id: 'system', label: 'System processing', demo: false },
]);

export const CHANNELS = Object.freeze([
  { id: 'inapp', label: 'In app' },
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' },
]);

export const CADENCES = Object.freeze([
  { id: 'immediate', label: 'Immediate' },
  { id: 'digest', label: 'Digest' },
  { id: 'off', label: 'Off' },
]);

/**
 * Rows the viewer can't change (Q-A10): a mandatory delivery policy per event family and channel. Shown as text with
 * the lock reason; the matrix never offers them as controls.
 */
export const LOCKED = Object.freeze([
  { family: 'correspondence', channel: 'email', cadence: 'immediate', reason: 'Delivery failures and Critical items always reach your mailbox' },
  { family: 'rfis', channel: 'inapp', cadence: 'immediate', reason: 'Workflow steps assigned to you are always shown' },
]);

/** Persona presets (spec §11): delivery defaults only; a preset grants nothing and changes no ownership. */
export const PRESETS = Object.freeze({
  pm: { label: 'Project manager', matrix: { correspondence: 'immediate', rfis: 'immediate', documents: 'digest', field: 'immediate', financials: 'immediate', contracts: 'immediate', scheduling: 'digest', system: 'off' } },
  pe: { label: 'Project engineer', matrix: { correspondence: 'immediate', rfis: 'immediate', documents: 'immediate', field: 'digest', financials: 'off', contracts: 'off', scheduling: 'digest', system: 'digest' } },
  super: { label: 'Superintendent', matrix: { correspondence: 'digest', rfis: 'digest', documents: 'immediate', field: 'immediate', financials: 'off', contracts: 'off', scheduling: 'immediate', system: 'off' } },
  accounting: { label: 'Accounting', matrix: { correspondence: 'digest', rfis: 'off', documents: 'off', field: 'off', financials: 'immediate', contracts: 'immediate', scheduling: 'off', system: 'digest' } },
  owner: { label: 'Owner', matrix: { correspondence: 'digest', rfis: 'digest', documents: 'digest', field: 'digest', financials: 'immediate', contracts: 'immediate', scheduling: 'digest', system: 'off' } },
  custom: { label: 'Custom', matrix: null },
});

/** Which preset a sandbox role starts on. */
export const PRESET_FOR_ROLE = Object.freeze({ gc_pm: 'pm', gc_pe: 'pe', guest_sub: 'custom' });

/**
 * The event catalog the prototype derives (spec §5): family, base severity, the card's primary action label and
 * where it lands (`screen` is a router SCREENS name). Critical comes from a confirmed condition (seed.js) or a manual
 * Mark as critical, never from the type alone.
 */
export const EVENT_RULES = Object.freeze({
  thread_response: { family: 'correspondence', severity: 'important', action: 'Reply', screen: 'thread' },
  thread_delivery_failed: { family: 'correspondence', severity: 'important', action: 'Update contact and resend', screen: 'thread' },
  thread_unmatched: { family: 'correspondence', severity: 'important', action: 'Link to record', screen: 'thread' },
  rfi_step: { family: 'rfis', severity: 'important', action: 'Open step', screen: 'rfi' },
  rfi_step_returned: { family: 'rfis', severity: 'important', action: 'Open step', screen: 'rfi' },
  drawing_revision_published: { family: 'documents', severity: 'update', action: 'View revision', screen: 'sheet' },
  manual_critical: { family: 'correspondence', severity: 'critical', action: 'Open', screen: 'thread' },
});

/** The catalog the product adds, listed on the preferences screen and in the spec; no events in this prototype. */
export const PRODUCT_CATALOG = Object.freeze([
  { family: 'contracts', event: 'Contract approval blocks an authorised start', severity: 'P1 under the impact rule, else P2' },
  { family: 'financials', event: 'Pay application awaiting approval', severity: 'P2; P1 under a deadline or exposure rule' },
  { family: 'financials', event: 'Materially overdue invoice', severity: 'P1 or P2 by aging and value' },
  { family: 'field', event: 'Credible immediate safety issue', severity: 'P1 under the safety policy' },
  { family: 'field', event: 'Field issue blocks planned work', severity: 'P2; P1 when confirmed' },
  { family: 'scheduling', event: 'Critical-path impact exceeds policy', severity: 'P1 only with sufficient schedule evidence' },
  { family: 'system', event: 'Schedule import or sheet processing completed', severity: 'P3' },
]);

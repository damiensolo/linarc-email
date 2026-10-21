// Status vocabulary for the module. Every status rendered on a screen comes from here: a key → { label, tone }.
// Never a string literal in a template, never colour alone (CLAUDE.md). Tones are colour roles, mapped to design-system
// tokens by the status component (`toneToChipStatus`), never here:
//   neutral | info | success | warning | error
// Labels are the user-facing ones from the spec, not internal names. Red (error) only for failed / expired / rejected.
// Reference for a multi-dimension model (workflow × outcome × lifecycle): the Prequalification module's status-model.md
// in linarc-prototypes.

const def = (entries) =>
  Object.freeze(
    Object.fromEntries(entries.map(([key, label, tone, note]) => [key, Object.freeze({ key, label, tone, note })])),
  );

// PLACEHOLDER DATA — the example module's one dimension. Replace with your module's dimensions (one `def` per dimension).
/** Submittal workflow */
export const SUBMITTAL = def([
  ['draft', 'Draft', 'neutral'],
  ['submitted', 'Submitted', 'info'],
  ['in-review', 'In review', 'info'],
  ['approved', 'Approved', 'success'],
  ['approved-as-noted', 'Approved as noted', 'success', 'Show a notes marker'],
  ['revise', 'Revise and resubmit', 'warning'],
  ['rejected', 'Rejected', 'error'],
]);

/**
 * Tone → library StatusChip `status` (src/components/StatusChip/statusChipTokenMap.js; Figma Status Chip 40005082:4900).
 * `strong` picks the orange warning for a "missing / failed" severity; everything else uses yellow.
 */
export function toneToChipStatus(tone, { strong = false } = {}) {
  switch (tone) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    case 'warning':
      return strong ? 'warning-medium' : 'warning-low';
    default:
      return 'warning-neutral';
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Correspondence (docs/correspondence/status-model.md, D-16, D-17). Each value renders ONE signal; the signal is the
// dimension's rendering choice (noted per value), not data. `sla` is computed from Response due (threads.js slaFor).

/** Thread triage; drives the Email screen's segments */
export const TRIAGE = def([
  ['needs_action', 'Needs action', 'warning', 'Signal: chip'],
  ['waiting', 'Waiting on them', 'neutral', 'Signal: word'],
  ['resolved', 'Resolved', 'success', 'Signal: check'],
  ['draft', 'Draft', 'neutral', 'Signal: word'],
]);

/** Response due against today */
export const SLA = def([
  ['overdue', 'Overdue', 'error', 'Signal: chip'],
  ['due_today', 'Due today', 'warning', 'Signal: chip'],
  ['on_track', 'On track', 'neutral', 'Signal: word'],
  ['none', 'No due date', 'neutral', 'Signal: word'],
]);

/** Per recipient of an outbound message; a thread shows its weakest */
export const DELIVERY = def([
  ['sending', 'Sending', 'neutral', 'Signal: spinner'],
  ['delivered', 'Delivered', 'neutral', 'Signal: word'],
  ['link_viewed', 'Link opened', 'neutral', 'Signal: word'],
  ['downloaded', 'Files downloaded', 'success', 'Signal: check'],
  ['bounced', 'Delivery failed', 'error', 'Signal: chip, plus the InlineNotice on the message'],
]);

/** Thread visibility (D-41); internal notes are an entry type, not a value */
export const VISIBILITY = def([
  ['project_public', 'Project email', 'neutral', 'Signal: none (default, not shown)'],
  ['restricted', 'Confidential', 'warning', 'Signal: chip'],
]);

/** Escalation to a formal record */
export const PROMOTION = def([
  ['unpromoted', 'Not promoted', 'neutral', 'Signal: none'],
  ['promoted_rfi', 'Promoted to RFI', 'info', 'Signal: link to the record'],
  ['promoted_pco', 'Promoted to PCO', 'info', 'Signal: link to the record (data only in the MVP, Q-10)'],
]);

/** Linked drawing revision */
export const DRAWING_REVISION = def([
  ['current', 'Current', 'neutral', 'Signal: word'],
  ['superseded', 'Superseded', 'warning', 'Signal: chip, plus the note on the preview'],
]);

/** RFI (docs/correspondence/rfi-integration.md §G; labels proposed for the Figma Status Tag frames) */
export const RFI_STATUS = def([
  ['draft', 'Draft', 'neutral', 'Signal: word'],
  ['open', 'Open', 'warning', 'Signal: chip'],
  ['answered', 'Answered', 'info', 'Signal: chip (a response is in review)'],
  ['closed', 'Closed', 'success', 'Signal: check'],
  ['rejected', 'Rejected', 'error', 'Signal: chip'],
]);

/** RFI workflow step (Create → Respond → Review → Close); `overdue` is computed from the step's due date */
export const WORKFLOW_STEP = def([
  ['not_started', 'Not started', 'neutral', 'Signal: word'],
  ['in_progress', 'In progress', 'info', 'Signal: chip'],
  ['overdue', 'Overdue', 'error', 'Signal: chip'],
  ['returned', 'Returned', 'warning', 'Signal: chip (Revise sent it back)'],
  ['completed', 'Completed', 'success', 'Signal: chip'],
]);

/** Delivery-tab event labels (status-model.md › Audit event vocabulary) */
export const AUDIT_EVENT = def([
  ['SMTP_DISPATCHED', 'Sent', 'neutral'],
  ['SMTP_BOUNCED', 'Delivery failed', 'error'],
  ['INBOUND_REPLY_INGESTED', 'Reply received', 'neutral'],
  ['INBOUND_UNMATCHED', 'Received at the project address', 'neutral'],
  ['RECORD_LINKED', 'Linked to record', 'info'],
  ['MAGIC_LINK_ACCESSED', 'Link opened', 'neutral'],
  ['ATTACHMENT_DOWNLOADED', 'File downloaded', 'success'],
  ['RECORD_PROMOTED', 'Promoted to record', 'info'],
  ['LINK_REVOKED', 'Link withdrawn', 'neutral'],
  ['CONTACT_UPDATED', 'Contact updated', 'neutral'],
  ['QA_ADDED', 'Added to Q&A', 'info'],
]);

/** Look up one value safely; an unmapped key is visible during verification instead of silently blank. */
export function statusOf(dimension, key) {
  return dimension[key] || Object.freeze({ key, label: `Unmapped: ${key}`, tone: 'error' });
}

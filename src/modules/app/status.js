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
  // Notifications (docs/notifications/status-model.md › Audit event vocabulary): a card's history rows
  ['ITEM_CREATED', 'Item created', 'neutral'],
  ['ITEM_UPDATED', 'Updated', 'neutral'],
  ['ITEM_RESOLVED', 'Resolved', 'success'],
  ['ITEM_REOPENED', 'Reopened', 'warning'],
  ['ACKNOWLEDGED', 'Acknowledged', 'neutral'],
  ['SNOOZED', 'Snoozed', 'neutral'],
  ['ASSIGNED', 'Assigned', 'info'],
  ['FALLBACK_ROUTED', 'Routed to the project fallback', 'warning'],
  ['COVER_STARTED', 'Cover started', 'neutral'],
  ['COVER_ENDED', 'Cover ended', 'neutral'],
  ['SEVERITY_OVERRIDDEN', 'Severity changed', 'warning'],
  ['MARKED_CRITICAL', 'Marked Critical', 'warning'],
  ['CHANNEL_SENT', 'Sent', 'neutral'],
  ['CHANNEL_FAILED', 'Delivery failed', 'error'],
]);

// ---------------------------------------------------------------------------------------------------------------------
// Notifications (docs/notifications/status-model.md, D-54, D-55). The dimensions coexist: a card can be Critical + Needs action
// + Acknowledged + Overdue. Critical is NOT red: `warning` with strong emphasis, the word, and its reason line.

/** Severity of the canonical item (the same for every viewer) */
export const SEVERITY = def([
  ['critical', 'Critical', 'warning', 'Signal: chip (strong) + the reason line'],
  ['important', 'Important', 'neutral', 'Signal: word'],
  ['update', 'Update', 'neutral', 'Signal: none (the Updates view is the signal)'],
]);

/** Work status, per accountable party (derived from responsibility, never stored) */
export const WORK_STATUS = def([
  ['needs_action', 'Needs action', 'warning', 'Signal: chip'],
  ['waiting', 'Waiting', 'neutral', 'Signal: word'],
  ['resolved', 'Resolved', 'success', 'Signal: check'],
  ['none', '', 'neutral', 'Signal: none (an Update, or watching)'],
]);

/** Engagement, per viewer */
export const ENGAGEMENT = def([
  ['unseen', 'New', 'info', 'Signal: dot'],
  ['seen', '', 'neutral', 'Signal: none'],
  ['acknowledged', 'Acknowledged', 'neutral', 'Signal: word with the time'],
]);

/** Timing of the obligation against today (Overdue is a filter, not a view) */
export const TIMING = def([
  ['overdue', 'Overdue', 'error', 'Signal: chip'],
  ['due_today', 'Due today', 'warning', 'Signal: chip'],
  ['on_track', 'Due', 'neutral', 'Signal: word with the date'],
  ['none', '', 'neutral', 'Signal: none'],
]);

/** Personal presentation */
export const PRESENTATION = def([
  ['shown', '', 'neutral', 'Signal: none'],
  ['snoozed', 'Snoozed', 'neutral', 'Signal: word with the date; stays in the snoozed subtotal of the count'],
  ['archived', 'Archived', 'neutral', 'Signal: word (All view only)'],
]);

/** Why this card is in front of this viewer */
export const ROUTING = def([
  ['assigned', 'Assigned to you', 'neutral', 'Signal: word'],
  ['fallback', 'Project fallback: no eligible owner', 'warning', 'Signal: word'],
  ['covering', 'Covering for', 'neutral', 'Signal: word with the name'],
  ['requester', 'You asked for this', 'neutral', 'Signal: word'],
  ['oversight', 'Project oversight', 'neutral', 'Signal: word (PM sees every Critical; never counted)'],
  ['watching', 'Watching this record', 'neutral', 'Signal: word (never counted)'],
]);

/** Outcome of a Critical override (audit) */
export const OVERRIDE_OUTCOME = def([
  ['false_positive', 'False positive', 'neutral', 'Signal: word'],
  ['duplicate', 'Duplicate', 'neutral', 'Signal: word'],
  ['resolved', 'Condition resolved', 'success', 'Signal: check'],
  ['accepted_risk', 'Accepted risk', 'warning', 'Signal: chip with the review date'],
]);

/** A channel delivery attempt (View history only); provider acceptance is never acknowledgment */
export const CHANNEL = def([
  ['queued', 'Queued', 'neutral', 'Signal: word'],
  ['sent', 'Sent', 'neutral', 'Signal: word'],
  ['failed', 'Delivery failed', 'error', 'Signal: chip'],
]);

/** Look up one value safely; an unmapped key is visible during verification instead of silently blank. */
export function statusOf(dimension, key) {
  return dimension[key] || Object.freeze({ key, label: `Unmapped: ${key}`, tone: 'error' });
}

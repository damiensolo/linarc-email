// PLACEHOLDER DATA — Notifications module: what the Email data can't say by itself (docs/notifications/spec.md §5, §7).
// One confirmed Critical (a person confirmed the field impact; the type alone never makes a Critical), the
// informational Updates (drawing revisions have no publish date in records.js), and the events the sandbox can fire.
import { relDate } from '~/modules/correspondence/data/project';

/**
 * Confirmed Critical conditions, keyed by the canonical item key (items.js). RFI-142's Respond step is due today and
 * the superintendent confirmed on site that framing has stopped (spec §5): the field impact is the evidence.
 */
export const CRITICAL_SEEDS = Object.freeze({
  'rfi:RFI-142:respond:wf-142-2': {
    reason: 'the lead-lined partition answer is due today and Carlos Reyes confirmed on site that framing at Grid D-7 has stopped',
    evidence: {
      byId: 'usr-carlos',
      at: relDate(0, '07:40:00'),
      quote: 'OR 2.14 top track is stopped until the termination height is answered. The crew moves to the corridors today and runs out of work Monday.',
    },
    markedById: 'usr-carlos',
    markedAt: relDate(0, '07:45:00'),
  },
});

/** Informational Updates (spec §5, `drawing_revision_published`): internal roles watch every sheet. */
export const UPDATE_SEEDS = Object.freeze([
  { key: 'drawing:A-302-Rev3:published', eventType: 'drawing_revision_published', recordId: 'A-302-Rev3', title: 'A-302 Rev 3 published', detail: 'Level 3 reflected ceiling plan, east wing: cove and baffle revisions at Corridor 3E', at: relDate(-2, '16:05:00') },
  { key: 'drawing:S-201-Rev1:superseded', eventType: 'drawing_revision_published', recordId: 'S-201-Rev1', title: 'S-201 Rev 1 superseded by Rev 2', detail: 'Level 3 framing plan: W24x68 at Grid B-4 revised; threads pinned to Rev 1 show the superseded note', at: relDate(-1, '09:30:00') },
]);

/**
 * What the sandbox's *Simulate event* can fire (`prototype.events`, spec §7). `fire` lives in actions.js; this is the
 * catalogue the sandbox lists. Each writes through the session, so Reset clears it.
 */
export const SIMULATED_EVENTS = Object.freeze([
  { id: 'critical_bounce', label: "Critical: Alex's email to Kenji about RFI-142 bounces (a Critical arrives)" },
  { id: 'reminder', label: "Reminder: THR-1031's response is still overdue (the same card, one more history row)" },
  { id: 'reassign', label: "Reassign: RFI-143's Respond step moves from Elena to Alex" },
  { id: 'cover', label: 'Cover: Alex covers for Sarah from Thursday for two weeks' },
]);

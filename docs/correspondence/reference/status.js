// Multi-dimensional status vocabulary for Correspondence & Host Tools (D-16, D-17)
// Rule: Every status rendered on screen comes from status.js (label + tone + signal);
// never use raw string literals in templates. One visual signal per value (D-17).

export const STATUS_DEFS = {
  // 1. Primary inbox triage dimension
  triage: {
    needs_action: {
      label: 'Needs action',
      tone: 'warning',
      signal: 'chip', // Coloured chip: requires user action now
    },
    waiting: {
      label: 'Waiting on external',
      tone: 'neutral',
      signal: 'text', // Muted word: no immediate user action required
    },
    replied: {
      label: 'Replied',
      tone: 'neutral',
      signal: 'text',
    },
    resolved: {
      label: 'Resolved',
      tone: 'success',
      signal: 'check', // Check mark or muted word, never chip + check together
    },
    draft: {
      label: 'Draft',
      tone: 'neutral',
      signal: 'text',
    },
  },

  // 2. Response SLA deadline dimension
  sla: {
    overdue: {
      label: 'Overdue',
      tone: 'danger',
      signal: 'chip', // Red chip: expired SLA
    },
    due_today: {
      label: 'Due today',
      tone: 'warning',
      signal: 'chip', // Coloured chip: action needed today
    },
    on_track: {
      label: 'On track',
      tone: 'neutral',
      signal: 'text',
    },
    none: {
      label: 'No due date',
      tone: 'neutral',
      signal: 'text',
    },
  },

  // 3. Per-recipient SMTP & Magic-Link audit verification dimension
  delivery: {
    sending: {
      label: 'Sending',
      tone: 'neutral',
      signal: 'spinner',
    },
    delivered: {
      label: 'Delivered (SMTP)',
      tone: 'neutral',
      signal: 'text',
    },
    link_viewed: {
      label: 'Link viewed',
      tone: 'neutral',
      signal: 'text',
    },
    downloaded: {
      label: 'Files downloaded',
      tone: 'success',
      signal: 'check',
    },
    bounced: {
      label: 'Delivery failed',
      tone: 'danger',
      signal: 'chip',
    },
  },

  // 4. Thread & message governance scope
  visibility: {
    project_public: {
      label: 'Project correspondence',
      tone: 'neutral',
      signal: 'text',
    },
    restricted: {
      label: 'Confidential',
      tone: 'warning',
      signal: 'chip',
    },
    internal_note: {
      label: 'Internal team note',
      tone: 'warning',
      signal: 'notice', // Renders via InlineNotice tone="warning"
    },
  },

  // 5. Formal record escalation state
  promotion: {
    unpromoted: {
      label: 'Informal thread',
      tone: 'neutral',
      signal: 'none',
    },
    promoted_rfi: {
      label: 'Promoted to RFI',
      tone: 'info',
      signal: 'link',
    },
    promoted_pco: {
      label: 'Promoted to PCO',
      tone: 'info',
      signal: 'link',
    },
    promoted_issue: {
      label: 'Promoted to Issue',
      tone: 'info',
      signal: 'link',
    },
  },

  // 6. Host tool statuses (Drawings & RFIs)
  drawingRevision: {
    current: {
      label: 'Current revision',
      tone: 'neutral',
      signal: 'text',
    },
    superseded: {
      label: 'Superseded',
      tone: 'warning',
      signal: 'chip',
    },
  },

  rfiStatus: {
    draft: {
      label: 'Draft',
      tone: 'neutral',
      signal: 'text',
    },
    open: {
      label: 'Open — In review',
      tone: 'warning',
      signal: 'chip',
    },
    answered: {
      label: 'Official response received',
      tone: 'info',
      signal: 'chip',
    },
    closed: {
      label: 'Closed',
      tone: 'success',
      signal: 'check',
    },
  },
};

/**
 * Helper to look up a status definition safely.
 * Every status in data must map cleanly; returns a visible fallback only to catch bugs during verification.
 */
export function getStatus(dimension, key) {
  const dim = STATUS_DEFS[dimension];
  if (!dim || !dim[key]) {
    return { label: `UNMAPPED(${dimension}:${key})`, tone: 'danger', signal: 'chip' };
  }
  return dim[key];
}
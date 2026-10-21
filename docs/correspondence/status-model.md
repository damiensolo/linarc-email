# Correspondence — status model (D-16, D-17)

Independent dimensions, each with user-facing labels and a tone per value, implemented once in `src/modules/app/status.js`. Tones are the template's: `neutral`, `info`, `success`, `warning`, `error` (not `danger`). Each value renders **one** signal (D-17): a chip, a muted word, a check, or a notice; the signal is a per-dimension rendering choice, not a data field. Red (`error`) only for failed, expired or rejected.

## Dimensions

### `triage` (thread; drives the inbox segments)
| Value | Label | Tone | Signal | Meaning |
|---|---|---|---|---|
| `needs_action` | Needs action | warning | chip | last message is inbound and unanswered, or a bounce |
| `waiting` | Waiting on them | neutral | word | last message is ours; awaiting a reply |
| `resolved` | Resolved | success | check | closed by a user, or the promoted record closed |
| `draft` | Draft | neutral | word | composed, not sent |

The draft's `replied` collapsed into `waiting`: "we replied" is "waiting on them".

### `sla` (thread; computed from Response due, `spec.md` §7)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `overdue` | Overdue | error | chip |
| `due_today` | Due today | warning | chip |
| `on_track` | On track | neutral | word |
| `none` | No due date | neutral | word |

### `delivery` (per recipient of an outbound message; a message shows its weakest)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `sending` | Sending | neutral | spinner (StatusIndicator) |
| `delivered` | Delivered | neutral | word |
| `link_viewed` | Link opened | neutral | word |
| `downloaded` | Files downloaded | success | check |
| `bounced` | Delivery failed | error | chip, plus the InlineNotice on the message |

### `visibility` (thread)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `project_public` | Project correspondence | neutral | none (default, not shown) |
| `restricted` | Confidential | warning | chip |

Internal notes are an **entry type** (`INTERNAL_COMMENT`), not a visibility value; they render as InlineNotice `warning`.

### `promotion` (thread)
| Value | Label | Tone | Signal | Note |
|---|---|---|---|---|
| `unpromoted` | — | neutral | none | |
| `promoted_rfi` | Promoted to RFI | info | link (record code) | |
| `promoted_pco` | Promoted to PCO | info | link | data only; not reachable in the MVP (Q-10) |

### `drawingRevision` (linked drawing)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `current` | Current | neutral | word |
| `superseded` | Superseded by Rev N | warning | chip, plus the note on the preview |

### `rfiStatus` (RFI; proposed labels for the Figma Status Tag frames, `rfi-integration.md` §G)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `draft` | Draft | neutral | word |
| `open` | Open | warning | chip |
| `answered` | Answered | info | chip (a response is in review) |
| `closed` | Closed | success | check |
| `rejected` | Rejected | error | chip |

### `workflowStep` (RFI › Workflow; `overdue` computed from the step's due date)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `not_started` | Not started | neutral | word |
| `in_progress` | In progress | info | chip |
| `overdue` | Overdue | error | chip |
| `returned` | Returned | warning | chip (Revise sent it back) |
| `completed` | Completed | success | chip |

## Where each dimension is read

| Place | Dimensions |
|---|---|
| Email screen columns | `triage`, `sla`, `delivery` (last outbound), `promotion`, `visibility` |
| Email screen segments | `triage` (Needs action, Waiting), `sla` (Overdue); Unmatched is "no linked record", not a status |
| Thread title bar | `triage` as the `Status:` chip; `visibility` chip only when restricted |
| ThreadStream entry | `delivery` per message |
| Linked items | `drawingRevision`, `rfiStatus` |
| RFI title bar | `rfiStatus` as the `Status:` chip; `sla` chip for Due only when due today or overdue |
| RFI › Workflow | `workflowStep` per step |
| RFI › Email tab | `triage` per thread; the tab's count = threads in Needs action |
| Portal | `drawingRevision` on the pinned sheet; the link's own state (valid / expired / revoked, `spec.md` §10) |

## Audit event vocabulary (right panel › Delivery)

`SMTP_DISPATCHED`, `SMTP_BOUNCED`, `INBOUND_REPLY_INGESTED`, `INBOUND_UNMATCHED` (mail to the project address with no thread), `RECORD_LINKED`, `MAGIC_LINK_ACCESSED`, `ATTACHMENT_DOWNLOADED`, `RECORD_PROMOTED`, `LINK_REVOKED`, `CONTACT_UPDATED`, `QA_ADDED` (a message added to an RFI's Q&A, D-49). Today's product already records per-recipient delivery and failure; the rest is new. Rows show event, actor and time; IP and checksum sit in the row's expand only (Q-09; no export in the MVP).

## Entry types (ThreadStream)

`EXTERNAL_EMAIL` (inbound or outbound), `INTERNAL_COMMENT`, `SYSTEM_EVENT`.

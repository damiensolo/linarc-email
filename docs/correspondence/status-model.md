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

### `follow_up` (thread; computed from the team's follow-up date, D-72)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `due` | Follow up | info | chip on the list row when nothing stronger applies (Overdue, Needs action win); the date as a word on the thread |
| `later` | Follow up · 19 Oct | neutral | word |
| `none` | — | neutral | none |

Not a `def` in `status.js`: `followUpFor` in `data/threads.js` computes the value and the two renderers (ThreadList row, thread and pane header) carry the label. The owner (`ownerId`, D-72) is a person, not a status: a select on the thread, a column and the *Assigned to me* view on the Email screen.

### `correspondenceType` (thread the GC started; D-78)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `general` | General | neutral | word, after the number (*C-0040 · General*) |
| `transmittal` | Transmittal | neutral | word |
| `notice` | Notice | warning | word (a notice carries contract deadlines; the Email screen's *Notices* quick filter finds them) |

The number (`letterNo`, *C-0041*) is data assigned on send, not a status; inbound mail has none.

### `visibility` (thread)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `project_public` | Project email | neutral | none (default, not shown; the hidden Visibility filter column's other value) |
| `restricted` | Confidential | warning | chip |

Internal notes are an **entry type** (`INTERNAL_COMMENT`), not a visibility value; they render as InlineNotice `warning`.

### `promotion` (thread)
| Value | Label | Tone | Signal | Note |
|---|---|---|---|---|
| `unpromoted` | Not promoted | neutral | none | |
| `promoted_rfi` | Promoted to RFI | info | link (record code) | |
| `promoted_pco` | Promoted to PCO | info | link | a target since D-77 |
| `promoted_field_issue` | Promoted to field issue | info | link | D-77 |
| `promoted_daily_log` | Added to the daily log | info | link | D-80; the thread's triage is unchanged |

### `drawingRevision` (linked drawing)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `current` | Current | neutral | word |
| `superseded` | Superseded | warning | chip (the screens append *by Rev N* from the record), plus the note on the preview |

### `submittal` and `changeOrder` (the stand-in records' status, D-74)
| Dimension | Values (tone) | Signal |
|---|---|---|
| `SUBMITTAL` (the template's) | Draft (neutral) · Submitted (info) · In review (info) · Approved (success) · Approved as noted (success) · Revise and resubmit (warning) · Rejected (error) | chip in the record's title bar; a neutral value as a word |
| `CHANGE_ORDER` | Draft (neutral) · Pending owner approval (warning) · Approved (success) · Rejected (error) | the same; a PCO promoted in the demo reads *PCO · Draft* in Linked items |

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
| Email screen columns | `triage` (Status), `sla` (Response due), `delivery` (last outbound), `correspondenceType` (Letter, D-78); no Promoted column (the promoted record is one of the Linked records); `visibility` is a hidden filter column behind the *Confidential* quick filter |
| Email screen segments | `triage` (Needs action, Waiting), `sla` (Overdue), `follow_up` (Follow up), the owner (Assigned to me, D-72); Unmatched is "no linked record", not a status; Drafts and Deleted are folders (D-67) |
| Thread title bar | `triage` as the `Status:` chip; `visibility` chip only when restricted; `correspondenceType` as a word after the id (D-78) |
| Record title bar (Submittal, Change order) | `submittal` / `changeOrder` as the `Status:` chip; `sla` chip for Due only when due today or overdue (D-74) |
| ThreadStream entry | `delivery` per message |
| Linked items | `drawingRevision`, `rfiStatus` |
| RFI title bar | `rfiStatus` as the `Status:` chip; `sla` chip for Due only when due today or overdue |
| RFI › Workflow | `workflowStep` per step |
| RFI › Email tab | `triage` per thread; the tab's count = threads in Needs action |
| Portal | `drawingRevision` on the pinned sheet; the link's own state (valid / expired / revoked, `spec.md` §10) |

## Audit event vocabulary (right panel › Delivery)

`SMTP_DISPATCHED`, `SMTP_BOUNCED`, `INBOUND_REPLY_INGESTED`, `INBOUND_UNMATCHED` (mail to the project address with no thread), `RECORD_LINKED`, `MAGIC_LINK_ACCESSED`, `ATTACHMENT_DOWNLOADED`, `RECORD_PROMOTED`, `LINK_REVOKED`, `CONTACT_UPDATED`, `QA_ADDED` (a message added to an RFI's Q&A, D-49), and since D-72 `REMINDER_SENT` (with the count: *Reminder 2 sent*), `THREAD_RESOLVED`, `THREAD_REOPENED`, `OWNER_ASSIGNED`, `FOLLOW_UP_SET`. Today's product already records per-recipient delivery and failure; the rest is new. Rows show event, actor and time; IP and checksum sit in the row's expand only (Q-09; no export in the MVP).

## Entry types (ThreadStream)

`EXTERNAL_EMAIL` (inbound or outbound; a reminder is an outbound one marked *Reminder*, D-72), `INTERNAL_COMMENT`, `SYSTEM_EVENT` (promoted, linked, filed to Q&A; since D-72 assigned, marked resolved, reopened).

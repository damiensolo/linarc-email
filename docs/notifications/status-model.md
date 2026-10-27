# Notifications — status model (D-16, D-17)

Independent dimensions, each with user-facing labels and a tone per value, implemented once in `src/modules/app/status.js` under a `// Notifications` section. Tones are the template's: `neutral`, `info`, `success`, `warning`, `error`. Each value renders **one** signal (D-17). Red (`error`) only for failed, expired, rejected or overdue; **Critical is not red** (D-54): it is the `warning` tone with strong emphasis, the word, and its reason line.

The proposal's rule is kept whole: these dimensions **coexist**. A card can be Critical + Needs action + Acknowledged + Overdue. Nothing here is a flat enum.

## Dimensions

### `severity` (item; canonical, the same for every viewer)
| Value | Label | Tone | Signal | Meaning |
|---|---|---|---|---|
| `critical` | Critical | warning (strong) | chip + reason line | credible material exposure or serious blockage needing prompt human attention; records its reason and evidence |
| `important` | Important | neutral | word | action or review within normal timeframes |
| `update` | Update | neutral | none (the Updates view is the signal) | informational; no obligation |

Acknowledgment, cover and snooze never change severity. Only an authorised override (`overrideOutcome`) or a source reassessment does.

### `workStatus` (item, **per accountable party**; derived from responsibility, never stored)
| Value | Label | Tone | Signal | Meaning |
|---|---|---|---|---|
| `needs_action` | Needs action | warning | chip | the next action belongs to the viewer or someone they cover |
| `waiting` | Waiting | neutral | word | the viewer is accountable for following up a response owed by another party; that party and the expected date are shown |
| `resolved` | Resolved | success | check | the obligation was fulfilled, or an authorised closure was recorded |
| `none` | — | neutral | none | an Update: no obligation |

The Email module's `triage` keeps its own meaning on the Email screen (a thread's last message); `workStatus` is computed from it plus responsibility (`spec.md` §4).

### `engagement` (item × viewer; stored in the session)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `unseen` | New | info | dot (StatusIndicator) |
| `seen` | — | neutral | none |
| `acknowledged` | Acknowledged · time | neutral | word (and the Critical badge's acknowledged state) |

Seen is recorded when the card's record is opened; it never acknowledges. *Mark updates reviewed* sets Updates to seen and nothing else.

### `timing` (item; computed from the obligation's due date and the acknowledgment deadline)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `overdue` | Overdue | error | chip |
| `due_today` | Due today | warning | chip |
| `ack_due` | Acknowledge by HH:MM | warning | word (Critical only, while unacknowledged) |
| `on_track` | Due date | neutral | word |
| `none` | — | neutral | none |

Overdue is a **filter**, not a view (the Email screen's Overdue segment is this same condition on `sla`).

### `presentation` (item × viewer; stored)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `shown` | — | neutral | none |
| `snoozed` | Snoozed until date | neutral | word; the card leaves the view but stays in the count's snoozed subtotal; a Critical keeps its signal |
| `archived` | Archived | neutral | word (All view only; never for an open Critical) |

### `routing` (item × viewer; why this card is in front of this person)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `assigned` | Assigned to you | neutral | word |
| `fallback` | Project fallback | warning | word (no eligible owner; the fallback is accountable until assigned) |
| `covering` | Covering for Name | neutral | word |
| `watching` | Watching this record | neutral | word (never counted in the bell) |
| `requester` | You asked for this | neutral | word (Waiting view) |

### `overrideOutcome` (a Critical override; audit)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `false_positive` | False positive | neutral | word |
| `duplicate` | Duplicate of … | neutral | word |
| `resolved` | Condition resolved | success | check |
| `accepted_risk` | Accepted risk · review date | warning | chip (the source keeps its state and owner) |

### `channel` (a delivery attempt; *View history* only)
| Value | Label | Tone | Signal |
|---|---|---|---|
| `queued` | Queued | neutral | word |
| `sent` | Sent by email / in app | neutral | word |
| `failed` | Delivery failed | error | chip |

Provider acceptance is never shown as acknowledgment.

### `eventType` (the prototype catalog; keys, severity and reason rules in `spec.md` §5)
`thread_response` (one per response cycle; Needs action for whoever owes the response, Waiting for whoever asked; Overdue is its `timing`), `thread_delivery_failed`, `thread_unmatched`, `rfi_step` (the step in hand), `rfi_step_returned`, `drawing_revision_published`, `manual_critical`. Implemented in `src/modules/notifications/data/policy.js` (`EVENT_RULES`) and derived in `items.js`.

## Where each dimension is read

| Place | Dimensions |
|---|---|
| Bell badge | count of `workStatus = needs_action` for me or my cover, `presentation ≠ archived`, `severity ≠ update`, `routing ≠ watching`; critical state from any `severity = critical` in Needs action or Waiting, split by `engagement` |
| Drawer views | `workStatus` (Needs action, Waiting), `severity = update` (Updates), everything (All); Critical section first by `severity`; order by `timing` then age |
| Card | `severity` chip + reason, title, impact, record, responsible, `timing`, `routing`, one primary action; `engagement` dot |
| Banner | `severity = critical` arriving for the viewer, `engagement = unseen` |
| Full page | all of the above as columns and filters; `presentation` snoozed subtotal; `channel` in *View history* |
| Preferences | event family (from `eventType`), channel, cadence; locked rows (`spec.md` §11) |
| Override modal | `overrideOutcome`; audit |
| Email screen, RFI | unchanged (`../correspondence/status-model.md`); the same obligations appear through `sources.js` |

## Audit event vocabulary (added to `AUDIT_EVENT`)

`ITEM_CREATED`, `ITEM_UPDATED` (a reminder or a new event on the same obligation), `ITEM_RESOLVED`, `ITEM_REOPENED`, `ACKNOWLEDGED`, `SNOOZED`, `ASSIGNED`, `FALLBACK_ROUTED`, `COVER_STARTED`, `COVER_ENDED`, `SEVERITY_OVERRIDDEN` (outcome, reason, actor, old and new severity), `MARKED_CRITICAL`, `CHANNEL_SENT`, `CHANNEL_FAILED`. Rows show event, actor and time; policy version and evidence sit in the row's expand. Append-only in the session.

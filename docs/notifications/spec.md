# Notifications — distilled spec

The facts the surfaces need, distilled from `source/unified-communication-model-v2.md` (cited below by its section titles) and reconciled with the Email module (`../correspondence/spec.md`, D-41, D-42, D-44, D-49). Each section separates **what the prototype shows** from **assumed platform behaviour** (one line, pointer to the source). Bets and scope: `00-plan.md` §1, §2. Vocabulary: `status-model.md`. Screens: `screens.md`.

## 0. Bets

Responsibility beats chronology (the drawer, the full page); Critical is explained, not shouted (the banner, the Critical section, the override); Email and notifications are one set of obligations (shared data with `correspondence-*`). `00-plan.md` §1.

## 1. What Notifications becomes (source: *Communication architecture › Surface responsibilities*)

| Surface | Question it answers | In this prototype |
|---|---|---|
| **Notifications** (the bell, the drawer, the page) | What deserves this person's attention now? | Built: obligations, risks and reviewable updates with routing and acknowledgment; no task lifecycle of its own |
| **Email** | What was communicated, to whom, what response is expected? | Built already (`correspondence-*`); a reply never approves or closes the source workflow |
| **Tasks and workflows** (RFI workflow here) | Who owes what, by when, what counts as complete? | The RFI stand-in's workflow is the authority; Notifications routes to it |
| **Activity and delivery logs** | What happened, how was it delivered? | The thread's Delivery tab and the RFI's Activity; the project Notification Log is assumed, not built |

**No shadow tasks** (source: *No shadow tasks*): nothing is created inside Notifications. Inline actions are acknowledge, snooze, assign, link correspondence, or a source action the record exposes (Update contact and resend, Add to Q&A, Route). Every inline action uses the record's own rules and writes the same audit row.

## 2. Navigation

- **Bell** on every shelled screen (`TopNavBar`, `account.notificationsBadge`). Not on the secure link page. Count and critical state: §6.
- **Drawer**: SlideOverPanel `md` over the current page; the page and any unsaved work stay (a compose panel open underneath is not closed; the drawer stacks beside the bell's edge). Header: *Notifications*, the Critical count as its badge, a scope switch All projects / Current project (one project in the MVP, Q-A3), the ··· menu (*Mark updates reviewed*, *Preferences*). Tabs: Needs action · Waiting · Updates · All, each with its count. Footer: *View all*. At 390 the drawer is a full-width sheet.
- **Full page** `notifications-list` from the bell's *View all*: top nav, no rail (Q-A2); the project context stays.
- **Preferences** `notifications-preferences` from the drawer's menu and from the top nav's account menu (Settings).
- **Phone**: the bell sits in the top nav's overflow drawer (library `RightPanel`, row *Notifications*); the bottom tab is not built (`00-plan.md` §2).
- **Deep links** (source: *Mobile entry and actions*): a card's primary action opens the record with the relevant part in view (thread: the message highlighted; RFI: the Workflow tab on the step; sheet: the revision). If the item was resolved since, the record opens with a line *This item was resolved by Name on date*; if access was removed, the drawer shows *You no longer have access to this item* in place of the record. Never a silent redirect home.

## 3. Who sees what (D-41 extended; source: *Security and continuity*, *Persona defaults*)

| Element | Internal PM | Internal PE | Guest (Dave) |
|---|---|---|---|
| Cards for obligations assigned to me or my cover | yes | yes | yes, own only |
| Cards for obligations I requested (Waiting) | yes | yes | yes, own threads only |
| Team scope (others' items, per-person counts) | yes | yes | no scope switch |
| Items on Confidential threads | participants and PMs only | if participant | if participant |
| Internal notes in a card's description or history | yes | yes | never |
| Cost fields in a card's impact line | `canSeeCost` roles | no | never |
| Counts | only items I may open; never a count of hidden items | same | same |
| Override a Critical | yes (Q-A6) | disabled with the reason | not offered |
| Preferences, delegation | yes | yes | preferences only; no cover |

Rules: permissions apply to cards, counts, the banner, history, search and preferences previews alike; access is rechecked when a card is opened (a card the viewer lost access to explains, §2); internal notes, cost, Bcc relationships and other recipients' delivery evidence never leave the company (D-41). Assumed: the same boundary applies to push previews, digests and AI summaries.

## 4. The item (source: *Shared object model*, *Independent state dimensions*)

**One canonical item per distinct active obligation or condition**, with per-viewer projections. Not every event is an item: an event creates an item, updates one (a reminder adds a history row and never a new card), resolves one, or produces nothing (an Update that nobody is responsible for).

**Dedup key**: project + source object + obligation type + response cycle or party. Never the channel, never the reminder time. A record may carry several items (THR-1031: an Overdue response obligation and a Delivery failed corrective obligation are two cards with different reasons).

**Fields**: id, `eventType`, severity + reason + evidence, title, impact line, project, record (code and link), responsible party, next-action party, requester, fallback, due (response due or the step's due), acknowledgment deadline (Critical), created, last event, history (audit rows), `workStatus` per viewer, `engagement` per viewer, `presentation` per viewer, `routing` per viewer.

**Derivation in the prototype** (`src/modules/notifications/data/sources.js`, D-55): items are computed from the Email module's threads (`triage`, `sla`, bounces, unmatched), the RFIs' workflow steps (`currentStep`, `stepStatus`) and the drawings (revision published) for the current role, plus `seed.js` (the Critical, the simulated events). The session stores only what a person does: engagement, snooze, archive, overrides, cover, preferences, simulated events. Reset clears them.

**Per-viewer work status**: Needs action when the next action is the viewer's (or someone they cover); Waiting when the viewer asked for a response owed by another party (the party and the expected date shown); Resolved when the source says so. The PM who routed a step is Waiting; the step's party has Needs action, for the same item.

## 5. Severity (source: *Severity and relevance*, *Example event catalog*)

Three levels, `status-model.md`. Critical requires credible material impact and a clear expectation, records its reason and evidence, and is never lowered by missing ownership (fallback routing instead), acknowledgment, cover or snooze. The reason is copy on the card: *Critical because …*.

**Prototype catalog** (every row lands on a built screen):

| `eventType` (key) | Severity | Responsible (Needs action) | Requester (Waiting) | Primary action | Resolves when |
|---|---|---|---|---|---|
| `thread_response` (`thread:<id>:response:<last message>`; one per cycle: the last message starts it) | Important; Critical when confirmed | last message inbound: the thread's internal owner (sender of the last outbound, else the correspondence owner). Last message outbound: its first To recipient | the sender of the last message | *Reply* / *Open thread* | the next message in the thread, or the thread resolved. Skipped when the awaited party holds the linked RFI's step (the RFI item is the obligation; THR-1039 and RFI-142) |
| `thread_delivery_failed` (`thread:<id>:delivery:<message>`) | Important; Critical when the thread's obligation is Critical | the sender | — | *Update contact and resend* | resent (`resolvedBounces`); kept 30 days as Resolved |
| `thread_unmatched` (`thread:<id>:link`) | Important (triage) | the project correspondence owner (Sarah), fallback Alex | the sender | *Link to record* | linked (the *Linked to* event); then a `thread_response` may follow |
| `rfi_step` (`rfi:<id>:<action>:<step>`) | Important; Critical when confirmed (RFI-142, seed) | the step's party (an assignment changes it) | the RFI's creator (when the creator holds the step, responsibility wins) | *Open step* (RFI › Workflow) | the step completes; steps completed in the demo stay as Resolved |
| `rfi_step_returned` | Important | the step's party | the creator | *Open step* | revised |
| `drawing_revision_published` (seed) | Update | — (internal roles watch) | — | *View revision* | seen |
| `manual_critical` | Critical | the item's responsible | — | the item's action | the source resolves, or an override |

Kenji's emailed answer on RFI-142 arrives as an inbound reply on THR-1039: a `thread_response` for Alex (*Reply to Kenji*) that *Add to Q&A* resolves (Q-A8; `addToQa` sets the thread Resolved) while the RFI's step stays until Route.

**The seeded Critical** (`seed.js`): RFI-142's Respond step is due today; Carlos Reyes confirmed on site at 07:40 that framing at Grid D-7 has stopped. Responsible Kenji Takahashi (the step's party, external), requester Alex Morgan (Waiting, accountable for the follow-up), fallback Carlos, the PM sees it under *Project oversight*. Marked 07:45; acknowledgment due 11:45 (Q-A7). Evidence on the card: *Carlos Reyes, 16 Oct 07:40: "OR 2.14 top track is stopped until the termination height is answered. The crew moves to the corridors today and runs out of work Monday."*

**Catalog the product adds, not in this prototype** (no screens here; rules from the source for the Figma review): contract approval blocking an authorised start (P1 under the impact rule), pay application awaiting approval (P2; P1 under a deadline or exposure rule), materially overdue invoice (P1 or P2 by aging and value), credible immediate safety issue (P1 under the safety policy), field issue blocking planned work (P2; P1 when confirmed), critical-path impact (P1 only with sufficient schedule evidence), schedule import or sheet processing completed (P3).

**Mark as critical** (manual, any internal role on items they own; PM on any): outcome Critical with a required reason; sets the acknowledgment deadline and the fallback. The AI "Potential critical" flag is not built (`00-plan.md` §2).

**Override** (PM, Q-A6): outcome false positive · duplicate of … · condition resolved · accepted risk (with a review date), required reason; an audit row with actor, time, old and new severity, reason. Accepted risk keeps the source's state and owner. Personal archive or dismissing the banner never changes severity.

## 6. Views, counts and ordering (source: *Navigation and triage*)

- **Needs action**: open obligations whose next action is the viewer's or their cover's. Critical first, then Overdue and Due today, then the rest by age.
- **Waiting**: open commitments owed by another party that the viewer must follow up. Critical first, then Overdue, then expected response date.
- **Updates**: informational events the viewer may see, grouped by record, newest first. *Mark updates reviewed* in the menu; it never touches an obligation.
- **All**: everything the viewer may see, open and resolved (resolved kept 30 days in the demo), searchable on the full page.
- **Critical** is a section at the top of each view and a quick filter, not a view. Overdue and Unmatched are filters.
- **Bell count** = distinct open Needs action items for the viewer or their cover; excludes Updates and Watching. Snoozed items stay in the total and show as a subtotal line in the drawer (*3 snoozed*). Team items are never in the bell.
- **Critical state** on the bell and in the drawer header: *Critical, not acknowledged* (strong) vs *Critical, acknowledged* (muted), counting Critical items in the viewer's Needs action and Waiting, and, for the PM, every Critical on the project (*Project oversight*: in the Critical section, never in the bell count). Acknowledged never reads as resolved.
- **Scope**: All projects / Current project. One project in the MVP (counts equal; Q-A3).

## 7. Arrival (source: *Arrival and mobile behavior*)

When a Critical item is created for the viewer, in order: the item and its projection exist; the bell's critical state updates; the **banner** appears above the content area of whatever screen is open (NotificationBar: *Critical · RFI-142 structural answer overdue, blocks the Level 3 deck pour* · *Acknowledge* · *Open* · dismiss); mail and push are assumed to go out as one delivery of the same item; the acknowledgment timer starts; after the deadline the fallback is notified (shown as a history row and *Project fallback* routing on Carlos's card).

Never: auto-open the drawer, steal focus, discard an edit, replay the banner on the next navigation, show a blocking dialog. Re-notification only for a material change or an escalation, each a history row on the same card. An Important item arrives silently (badge count); an Update never changes the badge.

**Simulate event** (sandbox bar, `prototype.events`): *Critical: delivery failed on a critical thread*, *Reminder: THR-1031 still overdue* (one card gains a history row, the count is unchanged), *Reassign RFI-143's step to me*, *Sarah's cover starts*. Writes to the session; Reset clears.

Assumed: push deep links restore the destination after sign-in; offline acknowledgments queue with *Pending sync* and never stop the server's clock (*Offline and synchronization*); not demoed.

## 8. Actions and transitions (source: *Transitions and completion*)

| Action | Who | Effect | Never |
|---|---|---|---|
| Seen | the viewer, by opening the record | `engagement = seen`; the dot goes | acknowledges or resolves |
| **Acknowledge** | the responsible viewer or cover | `engagement = acknowledged` with time; the Critical state turns acknowledged; stops the acknowledgment clock only | changes severity, status or Overdue |
| **Snooze** (until tomorrow, next Monday, the due date, a date) | the viewer | `presentation = snoozed`; leaves the view, stays in the count's subtotal; a Critical keeps its signal and its escalation; bounded to the due date for Critical | pauses a deadline or team escalation |
| **Assign** / delegate | internal roles, by the record's rules | the record's responsible party changes; the incoming owner gets the item Unseen; history keeps the chain | lowers severity |
| Take ownership | internal roles | the same as Assign to self; offered on fallback-routed cards | — |
| **Resolve** | the source only (reply sent, resent, linked, step completed, reviewed) | `workStatus = resolved`; the card leaves Needs action and Waiting | from the card directly (no *Resolve* button; "Mark updates reviewed" is for Updates only) |
| Reopen | the source (a new event on a resolved obligation) | the item reopens with its history; a materially changed Critical needs a new acknowledgment | — |
| Archive | the viewer, open Important or any resolved | `presentation = archived` (All view) | an open Critical |
| Mark as critical, Override | §5 | | |

Every action is a history row (`status-model.md` audit vocabulary). Bulk: Acknowledge only, on the full page, on items the viewer may acknowledge; never bulk override, never bulk approve.

## 9. Ownership, fallback and cover (source: *Ownership and escalation*)

- **Project fallback role**: Carlos Reyes (General Superintendent), backup Sarah Jenkins. An item with no eligible owner (a step whose party left the project; an unmatched mail with no correspondence owner) routes to the fallback with `routing = fallback`, severity unchanged, and a history row *Routed to the project fallback: no eligible owner*. Assumed: a company-level fallback and an operational exception when nobody is eligible; a restricted *needs an authorised owner* notice that reveals no content.
- **Two clocks**: the acknowledgment clock (Critical; stops at acknowledgment; escalates to the fallback at the deadline) and the obligation clock (due date; never stopped by acknowledgment, snooze or cover). Both show on the card where they apply.
- **Cover (out of office)** on `notifications-preferences`: delegate (internal roles with access), dates, then a **preview** of what will be covered (open Needs action, Overdue, Waiting follow-ups) and what will not (Confidential threads the delegate isn't on, with the reason; cost-restricted items), the dates and the delegate. *Start cover* writes `COVER_STARTED`; the delegate's cards show *Covering for Sarah Jenkins*; new items for Sarah route to both. *End cover* (or the end date) returns unresolved items to Sarah with a history row; nothing is dropped silently. Cover is temporary; it never transfers formal workflow ownership (Assign does that).
- Assumed: account deactivation and project removal trigger the same review; not demoed.

## 10. Email and workflow semantics (source: *Unified email behavior*)

The Email module is unchanged. Mapping of its events and actions to items:

| Event or action (Email, RFI) | Conversation | Item | Formal workflow |
|---|---|---|---|
| Inbound reply (`receiveMail` as a reply) | appended to the thread | the requester's Waiting item resolves; a Needs action item (review) for the thread's owner | none |
| Outbound request (`sendMessage`, `createThread` with Response due) | stored with the expected responder | the sender is Waiting; the responder (a guest with an account) has Needs action | none |
| Courtesy reply ("Looking into it"), out-of-office | stored; automated replies classified as evidence | does **not** resolve the Waiting item (the card shows *Automated reply received*) | none |
| *Add to Q&A* (`addToQa`, D-49) | the step is filed with provenance | resolves the review item (Q-A8) | the RFI stays open; Review makes it official |
| Route / Approve / Revise / Reject / Close (`routeRfi` …) | *Notify by email* as today | the step's party gets Needs action; the router is Waiting; Close resolves every item on the RFI | the permitted transition |
| Delivery failure (bounce) | the recipient-level evidence and the InlineNotice | a corrective item *Delivery failed* for the sender; Critical when the thread is | the original response obligation remains |
| *Update contact and resend* | resent | the corrective item resolves | — |
| *Link to record* on Unmatched | linked | the triage item resolves; a Needs action item may follow from the thread's state | none |

- **No email keywords** (`#RESOLVE`, `#APPROVE`); a mail's link opens the record and, for a consequential action, the in-app confirmation showing the current record state; opening or scanning the link executes nothing. Assumed server-side: authorisation, state check, replay protection (OWASP CSRF and transaction authorisation, cited in the source).
- **Cadence** (`../correspondence/spec.md` §7 kept): Needs action mail once on entry; the deadline mail then one daily overdue digest; Delivery failed at once. No separate alert mail for an event whose conversation mail already went to the same person unless the alert adds a required action; an internal user opening a card never suppresses a required external mail; Updates default to digest or none.
- **Response obligations**: one per expected party and response cycle; the project working calendar (Mon–Fri, three working days by default); the deadline is never extended by a reply or a reminder.
- Assumed: idempotent ingestion by message identity, a restricted triage queue for parsing failures, receipt and processing times both retained (*Email ingestion reliability*).

## 11. Preferences and governance (source: *Preferences and governance*)

**Hierarchy**: company requirements → project policy → role defaults → personal preferences → quiet hours and cover. A locked row shows *Set by Vanguard Construction Group policy* with a tooltip naming the reason. Mandatory delivery is per event (Q-A10: Delivery failed; any Critical for its owner), not "every Critical bypasses everything".

**`notifications-preferences`**:
- **Preset** (Radio): Project manager · Project engineer · Superintendent · Accounting · Owner · Custom. A preset sets delivery defaults; it grants nothing and changes no ownership. Copy under the control says so.
- **Matrix** (table, one row per event family: Correspondence · RFIs and Submittals · Drawings and documents · Field and safety · Financials · Contracts · Scheduling · System processing; columns In app · Email · Push; each cell Immediate · Digest · Off; locked cells shown as text with the lock reason). Event families outside the prototype are listed (the policy applies to them) but their rows note *No events in this demo*.
- **Quiet hours**: days, from, to, timezone; the exceptions line lists the mandatory events that still deliver.
- **Delegation**: §9.
- **Advanced**: a disclosure with per-event overrides within policy (not built beyond the disclosure; flagged).

**Audit** (source: *P1 override controls*): every severity change, override, acknowledgment, snooze, assignment and cover is an append-only history row with actor, time, old and new values, reason and the originating action. "Tamper-evident" is not claimed in copy.

## 12. States and copy

| Surface | State | Copy |
|---|---|---|
| Bell | no items | no badge |
| Bell | critical unacknowledged | badge status `error`-free: strong warning count; tooltip *2 need action · 1 critical, not acknowledged* |
| Drawer › Needs action | empty | *Nothing needs your action.* with *Check Waiting* |
| Drawer › Waiting | empty | *You're not waiting on anyone.* |
| Drawer › Updates | empty | *No updates since you last looked.* |
| Drawer › All | empty | *No notifications yet.* |
| Drawer | loading | skeleton rows (three) after 200ms |
| Drawer | error | *Couldn't load notifications.* + Retry |
| Drawer | snoozed subtotal | *3 snoozed* link under the tabs (opens the Snoozed filter on the full page) |
| Card (Critical) | — | chip **Critical** · *Critical because the lead-lined partition answer is due today and Carlos Reyes confirmed on site that framing at Grid D-7 has stopped* · *Respond RFI-142: Level 2 Operating Room lead-lined partition termination* · RFI-142 · *Waiting on Kenji Takahashi · You asked for this · fallback Carlos Reyes* · chip **Due today** · *Acknowledge by 11:45* · evidence line · *Open step* |
| Card (Waiting) | — | title · *Waiting on Elena Rostova, PE · due 21 Oct* · *You asked for this* |
| Card | covering | *Covering for Sarah Jenkins* |
| Card | fallback | *Project fallback: no eligible owner* with *Take ownership* |
| Card | resolved since | *Resolved by Alex Morgan, 17 Oct* (All view) |
| Card | automated reply | *Automated reply received 16 Oct; a response is still expected* |
| Banner | Critical arrived | *Critical · Delivery failed: Kenji Takahashi, AIA didn't receive "RFI-142 — Level 2 OR lead-lined drywall termination". ktakahashi@studio-arch.com: 550 5.2.2 Mailbox full.* *Acknowledge* · *Open* · ✕ |
| Override modal | — | title *Change severity of RFI-142*; outcome; *Reason (required)*; *Change severity*; the line *The RFI stays open and with Kenji Takahashi.* |
| Override, PE | disabled | *Only a project manager can change a Critical item.* |
| Assign modal | — | *Assign to*; *Note to the new owner (optional)*; *Assign* |
| Full page | empty segment | the drawer's copy for that view |
| Full page | bulk | *Acknowledge 4* in the toolbar; rows the viewer may not acknowledge stay unselected with a tooltip |
| Preferences | locked | *Set by Vanguard Construction Group policy* |
| Preferences › Delegation | preview | *Alex Morgan will cover 7 items from Thu 29 Oct to Wed 12 Nov. Not covered: 1 Confidential thread (Alex is not a participant).* |
| Preferences › Delegation | active | *Alex Morgan is covering for you until 12 Nov.* with *End cover* |
| Lost access | — | *You no longer have access to this item.* |

Buttons are label-only (D-17). Status is text plus colour, never colour alone.

## 13. Assumed platform behaviour, not shown

Pointers to the source for the engineering reader: *Email ingestion reliability* (idempotent processing, message identity, triage queue); *Processing sequence* and *Canonical records* (the server's item, responsibility, engagement, channel and audit records, the dedup key); *Schedule fidelity* (derived critical-path severity suspended on stale data, never auto-downgrading an existing Critical); *Offline and synchronization*; *Security and continuity* (recheck on open, no count leakage, delivery evidence retained); *Migration* (no conversion of the unread backlog into obligations; read history is not acknowledgment); *Delivery roadmap* (Release 1 triage, 2 correspondence, 3 policy, 4 assisted relevance: this prototype is 1 + 2).

## 14. Follow-ups

A second project and a company-level view; the finance, safety and schedule catalog with its screens; AI *Potential critical* triage with evidence excerpts and a correction path (D-44 rules apply); the mobile bottom tab; offline queueing; push; per-event advanced overrides; the Notification Log's redesign; SMS as a separately approved scope.

## 15. Sizes

Drawer: SlideOverPanel `md` (560; full width below 640). Cards: one container level, hairline-separated rows, 16px side gutter at 390. Full page: `AppShell` content, DataGrid full width. Preferences: centred column `max-w-4xl` with the fixed bottom panel aligned (D-19, D-20). Modals: ModalV2 compact.

# Unified Notifications and Email Communication Model

**Version:** 2.0 — Consolidated proposal  
**Date:** October 26, 2026  
**Audience:** Product, design, engineering, and implementation teams  
**Status:** Proposed product strategy and functional architecture

## Product direction

Upgrade notifications into a **role-aware Attention Center** that helps SMB construction users identify risk, understand responsibility, and take the next action without sorting through an undifferentiated activity stream.

Keep Attention accessible throughout the platform: from the global top bar on desktop and a persistent navigation entry on mobile. Organize the experience around **Needs action, Waiting, Updates, and All**, with **Critical** items prominently surfaced. Use three severity levels—**Critical, Important, and Update**—without confusing severity with read status, acknowledgment, due status, or completion.

Connect Attention to the redesigned Email / Correspondence feature through shared events, record links, responsibility, and response obligations. Preserve the ability to conduct ordinary correspondence from Outlook or Gmail while Linarc retains the project record, as defined in the supplied correspondence specification.

**Do not automatically open the Attention drawer for routine Critical arrivals.** Use a persistent indicator and nonblocking banner instead. Reserve forced interruption for narrowly defined conditions where continuing without a decision is unsafe or impossible. The Attention Center is not a replacement for emergency communication procedures or a guaranteed life-safety alerting service.

Unless explicitly described as existing behavior, the requirements below are proposed changes. This version integrates the reviewed amendment topics into the main architecture rather than maintaining a separate addendum.

## Design principles

- **Prioritize consequences, not chronology.** Business impact, required action, time sensitivity, and responsibility determine prominence.
- **Separate attention from activity.** Not every recorded event deserves a notification or badge.
- **Separate conversation from authorization.** Receiving or sending email is not equivalent to approving, paying, closing, or accepting a formal obligation.
- **Keep one authoritative obligation.** Channel deliveries and UI surfaces reference the same underlying item; they do not create separate work queues.
- **Keep source workflows authoritative.** Attention routes work and exposes safe actions; it does not become a second task-management system.
- **Make criticality explainable.** Show why an item is Critical, what action is expected, and who is accountable.
- **Never downgrade risk because ownership or data is missing.** Expose uncertainty and use fallback routing.
- **Design for mobile and intermittent connectivity.** Never imply that an offline acknowledgment has reached the team before the server confirms it.
- **Preserve access boundaries everywhere.** The same permissions apply to cards, counts, emails, push previews, search, digests, and AI-generated content.

## Current-state assessment

The supplied screenshot shows a chronological notification drawer with All / Unread, date groupings, unread indicators, Mark all as read, and counts of 1,323 new and 1,341 total. Payment delinquency, schedule imports, sheet analysis, document processing, and financial workflow updates receive similar visual treatment.

The design problem is structural: read status does not explain ownership or completion, recent events can obscure older risks, and background processing competes with obligations requiring human action. The new experience should not simply add severity colors to the existing list.

The current project Notification Log documents project alerts, reminders, messages, delivery channels, and delivery status. Preserve that historical delivery view rather than turning it into the primary daily triage experience. See the existing [project notification documentation](https://help.linarc.io/support/solutions/articles/1060000150416-view-project-notifications).

The correspondence specification adds record-linked conversations, contextual compose, inbound project email, response due dates, internal notes, secure links, delivery evidence, and Email views for Needs action, Waiting, Overdue, and Unmatched. Reuse these concepts, while clarifying the difference between correspondence handling and formal workflow completion.

The linked general notification and preferences articles were not fully retrievable during this revision. Detailed existing preference behavior must therefore be checked against the live product before implementation; this proposal does not claim an exact parity inventory for those screens.

## Communication architecture

### Surface responsibilities

| Surface | Primary question | Owns or displays | Boundary |
|---|---|---|---|
| **Attention Center** | What deserves this person's attention now? | Relevant obligations, risks, reviewable updates, routing, acknowledgment | Does not own an independent task lifecycle |
| **Email / Correspondence** | What was communicated, to whom, and what response is expected? | Messages, participants, record links, response obligations, delivery evidence | A reply does not automatically approve or close the source workflow |
| **Tasks and workflows** | Who owes what, by when, and what counts as complete? | Assignments, ball-in-court, due dates, approvals, formal completion | Remains the authority for work execution |
| **Activity and delivery logs** | What happened, and how was it delivered? | Domain events, administrative changes, notification attempts, outcomes | Does not interrupt users for every event |

### Shared object model

Use **one canonical attention item per distinct active obligation or condition**, with recipient-specific views and multiple delivery records. A record may legitimately have several distinct obligations—for example, a pay application approval and a separate delivery failure affecting its supporting correspondence.

An event is not an inbox row. A new event can create an item, update an existing item, resolve an item, or produce no Attention item at all. Repeated reminders about the same overdue invoice update that item's timeline rather than creating new unread work.

Different participants can see different action states for the same obligation: the PM can be Waiting while the reviewer has Needs action. The system must derive those views from responsibility, not flip a single global thread state whenever anyone replies.

### No shadow tasks

Do not allow standalone task creation inside Attention. If a user needs to create work, open the appropriate source-module creation flow and link the resulting record.

Inline actions may acknowledge, request reassignment, snooze where allowed, link correspondence, or execute an explicitly supported source action. Multi-step review, financial approval, workflow routing, and sub-task management belong in the source module. Every inline mutation uses the same authorization, validation, and audit rules as its source-screen equivalent.

## Severity and relevance

### Three-level model

| Internal level | User label | Definition | Default delivery |
|---|---|---|---|
| **P1** | **Critical** | Credible material exposure or serious operational blockage requiring prompt human attention | Immediate in-app signal and persistent critical indicator; email/push according to mandatory policy and available channels |
| **P2** | **Important** | Meaningful action or review required within normal project operating timeframes | Immediate in-app; email immediate or digested according to event policy and preference |
| **P3** | **Update** | Informational change, completion, or publication without a current assigned obligation | Updates feed; digest or no email by default; no interruptive banner |

Severity must consider impact, required response, deadline, affected work, and accountable party. Module name alone is insufficient: a contract is not always Critical, and a field issue is not always merely Important.

P1 classification requires credible material impact and a clear review or response expectation. It must record its reason and evidence. Missing ownership triggers fallback routing; it does not invalidate the classification. Acknowledgment and delegation do not lower severity.

An informational publication and an assigned review are different conditions. A drawing publication can generate an Update for watchers and a distinct review obligation for an assigned reviewer without creating two copies of the same obligation for that reviewer.

### Persona defaults

Use personas to configure defaults, not to grant permissions. Actual routing depends on project membership, workflow responsibility, company relationship, participation, delegation, and authorization.

| Persona | Prioritize | Usually digest or suppress |
|---|---|---|
| **Owner / executive** | Material cash exposure, contract decisions, major changes, significant schedule risk, unresolved escalations | Processing completions, ordinary comments, minor changes |
| **Project manager** | Approvals, commercial exposure, field blockers, overdue external commitments, unmatched correspondence | Successful imports and routine processing |
| **Superintendent** | Safety-related issues, field blockers, inspections, near-term schedule impacts, field-relevant revisions | Office-only administration outside assigned responsibility |
| **Project engineer / coordinator** | RFI/Submittal actions, document reviews, correspondence triage, delivery failures | Financial details outside permission scope |
| **Accounting / controller** | Pay applications, invoices, approvals, aging, compliance, financially relevant changes | Field coordination without financial consequence |
| **Trade partner / guest** | Their assigned obligations, permitted mentions, shared revisions, participating threads | Internal notes, confidential material, unshared financials, unrelated company work |

Support users with multiple roles. Explain routing with copy such as “Assigned to you,” “Project fallback,” “Covering for Alex,” or “Watching this record.” Watchers do not inherit ownership merely by receiving a notification.

### Example event catalog

The following are proposed classification examples, not fixed thresholds or claims about current behavior.

| Event | Classification | Responsible audience | Primary action |
|---|---|---|---|
| Contract approval blocks an authorized start | P1 when the approved impact rule is met; otherwise P2 | Contract approver, PM | Review contract |
| Pay application awaiting approval | P2; P1 when a material deadline/exposure rule is met | Current approver, accounting | Review pay application |
| Materially overdue invoice | P1 or P2 under aging/value policy | Accounting, accountable PM | Review follow-up |
| Credible immediate safety issue | P1 under approved safety policy | Designated field/safety owner, fallback | Review issue and follow established response procedure |
| Field issue blocks planned work | P2; P1 if material impact is confirmed | Superintendent, PM | Open issue |
| Critical-path impact exceeds policy | P1 only with sufficient schedule evidence | PM, scheduler | Review impact |
| RFI/Submittal response overdue | P2; P1 only with additional material impact | Current responsible party | Open record |
| New correspondence requiring a response | P2 | Thread/response owner | Reply |
| Delivery failure | P2; P1 if a critical communication is jeopardized | Sender, accountable owner | Update contact and resend |
| Unmatched project email | P2 triage by default; expedited flag when warranted | PM, PE, fallback | Review and link |
| New drawing revision published | P3; assigned review is a separate obligation | Authorized watchers/reviewers | View revision |
| Schedule import or sheet processing completed | P3 unless an explicit review obligation exists | Initiator, selected watchers | View results |

## Independent state dimensions

Do not implement a flat enum containing Unread, Acknowledged, Waiting, Overdue, Snoozed, and Resolved. These concepts can coexist.

| Dimension | Values or fields | Scope |
|---|---|---|
| **Severity** | Critical, Important, Update; reason and evidence | Canonical condition |
| **Work status** | Needs action, Waiting, Resolved; not applicable for informational updates | Derived for each accountable party from the shared obligation |
| **Recipient engagement** | Unseen, Seen, Acknowledged; relevant timestamps/version | Individual recipient, synchronized across devices |
| **Timing** | Due soon, Overdue, acknowledgment deadline, follow-up date | Corresponding obligation or responsibility |
| **Presentation** | Snoozed until a time/event; archived from personal view where allowed | Individual recipient, subject to policy |
| **Delivery** | Pending, provider accepted, failed, or other supported evidence | Channel delivery attempt |

A valid item can be **Critical + Needs action + Acknowledged + Overdue**. An acknowledged overdue payment is still overdue. Opening a thread does not mean accepting responsibility, and dismissing a banner does not change the obligation.

### Transitions and completion

- **Seen:** Records that the recipient opened the relevant content; does not acknowledge or resolve it.
- **Acknowledge:** Explicitly confirms awareness. If the product also offers Take ownership, make that a separate assignment action.
- **Assign/delegate:** Changes accountable responsibility through source rules. Notify the incoming owner and preserve history.
- **Waiting:** Identifies an outstanding response owed by another party, with that party and expected date visible.
- **Resolve:** Occurs when the specific obligation is fulfilled or an authorized exceptional closure is recorded.
- **Snooze:** Changes personal presentation only; does not pause a contractual clock, change severity, or cancel team escalation.
- **Reopen:** Re-evaluates the obligation and responsible audience. A materially changed P1 may require a new acknowledgment under policy.

For P1, personal snooze must be bounded and must not remove the persistent critical signal or hide unacknowledged work from accountable oversight. Mark updates reviewed may clear Update engagement indicators, but cannot acknowledge, resolve, or downgrade P1/P2 obligations.

## Navigation and triage

### Desktop access

Provide a global top-bar Attention control on company, portfolio, and project screens. Opening it must preserve the current page and unsaved work. Default scope is the user's authorized cross-project attention, with a visible All projects / Current project switch; never silently hide another project's critical item when entering a project.

Show the count of distinct active Needs action items assigned to the user or their explicit coverage responsibilities. Exclude informational updates and watcher-only items from the primary count. Snoozed obligations remain in the total, with a visible snoozed subtotal so the count is explainable.

A separate critical signal identifies active P1 items for the responsible user, including P1 items being monitored in Waiting. Distinguish “Critical — not acknowledged” from “Critical — acknowledged” without implying that acknowledgment resolved the condition. Broader team oversight counts belong in an explicitly selected Team view.

### Primary views

| View | Includes | Default organization |
|---|---|---|
| **Needs action** | Open obligations whose next action belongs to the viewer or covered responsibility | Critical first, then overdue/due soon, then other Important |
| **Waiting** | Open commitments owed by another party that the viewer is accountable for following up | Critical first, then overdue, then expected response date |
| **Updates** | Authorized informational events without an outstanding assigned obligation | Grouped by record/batch, then recency |
| **All** | Authorized active and retained closed items | Searchable and filterable history |

Critical is a prominent section and filter, not the only way to organize work. Overdue is a timing filter, not a mutually exclusive state. Unmatched remains a correspondence-linking filter and can coexist with Needs action or Overdue.

### Full-page Attention

Provide a larger workspace for cross-project and team triage. Support project, responsible person, company, source module, severity, due date, age, and state filters. Include My responsibilities, My team, and Watching scopes with distinct counts and permission checks.

Allow safe bulk acknowledgment or assignment only where the source rules permit it. Do not offer one-click bulk financial approval or unrestricted bulk P1 dismissal. Reuse saved views for payment exposure, field blockers, overdue responses, and unmatched correspondence.

### Item content

Every actionable card must show severity, event/obligation title, impact, project and record, responsible party, due/response-due date where applicable, and one clear primary action. Secondary actions may include Acknowledge, Assign, Snooze, and View history where allowed.

Use compact text labels and icons; never rely on color alone. Explain conditional escalation, for example: “Critical because approval is overdue and blocks the authorized start.” Include source-data freshness where the classification depends on a calculation.

## Arrival and mobile behavior

### Critical arrival

1. Create or update the canonical item and its responsibility projection.
2. Update the persistent critical indicator.
3. Present a nonblocking banner to the responsible user when appropriate to the current session.
4. Deliver configured email/push without duplicating the underlying work item.
5. Start the applicable acknowledgment and follow-up timers.
6. Escalate to eligible coverage if the policy condition remains unmet.

Do not automatically open the drawer, steal focus, discard edits, or repeatedly replay the same banner on navigation. Re-notification is appropriate for defined material changes or escalation—not every refresh.

Blocking dialogs require a separately approved use case where continued interaction depends on an immediate decision. Financial importance by itself is not sufficient. Safety-critical operating procedures remain independent of whether a user has an active session or working push channel.

### Mobile entry and actions

Require persistent access and critical badging in the mobile application shell. A dedicated bottom-navigation tab is an option to validate against the broader navigation model, not a mandatory implementation detail.

Provide large, explicit quick actions. A swipe may reveal Acknowledge or Snooze, but do not silently acknowledge or resolve a P1 on a full swipe. Provide equivalent tap-accessible controls and assistive-technology labels. W3C guidance requires single-pointer alternatives for functionality implemented with path-based gestures; see [Pointer Gestures](https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures.html).

Push notifications must deep-link to the relevant record, thread, or contextual Attention item. After authentication, restore the intended destination. If access was removed or the item was resolved, explain the current state rather than redirecting silently to a generic home screen. Use privacy-safe lock-screen previews.

### Offline and synchronization

Show last-sync time and stale-data indicators when offline. Supported acknowledgment or low-risk actions may queue locally, with clear “Pending sync” presentation; server acknowledgment timers do not stop until the server accepts the action.

Recheck permissions, item version, and source state on synchronization. Conflicts must return a clear outcome such as “Already resolved by another user” or “Assignment changed — review current owner.” Financial approval and other high-consequence mutations require online server validation in the initial release.

## Ownership and escalation

### Fallback routing

Configure a Project Fallback Role with a named eligible recipient and backup. Missing or invalid assignment routes a credible P1 to that fallback without lowering severity.

If nobody eligible is available, escalate to an authorized company-level fallback and generate an operational routing exception. Never route protected content to an arbitrary administrator merely because that account exists. A restricted “Critical item needs an authorized owner” notification can expose the routing problem without revealing confidential details.

Assignment does not remove P1 status. Acknowledgment confirms awareness; delegation establishes coverage; resolution or an authorized impact reassessment changes the condition.

### Two escalation clocks

Maintain separate policies for **unacknowledged alerts** and **unresolved obligations**. Acknowledgment stops only the relevant acknowledgment escalation. It does not stop due-date, unresolved-risk, or contractual escalation.

Define recipient, backup, clock, timezone/calendar, retry behavior, and escalation stop conditions per event type. Display the policy to affected users. Provider acceptance of an email or push does not count as human acknowledgment.

### Active delegation

Out-of-office setup must review both new routing and existing obligations: Needs action, overdue work, and Waiting items needing follow-up. Offer a preview of covered items, excluded items, coverage dates, and the incoming delegate.

Validate delegate eligibility and access; do not grant confidential-thread or financial privileges automatically. Unsupported transfers remain with the original owner plus an authorized fallback until resolved. Distinguish temporary coverage from permanent workflow reassignment, preserve history, and define end-of-coverage behavior so unresolved work is not silently dropped or blindly reassigned.

Account deactivation and project removal must trigger the same responsibility review even when the departing user cannot configure delegation.

## Unified email behavior

### Preserve the correspondence design

Retain contextual compose, pinned record/revision links, internal notes, inbound reply threading, project email addresses, secure recipient pages, delivery evidence, and the record's Email tab from the supplied correspondence specification.

Ordinary correspondence remains replyable from Outlook/Gmail. A notification connected to a thread can accept a reply into that thread; a system-only notification must not imply that replying approves an invoice, acknowledges a safety instruction, or executes another unsupported command.

The source specification uses a three-working-day default response due, with the workflow step's due date available in record context. Define one authoritative response obligation per expected party/response cycle, using an explicit message date or applicable workflow deadline. Capture project working calendar and timezone; do not extend the original deadline automatically with every reply or reminder.

### Reply and workflow semantics

| Event or action | Conversation effect | Attention effect | Formal workflow effect |
|---|---|---|---|
| Inbound participant reply | Append and thread the message | Route review to accountable recipient; satisfy only a response-received condition that the event contract explicitly defines | None by default |
| Outbound substantive request | Store message and expected responder | Sender may be Waiting; responder may have Needs action | Only an explicit source action can transfer formal responsibility |
| Courtesy reply or “Looking into it” | Preserve correspondence | Does not automatically clear the underlying obligation | None |
| Out-of-office or automated reply | Store/classify as automated evidence | Does not satisfy the requested substantive response | None |
| Authorized Add to Q&A | File selected content with provenance | May resolve the email-filing/review obligation | Does not automatically approve or close the RFI |
| Authorized Approve / Close | Record explicit action | Resolve the corresponding completed obligation | Execute the permitted source transition |
| Delivery failure | Append recipient-level failure evidence | Create/update corrective obligation | Does not fulfill the original response obligation |

The supplied RFI design already separates Add to Q&A from Respond, Review, Approve, and Close. Preserve that distinction. Completing correspondence handling must not silently complete the linked RFI, payment, or contract workflow.

### Secure consequential actions

Do not implement email keywords such as `#RESOLVE` or `#APPROVE` in the initial release. High-consequence actions require an explicit authorized confirmation in the web or native application, showing the current record and significant details.

An email link opens that confirmation; opening or scanning the link must not execute the action. Enforce authorization, current record state, replay protection, and applicable request protection server-side. OWASP advises against state-changing GET requests and requires server-enforced transaction authorization; see [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) and [transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html).

A secure correspondence-viewing token is not automatically permission to approve a workflow. Access and action authorization must remain distinct.

### Email ingestion reliability

Record receipt, ingestion, threading, and processing failures independently. Use message identity and idempotent processing to avoid duplicate messages or state transitions on retry. Validate participant identity and thread association; ambiguous or unauthorized mail must not mutate formal workflows.

If parsing or threading fails, preserve the message in a restricted triage queue with a corrective action. If arrival time and processing time differ, retain both. A rule that recognizes a qualifying response uses the verified receipt evidence rather than pretending it was processed instantly; any resulting timing correction remains auditable.

### Delivery cadence

Preserve the correspondence proposal's once-on-entry Needs action email, deadline notification, consolidated daily overdue digest, and immediate delivery-failure handling, subject to the unified policy layer.

Avoid duplicating an outbound conversation email with a separate alert email to the same recipient for the same event unless the alert adds a distinct required action. Do not suppress a required external email merely because an internal user opened a card. Routine Updates default to a digest or no email; ordinary overdue reminders do not become new attention items.

## Unmatched mail and AI

Unmatched is a linking condition, not a severity or indication that no response is needed. Route ordinary unmatched mail requiring triage to the designated project correspondence owner as P2; show unassigned or aging exceptions.

When automated priority assistance is introduced, use contextual evidence to mark **Potential critical — review required**. Terms such as breach, injury, or stop work are signals, not sufficient proof. Distinguish a new stop-work notice from a withdrawn notice, quoted history, training content, or spam.

Only an approved deterministic rule or authorized human confirmation establishes P1. A potential-critical flag may receive expedited triage delivery under policy, but remains distinguishable from confirmed criticality. Show evidence excerpts, source message, classification basis, and a correction mechanism; do not present an uncalibrated AI confidence number as certainty.

AI output cannot approve, resolve, send external correspondence, or downgrade a P1. The thread and manual triage must work if AI fails. Preserve permission-aware summaries and human-reviewed drafting from the correspondence design. NIST identifies erroneous generated content and overreliance as relevant generative-AI risks; see its [Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf).

Automated scanning is a later enhancement, not a prerequisite for the initial Attention launch. From the first release, provide manual escalation and accountable unmatched-mail triage. Never imply that an unflagged email has been verified as low risk.

## Preferences and governance

### Policy hierarchy

Apply documented company requirements, then project policy, role defaults, personal preferences, and temporary quiet hours/coverage. Higher-priority requirements constrain lower-level controls, and locked settings must explain who set them and why.

Mandatory delivery is an explicit event policy—not a blanket assumption that every P1 bypasses every user setting. Configure quiet-hour exceptions and acknowledge operating-system delivery limits. Users must understand the difference between muting optional delivery and removing responsibility, which preferences cannot do.

### Controls

| Area | Proposed controls |
|---|---|
| Scope | Projects, responsibility, team oversight, watching |
| Event families | Financials, contracts, scheduling, RFIs/Submittals, field/safety, documents, correspondence, system processing |
| Channel | In-app, email, mobile push; SMS only through a separately approved scope |
| Cadence | Immediate, digest, optional off |
| Quiet hours | Days, times, timezone, policy exceptions |
| Delegation | Eligible delegate, coverage period, active-item review |
| Advanced settings | Event-specific overrides within policy limits |

Start with understandable persona presets and an advanced matrix. A preset changes delivery defaults, not project permissions or source ownership.

### P1 override controls

P1 severity downgrade, exceptional closure, or risk acceptance requires an authorized role and mandatory reason. Separate false positive, duplicate, condition resolved, and accepted-risk outcomes. Accepted risk does not label the underlying workflow complete; retain its source state, accountable owner, and review date where applicable.

Write an append-only, access-controlled audit history containing actor/service identity, server timestamp, item and source references, old/new severity and state, reason, policy version, evidence, and originating action/channel. Record automated changes as well as manual ones. Use “immutable” or “tamper-evident” only if the actual storage and retention controls support that claim.

Routine personal archive or banner dismissal must never act as an unrestricted P1 closure mechanism. Any authorized suppression of further delivery must show its scope and expiry and remain separate from source completion.

## Data and integration requirements

### Canonical records

| Record | Required information |
|---|---|
| **Source event** | Event ID/type, occurrence and receipt time, tenant/project, source object/version, evidence, originating actor/service |
| **Attention condition** | Stable attention ID, condition type, source references, severity/reason, lifecycle, deduplication key, policy version, timing, resolution basis |
| **Responsibility** | Accountable party, next action party, requester/follow-up owner, eligible fallback, delegation, action-state projection |
| **Recipient engagement** | User, current item revision, seen/acknowledged timestamps, acknowledgment requirement, personal snooze/archive |
| **Channel delivery** | Recipient, channel, attempt/idempotency key, queued/sent/failed evidence, retries, provider reference |
| **Audit entry** | Actor, old/new values, reason, timestamps, source and policy references |

Link thread ID, message ID, record revision, and pinned files where relevant. Treat restricted content as an authorized projection, not a generic payload that the interface later hides.

### Processing sequence

1. Validate and persist the source event idempotently.
2. Identify the condition, source authority, and applicable policy.
3. Determine or repair responsibility through eligible fallback routing.
4. Evaluate impact and data quality; record uncertainty.
5. Create, update, reopen, or resolve the canonical condition using its deduplication key.
6. Compute authorized recipient views and action eligibility.
7. Apply delivery preferences, mandatory policies, quiet hours, and deduplication.
8. Deliver and record channel outcomes.
9. Evaluate acknowledgment and unresolved-obligation escalation.
10. Reconcile derived state with the source system.

An illustrative condition key is tenant + project + source object + obligation type + response cycle/party. Do not include channel or reminder timestamp in the key. Recipient differences belong in responsibility and engagement records, not duplicate canonical obligations.

Version mutations and recheck source state before execution. Use idempotent handlers and reconciliation so duplicate or out-of-order events do not reopen completed work or overwrite newer assignments. A failed channel updates delivery evidence; it becomes a separate corrective obligation only when delivery failure itself requires action.

### Per-event readiness

Each integrated event type needs a documented contract covering source identity, accountable/fallback routing, severity rules, timing/calendar, permission scope, allowed actions, resolution/reopen rules, and data-quality limitations.

Adopt modules incrementally. Informational completion events need not supply nonexistent financial impact, and an event lacking a dependable critical-path calculation may still support a due-date reminder. Unsupported metadata must be explicit; do not invent impact or silently present unassessed risk as safe.

### Schedule fidelity

Critical-path-derived severity requires the relevant schedule version, status/data date, calculation timestamp, and sufficient relationship/logic quality. A successful sync is not proof that progress data is current.

Use configurable freshness/quality thresholds appropriate to the project update cadence; do not hard-code 14 days as a universal rule. When checks fail, suspend new derived critical-path classifications, expose the limitation, and route a data-quality review obligation.

Continue independent contractual deadlines, verified field blockers, manually confirmed impacts, and other supported alerts. Do not automatically clear or downgrade an existing P1 because the schedule becomes stale. Preserve its last calculation evidence and require policy-based or human reassessment.

## Security and continuity

Apply source permissions to notifications before delivery. Recheck authorization when a recipient opens a link or executes an action; membership, confidentiality, and assignment may have changed since sending. Counts must not reveal inaccessible records.

Keep internal notes, cost-restricted fields, confidential threads, Bcc relationships, and recipient-level delivery evidence within the access boundaries defined by the correspondence design. Generated summaries, digests, logs, search results, fallback messages, and mobile previews inherit those boundaries.

Separate transport evidence from human intent. Email delivery, link access, file download, seen status, acknowledgment, and workflow approval are distinct events. Retain delivery history even when an active item is resolved, subject to approved retention policy.

Monitor routing failures, queue backlogs, ingestion delays, and delivery degradation. A system unable to deliver a required critical alert must surface an operational exception rather than silently recording success. Document supported channels and fallback limitations.

## Delivery roadmap

### Release 1: Trustworthy triage

Ship the shared state dimensions, desktop and mobile entry points, primary views, explainable counts, scoped severity labels, contextual deep links, deduplication, and a deliberately limited event catalog.

Include basic safe preferences, eligible fallback routing, server-confirmed acknowledgment, protected P1 overrides, source-authoritative actions, audit history, and delivery monitoring from the start. These are foundations, not optional later governance. Basic mobile behavior must ship with the first field-facing release; richer offline mutation support can follow once tested.

### Release 2: Correspondence integration

Connect inbound reply, response due, delivery failure, and unmatched-mail obligations to Attention. Preserve project email, secure links, pinned records, Add to Q&A, and ordinary mailbox replies from the correspondence design.

Implement deterministic response rules, automated-reply handling, ingestion recovery, and consolidated overdue delivery. Formal approvals remain explicit authorized actions. Extend to active delegation/coverage with permission validation if not already available.

### Release 3: Advanced policy

Add advanced persona presets, saved team views, configurable multi-step escalation, policy-managed quiet-hour exceptions, sophisticated delegation handback, and broader event integrations. Expand offline-supported actions only with conflict and retry testing.

### Release 4: Assisted relevance

Add evidence-backed unmatched-mail prioritization, grouped summaries, assignment suggestions, and noise diagnostics. Retain deterministic policy or authorized confirmation as the authority for P1 classification and consequential workflow changes.

### Migration

Do not convert the historic unread backlog into active obligations. Rebuild current P1/P2 items from source truth, apply deduplication, and retain legacy notification history separately under the retention policy.

Carry forward valid preferences and explain changes to counts and categories. Do not convert read history into acknowledgment. Migrate by project/event cohort, compare routing and counts, and provide rollback for delivery policy without losing source events or audit history.

## Acceptance and validation

The following are proposed release criteria, not claims of tested performance.

| Scenario | Required outcome |
|---|---|
| P1 arrives during editing | Critical signal and nonblocking notice; edits preserved; drawer does not auto-open |
| P1 has no assigned owner | Eligible fallback receives it; severity retained; unresolved routing escalates |
| User acknowledges a P1 | Engagement changes; severity, obligation, and overdue status remain unless independently changed |
| User snoozes a P1 | Personal presentation changes within policy; critical oversight and required escalation continue |
| Multiple reminders arrive | One canonical condition with updated history, not duplicate work |
| One record has two distinct obligations | Separate conditions with clear reasons, not incorrect deduplication |
| PM awaits reviewer response | PM sees Waiting; responsible reviewer sees Needs action for the corresponding obligation |
| Courtesy or automated email arrives | Message recorded; formal workflow not approved or closed |
| Qualifying response arrives | Only the defined response-received obligation advances; substantive review may remain |
| Add to Q&A is completed | Email-filing obligation may resolve; linked RFI is not automatically closed |
| Email action link is opened/scanned | No consequential action executes without explicit authorized confirmation |
| Unmatched mail contains alarming language | Contextual potential-critical triage when available; no unsupported confirmed P1 |
| Schedule becomes stale | Unsupported new derived escalation pauses; existing P1 and independent deadlines remain visible |
| User enables delegation | Existing and new responsibilities reviewed; invalid access and uncovered work identified |
| User is deactivated | Eligible coverage/fallback assigned; no silent orphaning |
| P1 downgrade is attempted | Permission and required reason enforced; append-only audit recorded |
| Mobile device is offline | Last-sync and pending action states visible; server acknowledgment not falsely implied |
| Duplicate/out-of-order events arrive | Newer source state preserved; no duplicate approvals or reopened completed work |
| Guest or delegate lacks access | No restricted content or count leakage; safe fallback explanation |
| Legacy backlog is migrated | Active work reconstructed from source truth, not unread history |

Test with PMs, superintendents, accounting/controller users, owners, PEs/coordinators, and external participants. Include mixed-role users and real project policy variations. Validate recognition, responsibility, action selection, interruptions, and recovery—not only preference-screen comprehension.

## Success measures

- Time from P1 creation to server-confirmed acknowledgment, including failed or missing delivery.
- Time to first meaningful source action and obligation completion.
- Active Needs action and Waiting aging by role, project, and condition type.
- Percentage of P1 items with an eligible accountable owner, fallback, evidence, and clear next action.
- Critical reclassification, false-positive, and missed-critical review rates.
- Duplicate items and redundant deliveries per condition.
- Unmatched-mail triage age and response-obligation breaches.
- Email threading failures, ingestion delay, retry recovery, and invalid state transitions.
- Delegation coverage gaps and orphaned obligations.
- P1 overrides and accepted-risk items awaiting review.
- Schedule-dependent classifications withheld due to data quality.
- Optional delivery mute rates and Update-email reduction without missed obligations.

Define metric denominators, capture missing outcomes, and establish a baseline during the pilot. Do not optimize for unread clearance, drawer opens, or blanket acknowledgment as substitutes for reduced risk and completed work.

## Product decisions remaining

- Which event types and thresholds are approved for the first integrated catalog?
- Which P1 types require acknowledgment, by whom, and within which operating calendar?
- Which policies permit after-hours interruption, risk acceptance, or delivery suppression?
- Which roles can downgrade P1, accept risk, transfer formal ownership, or provide temporary coverage?
- What source action counts as completion for each obligation, including correspondence review versus formal approval?
- What schedule freshness and quality checks apply to each supported derived classification?
- Which mobile navigation placement and offline actions pass field testing?
- What retention, audit protection, secure-link authorization, and account-offboarding policies are required?

These decisions configure the proposed architecture; they must not be filled in with arbitrary universal thresholds during implementation.

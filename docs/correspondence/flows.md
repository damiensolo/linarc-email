# Correspondence — information architecture and flows

**Board:** [Email Flows](https://www.figma.com/board/OeDLoqdulJByloYjQg7U3L) (FigJam, Linarc organisation, 2026-11-10), in the format of the [Prequalification Flows](https://www.figma.com/board/GRdecgo4oYcBpArUwo8s8J/Prequalification-Flows?node-id=0-1) board: white boxes and diamonds with a grey stroke, elbowed labelled arrows, one white section per topic with a Roboto Mono heading and a one-line description. Read from `00-plan.md`, `spec.md`, `status-model.md`, `screens.md`, `rfi-integration.md`, `demo-guide.md`, the prototype records and the code (`router.js`, `nav.js`, `status.js`, `emailColumns.js`, `data/actions.js`). This file is the text of the board; the board is the picture. When a screen, view, panel or flow changes, update both (the F-036 rule for the app map applies here too).

## 1. Information architecture (board section 1)

```
Project (module, top nav) · project Riverside Medical Center
├─ Communication (tool)
│  ├─ Email (rail) → correspondence-list
│  │  ├─ Views: All · Needs action · Waiting · Overdue · Unmatched · folders Drafts · Deleted (D-67)
│  │  ├─ Reading pane view (default, D-65): Views pane · Thread list (Preview / List) · Reading pane
│  │  ├─ List view (table): columns, Filter panel, quick filters, selection toolbar
│  │  ├─ Compose panel (SlideOverPanel lg, full-screen toggle): the one ComposePanel, shared
│  │  ├─ Link to record (ModalV2 md, SmartPicker) on Unmatched rows
│  │  └─ Open / Open thread → Email thread → correspondence-thread
│  │     ├─ Title bar: subject, id, Status, Confidential, Cost impact (canSeeCost, D-66)
│  │     ├─ AI summary (3+ messages) · ThreadStream · Composer (Reply to all / Internal team note)
│  │     ├─ Promote to record (SlideOverPanel md) · Update contact and resend (ModalV2)
│  │     └─ Right panel: Linked items · Delivery
│  └─ Notifications (rail) → notifications-list, notifications-preferences (D-52; its own docs)
├─ Drawings (tool, stand-in) › Sheet → correspondence-context-dwg
│  └─ Markup pin popover: Email about this markup (→ Compose panel, revision pinned) · Open in Email
├─ RFIs (tool) › All RFIs (the RFI log) → correspondence-rfi-list
│  └─ Open → RFI detail → correspondence-context-rfi: Details · Q&A · Workflow · Email
│     ├─ Email tab: the RFI's threads with composer; Compose (panel, RFI pinned) only here (D-50)
│     ├─ Add to Q&A (SlideOverPanel md) on inbound messages (D-49)
│     ├─ Workflow move in the title bar: Route · Approve · Revise · Reject · Close (ModalV2)
│     └─ Right panel: Activity · Watchers
└─ External (no shell, reduced top nav, mobile first) › Secure link page → correspondence-portal
   └─ States: valid · expired · revoked · replied; Open in Linarc for account holders (Q-14)
```

## 2. Product model / flow (section 2)

Entry points: compose from a drawing pin (sheet and revision pinned), from a record's Email tab (RFI pinned, its PDF attached), from the Email screen (no record); an outsider emails the project address; anyone replies from their own mail client (reply token). Compose → a thread on the record in **Waiting on them** with a Sent audit row → delivery per recipient (Delivered · Link opened · Files downloaded; a bounce shows Delivery failed with Update contact and resend). The recipient answers in Linarc, from their mailbox, or on the secure link page; the reply is ingested: if the reply token matches a thread it joins it (`INBOUND_REPLY_INGESTED`), otherwise it becomes an **Unmatched** thread (`INBOUND_UNMATCHED`) until *Link to record*. The thread is then **Needs action**, with Due today / Overdue computed from Response due, and the PM's mailbox gets the Needs action, Overdue digest and Delivery failed notifications (D-42). The PM answers (reply, or an internal team note → Waiting on them), escalates (Promote to record → the RFI; the thread is its Email tab), or files the answer (Add to Q&A → Resolved).

## 3. How a thread gets its labels (section 3; `status-model.md`)

- **triage** from the last message: inbound and unanswered (or bounced) → Needs action (chip); ours → Waiting on them (word); closed → Resolved (check); composed, not sent → Draft (word).
- **sla** from Response due (default three working days): passed → Overdue (red chip); today → Due today (chip); else On track (word); none → No due date.
- **delivery** per recipient of the last outbound message: Sending → Delivered → Link opened → Files downloaded (check); not accepted → Delivery failed (red chip + notice). The thread shows its weakest recipient.
- **visibility**: Confidential (chip, participants and PMs only) or Project email (not shown). **promotion**: Promoted to RFI (link). Unmatched is a view (no linked record), not a status.

## 4. Compose flow (section 4; `spec.md` §5)

Start (pin popover, RFI Email tab, Email screen; a closed record disables Compose) → the panel with the record and revision pinned when composed from context → To / Cc / Bcc from the project directory (amber = outside the company; an address not on the project is refused with the My Team › Guests line, D-60) → Subject, Response due, Message → attachments (file, link, cloud drive, record PDF; over 20 MB or a pinned drawing goes by secure link, D-45) → Send / Save draft (kept per context, Drafts folder) / Discard (asks) → sent: the thread opens in Waiting on them with delivery per recipient; failed: InlineNotice + Retry, the panel stays.

## 5. Recipient flow (section 5; `spec.md` §10)

Mail arrives with the message, files or secure links, the pinned revision and the reply token. They reply from their mail client, open the thread in Linarc (account holders), or open the secure link (no account, a file over 20 MB, or the markup). Link state: valid → the page (sender, project, Response due, the pinned markup Current / Superseded, files of any size; opens and downloads land on the sender's Delivery tab) → reply from the page; expired (30 days) → *Send me a new link*; revoked → withdrawn, the sender named. Every path ends with the reply in the thread, copied to the recipient's mailbox, and the thread in Needs action.

## 6. Mail that arrives on its own, and mail that failed (section 6; demo Act 3)

Mail to the project address → Unmatched view → Link to record (Suggested from a code in the subject, Recent, search by kind) → the thread on the record (`RECORD_LINKED`, subject prefixed) and on the record's Email tab. A bounce (`SMTP_BOUNCED`) → Delivery failed with the SMTP reason → Update contact and resend → Delivered, `CONTACT_UPDATED` + Sent on the Delivery tab. Response due passes → Overdue → one mail at the deadline, then a daily digest → answered by reply from any mail client or in Linarc.

## 7. Escalation: Promote to RFI, and the RFI's email (section 7; `spec.md` §8, §8b)

Promote to record on an inbound message → the panel beside the thread (Title, AI-drafted Question, Assigned to, Due, files to include); Create RFI stays disabled until the Question has been visited (D-44) → RFI created, event row, Promoted to RFI, the thread is the RFI's Email tab and the source message is Q&A Step 1 → the RFI (Details · Q&A · Workflow · Email) → Compose on the RFI (To = ball in court, Response due = the step's due date, PDF attached) or Route with Notify by email → the party answers from their mailbox or the secure link → Add to Q&A (Response or Comment, quoted history left out, files ticked → Step n, `QA_ADDED`) → Review: Approve → Close (Compose disabled, no Add to Q&A); Revise → back to Respond (Returned), emails the party; Reject (reason required) → Rejected, no email.

## 8. Who sees what (section 8; `spec.md` §3, D-41)

GC PM: every thread, notes, cost impact, delivery, Promote and Link. GC PE: every thread (Confidential only as a participant), notes, delivery, no cost. Guest participant: own threads, own delivery row, no notes, cost, Promote or Link. Guest not on the thread: nothing. Secure link page: the one thread, own state only. Internal notes are an entry type never shown to a guest or on the link page; the AI summary and the drafted question are built only from what the viewer may see.

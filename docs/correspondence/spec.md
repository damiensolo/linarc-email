# Correspondence — distilled spec

The facts the screens need. Open points are **Q-NN** in `00-plan.md` §6; UI rules come from `../5-ui-patterns.md` and are cited, not repeated; components are in `screens.md`; labels and tones in `status-model.md`. Today's Email behaviour (`00-plan.md` §0) is the baseline: every field and state it has stays, so a client sees an upgrade, not a replacement. Source: `source/` (first-pass spec; the raw PRD is still wanted for line references).

## 1. What Email becomes

1. **Compose in context**, from a drawing markup or a record, in a slide-over panel over the host screen (D-34), with the record and its revision pinned.
2. **The record's Email tab, upgraded**: the same thread with internal notes, Promote to record, Response due, and delivery evidence.
3. **The project Email screen, upgraded**: triage views (All, Needs action, Waiting, Overdue, Unmatched; Assigned to me and Follow up since D-72), a Linked record column, and mail that arrived from outside.
4. **A secure link page** for recipients without an account: the message, the pinned revision, files of any size, a reply.

## 2. Navigation (`src/modules/app/nav.js`)

Module **Project** (the template's). Only rails with a built screen are shown:
- **Communication** › `Email` → `correspondence-list`. Needs action, Waiting, Overdue and Unmatched are segments on the screen.
- **Drawings** › `Sheets` → `correspondence-context-dwg` (stand-in).
- **RFIs** › `All RFIs` → `correspondence-context-rfi` (the RFI detail as the Documentation file's ☉ Create RFI page draws it, with Email built in; §8b).
- **Submittals** › `Submittals` → `correspondence-context-sub` and **Change orders** › `Change orders` → `correspondence-context-co` (D-74, 2026-11-14): one stand-in record each (SUB-088, PCO-019) with the same Email tab as the RFI's, Details, Activity and the Distribution list; no log screens.
- The list's primary action is *Compose* (today's name).

## 3. Who sees what (decided 2026-10-16, D-41)

| Element | GC PM | GC PE | Guest participant (To / CC) | Guest non-participant | Secure link page |
|---|---|---|---|---|---|
| Threads and messages | all project threads | all | own threads | none | the one thread the link is for |
| Internal team note | yes | yes | never | never | never |
| Estimated cost impact (Email screen column, thread title bar; D-66) | yes | no (`canSeeCost`) | never | never | never |
| Confidential thread | yes | if a participant | own | never | own |
| Delivery evidence | all rows | all rows | own row | never | own state only |
| Promote, Link to record | yes | yes | no | no | no |
| Other recipients' addresses | yes | yes | To and CC as in ordinary mail | — | sender only |

Rules behind the table: internal team members see every project thread (the record is shared), except Confidential threads, which only participants and PMs see; guests see only threads they are on; internal notes and cost never leave the company; To and CC are visible to each other exactly as in ordinary mail, so nothing is hidden that the mail itself revealed; only internal roles promote or link. The role switcher shows each role; restricted fields exist in the data and are gated in the view. D-39 fixes the last column.

## 4. Inbound mail and threading

- Replies thread automatically today (reply token `reply+thr_1042@mail.linarc.io`); kept. The Delivery tab records `INBOUND_REPLY_INGESTED`.
- **New: mail from outside.** The project has an address (`rmc-04@mail.linarc.io`) printed on the Email screen (a small help icon beside the title in the Title Bar whose Tooltip reads *Mail sent to rmc-04@mail.linarc.io lands here.*, review 2026-11-06; from 2026-10-28 to then a 12px line beside the title; and in full in its empty state), in the compose footer and in every outbound footer. A message to it that matches no thread becomes a thread with no linked record and appears in the **Unmatched** view with the row action *Link to record* (a `md` modal with the SmartPicker, D-61 / D-62: search by code or title, a checkbox per kind (RFIs / Drawings / Submittals / Change orders / Field issues / Daily log, all on; `RECORD_KINDS`), the records the subject names first as *Suggested*, the latest threads' records as *Recent*; the thread then shows the record and moves to the matching triage state; several records at once since D-77, and *Link a record* under the thread's Linked items adds more to any thread). Audit: `RECORD_LINKED`.
- **Hybrid model (Q-05, D-42):** PMs answer everyday mail in Outlook or Gmail; Linarc holds the record. So every outbound mail and every notification is answerable by reply (the token keeps the thread), the project address is shown wherever mail is composed or forwarded (compose footer, outbound mail footer, the Email screen's empty state and meta line). It is plain text, not a copy action: people set the address up once (a contact, a Bcc habit), so it is information, not a task. Not on a thread: forwarded mail starts a new Unmatched thread rather than joining the open one, and the Email screen is where the record is checked, not where mail is read. Nothing in the MVP requires the PM to open Linarc to reply.

## 5. Compose (slide-over panel)

Triggers: *Email about this markup* on a drawing pin; *Compose* on the Email screen and on a record's Email tab. Pattern: `../5-ui-patterns.md` §1 contextual create, SlideOverPanel `lg` (720px) with a full-screen toggle next to Close (2026-10-28); flat form, left-aligned (D-26), label-only buttons (D-17) except the tool row's icon-only tools (D-58).

Fields, in order. Items marked **today** exist in the current Compose and keep their behaviour.
1. **Linked record** (new): pre-filled with the host record and its **immutable revision pin** (`Drawing A-302 · Rev 3`); empty when composing from the Email screen. From a pin, the cropped markup preview with sheet, grid and revision sits under it (DrawingPinPreview candidate; Q-13 confirmed nothing exists to reuse); a newer revision is noted (*Superseded by Rev 2*) without changing the pin.
1b. **Letter** (D-78): **Type** (General · Transmittal · Notice), a **Template** for a transmittal or a notice (fills the subject and the body with the project letterhead, the letter's form and the sender's sign-off; blanks stay in brackets) and the line *Numbered C-0041 on send*.
2. **From** (today): the sender, read-only.
3. **To, Cc, Bcc** (today's To and CC, upgraded; D-46, D-47): three RecipientField rows (Bcc behind a *Bcc* link on the To row). Typeahead over anyone already in the project directory except the sender, suggested first from the record's distribution list; the project's distribution lists and the record's own one as **group chips** (D-75: *Design team · 2*, amber when a member is outside the company, *Show members* in the chip menu; expanded into people on send); chips amber for any domain outside the company's, red for an invalid address (Send is blocked with *"bad@x" in To isn't a valid email address. Double-click it to fix it, or remove it.*); Enter, Tab, comma, paste and blur commit; chips drag between rows or *Move to …* from their menu (View contact, Copy email address, Show email address, Edit, Remove). Only people already on the project become chips: an address nobody in the directory has stays in the field under the list's line *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.* (announced too); nothing is created. **Add a guest user** from the panel (Q-02, D-36, D-46: an add-by-email row and an inline form) was built on 2026-10-16 and removed on 2026-10-28, deferred until customer discovery (D-60, §12).
4. **CC** (today): typed addresses.
5. **Subject** (today): prefilled `[RMC-04] A-302 Rev 3 — …`, editable. **Response due** (new): short date input, default §7.
6. **Message** (today): rich text; the editor's bar is always open and trimmed to one line (P-057): style, bold / italic / underline / strikethrough, text colour, an alignment menu (one button, vertical menu), numbered and bulleted lists, link.
7. **Attachments** (today, upgraded; D-58): added from the tool row in the footer, the same row as the thread composer's (§6.3): a file from the device, a photo from the camera (D-80: *Take a photo*; a photo keeps its capture time, shown as *Taken 16 Oct, 08:12* on its tile), a link, a file from Linarc Drive or a connected cloud drive (copied in) or a record (sent as its PDF), each a removable chip under the Message. The drive and record pickers are the SmartPicker in a `md` modal (D-61 / D-62, since 2026-10-28): search as you type, a checkbox per kind (the drives, Linarc Drive first; the record kinds), *Suggested* = the thread's or the pinned record, *Recent* = the latest threads' records, picks as removable chips and *Attach 2* on the button. Composing from a record other than a drawing attaches the record's PDF by default (today's *Attach record PDF*), removable like any chip. A file over 20 MB, or a pinned drawing, is marked *By secure link* instead of being refused (D-45). No drop area. The how and the limit are a tooltip on a help icon beside the *Attachments* label (focusable; the icon's accessible name carries the text); the section itself says only *Nothing attached yet.* while empty.

Footer: the tool row (§6.3): the attach tools left; *Discard draft* (confirms), *Save draft* (*Draft saved.*) and *Send* right; the buttons disable while sending. A draft is kept per context (the Email screen, or the record and pin composed from): Save draft keeps it, and so does closing the panel with unsaved changes; reopening restores it, Send or Discard drops it. Success closes the panel and shows the new thread (or the tab) with the message and per-recipient delivery. Failure keeps the panel open with an InlineNotice and *Retry*. Closed records can't send (today's rule): the trigger is disabled with a tooltip.

## 6. The thread

**6.0 Title bar** (Title Bar / Workflow, Comfortable): back, the subject, the thread id chip, the correspondence number and type as a word (*C-0040 · General*, D-78; threads the GC started), *Status:* with the `triage` chip and the *Confidential* chip when restricted, then *Cost impact: $4,200* (or *None*) as a muted word for `canSeeCost` roles (D-66, 2026-11-06). It is the thread's own estimate, the same value as the Email screen's column; a record's own cost field stays on the record (Q-15). The Reading pane's header shows the same. No chip and no colour: cost is information here, not a call to act.

**Triage (D-72, 2026-11-14).** The title bar's actions (internal roles): the **Owner** select (a team member; the sender by default; an `@First` mention in an internal note hands the thread over; Notifications reads the same owner), **Send reminder** while the thread waits on someone outside (a compact modal: the recipients of the last message we sent, the due date, the wording prefilled and editable, the count; it goes out as a message marked *Reminder*, the Delivery tab gains *Reminder sent · Reminder 2 sent via the Linarc relay*, the thread stays in Waiting and the due date does not move), **Follow up** (a compact modal with one short date input, the next working day by default; the date shows as a word after Cost impact and the thread surfaces in the Email screen's Follow up view) and **Mark resolved** / **Reopen** (resolved owes nobody a response; reopening follows the last message again). The Reading pane's header carries the same as icon buttons with Tooltips (D-68) and the Owner select in its meta row. Compose offers *Send a reminder at the due date if there's no reply*, on by default; the thread then says *Reminder at the due date* while it waits.

**6.1 ThreadStream** (candidate; the entry list): one container level, hairlines (D-17). Entries:
- **Message** (inbound or outbound): sender, company, time, one delivery signal (`status-model.md` › delivery), body, files with a file glyph (*by link* when streamed), *Promote to record* on inbound messages (internal roles).
- **Internal team note** (new): InlineNotice `warning` headed *Internal team note (hidden from external recipients)*; internal roles only.
- **System event**: muted row, e.g. *Promoted to RFI-143 · View RFI*, *Linked to SUB-088*.
- **Bounce** (today shows the error on hover; upgraded): InlineNotice `error` under the message with the SMTP reason and *Update contact and resend*, which opens a compact modal with the contact's address pre-filled with the suggested one and resends on *Update and resend* (patterns §3, "a warning guides"). On success the delivery signal becomes Delivered and the audit gains a row.

**6.2 AiSummary** (candidate; mock in the prototype): on threads with three or more messages, above the list. AI StatusChip in a focusable span with the §9 tooltip; *Decisions*, *Open questions*, *Commitments*; the evidence line under the content.

**AI content rules (Q-12 decided, D-44)**, the same for the summary and the AI-drafted RFI question:
1. **Labelled** wherever it appears: the AI chip and §9 tooltip; the chip leaves a field once a person edits it, so what is sent or saved is marked as human-reviewed.
2. **Sourced**: the evidence line names what was read (messages, files, record), never a model name; each summary bullet can be traced to a message (the prototype links bullets to the entry).
3. **Human in the loop**: AI text is never sent to anyone and never written to a record without a person pressing the action; the Promote button is disabled until the Question field has been focused once.
4. **Fails gracefully**: skeleton after 200 ms, never blank (D-24); *Summary unavailable* with *Retry* on failure; the thread and all actions work without it.
5. **Feedback**: a *Not accurate* link under the summary records the thread id for review (prototype: toast only).
6. **Scope**: summaries are generated only from content the viewer is allowed to see (D-41); internal notes are excluded from anything shown to a guest.

**6.3 Composer** (composition of existing components, D-58): mode select *Reply to all* / *Internal team note*; the product's rich-text editor, its formatting bar (bold, italic, underline, numbered and bulleted lists, link) always on (the *Formatting* toggle went with D-69); attachments as removable chips; one compact tool row. Left, icon-only with tooltips: *Attach file*, *Take a photo* (D-80), *Attach link*, *Choose from cloud drive*, *Attach a record*. Right: *Discard draft* set apart (asks *Discard this draft?* when there is something to lose), *Save draft* (the text, its formatting and the attachments come back on this thread until sent or discarded; *Draft saved.* confirms, and clears on the next change) and the one primary button whose label follows the mode (*Send* / *Post note*). Note mode tints the composer like the note it creates. A sent message or note keeps its formatting and lists its links under the body.

## 7. Response due and notifications (Q-11 decided, D-42)

Default Response due is the contract's turnaround for the record type (D-76: RFI 7, submittal 10, change order 14 working days; a drawing markup or plain email 3), counted in the project calendar (weekends and the project's holidays skipped; `CONTRACT_TURNAROUND`, `PROJECT_HOLIDAYS` in `data/project.js`), editable per message, with the rule named under the field; on an RFI the workflow step's due date wins. `sla` is computed against today.

Notifications extend today's Notification preferences (which already cover a reply arriving) with three events, each on by default, each a mail the PM can answer by replying (hybrid model, §4) and each carrying one link to the thread:
1. **Needs action**: an inbound message or a mail to the project address that no one has answered; sent once, when the thread enters the state.
2. **Overdue**: Response due passed without a reply; one mail at the deadline and a daily digest of all overdue threads after that, not one mail per thread per day.
3. **Delivery failed**: a bounce, sent at once, with *Update contact and resend* as the link.

In the prototype these are behaviour and copy (the mail footer *Reply to this email to respond in the thread, or open it in Linarc*), not a preferences screen; the preferences page itself is a product change outside the prototype.

## 8. Promote to record

From *Promote to record* on an inbound message. SlideOverPanel `md` beside the thread, the source message highlighted (D-34, D-37). Five fields, pre-filled:
1. **Record type**: RFI, Field issue, Potential change order or Daily log entry (D-77 closed Q-10; the PCO adds *Estimated amount* for roles that may see cost; a daily log entry has no assignee or due date and leaves the thread's triage alone, D-80; a field issue, PCO or log entry is created in the session with no screen of its own).
2. **Title** from the subject.
3. **Question** (RFI) or **Description** (field issue, PCO), AI-drafted from the message; carries the AI chip and tooltip until edited. Always editable.
4. **Assigned to** (suggested reviewer) and **Due date** (short input).
5. **Include from the email**: checkboxes for the pinned drawing and each file.

Button *Create RFI* (the label follows the type: *Create field issue*, *Create PCO*, *Add to daily log*). The number is assigned on creation and shown in the confirmation (*RFI-143 created · Open RFI*). On success: record in the session, a system event in the thread, promotion state Promoted to RFI, confirmation links to `correspondence-context-rfi#RFI-143`. The thread is the RFI's Email tab from then on.

## 8b. The RFI with Email (D-48, D-49; full review in `rfi-integration.md`)

- **Record:** Details (name, type, sequence, priority, location, due date, spec section, reference, schedule and cost impact (cost for `canSeeCost`), ball in court, question, proposed solution, custom details, linked items), **Q&A** (numbered steps: question, responses, comments; each with author, company, time, files, *From email* when filed from a message), **Workflow** (template *Design team RFI*: Create → Respond → Review → Close; parties with company type, process days, in / due / out dates, `workflowStep` status), **Email** (the RFI's threads; count = Needs action). Right panel: **Activity** (record events plus the threads' sent / reply received / link opened / file downloaded / delivery failed rows, each with *Open thread*) and **Watchers** (notification only).
- **Placement (D-50):** the workflow move is the title bar's action; **Compose** sits at the top of the Email tab (secondary button, with *Email about RFI-n. Replies from any mail client land here.*) and shows only on that tab, so it can't be read as composing an RFI.
- **Compose on an RFI:** suggestions = current step's parties, then the distribution list, then the directory; To = the ball-in-court party; Subject `[RMC-04] RFI-n — <name>`; Response due = the step's due date; *Attach a PDF* on.
- **Add to Q&A** (inbound messages, internal roles): panel with Step type (Response when the sender has the ball, else Comment), From, Text (quoted history and sign-off left out and listed), files from the email; *Add as Step n*. Writes the step (`source: email`), a thread event *Added to RFI-n Q&A as Step n by …*, a `QA_ADDED` audit row, an Activity row; a thread in Needs action becomes Resolved. Nothing is sent. The message an RFI was created from is Step 1 (*In Q&A · Step 1*). RFI-142 ships with Kenji's emailed answer on THR-1039 waiting to be filed (seed data since 2026-10-28, as the Documentation file's screen 09 draws it), so *Add to Q&A* is on the record without simulating mail.
- **Email this** on a Q&A step: Compose to the step's author and the party in hand, the step quoted.
- **Workflow moves** (tab bar, internal roles, by the step in hand): Respond → **Route** (to Review; the RFI becomes Answered); Review → **Reject** (reason required; Rejected, workflow ends, no email), **Revise** (back to Respond, *Returned*; RFI Open), **Approve** (to Close); Close → **Close** (Closed). Each is a compact ModalV2 naming the next step, its parties and due date. Route and Revise offer **Notify by email** (on by default when a party is outside the company; optional message): one thread to the parties with the RFI pinned, its PDF and Response due.
- **Closed or rejected RFI:** Compose disabled (*Closed RFIs can't send email*), no Add to Q&A, no response editor.

## 9. Email screen and the thread's right panel

- **Email screen** (`correspondence-list`): segments All / Assigned to me / Needs action / Waiting / Overdue / Unmatched / Follow up cross-linked with the grid's Filter panel (D-30; Assigned to me and Follow up since D-72), then the folders Drafts and Deleted (D-67: a different row set, not a condition); quick filters for the segments, Unread, Has attachments, Confidential. Columns: `screens.md` §1 (Owner and Follow up since D-72; Letter, the correspondence number and type, since D-78, with a *Notices* quick filter; Files since D-79, so the search box finds a thread by a file name); the toolbar's Download is the correspondence log as a CSV of the rows as filtered (D-79); Subject and From bold while the thread is unread for the viewer. The table's selection toolbar and the Reading view's list bar: Delete, Mark as unread, Mark as read, Mark resolved (Restore in Deleted); no cut / copy / paste. Loads through LoadRegion.
- **Right panel** on the thread: TabNavigation with *Linked items* (records with revision pins or status, and *Link a record*, D-77) and *Delivery* (per recipient, today's statuses plus Link opened and Files downloaded, and the event rows). Rows show event, actor, time (D-17); IP and checksum are in a row's expand only (Q-09). No export in the MVP.

## 10. Secure link page (`correspondence-portal`)

- Reduced top nav (Company variant, logomark), no rail, no shell (patterns §1). Mobile first; internal screens stay responsive to 390 (D-08).
- Who it is for (Q-14): guests with an account can already open the thread in-app on the record's Email tab, so this page serves recipients **without** an account and anyone opening a **file over 20 MB** or the **markup view** from the mail. A recipient with an account also sees *Open in Linarc*.
- Shows: sender and project, the message, the pinned markup (sheet, grid, revision, *Current* or *Superseded by …*), files of any size (streamed), Response due, the quick response *Received, I'll answer by <date>* (D-73: one short date input and one button; it posts as a reply, the thread waits on the recipient until that date, the reply box stays), a reply field and *Send* in a fixed bottom panel. Never notes, cost or others' delivery (D-39). A reply from here threads like a mailed reply and is copied to the recipient's mailbox (Q-08); replying by mail still works and is the expected path.
- **Link states (Q-08 decided, D-43):** valid 30 days from sending, revocable by the sender from the thread; **expired** offers *Send me a new link* to the same address; **revoked** names the sender. Opening records `MAGIC_LINK_ACCESSED`; a download records `ATTACHMENT_DOWNLOADED`.

## 11. States and copy

| Screen | Empty | Loading | Error | Other |
|---|---|---|---|---|
| `correspondence-list` | *No email yet. Mail sent from drawings and records, and mail sent to rmc-04@mail.linarc.io, appears here.* | grid skeleton | *Couldn't load the email.* + Retry (LoadRegion wording) | empty segment: the grid's own empty state |
| `correspondence-thread` | right panel *No linked items* | stream and summary skeletons | *Couldn't load the thread.* + Retry; *Summary unavailable* + Retry | bounce; promoted; linked |
| `correspondence-context-dwg` | — | sheet placeholder | — | superseded note on the preview |
| `correspondence-context-rfi` | Email tab: *No email on this RFI yet* | tab skeleton | Retry in the tab | closed / rejected: Compose disabled; workflow moves; Add to Q&A panel |
| `correspondence-context-sub` / `-co` (D-74) | Email tab: *No email on this submittal yet* / *… change order yet*; Details › Linked items the same | tab skeleton | Retry in the tab | closed: Compose disabled (*Closed submittals can't send email*) |
| `correspondence-rfi-list` | *No RFIs yet. RFIs created from a drawing, an email or the Create RFI form appear here.* | grid skeleton | *Couldn't load the RFIs.* + Retry | empty segment: the grid's own empty state |
| `correspondence-portal` | — | file streaming | send failed + Retry | expired; revoked; *Reply sent*; acknowledged (*Sent: received, answering by …*, D-73) |
| Compose / Promote panels | — | button disabled | InlineNotice + Retry, panel stays | unknown address refused with the directory message; *By secure link* |

Copy: *Compose* · *Send* · *Create RFI* · *RFI-143 created · Open RFI* · *Post note* · *Internal team note (hidden from external recipients)* · *Name or email address* · *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.* · *By secure link* · *Update contact and resend* · *Link to record* · pickers (D-61) *Search by code or title* · *Search by file name or folder* · *Suggested* · *Recent* · *2 selected* · *No records match “{query}”. Try a code or a word from the title.* · *Search all records* · *Attach 2* · Email meta line *Mail sent to {address} lands here.* · compose footer *Replies from any mail client come back to this thread. To file other mail in this project, forward or Bcc it to {address}.* · outbound footer / secure link page *Something new about {project}? Email {address} and it's filed in the project.* · mail footer *Reply to this email to respond in the thread, or open it in Linarc* · *Open in Linarc* · *This link has expired. Send me a new link* · AI tooltip and evidence line as §9. Fictional names only; the demo user is Alex Morgan.

## 12. Follow-ups (not in the MVP)

Proof-pack export (thread PDF with delivery events and file hashes); ~~structured quick responses on the link page~~ (one built, D-73); Quick create › New message; ~~Submittal and CO stand-ins~~ (built, D-74); promote to PCO / Submittal revision / Field issue; the modal variant of Promote, only if sessions show trouble with the pane; **Add a guest user from Compose** (an add-by-email row and inline creation, D-36 / D-46: built, then removed on 2026-10-28, D-60): a feature the MVP does not support until customer discovery shows the friction is real; recipients must be on the project, as today; an Outlook or Gmail add-in that files a mail to a record from the PM's own inbox (the natural next step of the hybrid model, D-42); the Notification preferences page with the three new events. A persona-by-persona review of further gaps (reminders, thread owner, correspondence numbers, contract turnaround, a field persona, Submittal and CO tabs, group chips, a portal quick response, markup replies, an owner digest, attachment search) is in `00-plan.md` §9 (2026-11-11, for product review).

## 13. Sizes, by source

Slide-over `md` 560 (`sm` 420, `lg` 720), full width below 640 (D-34) · panel header and footer `h-space-64`, `border-border-subtle` (D-25) · body `p-space-20` (F-051) · short date inputs FormV2 `width: 'short'` (D-26) · filter panel per P-044 · right panel per AppLayout (380) · backdrop `bg-surface-overlay`.

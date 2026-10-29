# Correspondence — plan, open questions and decisions

Module **Correspondence** (slugs `correspondence-*`), built in this repo (`linarc-email`, from `linarc-prototype-base`, D-33). Companions: `spec.md` (facts the screens need), `status-model.md`, `screens.md`. Decisions live in `../4-decisions.md`; §7 points at them. `source/` holds the first-pass spec (not the raw PRD; see its README). `reference/` holds the drafts; only the mock data carries forward.

**The product already has Email.** This plan upgrades it (§0); it does not add a parallel system. Screens, tabs and copy say **Email**; "Correspondence" is only this repo's module and slug name.

## 0. What the platform does today, and the delta we test

From the help centre (read 2026-10-16): [Email an RFI](https://help.linarc.io/support/solutions/articles/1060000092050-email-an-rfi-to-external-stakeholders), [a Submittal](https://help.linarc.io/support/solutions/articles/1060000092369-email-a-submittal-to-external-stakeholders), [a Change Order](https://help.linarc.io/support/solutions/articles/1060000093873-email-a-change-order-to-external-stakeholders) to external stakeholders; [Exchange emails with collaborators](https://help.linarc.io/support/solutions/articles/1060000150320-exchange-emails-with-collaborators); [Distribution lists](https://help.linarc.io/support/solutions/articles/1060000112831-configure-distribution-list-for-document-items); Notification preferences.

| Exists today | Where | In this plan |
|---|---|---|
| **Email tab** on each RFI, Submittal and CO: left pane of sent mail with status; Compose with From, To (guest users), CC (typed addresses), Subject prefilled with number and subject, rich text, attachments from device or project files, generate a PDF of the record | record detail › Email | **Kept and upgraded** (`correspondence-context-rfi`): the same tab gains internal notes, Promote to record, Response due, Link opened / Files downloaded. CC and *Attach record PDF* stay so nothing regresses |
| **Project Email screen**: same compose; list of sent and received mail with status | Project › Communication › Email | **Kept and upgraded** (`correspondence-list`): triage views, Linked record column, Unmatched, Response due |
| Recipients must already be **guest users** (Project › My Team › Guests) | compose To | **Kept as today** (D-60, 2026-10-28): an unknown address is refused with a line naming My Team › Guests. Inline guest creation (Q-02, D-36) was built on 2026-10-16 and removed for the MVP, pending customer discovery |
| Attachments **≤ 20 MB**; "save larger files to cloud storage and link them" | compose | Large files delivered by secure link (bet 3) |
| **Per-recipient delivery status**, error on hover | left pane | Kept as the `delivery` dimension; adds Link opened, Files downloaded |
| **Replies fetched automatically** and threaded; notification on reply | thread | Kept (this is the threading `spec.md` §4 relies on). Adds: outsiders can start a thread via the project address; internal notes; promote |
| **Distribution lists** per document type (members, guests, watchers) | Documents › Config | Source of the suggested recipients in compose |
| No sending from a **closed record** | | Rule kept |
| Not found: compose from a drawing; linking mail to a record; triage states; internal notes; promote to record; inbound mail from outside; files over 20 MB; open and download tracking; a page for recipients without an account | | **The delta this MVP tests** |

## 1. Problem and bets

**Problem.** Decisions get made in project email. Today's Email keeps the record-level threads, but a message about a drawing has no home, the files that matter don't fit, recipients must be set up first, nothing says what needs action or when, and turning an email into an RFI is a re-type.

**Operating assumption: hybrid (Q-05, decided 2026-10-16, D-42).** PMs read and answer everyday mail in Outlook or Gmail; the platform holds the shared project record and the formal workflows. Platform email tools are used, but they do not replace the PM's inbox. Procore, Autodesk Construction Cloud and Newforma support this inbox-plus-project-record model; that is a conclusion from their supported workflows, not a measured usage share. Consequences for the design: a reply from any mail client must keep the thread (the reply token); forwarding or BCC to the project address is a first-class way in, not an edge case; Needs action and Overdue must reach the PM's mailbox as notifications (Q-11); the Email screen is the project's record and triage view, not a place people live. An Outlook or Gmail add-in is the natural follow-up and is out of the MVP.

**Bets**, one screen cluster each:
1. **Context beats a mailbox.** Sending from the drawing pin, with the revision pinned, captures email without a change of habit. `correspondence-context-dwg`, `correspondence-context-rfi`.
2. **Escalation is one step.** Promote an email to an RFI with five pre-filled fields while the email stays visible. `correspondence-thread`.
3. **Recipients shouldn't have to log in to see the files and answer, and mail can't carry the files.** A link that opens without an account, shows the pinned revision and streams the file gets a faster, verifiable answer. (Guests with accounts can already open the thread in-app, Q-14; the link page serves the rest and the large files.) `correspondence-portal`, the Delivery tab.

**How this differs from Procore Correspondence, Autodesk Build and Fieldwire** (to validate, not assert): compose from a drawing markup with an immutable revision pin; promote with pre-filled fields and an AI-drafted question; a zero-login page for large files; delivery evidence per recipient. §5 measures which of these clients notice unprompted.

## 2. MVP scope (lean)

In:
- Five screens (`screens.md`): Email list, Email thread, Drawings stand-in with compose, RFI stand-in with the upgraded Email tab, external link page.
- Compose panel with parity to today's Compose (From, To, CC, Subject, rich text, attachments, Attach record PDF) plus: linked record with revision pin, Response due, large files by link.
- Inbound mail from outside (Q-06 → yes): the project address, an **Unmatched** view, *Link to record*.
- Internal notes, Promote to RFI, AI summary (mock), Delivery tab with Link opened / Files downloaded, bounce with a guided fix.
- The RFI with Email (added 2026-10-20, `rfi-integration.md`, D-48, D-49): the RFI detail as the Figma draws it (Details, Q&A, Workflow, Email, Activity, Watchers), *Add to Q&A* from an emailed answer, workflow moves with *Notify by email*.
- Notifications (Q-11 → yes) as specified behaviour, not a new screen: three events added to today's Notification preferences (`spec.md` §7); the prototype shows the mail footer and the reply-by-mail path, not the preferences page.
- DrawingPinPreview as a confirmed candidate (Q-13 → nothing exists in Figma or the Drawings tool); drawn in Figma through the candidate flow (D-15).

Out, with the reason:
- The **modal variant** of Promote (`correspondence-thread-modal`): D-34 already picked the panel and the product has no modal precedent; build it only if sessions show trouble with the panel (D-37 settled).
- **Proof-pack export**, portal **quick-response radios**, a **Quick create › New message** item: nice, not needed to test the bets. Listed as follow-ups in `spec.md` §12.
- Submittal and CO stand-ins (same tab as RFIs), Configure screens, promote to PCO / Submittal revision / Field issue, notification changes (today's reply notification is kept; Needs action / Overdue reuse the same preferences).
- **Add a guest user from Compose** (Q-02, D-36 / D-46): built 2026-10-16, removed 2026-10-28 (D-60). Kept as a feature the MVP does not support until customer discovery shows people need it; recipients must already be on the project, as today.

## 3. Personas

| Persona | Job on these screens |
|---|---|
| GC Project Manager (internal) | Triage what needs action, decide what becomes formal, keep cost talk internal, show who received what |
| GC Project Engineer (internal, no confidential cost) | Communicate a field conflict from the drawing; follow up with subs and consultants |
| Subcontractor PM (external guest, e.g. Apex Mechanical) | Answer from a phone; see exactly which revision and spot; attach a sketch |
| Design consultant (external, not yet a guest) | Receive one clear question with the files, without an account |
| Owner representative (external guest) | Acknowledge receipt; the persona for whom a bounce is common |

## 4. Demo flows and client test tasks

Each flow is the demo script and one or two usability tasks. Mock data: `reference/correspondenceData.js` (`THR-1042`, `THR-1039`, `THR-1031`).

**Flow 1: clash on a drawing → message a new consultant → they answer from a phone.** `correspondence-context-dwg#A-302-Rev3` → pin at Grid B-4 → *Email about this markup* → panel pre-pins `A-302 · Rev 3` → pick Marcus Vance (a guest user already on the project) → Response due → attach the 45 MB video (by link) → Send. Then `correspondence-portal#tk-marcus-a302` on a phone.
- **Task 1.** "You've found this clash. Get Marcus Vance at Acoustix to look at it by Friday." Success: sent with the revision pinned, Marcus found in To, due date set; under three minutes, no help. Watch for anyone typing an address that isn't on the project: that is the signal for D-60.
- **Task 2** (on the participant's own phone if possible). "You're Marcus. Open the link, look at the markup and the video, and reply." Success: reply sent without asking how to log in.

**Flow 2: reply arrives → summary and internal note → promote to RFI → the RFI's Email tab.** `correspondence-list` › Needs action → `THR-1042` (Dave's reply, AI summary, Sarah's note) → *Promote to record* on Dave's message → five fields → Create RFI → promotion row → RFI › Email tab.
- **Task 3.** "Apex says they need the structural engineer's sign-off. Get this in front of Thornton as a formal RFI without losing Dave's wording." Success: RFI created from the thread, assigned to Thornton, sketch included, promotion visible in the thread, participant finds it on the RFI's Email tab.
- **Task 4.** "Sarah asked you to hold the cost reply. Tell the team, not Apex." Success: internal note posted; the participant can say Apex won't see it.

**Flow 3: inbound and failed mail.** `correspondence-list` › Unmatched: a sub's email sent straight to the project address about SUB-088 → *Link to record*. Then › Overdue: `THR-1031` shows Delivery failed → the bounce notice names the corrected address → *Update contact and resend*.
- **Task 5.** "SunState emailed the project address about SUB-088 instead of replying in the thread. Get it onto the submittal." Success: finds Unmatched, links to SUB-088, the thread now shows the record.
- **Task 6.** "SUB-088 is overdue and nobody at Riverside Health has answered. Find out why and fix it." Success: finds the bounce from Overdue, updates the contact, resends.

**Live inbound mail (facilitator).** The prototype can't receive real mail, so the sandbox bar's *Simulate inbound email* stands in for it on every correspondence screen: pick a sender (a guest, a team member answering from their own mailbox, or a new address, which becomes a guest), send it to the project address (a new Unmatched thread) or as a reply to a thread (its reply token), optionally with a file. Use it to land a reply mid-session ("Dave just answered"), or to replace Task 5's seeded mail with one the participant watched arrive. It goes into the demo session, so *Reset demo data* clears it.

**Interview.** Assuming the hybrid model (Q-05): "Which of these would you still do from Outlook? When a reply lands in your inbox, would you answer there or open the thread here? What would make you BCC the project address by habit? Which notification would you want, and how often?"

## 5. Success metrics

Per session: completion without help per task (target five of six participants on Tasks 1, 3, 5); which steps participants say they would do in Outlook vs here, and whether they trust the reply-by-mail path; unprompted mentions of the revision pin, delivery evidence, the no-login link, the AI summary (the most-noticed bet becomes the headline); candidates needed per screen, which should fall from the first screen to the last.

After launch: share of a project's external email captured in Linarc; median time from inbound email to RFI created; external response time; link opens within 24 hours; threads with a complete delivery record when a claim is raised.

## 6. Open questions

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|
| Q-01 | Cross-tool or standalone? | — | Product | Resolved → D-35 |
| Q-02 | Recipient not yet a guest: how is one added from the compose panel? | compose | Design + user | **Resolved 2026-10-16** (row renamed *Add a guest user* and To widened to the whole directory on 2026-10-19, D-46): an InputV2 *Add by email* row under the recipients select opens the inline guest form (name, company, role); creates a guest user; no library change. P-041 stands. → D-36. **Reopened and deferred 2026-10-28 (D-60):** the row and the form were removed for the MVP; an unknown address is refused with a line naming My Team › Guests. Revisit after customer discovery |
| Q-03 | Promote: panel or modal? | — | — | Resolved → D-34; modal variant deferred (D-37) |
| Q-04 | Which candidates? | — | — | Resolved → D-38 |
| Q-05 | Where do PMs read mail: here, or Outlook with Linarc as the record? | empty-state copy, notifications | Product | **Resolved 2026-10-16: hybrid** (§1, D-42). The interview tests the boundary, not the model |
| Q-06 | Inbound mail from outside in the MVP? | `correspondence-list` | Product | **Resolved 2026-10-16: yes.** Project address, Unmatched view, Link to record (`spec.md` §4) |
| Q-07 | Visibility: who sees a thread, who may promote, do CCs see each other, what does Confidential restrict? | list columns, role switcher, portal | Product + Security | **Resolved 2026-10-16:** the `spec.md` §3 table is the decision (D-41) |
| Q-08 | Secure link: lifetime, revocation, re-request; does a portal reply also reach the recipient's mailbox? | portal states | Product + Security | **Resolved 2026-10-16:** the `spec.md` §10 proposal stands (30 days, revocable by the sender, re-request to the same address, portal replies copied to the recipient's mailbox) → D-43 |
| Q-09 | Delivery evidence: do IP and checksum belong on screen? Who needs an export, and when? | Delivery tab | Product + legal reviewer | Narrowed: no export in the MVP; rows show event, actor, time |
| Q-10 | Promote targets beyond RFI? | thread | Product | Proposed: RFI only |
| Q-11 | Do Needs action and Overdue need notifications beyond today's reply notification? | `sla` | Product | **Resolved 2026-10-16: yes.** Three events on today's Notification preferences, each mail answerable by reply (`spec.md` §7, D-42) |
| Q-12 | AI: failure state, wording beyond §9, is AI-drafted RFI text ever sent unedited? | thread, promote | Product + legal reviewer | **Resolved 2026-10-16: industry practice** (labelled, editable, human-confirmed, sourced, fails gracefully, no autonomous sending) → D-44; rules in `spec.md` §6.2 |
| Q-13 | Is there a drawing or markup thumbnail in Figma or the Drawings tool? | `correspondence-context-dwg` | Design | **Resolved 2026-10-16: no.** DrawingPinPreview is a confirmed candidate; design draws it in the candidate flow |
| Q-14 | Does today's Email tab show the thread to guest users in-app? | portal | Product | **Resolved 2026-10-16: yes.** The secure link page is for recipients without an account and for files over 20 MB; a recipient with an account also gets *Open in Linarc* (`spec.md` §10) |

## 7. Decisions (in `../4-decisions.md`)

D-34 overlay for contextual create · D-35 cross-tool capability plus central log · D-36 recipient entry (add-by-email row; removed by D-60) · D-37 promote in place, panel; modal deferred · D-38 candidate boundaries · D-39 the external page shows nothing internal and shows link state · D-40 Correspondence upgrades the existing Email tab and Email screen; parity first, Email naming · D-41 visibility model (`spec.md` §3) · D-42 hybrid inbox-plus-record model and the three notifications.

## 8. Build order

1. **Done 2026-10-16.** Data: `src/modules/correspondence/data/` (`project`, `people`, `records`, `threads`, `links`, `actions`, `index`); the dimensions of `status-model.md` in `src/modules/app/status.js` (plus `AUDIT_EVENT` and `statusOf`); session keys and primitives in `src/modules/session.js`, flows in `data/actions.js` (add guest, send, note, link, promote, resend, reply from link, revoke, set role); `nav.js` PROJECTS now Riverside Medical Center. Verified with `node scripts/smoke-correspondence-data.mjs` (F-006) and `yarn verify`. The sandbox **role switcher** (reads and writes `session.settings.role` through `currentRole()` / `setRole()`) is UI and lands with step 2.
2. **Done 2026-10-16.** `correspondence-list` (`Communication › Email`): segments cross-linked with the Filter panel (D-30), Unmatched view, *Link to record* in a compact ModalV2, role-gated columns, the sandbox role switcher (`prototype.roles`, F-007). Record: `docs/prototypes/correspondence-list.md`. *Compose* arrives with step 5; *Open* leads to the thread once step 3 exists.
3. **Done 2026-10-16.** `correspondence-thread`: the SlideOverPanel, ThreadStream and AiSummary candidates built (`src/candidates/`, backlog stage `candidate`); Promote to RFI with the D-44 gating; Composer (reply / note), bounce fix modal, Linked items and Delivery tabs. Shim for `lodash.throttle` (F-008). Record: `docs/prototypes/correspondence-thread.md`. *Open* on the Email screen now lands here.
4. **Done 2026-10-16.** `correspondence-context-rfi`: the upgraded Email tab (ThreadStream + composer per thread, *Open in Email*), and the shared **ComposePanel** built here rather than in step 5 (parity fields, pinned record, Add by email with inline guest creation, Response due, large files by link, Attach record PDF); `createThread` + `session.newThreads`. The Email screen's *Compose* button landed with it. Record: `docs/prototypes/correspondence-context-rfi.md`.
5. **Done 2026-10-16.** `correspondence-context-dwg`: token-drawn SheetSvg stand-in, one pin → Popover → *Email about this markup* → ComposePanel with the pinned revision and the **DrawingPinPreview** candidate (now stage `candidate`); S-201 superseded case; guests can't compose. Record: `docs/prototypes/correspondence-context-dwg.md`.
6. **Done 2026-10-16.** `correspondence-portal`: reduced top nav, no shell, mobile first; the message, Response due, DrawingPinPreview with the full sheet on demand, files with Download / Stream, reply in the bottom panel; states valid / expired (*Send me a new link*) / revoked / replied; *Open in Linarc* for account holders (Q-14). Record: `docs/prototypes/correspondence-portal.md`.
7. **Done 2026-10-16.** The map is on the Documentation file's **Email** page (`4084:9896`, the page already existed, matching D-40 naming), two sections: Level 1 (01 Email · 02 Thread, full length · 03 Promote panel · 04 RFI Email tab, full length) and Level 2 (05 Sheet · 06 Compose, full length · 07 Secure link page at 390), with labels, hotspots, navigation and state-change arrows and pills; every text, paint, padding, gap and radius bound (audit 0/0/0 outside instances and annotations). Four candidates drawn as components on the library's `_ ☉ Candidates` page (unpublished; **not published**, per the rule to ask first). Node links in each prototype record and `prototype.figma`. Gaps for design in F-010 (Project rails and tools; sm Company top nav). **2026-10-28:** a fourth section, [Level 4 · Compose](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4237-4926) (15 Email › Compose · 16 full screen · 22 RFI › Email tab › Compose · 17 composer states · 18 Attach link · 19 cloud drive · 20 record · 21 Discard), and the composers on 02, 04, 06 and 09 redrawn to D-58 / D-59 (F-036).
8. **Done 2026-10-16.** Five prototype records in `docs/prototypes/`, backlog stages at `figma` for the four candidates, screen stages at `figma`, findings F-003 to F-010, every question in §6 answered or narrowed. **Next for the team:** run the client sessions (§4), then the design review on the Email page; the library follow-ups are in F-008 to F-010.

9. **Done 2026-10-26.** `correspondence-rfi-list` (`RFIs › All RFIs`): the RFI log, asked for in review because the rail opened the RFI detail directly. Views All · Open · Answered · Closed · Overdue cross-linked with the Filter panel; columns RFI · Title · Type · Priority · Status · Ball in court · Step · Due · Email (threads to answer) · Location · Created · Open; the guest sees only the RFIs they are on; the RFI detail's back returns to the log; the Figma frame 14 on the Email page's Level 3 section. `scripts/interact-correspondence-rfi-list.mjs`.

Each step ends with `yarn verify` and `yarn shot`. Sessions can start after step 4 with Flows 2 and 3, and after step 6 with all three.

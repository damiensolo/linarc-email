# Linarc Email — demo guide and script

For whoever runs the demo for clients and leadership, and for the team member who has to explain how the prototype system works. Everything here runs on the prototype in this repo; nothing sends real mail.

## 1. The pitch in one minute

Construction decisions get made in email, and that email lives outside the project record: in personal inboxes, with files too large to attach, with no link to the drawing revision or the RFI it was about, and with no proof of who received what and when. When a claim arrives, the PM rebuilds the story by hand from Outlook. When an email needs to become an RFI, someone re-types it.

Linarc already has Email: an Email tab on every RFI, Submittal and Change Order, and a project Email screen. This project **upgrades that Email**, it does not replace it. Every field and behaviour people have today stays. On top, three bets we want to test with clients:

1. **Context beats a mailbox.** Send from the drawing pin or the RFI you are looking at, and the record and its revision are pinned for you.
2. **Escalation is one step.** Promote an email to a formal RFI with five pre-filled fields while the email stays visible.
3. **Recipients should not have to log in, and mail can't carry the files.** A secure link opens on a phone, shows the pinned revision, streams a 45 MB video, and takes a reply.

And one operating assumption, stated out loud: PMs keep reading mail in Outlook or Gmail. Linarc holds the record. Every message and notification can be answered by replying from any mail client, and forwarded or direct mail to the project address lands in the project. The demo proves that too.

## 2. Before the demo (10 minutes)

Checklist:

- `yarn dev` in the repo. The app is at `http://localhost:5173` (or the port Vite prints; this guide assumes it). Open `/?p=correspondence-context-dwg`.
- Browser window at 1440 wide, light theme. The sandbox bar at the top is **not part of the product**: say so once, then use it. It holds the screen picker, the record picker, **Viewing as** (role), **Simulate inbound email**, **Reset demo data**, and a menu with Theme, simulated loading speed and the screen's Figma frame. `?chrome=0` hides the bar if you want a clean recording; the gear in the top nav brings it back.
- Click **Reset demo data** so every thread is in its starting state.
- Have a phone ready for Act 1, or use the browser's device mode at 390 wide. The secure link page URL is `/?p=correspondence-portal#tk-marcus-a302`.
- Know the four threads: `THR-1042` (the clash, needs action, due today), `THR-1039` (promoted to RFI-142, waiting), `THR-1031` (overdue, bounced, Confidential), `THR-1050` (mail to the project address, unmatched).
- Know the three roles in **Viewing as**: GC project manager (sees everything, including cost), GC project engineer (no cost, no Confidential thread they are not on), Subcontractor guest (own threads only, no notes, no Delivery, no Promote).
- Decide what to skip. The full script is about 25 minutes. Act 2 alone is 10 and carries the strongest moments.

What not to say: the Drawings sheet and the RFI screens are **stand-ins** for those products. Review the email behaviour on them, not the sheet viewer or the RFI form. The AI summary and the AI-drafted question are mocked text. The sandbox bar is ours, not the product's.

## 3. The script

Format per step: **Do** (the click), **Say** (the talk track), **Point at** (what the audience should see), **Why** (the value you are proving). Keep the talk track short and let the screen do the work.

### Opener (2 min)

**Say.** "This is Linarc's Email, upgraded. Everything you can do today is still here. I'll show you three things on top: sending from where the work is, turning an email into an RFI in one step, and getting an answer from someone who will never log in. And I'll show you that none of it asks your PM to stop using Outlook."

**Do.** Stay on the Drawings sheet. **Point at** the sheet, the single markup cloud at Grid B-4.

### Act 1 · From the drawing to a consultant's phone (7 min)

1. **Do.** Click the cloud at Grid B-4. **Point at** the popover: the markup's text, its author and time, two actions. **Say.** "Alex found a duct clashing with the acoustic cove this morning. The markup already carries the sheet, the revision and the grid."
2. **Do.** Click **Email about this markup**. **Point at** the panel: *Linked record* `A-302 · Rev 3`, the cropped markup preview under it. **Say.** "The record and the revision are pinned. If Rev 4 is issued tomorrow, this message still points at Rev 3, and says so. Nobody will argue about which drawing we meant." **Why.** Bet 1: context captured without a change of habit; the immutable revision pin.
3. **Do.** Open **To**. **Point at** the order: the sheet's suggested recipients first (the architect, the HVAC sub, the structural engineer). **Say.** "Suggested first, then every guest on the project."
4. **Do.** In **Add by email**, type `m.vance@acoustix.com` and click **Add**. **Point at** the inline form: name and company already guessed from the address, a role select. Click **Add recipient**. **Say.** "Marcus is the acoustic consultant. He isn't set up on the project yet. Today you'd leave this screen, go to My Team › Guests, create him, come back. Here he's a recipient in one step, and he's now a guest user for every other record." **Why.** The biggest friction in today's Compose, removed in place.
5. **Do.** Scroll to **Attachments** and read the line under it. **Say.** "Today's limit is 20 MB; the help centre tells you to put bigger files in cloud storage and paste a link. Here a 45 MB site walk video goes by secure link automatically. Nothing is refused."
6. **Do.** Type one line in **Message** (the editor is the product's rich-text editor) and click **Send**. **Point at** the acknowledgement: *Sent with A-302 · Rev 3 at Grid B-4 · Corridor 3E pinned* and **Open in Email**. **Say.** "Sent, pinned, and already a thread in the project."
7. **Do.** On the phone (or at 390), open `/?p=correspondence-portal#tk-marcus-a302`. **Point at** sender, project, "Response requested by", the pinned markup with *View the full sheet*, the video with **Stream**, the reply box. **Say.** "This is what Marcus opens from his mail. No account, no password. He sees exactly which spot on which revision, he can stream the video, and he answers here or just replies to the email. Both land in the thread." **Why.** Bet 3.
8. **Do.** Type a reply and **Send**. **Point at** *Reply sent*. Then back on the desktop, open the thread (`Communication › Email` › the top row). **Point at** Marcus's reply as an entry, the thread back in **Needs action**. **Say.** "His answer is in the project, with the time it arrived."

### Act 2 · From an email to a formal RFI (10 min)

9. **Do.** Go to `Communication › Email` (the picker, or the Email rail). **Point at** the segments: All, Needs action, Waiting, Overdue, Unmatched; the Status and Response due columns; the Linked record column. **Say.** "This is today's project Email screen with triage added. One signal per status: a chip only where you need to act, a red one only when something failed." Click **Overdue**, then **Needs action**. **Point at** the Filter button's count changing. **Say.** "The views and the filter panel are the same thing; nothing above the table fights the grid."
10. **Do.** Click **Open** on `THR-1042`. **Point at** the title bar (subject, thread id, Needs action), the **Summary** with the AI chip. Hover the chip. **Say.** "Three messages or more and you get a summary. It's labelled AI, with the disclaimer, and every bullet has a Source." Click a **Source**. **Point at** the highlighted message. **Say.** "Nothing in the summary is unsourced." **Why.** AI the way a legal reviewer would accept it (D-44).
11. **Do.** Scroll to the yellow **Internal team note**. **Say.** "Sarah told Alex to hold off on the $4,200 reply. Apex never sees this." Prove it: in **Viewing as**, pick *Subcontractor (guest)*. **Point at** the note gone, the Delivery tab gone, Promote gone. Switch back to *GC project manager*. **Why.** The visibility model (D-41), shown rather than claimed.
12. **Do.** On Dave's message, click **Promote to record**. **Point at** the panel beside the thread with Dave's message highlighted behind it; the five fields; the **Drafted by AI** chip on the Question; **Create RFI** disabled. **Say.** "Five fields, pre-filled from the email. The question is drafted from Dave's words, and it says so. You can't create until you've at least looked at it." Click into the Question, change a word. **Point at** the chip turning into *Edited* and the button enabling. **Say.** "Once a person has edited it, it's theirs." **Why.** Bet 2, with the human in the loop.
13. **Do.** Click **Create RFI**. **Point at** the confirmation *RFI-143 created · Open RFI-143*, the event row in the thread, the status now **Waiting on them**, the Linked items panel showing RFI-143. **Say.** "The thread didn't go anywhere. It is now the RFI's email."
14. **Do.** Click **Open RFI-143**. **Point at** the RFI's **Email** tab with the same thread, and **Compose** in the title bar. Click **Compose**. **Point at** *Linked record RFI-143*, To pre-filled with the assignee, **Attach a PDF of RFI-143** checked. **Say.** "This is today's Email tab, upgraded. Same fields, plus the pin, plus the PDF option you already have." Cancel. **Why.** Parity first, then the delta (D-40).

### Act 3 · Mail that arrives on its own, and mail that failed (5 min)

15. **Do.** Back on `Communication › Email`, click **Simulate inbound email** in the sandbox bar. Pick *Ray Castellano · SunState Drywall & Framing*, destination *Project address · rmc-04@mail.linarc.io*, subject "Door frames waiting on reader box size", a line of body, the photo attachment. Click **Receive**, then **Open**. **Say.** "Ray didn't reply to anything. He emailed the project address from his phone. It's here, with his photo, and it's Unmatched." **Point at** the Unmatched segment on the way. **Why.** The hybrid model: mail finds the project without anyone logging in.
16. **Do.** Back on the list, **Unmatched** view, click **Link to record** on Ray's row, choose `SUB-088`, **Link**. **Point at** the subject gaining the record prefix and the row leaving Unmatched. **Say.** "One click to put it on the submittal. From now on it's on SUB-088's Email tab."
17. **Do.** Click **Overdue**, open `THR-1031`. **Point at** the Confidential chip, the red **Delivery failed** chip, the notice with the SMTP reason, **Update contact and resend**. **Say.** "Valerie's mailbox was migrated. Today you'd see a red icon and hover for the error. Here the notice tells you what happened and offers the fix." Click it, **Point at** the corrected address pre-filled, click **Update and resend**. **Point at** the resent message, the notice gone, and the **Delivery** tab with *Contact updated* and *Sent*. **Why.** A warning that guides, and the delivery record a claim will need.

### The hybrid moment (2 min, optional but strong)

18. **Do.** **Simulate inbound email** again. Pick *Alex Morgan · Vanguard (team, from their own mailbox)*, destination *Reply to THR-1042*, a line of body. **Receive**, **Open**. **Point at** Alex's reply as an outbound message, relayed to the thread's guests, the thread in **Waiting on them**, and the Delivery tab's *Reply received … from the sender's own mailbox* and *Relayed to the thread's guests*. **Say.** "Alex answered from Outlook. He never opened Linarc. The thread, the guests and the record all got it anyway. That is the whole model: your inbox stays your inbox; Linarc keeps the record."

### Close (2 min)

**Say.** "Four things to react to: sending from the drawing with the revision pinned, Add by email, promote with the drafted question, and the secure link for people and files that don't fit in mail. Which of those did you notice first? And honestly: would you triage here, or in Outlook with the notifications?" Then show the Figma page (menu › Figma) if designers are in the room: "Every screen you saw is also an editable map in the design system, built from the same components."

**Do.** Click **Reset demo data** before the next audience.

## 4. Why it is valuable (the talking points, with their evidence)

| Claim | What to show | Where it comes from |
|---|---|---|
| Nothing you have today is lost | Compose fields: From, To (guests), CC, Subject, rich text, attachments, Attach record PDF; delivery status; auto-threaded replies | Help centre parity table, `00-plan.md` §0; D-40 |
| Email becomes part of the record | Linked record column; the thread on the RFI's Email tab; Link to record on unmatched mail | Spec §4, §9 |
| The revision can't be argued about | The pin `A-302 · Rev 3` and the superseded note on `S-201 Rev 1` | Spec §5; DrawingPinPreview |
| Escalation without re-typing | Promote: five pre-filled fields, the drafted question, one click to an RFI | Spec §8; D-37 |
| AI you can defend | The chip, the disclaimer, Source on every bullet, Create disabled until reviewed, chip gone once edited | D-44 |
| Nothing internal leaks | The guest role: no notes, no cost, no Delivery, no Promote; the link page shows only its own thread | D-39, D-41 |
| Proof when a claim comes | The Delivery tab: sent, bounced, link opened, file downloaded, resent, contact updated | Status model, audit events |
| Your inbox stays your inbox | Simulate inbound: a team member's Outlook reply relayed to the guests; mail to the project address | D-42 (hybrid model) |

Competitive framing, to validate rather than assert: Procore Correspondence, Autodesk Build and Fieldwire also attach email to projects. What they do not do together is the drawing pin with an immutable revision, the one-step promote with a drafted question, and the zero-login page for large files. Listen for which one the client names unprompted.

## 5. How the system works (for the team)

The prototype is not a mock-up. It is a working front end on the real design system, built by a repeatable method. The layers, top to bottom:

1. **The module docs** in `docs/correspondence/`: `00-plan.md` (bets, scope, test tasks, questions, decisions, build order), `spec.md` (the facts each screen needs), `status-model.md` (every status label and tone, one signal per value), `screens.md` (one row per screen with persona, nav, pattern, states, stage). The `spec-to-prototype` skill reads exactly these four files. Standing rules live in `CLAUDE.md`, `docs/5-ui-patterns.md` and `docs/4-decisions.md`.
2. **The data layer** in `src/modules/correspondence/data/`: people (team and guest users), records (drawings, RFIs, submittals, COs), threads, secure links, and `actions.js`, the only place that writes. Everything a person changes goes through the **demo session** (`src/modules/session.js`), overlays the static data, survives a reload, and shows on every screen. **Reset demo data** clears it. Statuses come from `src/modules/app/status.js`; a template never contains a status string.
3. **The screens** in `src/prototypes/correspondence-*/`: Vue 2.7 Options API, plain JS, design-system components imported from the sibling library's source (`@/componentsV2/*`, `@/components/*`). Tokens only, no hex, no raw spacing; `yarn check` enforces it. Navigation is in-document (`router.js`), so the shell never blanks; data loads through `LoadRegion` with the 200 ms skeleton rule, honest slow and error states, and the sandbox's latency switch to review them.
4. **The candidates** in `src/candidates/`: components the design system lacked (SlideOverPanel, ThreadStream, AiSummary, DrawingPinPreview), each with a proposal in `docs/components/`, a README, and a row in the backlog. They are built as they will ship (props and slots, no page data), drawn in Figma for the design iteration, and only then promoted into the library.
5. **The Figma map** on the Documentation file's Email page: editable library instances of every screen, numbered labels, arrows for navigation and state change, hotspots on what was clicked. Every text has a style and every colour, padding, gap and radius is bound to a variable. The design review happens there, not on screenshots.
6. **Verification**: `yarn verify` (conventions plus build), `yarn shot <slug>` (light and dark at 1440, 1024 and 390, console errors, overflow), the data smoke test, and one interaction script per screen under `scripts/` that drives every demo flow and asserts the result. Every step ends green before it is recorded.
7. **The record**: one `docs/prototypes/<slug>.md` per screen (components, gaps, verification, design flags), a dated finding in `docs/findings-log.md` for anything that broke or surprised, and the decision register for anything decided.

Sandbox controls that make the demo possible without a backend: the role switcher (`prototype.roles`), the record picker (`prototype.records`), **Simulate inbound email** (`prototype.inbound`: a guest's reply, a team member's reply from their own mailbox, or mail to the project address, with an optional attachment), simulated latency, and the theme toggle.

To add a screen: a row in `screens.md`; a pattern from `5-ui-patterns.md`; data in `data/` and writes in `actions.js`; copy `src/prototypes/_blank/`; register it in `router.js` and `nav.js`; pass 1 with existing components, pass 2 with candidates; `yarn verify` and `yarn shot`; the interaction script; the record; the Figma frame.

## 6. Questions you will get

- **"Is this replacing our email?"** No. It upgrades the Email tab and the Email screen you have, and it is built so a PM can keep working in Outlook. The thread forms either way.
- **"Does the AI send anything?"** Never. It drafts and summarises, it is labelled, and nothing it writes leaves the project or lands in a record until a person edits or confirms it.
- **"What does a subcontractor see?"** Only threads they are on, never internal notes or cost. Switch the role and show it.
- **"What about files over 20 MB?"** They go by secure link; the recipient streams or downloads without an account, and the open is recorded.
- **"How long does a link live?"** 30 days, revocable by the sender, and an expired page offers a new link to the same address.
- **"Is the drawing viewer real?"** No, it's a stand-in. The compose-from-markup flow is the thing being tested.
- **"How much of this is real code?"** All of the front end runs on the production design system's components. The backend is simulated; the data model, statuses and actions are written to map onto the product's.

## 7. Known limits, so you are not surprised

- The sheet and the RFI detail are stand-ins. The AI content is mocked. No real mail is sent or received; **Simulate inbound email** stands in for the mail server.
- Send enables about half a second after you stop typing in the rich-text editor (the product's editor debounces its value).
- In Figma, the Project module's side nav has no Email rail and its top nav has no Drawings or RFIs tools, so those frames select the nearest item or none. Those are design-system gaps logged for the team (F-010).
- The modal variant of Promote, the proof-pack export and the portal's quick-response buttons were cut from the MVP on purpose. They are listed as follow-ups in the spec.

## 8. Quick reference

| Screen | URL | Records |
|---|---|---|
| Email screen | `/?p=correspondence-list` | — |
| Email thread | `/?p=correspondence-thread#THR-1042` | `THR-1042`, `THR-1039`, `THR-1031`, `THR-1050` |
| RFI stand-in | `/?p=correspondence-context-rfi#RFI-143` | `RFI-143`, `RFI-142` |
| Drawings stand-in | `/?p=correspondence-context-dwg#A-302-Rev3` | `A-302-Rev3`, `S-201-Rev1` |
| Secure link page | `/?p=correspondence-portal#tk-marcus-a302` | `tk-marcus-a302`, `tk-kenji-rfi142`, `tk-expired` |

Useful URL switches: `?theme=dark`, `?latency=slow|fail|fail-once`, `?chrome=0`.

Scripts: `yarn verify`, `yarn shot <slug>`, `node scripts/smoke-correspondence-data.mjs`, `node scripts/interact-correspondence-<list|thread|rfi|dwg|portal>.mjs <port> <out-dir>`.

Figma: Documentation file, page Email (`4084:9896`); library `_ ☉ Candidates` page for the four candidates.

Docs: `docs/correspondence/` (plan, spec, status model, screens), `docs/prototypes/` (one record per screen), `docs/components/` (candidate backlog), `docs/4-decisions.md` (D-34 to D-44), `docs/findings-log.md` (F-003 to F-010).

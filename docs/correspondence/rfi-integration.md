# RFIs × the upgraded Email: review and recommendations

**For:** product and design (RFI and Email owners). **Date:** 2026-10-20. **Status:** recommendation; built in `correspondence-context-rfi`, drawn on the Documentation file's Email page: [App map — Level 3 · RFIs › RFI with Email](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4122-2257) (screens 08 Details, 09 Email tab, 10 Add to Q&A, 11 Q&A, 12 Revise with Notify by email, 13 Workflow & Activity). Decisions: D-48 (where email lives on an RFI), D-49 (Email → Q&A). Open points are in §5.

**Reviewed:** the Documentation file's [☉ Create RFI](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=0-1) page (Creation Form, Q&A, Workflow, Email, Read-only view, Redirect from plan sheet, Existing flow with updated components, Status Tag).

## 1. What the RFI designs have today

| Area | Frames | What's there |
|---|---|---|
| Header | every frame; read-only [1703:44860](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-44860) | Title Bar / Workflow: *Create RFI* + `RFI-001`. After creation it adds **Type**, a **Due date** chip and a **Status** chip. On the right: *Last updated*, then toggles for Activity log, Comments and Chat |
| Tab bar | [1420:26174](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1420-26174) | *Details · Q&A*. The workflow action sits on the right of the tab bar: **Route**, or **Reject · Revise · Approve**, or **Close**. Then download and delete |
| Details | [1703:44906](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-44906), [1703:44820](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-44820), [1915:104117](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1915-104117) | RFI Name, RFI Type, Sequence, Priority, Location, Due Date, Schedule Impact (Yes/No), Cost Impact (Yes/No), *Custom details*, the question in the rich-text editor with attached files, and **Linked items** (a plan sheet when created from Plans) |
| Q&A | [1703:45450](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-45450), [1703:45222](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-45222) | One entry per workflow step (*Step 2: Created by … on …*): avatar, role chip, company, time, body. An inline editor with *Add Attachment* and *Link Item*, then *Cancel / Route* |
| Workflow | [1703:45546](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-45546), [1703:44980](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-44980) | A template select, then the steps CREATE → RESPOND → REVIEW → CLOSE. Each step has shared timing (process days; in, due and out dates), parallel parties (company type, company, user) and a status. A table view lists Step, Action, Company type, Company, User, Process days, In, Due, Out and Status |
| Email | [1703:45957](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-45957), [1703:46016](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-46016), [1703:46082](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-46082) | *Inbox: All* and *Compose*. Below them, a mail list about 300px wide, a reader (FROM, TO, body, REPLY, *Enter Message*) and Compose inline in the reader: From, To, CC, Subject, the editor and *Linked Items* |
| Right panel | all | Activity Log (empty state), with **Watchers (n)** under it (search and *Add*); Comments when toggled |
| Status Tag | [1703:46309](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=1703-46309) | Three chip sets: RFI (4 tones), Email (3), Workflow (4). All are labelled "Chip" |

## 2. What doesn't work with the upgraded Email

1. **No route to Email or Workflow.** The tab bar has only Details and Q&A. The Email and Workflow frames show the same two tabs with neither selected.
2. **A mailbox squeezed into a record.** The Email frames put three panes (list, reader, compose) in the 816px column while the Activity panel stays open. At 1440 the reader is about 540px wide, and on a laptop or phone the layout doesn't fit. A message is shown on its own: you can't follow a conversation with Dave and Elena as one thread.
3. **Compose uses the wrong controls.**
   - **To and CC** are dropdown selects, so you can't type an address or paste a list, and you can't tell inside from outside the company.
   - **Subject** is a dropdown select.
   - **From** is an editable field with the placeholder *RFI Title*.
   - There's no *Response due*, no pinned record or revision, and no *Attach RFI PDF* (today's product has it).
4. **Email and the formal record are disconnected.** Answers arrive by email but the official answer lives in Q&A, so someone retypes them, and the email and the Q&A step drift apart. Routing a workflow step to a consultant doesn't email them.
5. **Recipients are set up three times.** The Distribution List (the newer rail), Watchers and the workflow step's parties are separate lists, and Compose uses none of them.
6. **Status has no words.** The Status Tag frames show tones but no labels, so the Email chip on a mail row ("Chip") can't be built.
7. **Delivery is invisible.** Nothing says whether the architect got the RFI, opened the link or downloaded the sketch. The Activity Log panel is empty in every frame.

## 3. Recommendations

### A. Email is a tab of conversations (D-48)
- **Tabs:** **Details · Q&A · Workflow · Email**. The Email tab shows a count when a thread needs action (*Email 1*). The workflow action (**Route**, or **Reject · Revise · Approve**, or **Close**) moves from the tab bar to the **title bar**, where it is the RFI's main call to action (D-50).
- **The Email tab** lists the RFI's threads, newest first. Each thread shows its subject, a triage chip (*Needs action*, *Waiting on them*, *Resolved*) and a link to the full thread in Email, then the thread itself (messages, internal team notes, events, delivery) and the reply composer. When there are many threads, a filter (*All, Needs action, Waiting, Overdue*) replaces *Inbox: All*.
- **Compose lives inside the Email tab**, at the top of its content, and shows only when Email is selected (D-50). In the title bar it read as composing an RFI; inside the tab it can only mean an email about this RFI. It is a secondary button so it never competes with Route. It opens the slide-over Compose panel used everywhere else (D-34), so the record stays visible behind it. This retires the three-pane layout.
- **Empty state:** *No email on this RFI yet. Compose sends from here with RFI-142 pinned; replies from any mail client come back to this tab.*

### B. Compose on an RFI
| Field | Recommendation |
|---|---|
| Linked record | Pinned and read-only: `RFI-142` and its title. When the RFI links a drawing, the drawing and revision go with it |
| From | Read-only: the sender's name and address |
| To / Cc / Bcc | RecipientField (D-47). Suggestions start with the **current workflow step's parties**, then the **Distribution List**, then the rest of the directory. To is prefilled with the ball-in-court party. Amber chips mark people outside the company and red chips mark invalid addresses. An address not on the project is refused with a line naming My Team › Guests (D-60) |
| Subject | Text, prefilled `[RMC-04] RFI-142 — <RFI name>` |
| Response due | Short date. On an RFI it defaults to the **current step's due date** (otherwise three working days) |
| Message | Rich text |
| Attachments | From the footer's tool row: a device file, a link, a cloud-drive file or a record, as chips (D-58). Files over 20 MB go by secure link. The RFI's PDF is attached by default, removable |

### C. Email → Q&A: *Add to Q&A* (D-49)
The most useful change. On the Email tab, every inbound message has **Add to Q&A**. It opens a panel beside the thread, with the message highlighted, prefilled with:
- **Step type:** *Response* when the sender is the ball-in-court party, otherwise *Comment*. The person can change it.
- **From:** the sender, with their company.
- **Text:** the message body. Quoted history and the signature are removed, and the removed lines are listed so nothing disappears silently.
- **Files:** the message's files, each a checkbox (all on).

Saving adds the step to Q&A with an **Email** source chip that links back to the message. The thread gains the event *Added to RFI-142 Q&A as Step 3*, and the Activity panel logs it. Nothing is sent to anyone. The reverse also works: **Email this** on a Q&A step opens Compose with the step quoted, addressed to the step's parties.

### D. Workflow → Email
- **Route** opens a short confirmation:
  - The next step and its parties.
  - **Notify by email**, on by default when a party is outside the company.
  - An optional message.
- Confirming completes the current step, starts the next one, moves the ball in court and, if *Notify* is checked, sends one email per route. That email has the RFI pinned, its PDF attached and *Response due* set to the step's due date.
- A party without an account opens it through the secure link page and can answer by replying. The reply lands on the Email tab, ready for *Add to Q&A*.
- **Revise** returns the RFI to the Respond step and can notify the same way. **Approve** advances; **Reject** ends the workflow; **Close** closes the RFI.
- **Closed RFIs can't send email** (today's rule): Compose is disabled and its tooltip says why.

### E. Right panel: Activity with email in it, Watchers kept
- **Activity** (newest first) mixes record events (created, routed, step completed, added to Q&A, closed) with email events: sent, delivered, link opened, file downloaded, delivery failed, reply received. Each row shows the event, who, when and *Open thread*.
- **Watchers** stay notification-only (they don't receive the RFI's email unless added as recipients). The Distribution List feeds Compose suggestions (§B).
- **Comments vs internal team notes:** both are internal. Comments are about the RFI and internal notes are inside a thread. We keep both and recommend the Comments panel also lists the thread notes, read-only (open, §5).

### F. Header
Title, number chip, **Type**, the **Due** date (a chip only when due today or overdue, per D-17), the **Status** chip, and **Ball in court**. The header action is the **workflow move** for the step in hand (Route; Reject · Revise · Approve; Close), not Compose (D-50).

### G. Status vocabulary (proposed for the Status Tag frames)
| Dimension | Labels (tone) |
|---|---|
| RFI | Draft (neutral) · Open (warning) · Answered (info) · Closed (success) · Rejected (error) |
| Workflow step | Not started (neutral) · In progress (info) · Overdue (error) · Completed (success) · Returned (warning) |
| Email (thread) | Needs action (warning) · Waiting on them (neutral) · Resolved (success): the triage values already used on the Email screen |
| Q&A step source | Linarc (none) · Email (chip, links to the message) |

## 4. What the prototype adds so the RFI feels real
`correspondence-context-rfi` is rebuilt from a stand-in into an RFI detail that follows the Figma:
- **Details:** Name, Type, Sequence, Priority, Location, Due date, Spec section, Schedule impact (Yes, *2 working days*), Cost impact (Yes, *$4,200*; internal roles that can see cost), Question, **Proposed solution** (the contractor's suggested answer, standard on RFIs), Reference (drawing and detail), Custom details, and Linked items (the drawing revision and the email threads).
- **Q&A:** the steps so far, then *Add response* (rich text, files, *Link item*).
- **Workflow:** template *Design team RFI*, with Create → Respond → Review → Close. Each step shows its parties, process days, in, due and out dates, and status. The current step is open.
- **Email:** as §A.
- **Activity and Watchers** in the right panel.
- **Workflow actions** in the title bar, changing with the step; **Compose** at the top of the Email tab only.

## 5. Open questions for design
1. The labels for the Status Tag chips (§G).
2. Comments and internal notes: should one list show both?
3. Is the Distribution List a rail item (newer frames) or a Details section? We read it as configuration and use it only for suggestions.
4. Can *Add to Q&A* write the **official response** (the answer that closes the RFI), or only a step that the reviewer then approves? We propose a step only: the Review step makes it official.
5. Should *Notify by email* on Route be per party (a checkbox each) or per route (one checkbox)? We built one per route.

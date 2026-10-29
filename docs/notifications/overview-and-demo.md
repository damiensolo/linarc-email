# Notifications upgrade: overview, the jobs it does, and the demo

For product leadership, client stakeholders and whoever presents the prototype. Sections 1 to 5 are the case for the enhancement; §6 is the step-by-step demo. Everything runs on the prototype in this repo (`?p=correspondence-list` and the two `notifications-*` screens); nothing sends real mail. The working documents behind it: `00-plan.md` (bets, test tasks, open questions), `spec.md` (behaviour), `status-model.md`, `screens.md`, and the proposal in `source/`. The Email demo that this one builds on is `../correspondence/demo-guide.md`.

## 1. Product overview

Linarc already notifies people: a bell in the top bar, a drawer of events, a per-project Notification Log and a preferences grid of mail and text checkboxes. This enhancement keeps all of that as the entry point and the delivery record, and replaces what the bell shows with a **responsibility-based view of the project's open obligations**.

| Surface | The question it answers | What is new |
|---|---|---|
| **The bell** (every screen) | Do I owe anything right now? | The count is distinct obligations that need *my* action, not unread events. A second signal says whether a Critical item is waiting for my acknowledgment. |
| **The drawer** | What needs me, what am I waiting on, what changed? | Views **Needs action · Waiting · Updates · All**, a **Critical** section first, one card per obligation with the reason it is in front of this person, the due date, and one action that lands on the record. |
| **The banner** | Something critical just arrived; must I stop? | No. A bar under the top nav with *Acknowledge* and *Open*; it never steals focus or discards an edit. |
| **All notifications** (full page, Communication › Notifications) | How do I triage at scale and see my team's load? | Scopes **My responsibilities · My team · Watching**, the grid's Filter panel, bulk *Acknowledge*, the history of every item. |
| **Preferences** | What reaches me, by which channel, and who covers me when I am away? | Persona presets, an event family × channel × cadence matrix with company-locked cells, quiet hours, and **out-of-office cover** with a preview of what the delegate will and will not see. |
| **Change severity** | Can a Critical be wrong? | A project manager can downgrade or close one with an outcome and a required reason; the audit row is kept and the record itself does not change. |

Two rules hold it together. **Email and notifications are one set of obligations**: a thread that needs a reply, a bounced message and an RFI step in someone's hands are the same item in the drawer, on the Email screen and on the record. **Notifications never become a second task list**: every action on a card is the record's own action, and only the record resolves an item.

## 2. The problem today

The reviewed drawer shows **1,323 new of 1,341** notifications on one project. That number is the problem in miniature:

- **Read is not done.** Marking something read says nothing about who owns it or whether it was handled. A PM cannot tell an overdue commitment from a noticed one.
- **Recency buries risk.** A sheet-analysis completion from this morning sits above an RFI answer that has been overdue for three days. The list is a timeline, not a worklist.
- **Noise and obligation look alike.** Payment delinquency, schedule imports, document processing and a bounced email to the architect get the same row.
- **Nobody is accountable for an item.** There is no owner, no fallback when the owner has left the project, and no cover when they are on leave. Obligations go quiet.
- **Email is separate.** The Email upgrade's Needs action, Overdue and Delivery failed states are mailed as notifications, but the bell does not know they exist, so a person triages the same thing in two places.
- **Urgent means loud.** An urgent item is a red dot or a mail; neither says why it is urgent, who confirmed it, or by when it must be acknowledged.

The result is that project managers triage in Outlook and treat the bell as something to clear, which is what the count shows.

## 3. Who it is for, and the jobs to be done

The personas are the ones already in the Email prototype's demo data (Riverside Medical Center, Vanguard Construction Group). Each job is written as *when, I want to, so that*; the right-hand column is where the prototype serves it.

| Persona | Job to be done | How the design serves it |
|---|---|---|
| **GC Project Manager** (Sarah Jenkins) | When I open the project on a Friday morning, I want to see what I owe, what I am waiting on from others and what is critical across the project, so that I can decide the day in two minutes without opening Outlook. | The drawer's Needs action and Waiting views with explainable counts; a **Project oversight** section listing every Critical on the project without inflating her own count. |
| | When a Critical turns out to be wrong, I want to downgrade it with a reason that is kept, so that the team trusts the signal and nothing is hidden. | *Change severity*: outcome, required reason, audit row; the RFI stays open with its owner. |
| | When I go on leave, I want someone to pick up what I own and to know exactly what they will not see, so that nothing goes quiet and nothing confidential leaks. | Out-of-office cover with the preview of covered and excluded items, *Start cover*, *Covering for Sarah Jenkins* on the delegate's cards, and the return of unresolved items when cover ends. |
| | When I need to see how loaded my engineers are, I want their open obligations in one table, so that I can rebalance before something is late. | The full page's **My team** scope with a Person column and the grid's Filter panel. |
| **GC Project Engineer** (Alex Morgan) | When a field answer is due today, I want to know it is critical, why, who confirmed it and by when I must acknowledge, so that I chase the right person instead of reading a red dot. | The Critical card: *Critical because …*, the superintendent's quote as evidence, *Waiting on Kenji Takahashi*, *Acknowledge by 11:45*, the fallback named. |
| | When something critical arrives while I am writing an email, I want to be told without losing my draft, so that I decide when to act. | The nonblocking banner; the draft survives; the item waits in the drawer. |
| | When I cannot act on a reply until Monday, I want to park it without it disappearing from what I owe, so that my count stays honest. | *Snooze* keeps the item in the total with a *snoozed* subtotal; a Critical's snooze is bounded to its due date and keeps its signal. |
| **General Superintendent** (Carlos Reyes) | When framing stops on site, I want the office to see the blockage as a critical item with my words attached, so that the answer comes before Monday. | The confirmed Critical is seeded from Carlos's site confirmation; he is also the **project fallback** who is told if nobody acknowledges in time. |
| **Subcontractor PM** (Dave Miller, guest) | When I log in, I want only what I owe on the threads I am on, so that I am not shown, or counted against, things I cannot open. | The guest's bell counts only his own obligations; no Team scope, no internal notes, no cost, no count of hidden items. |
| **Owner representative, accounting** | When a pay application or a contract decision is material, I want it immediately and the rest in a digest. | In the catalog and the persona presets; no records in this prototype (the matrix rows say *No events in this demo*). |

The common job underneath: **know what I owe, why, and by when, without a second worklist**.

## 4. As-is and to-be

| Scenario | As-is | To-be (what the prototype shows) |
|---|---|---|
| **Friday morning** (Alex) | Opens the bell: hundreds of unread rows, newest first, most of them processing events. Opens Outlook instead and scans for the architect's reply. Does not know RFI-142's answer is due today and that framing has stopped. | The bell reads **1**, with a critical state. The drawer opens on the Critical card: *Respond RFI-142*, due today, Carlos's confirmation quoted, *Waiting on Kenji Takahashi*, *Acknowledge by 11:45*. Needs action holds one reply owed to Dave; Waiting shows the two RFIs he is following up. |
| **The same obligation, two people** (Alex and Sarah) | Both get a mail. Neither screen says whose turn it is. | RFI-139 is Sarah's **Needs action** (she is reviewing) and Alex's **Waiting** (*Waiting on Sarah Jenkins*): one item, two projections. |
| **A critical arrives mid-work** | A mail lands in the inbox; a toast or a modal interrupts the compose; or nothing happens until the next refresh. | A bar under the top nav: *Critical · Delivery failed: Kenji Takahashi, AIA didn't receive …* with *Acknowledge* and *Open*. The draft is untouched; the bell shows *2 critical, 1 not acknowledged*; dismissing the bar keeps the item. |
| **A reminder repeats** | A second reminder is a second unread row. | The existing card gains a history row; the count does not change. |
| **A bounce on a critical thread** | A red icon, an SMTP code on hover, and a reply that never arrives. | A card whose action is *Update contact and resend*; resending resolves the card; the acknowledgment stays in its history. |
| **Going on leave** (Sarah) | Tells Alex in a hallway. Her RFIs keep mailing her; the Confidential thread is forgotten. | Cover by Alex for two weeks; the preview says what he will cover and that the Confidential thread is excluded because he is not a participant; his cards read *Covering for Sarah Jenkins*. |
| **The owner's rep disputes a Critical** | Someone edits the RFI priority, or ignores the red. Nobody records why. | Sarah chooses *Condition resolved* with a reason; the card reads *Was Critical*; History shows *Severity changed*; the RFI is still open and still with Kenji. Alex sees the same option disabled: *Only a project manager can change a Critical item*. |
| **The subcontractor's view** (Dave) | Guest users are mailed with everyone else and see nothing in-app that says what is theirs. | Dave's bell counts his one obligation; the drawer shows only threads he is on; nothing internal and no Team scope. |
| **Preferences** | A grid of mail and text checkboxes per module. Muting is the only control. | Presets per role, a matrix of In app · Email · Push with Immediate · Digest · Off, cells locked by company policy with the reason, quiet hours with the mandatory exceptions listed, and cover. A preference changes delivery, never responsibility. |

## 5. Why it is a valuable platform enhancement

- **It makes the bell trustworthy again.** Every count is explainable and counts only obligations; an honest count is the only reason anyone will open the drawer before Outlook.
- **It reuses what the platform already has.** The bell, the drawer, the Notification Log and the preferences page stay. The Email upgrade's three notifications become items instead of a parallel mail stream.
- **It is governable.** Severity has a reason and evidence, overrides are audited, mandatory delivery is a per-event policy shown as locked cells, and delegation is explicit and reversible.
- **It is safe by construction.** Nothing is created inside Notifications; nothing closes an RFI from a card; acknowledging never resolves; a guest never sees a count of things they cannot open.
- **It extends to the rest of the platform without a redesign.** Financials, contracts, scheduling, field and safety events plug into the same item model, presets and matrix; the prototype already lists the families and lands only where records exist.

What to watch for in client sessions (`00-plan.md` §5): whether participants explain a Critical card's reason in their own words, whether *Acknowledged* is ever read as *done*, and which counts they disagree with.

## 6. The demo, step by step

About 20 minutes. Format per step: **Do** (the click), **See** (what the audience should notice), **Say** (the talk track). Let the screen do the work.

### Before you start (5 minutes)

- `yarn dev`, then open `http://localhost:5173/?p=correspondence-list` at 1440 wide, light theme.
- The sandbox bar at the top is **not the product**: say so once. It holds the screen picker, the record picker, **Viewing as** (the role), **Simulate inbound email**, **Simulate event**, **Reset demo data**, and the ··· menu (theme, loading speed, the screen's Figma frame). `?chrome=0` hides it; the gear in the top nav brings it back.
- Click **Reset demo data**. Set **Viewing as** to *GC project engineer* (Alex Morgan).
- Know the data. The demo clock is Friday 16 October, 10:30 (the cover defaults to today for two weeks: 16 Oct to 30 Oct). `RFI-142`: the lead-lined partition answer is due today from Kenji Takahashi (architect); Carlos confirmed at 07:40 that framing at Grid D-7 has stopped; this is the one seeded Critical. `RFI-143`: waiting on Elena Rostova, due 21 Oct. `RFI-139`: Alex asked, Sarah is reviewing. `THR-1042`: Alex owes Dave Miller a reply, due today. `THR-1031`: Sarah's Confidential thread, overdue and bounced. `THR-1050`: mail to the project address, unmatched. `THR-1039`: Alex's thread with Kenji about RFI-142.
- Know the three roles in **Viewing as**: *GC project manager* (Sarah: sees everything, may change a Critical), *GC project engineer* (Alex: may acknowledge and assign, not override), *Subcontractor (guest)* (Dave: own threads only).

### Opener (1 minute)

**Say.** "You have a bell today. On the project we reviewed it showed 1,323 unread. Nobody can act on that. This upgrade keeps the bell and changes what it means: it counts what you owe, says why something is critical, and never asks you to stop what you are doing. And it is the same obligations you see in Email and on the RFI, not a second list."

### Part A · What needs me, and why (6 minutes, as Alex)

1. **Do.** Point at the bell. **See.** The count **1** in the critical state (its accessible label reads *Notifications: 1 need action, 1 critical, 1 not acknowledged (1 unread)*). **Say.** "One thing Alex owes. And one critical item waiting for him to acknowledge it. That is the whole count, and he can explain it."
2. **Do.** Click the bell. **See.** The drawer over the page: *Notifications* with the badge *1 critical*; the scope switch *All projects / RMC-04* (the current project); the line *1 critical, not acknowledged*; the tabs *Needs action · Waiting · Updates · All* with counts; a **Critical** section first. **Say.** "The page underneath stays; nothing was interrupted."
3. **Do.** Read the Critical card aloud. **See.** The chip **Critical**; *Critical because the lead-lined partition answer is due today and Carlos Reyes confirmed on site that framing at Grid D-7 has stopped*; *Respond RFI-142: Level 2 Operating Room lead-lined partition termination*; *Waiting on Kenji Takahashi*; the chip **Due today**; *Acknowledge by 11:45 · then Carlos Reyes is told*; Carlos's quote; the actions *More · Acknowledge · Open step* bottom-right. **Say.** "Why it is critical, who said so, whose answer it is, who gets told if Alex does nothing by 11:45, and the one action that goes to the record. No red dot."
4. **Do.** Click **Acknowledge**. **See.** The card stays **Critical** and **Due today**; the header line changes to *1 critical, acknowledged*; the *Acknowledge by* line goes. Ask the room: "Is it dealt with?" **Say.** "No. Acknowledging says Alex knows. The RFI is still open, still due today, still with Kenji. Only Kenji's answer, reviewed, resolves it."
5. **Do.** Click **Open step**. **See.** RFI-142 opens on its **Workflow** tab (*Template: Design team RFI · 4 steps*) with the Respond step in hand; the drawer closes. **Say.** "Every card lands on the record, at the part that matters." Open the bell again.
6. **Do.** Click **Needs action**, then **Waiting**, then **Updates**. **See.** Needs action: *Reply to Dave Miller* on THR-1042, due today. Waiting: RFI-143 *Respond step with Elena Rostova, PE, due 21 Oct* with *Due 21 Oct · Waiting on Elena Rostova*; RFI-139 *Review step with Sarah Jenkins, due 19 Oct* with *Waiting on Sarah Jenkins*. Updates: *A-302 Rev 3 published*, *S-201 Rev 1 superseded by Rev 2*, and *Mark updates reviewed* in the footer. **Say.** "Three questions, three tabs: what needs me, what I am waiting on, what changed. Updates never count against you."
7. **Do.** On Dave's reply, **More › Snooze until next Monday**. **See.** The card leaves Needs action; the line *1 snoozed · still in your count*; the bell still reads 1. **Say.** "Snooze hides it from view, not from what you owe. The count stays honest."
8. **Do.** **Viewing as › GC project manager**. Open the bell. **See.** Sarah's count is **3**. Needs action: *Review RFI-139* (the item Alex was waiting on), *Delivery failed: Valerie Chen didn't receive …* with *Update contact and resend*, and *Unmatched mail from Ray Castellano …* with *Link to record*. Waiting: *Response from Valerie Chen* with the chip **Overdue**. The Critical section shows RFI-142 under **Project oversight**, not in her count. **Say.** "Same RFI-139: Alex is waiting, Sarah has the action. One item, two views, derived from who holds the step. And as PM she sees every critical on the project without being counted for it."

### Part B · A critical arrives while you work (4 minutes, as Alex)

9. **Do.** **Viewing as › GC project engineer**. Picker › *Drawings › Sheet*. Click the markup cloud at Grid B-4, then **Email about this markup**. Click into **To** and pick *Kenji Takahashi* from the suggestions (or type `ken` and press Enter). Type a line in **Message**. Leave the panel open and do not send. **See.** *Send* enables once To and the message are filled; the sandbox bar stays usable above the panel. **Say.** "Alex is mid-email to the architect about a clash."
10. **Do.** Sandbox › **Simulate event › Critical: Alex's email to Kenji about RFI-142 bounces**. **See.** A bar under the top nav: *Critical · Delivery failed: Kenji Takahashi, AIA didn't receive "RFI-142 — Level 2 OR lead-lined drywall termination" …* with *Acknowledge*, *Open* and a close; the draft untouched behind it; the bell now *2 need action, 2 critical, 1 not acknowledged*. **Say.** "His question to the architect bounced on a critical RFI. He is told at once, and nothing he typed is lost. No modal, no refresh."
11. **Do.** Click **Acknowledge** on the bar. **See.** The bar goes. Close the compose panel with its ✕ (or send it): the demo no longer needs the draft. Open the bell: the new Critical card *Delivery failed: Kenji Takahashi, AIA didn't receive …*, already *Acknowledged 10:30*, with the action **Update contact and resend**. **Say.** "Dismissing or acknowledging the bar never removes the item. It waits where it belongs."
12. **Do.** Click **Update contact and resend** on the card. **See.** THR-1039 opens with the *Delivery failed* notice. Click **Update contact and resend** in the notice, then **Update and resend**. **See.** *Contact updated and message resent*, the notice gone. Open the bell: the delivery-failed card has left Needs action; in **All** it reads *Resolved by Alex Morgan*, and *More › View history* still shows *Acknowledged*. RFI-142's own Critical remains. **Say.** "The record resolved it, not the card. The history keeps that Alex acknowledged it first."
13. **Optional, as Sarah.** **Simulate event › Reminder: THR-1031's response is still overdue**. **See.** No new card and the same count; in **Waiting**, *Response from Valerie Chen* › **More › View history** has a new row: *Updated · Overdue reminder sent to Sarah Jenkins; the same obligation, no new card*. **Say.** "A reminder is a row on the same card, never another unread item."

### Part C · Triage at scale (4 minutes, as Sarah)

14. **Do.** **Viewing as › GC project manager**. In the side nav, **Communication › Notifications** (or bell › **View all**). **See.** *All notifications*: the scopes *My responsibilities · My team · Watching*, the views, the grid's **Filter** with quick filters (Critical, Overdue, Not acknowledged, Snoozed, the sources), the count line. **Say.** "The same obligations as a table, with the filter panel every other list in Linarc uses."
15. **Do.** Tick two or three rows. **See.** *Acknowledge n* in the title bar, where n is the ticked rows she may still acknowledge. Click it. **Say.** "The one bulk action. Nothing else is bulk: no bulk override, no bulk approve."
16. **Do.** Click **My team**. **See.** The team's open obligations with a Person column (Alex's items; Carlos, the fallback, has none until an item escalates to him). **Say.** "Who is carrying what, before something goes late."
17. **Do.** Click a row. **See.** The card in a side panel with its actions and *View history*. Close it.

### Part D · Cover and changing a Critical (4 minutes)

18. **Do.** Bell › **Preferences**. **See.** *Preset* with *Project manager* selected; *What reaches you, and how*: the matrix of families × In app · Email · Push, each cell Immediate · Digest · Off, and cells that read *Set by Vanguard Construction Group policy* (hover for the reason); *Quiet hours*; *Advanced › Per-event rules* listing the families with *No events in this demo*. **Say.** "A preset sets delivery, nothing else. The company can lock a row and says why. Muting a channel never removes a responsibility."
19. **Do.** *Out of office: cover*: Delegate **Alex Morgan**; keep the dates (today for two weeks). **See.** The preview: *Alex Morgan will cover 2 items from 16 Oct to 30 Oct. Not covered: 2 (Alex Morgan is not a participant of this Confidential thread).*, then each item as *Covered ·* or *Stays with you ·*. Click **Start cover**. **See.** *Alex Morgan is covering for you until 30 Oct* with *End cover*. **Say.** "Before Sarah leaves she sees exactly what Alex gets and what he does not, and why. Nothing goes quiet, nothing confidential leaks."
20. **Do.** **Viewing as › GC project engineer**, open the bell. **See.** Sarah's items in Alex's Needs action, each with *Covering for Sarah Jenkins*; his count includes them. While here, on RFI-142 (in **Waiting**) open **More**: *Change severity (project manager only)* is disabled. **Say.** "An engineer can acknowledge and assign, never change what is critical."
21. **Do.** **Viewing as › GC project manager**. Side nav **Communication › Notifications**, scope **Watching** (her oversight view), click the RFI-142 row, then in its card **More › Change severity…**. **See.** The modal *Change severity of RFI-142*: the outcomes *False positive: the condition was never material · Duplicate of another item · Condition resolved outside the record · Accepted risk (with a review date)*; *Reason (required)*; the line *RFI-142 stays open and with Kenji Takahashi. The item keeps its history; only its severity changes.* Choose *Condition resolved*, write "Framing restarted after the site call", **Change severity**. **See.** The card now reads *Was Critical · Condition resolved by Sarah Jenkins: "Framing restarted after the site call"*; **More › View history** shows *Severity changed*. The item leaves Sarah's drawer: it is no longer critical and was never hers. Switch to Alex and open the bell's **Waiting**: RFI-142 is Important now and carries the *Was Critical* line. **Say.** "A critical can be wrong. Only a project manager can say so, with a reason that is kept, and the RFI itself is untouched."

### Part E · The guest (1 minute)

22. **Do.** **Viewing as › Subcontractor (guest)**. Open the bell. **See.** Dave's own obligation only; no Project oversight, no internal items; on the full page, no scope switch. **Say.** "A trade partner sees what they owe on the threads they are on, and is never shown a count of things they cannot open."

### Close (1 minute)

**Say.** "Three things to react to: a bell that counts obligations, a critical that explains itself and never interrupts, and cover that shows what it will not cover. Which did you notice first? And honestly: would you open this before Outlook?" If designers are in the room, open the ··· menu › Figma: every screen is an editable map in the design system.

**Do.** **Reset demo data** before the next audience.

## 7. Questions you will get

- **"Is this a new task system?"** No. Nothing is created in Notifications. Every action on a card is the record's own action, and only the record resolves an item.
- **"Can I turn Critical off?"** Only its optional channels. Mandatory delivery is a per-event company policy, shown as locked cells; the obligation itself never goes away.
- **"Does acknowledging close anything?"** Never. It records awareness and stops the acknowledgment clock. Due dates, severity and status do not move.
- **"Who decides something is critical?"** A confirmed condition (a person on site, a policy rule) or a manual *Mark as critical* with a reason. The AI "potential critical" flag is a later release and is not in this prototype.
- **"What about finance, safety and schedule events?"** Same model, same presets, same matrix. They are listed in the catalog; this prototype shows only events whose records exist here (Email, RFIs, drawings).
- **"Where is the phone?"** The drawer is a full-width sheet at 390 and the bell is a row in the hamburger drawer. A bottom tab is an open question in the proposal.
- **"What about a second project?"** The scope switch is there; the demo has one project, so both scopes match. Flagged for the design review.

## 8. Quick reference

| Where | What |
|---|---|
| Any Email screen (`?p=correspondence-list`, `-thread`, `-context-rfi`, `-context-dwg`) | the bell, the drawer, the banner, *Simulate event* |
| `?p=notifications-list` | All notifications: scopes, views, Filter panel, bulk Acknowledge, a row's card and history |
| `?p=notifications-preferences` | preset, matrix, quiet hours, out-of-office cover |
| Sandbox › Simulate event | a Critical bounce, a reminder, a reassignment, a cover start (no remount: a draft survives) |
| Sandbox › Viewing as | GC project manager (Sarah) · GC project engineer (Alex) · Subcontractor guest (Dave) |
| Figma | Documentation file › **Notifications** page (`4187:3492`): 01 drawer · 02 banner · 03 card states · 04 full page · 05 preferences · 06 Change severity |
| Verification | `yarn verify`; `yarn shot notifications-list`; `scripts/demo-notifications-walkthrough.mjs` (every step of §6 as written); `scripts/interact-notifications-{drawer,list,prefs}.mjs`; `scripts/smoke-notifications-data.mjs` |

Useful URL switches: `?theme=dark`, `?latency=slow|fail|fail-once`, `?chrome=0`.

# Notifications — plan, open questions and decisions

Module **Notifications** (slugs `notifications-*`), built in this repo beside Correspondence (D-52): it is a platform surface shown on every screen, not a nav module (no tile, no tool, no rail), and it reads the Email module's data. Companions: `spec.md` (facts the surfaces need), `status-model.md`, `screens.md`; `overview-and-demo.md` is the stakeholder overview (problem, jobs to be done, as-is and to-be) with the step-by-step demo. Decisions live in `../4-decisions.md`; §7 points at them. `source/` holds the proposal this plan distils (see its README).

**The product already has Notifications.** This plan upgrades the bell, the drawer and the preferences (§0); it does not add a parallel system. The bell, the drawer, the page and copy say **Notifications** (Q-A1, D-53); The module and slug name is Notifications too (the user's choice on 2026-10-26, amending D-53); only this plan's working title was "Attention".

## 0. What the platform does today, and the delta we test

From the proposal's current-state section, the help centre ([View project notifications](https://help.linarc.io/support/solutions/articles/1060000150416-view-project-notifications), read 2026-10-26) and the library (TopNavBar, `UserPreferredNotification`):

| Exists today | Where | In this plan |
|---|---|---|
| **Bell** in the top bar with a count badge (TopNavBar `account.notificationsBadge`); a **drawer** with All / Unread, date groups, unread dots, *Mark all as read* (1,323 new of 1,341 in the reviewed screenshot) | top bar, every screen | **Kept as the entry, content replaced** (drawer): views by responsibility (Needs action · Waiting · Updates · All), Critical first, one card per obligation with its reason and one action; the count is explainable |
| **Project Notification Log**: alerts, reminders, messages, delivery channel and delivery status, per project | Project › Notifications | **Kept as history**, not built: the drawer's All view and the full page's *View history* are the triage views over the same events; the log remains the delivery record |
| **Notification preferences** per module: mail / text checkboxes in a grid | Settings | **Upgraded** (`notifications-preferences`): persona preset, event family × channel × cadence, quiet hours, delegation; locked rows say who set them |
| **Email's three notifications** (Needs action once, Overdue at the deadline then a daily digest, Delivery failed at once; `../correspondence/spec.md` §7) and today's reply alert | mail | **Become notification items**; the mail is one delivery of the item, never a second work queue |
| Not found: severity, who is responsible and why, acknowledgment distinct from read, snooze, delegation and cover, fallback when nobody owns an item, a banner that doesn't steal focus, a cross-project view, team oversight | | **The delta this MVP tests** |

## 1. Problem and bets

**Problem.** The drawer is a chronological activity stream. Read state says nothing about ownership or completion, recent events bury older risks, and background processing (sheet analysis, imports) competes with obligations a person must act on; 1,300 unread items tell a PM nothing.

**Operating assumptions carried over.** Hybrid model (D-42): the in-app item is canonical and the mail is one delivery of it; ordinary correspondence stays replyable from Outlook or Gmail. Source workflows stay authoritative (D-49): an item routes to the record and offers the record's own safe actions; it never becomes a second task list.

**Bets**, one surface each:
1. **Responsibility beats chronology.** Needs action, Waiting and Updates with one card per obligation and the reason it is in front of this person; the bell count is explainable. The drawer, `notifications-list`.
2. **Critical is explained, not shouted.** A Critical card says why, who is accountable and by when; its arrival never steals focus; acknowledging it changes nothing but acknowledgment. The banner, the Critical section, the override modal.
3. **Email and notifications are one set of obligations.** A thread's Needs action, Overdue and Delivery failed and an RFI's ball-in-court are the same item in the drawer, on the Email screen and on the RFI, and the PM sees Waiting while the reviewer sees Needs action. Shared with `correspondence-*`.

**How this differs from Procore and Autodesk Construction Cloud notifications** (to validate, not assert): obligations instead of events; acknowledgment separate from resolution; fallback routing when nobody owns an item; a Critical that carries its evidence. §5 measures which of these clients notice unprompted.

## 2. MVP scope (lean)

In:
- The **drawer** on every screen from the bell (`screens.md` §1): Needs action · Waiting · Updates · All with counts, Critical first, scope switch All projects / Current project, cards with one primary action and Acknowledge · Snooze · Assign; the **bell badge** = distinct Needs action items for this person or their cover, with a critical state.
- A **nonblocking banner** when a Critical item arrives for the viewer, and the sandbox's **Simulate event** (a Critical arrival, a duplicate reminder, a reassignment, a cover starting) to make that happen in a session.
- `notifications-list`: the full page with the grid Filter panel (D-30), scopes My responsibilities · My team · Watching, bulk Acknowledge only, *View history* per row.
- `notifications-preferences`: persona preset, event family × channel × cadence, quiet hours, a Delegation section with the preview of covered and excluded items.
- **Critical override**: a compact ModalV2 with outcome (false positive · duplicate · resolved · accepted risk) and a required reason; an audit row; the record stays as it is.
- **Event catalog for the prototype** (`spec.md` §5): a thread's expected response (Needs action for whoever owes it, Waiting for whoever asked; Overdue by timing), Delivery failed, Unmatched; an RFI's step in hand (routed to you, returned); drawing revision published (an Update); and **one confirmed Critical** (RFI-142: the lead-lined partition answer is due today and the superintendent confirmed on site that framing at Grid D-7 has stopped). Every card lands on a screen that exists.

Out, with the reason:
- **Finance, contract, safety and schedule events** (pay application, invoice aging, stop work, critical-path impact): no record or screen to land on here and "never a dead link"; listed in `spec.md` §5 as the catalog the product adds, with the proposal's severity rules.
- **A second project** behind the scope switch: its cards would open records this app doesn't have. The switch is rendered with one project (All projects = Current project) and flagged for the design review (Q-A3).
- **Mobile bottom tab**: the proposal calls it an option to validate against the navigation model; the drawer is a full-width sheet at 390 and the bell is in the phone's overflow drawer already.
- **Offline queueing, stale-schedule suspension, account deactivation, SMS, after-hours policy exceptions, migration**: described in `spec.md` §13 as assumed platform behaviour, not demoed.
- **AI "Potential critical" triage** (the proposal's Release 4): manual *Mark as critical* with a reason covers the human-confirmed path the proposal requires.
- **Company and portfolio screens**: the shell is project-level; the drawer shows the cross-project count and nothing more.
- **Email keywords and email action links that execute**: a link in a mail opens the in-app confirmation; nothing executes from mail (`spec.md` §10).

## 3. Personas

| Persona | Job on these surfaces | Role in the sandbox |
|---|---|---|
| GC Project Manager (Sarah Jenkins) | Reviews (RFI-139 is her Needs action), unmatched mail, the bounce on her Confidential thread; Waiting on Riverside Health's overdue acknowledgment; sees every Critical under *Project oversight*; may override a Critical; is the fallback's backup | `gc_pm` |
| GC Project Engineer (Alex Morgan) | Replies owed (THR-1042, due today), RFI follow-ups; the requester whose Waiting on RFI-139 is Sarah's Needs action; accountable for the Critical follow-up on RFI-142 (Waiting on Kenji); may acknowledge and assign, not override | `gc_pe` |
| General Superintendent (Carlos Reyes) | Field blockers; the project fallback owner; confirmed on site the stopped framing that makes RFI-142 Critical | not switchable in the MVP (appears as evidence, owner and fallback) |
| Subcontractor PM (Dave Miller, guest) | Only his own obligations; sees no internal items and no counts of things he can't see | `guest_sub` |
| Owner representative, accounting | In the catalog's persona defaults (`spec.md` §11); no screens in this prototype | — |

## 4. Demo flows and client test tasks

Each flow is the demo script and one or two usability tasks. The data is derived from the Email module's threads and RFIs (`spec.md` §4) plus one seeded Critical.

**Flow 1: the drawer replaces the stream.** Any Email screen as Alex → the bell shows 1 with the critical state → drawer: the Critical section first: RFI-142 (*Critical because the lead-lined partition answer is due today and Carlos Reyes confirmed on site that framing at Grid D-7 has stopped*; Waiting on Kenji Takahashi, due today; *Acknowledge by 11:45 · then Carlos Reyes is told*; Carlos's quote as evidence) → *Acknowledge* (the card stays Critical and Due today; the bell's critical state changes from unacknowledged to acknowledged; the deadline line goes) → *Open step* lands on RFI-142's Workflow tab. Needs action: *Reply to Dave Miller* on THR-1042, due today. Waiting: RFI-143 on Elena; RFI-139 (*Waiting on Sarah Jenkins*; Sarah is reviewing). Switch role to Sarah: RFI-139's review is her Needs action, the Critical sits under *Project oversight*, THR-1031's bounce and unmatched mail are hers; her count is 3.
- **Task 1.** "You're Alex. It's Friday morning. Find out what you must do today and what you're waiting on others for." Success: opens the drawer, names the Critical item and says in their own words why it is Critical, tells Needs action from Waiting without prompting; under two minutes, no help.
- **Task 2.** "Acknowledge the critical RFI. Is it dealt with?" Success: the participant says no, it is still due today and still open, and can say what would resolve it (Kenji's answer, reviewed).

**Flow 2: a Critical arrives while composing.** `correspondence-context-dwg` as Alex → Compose open, text typed → sandbox *Simulate event › Critical: Alex's email to Kenji about RFI-142 bounces* → the banner appears above the content, the draft is intact, the bell turns critical (2 Critical, 1 not acknowledged) → *Acknowledge* on the banner (or dismiss: the item stays) → later *Open* from the drawer → THR-1039 with the bounce → *Update contact and resend* → the item resolves and leaves Needs action; its history keeps the acknowledgment; RFI-142's own Critical remains.
- **Task 3.** "Keep writing your email. Something will come in. Deal with it when you choose." Success: the draft survives; the participant doesn't feel forced to act; finds the item again from the bell without help.
- **Facilitator show, duplicates.** *Simulate event › Reminder: THR-1031's response is still overdue* as Sarah: the existing card's history gains a row, the count doesn't change.

**Flow 3: triage at scale and handing over.** `notifications-list` as Sarah → Filter panel (Source: Email; Severity) → select rows → bulk *Acknowledge* → scope *My team* (Alex's and Carlos's items, counts per person) → `notifications-preferences` › Delegation: cover for Sarah from Thursday for two weeks, delegate Alex → preview: covered (the unmatched mail, RFI-139's review), excluded (THR-1031's two obligations: Alex is not a participant of the Confidential thread), the dates → *Start cover* → the drawer as Alex shows those cards with *Covering for Sarah Jenkins*.
- **Task 4.** "You're going on leave for two weeks from Thursday. Make sure nothing you own goes quiet." Success: sets the cover, reads the preview, can say what is not covered and why.
- **Task 5.** "You're Sarah. The owner's rep says RFI-142 should not be Critical: framing restarted after yesterday's site call." Success: finds the override under *Project oversight* (the drawer) or the full page's *Watching* scope (where the card stays after the change), chooses an outcome, writes a reason, sees the audit row, and understands the RFI itself is still open and still with Kenji.

**Interview.** "Which of these would you want by email as well, and which only here? When is it acceptable to interrupt you? Who would you trust to accept a risk on your behalf, and who would you want to see that they did? What would make you stop opening Outlook first?"

## 5. Success metrics

Per session: completion without help on Tasks 1 and 4 (target five of six participants); whether participants explain a Critical card's reason in their own words; whether *Acknowledged* is ever read as *done* (target zero); counts the participant disagrees with or can't explain (every count must be explainable); which events they would mute and which they would want interrupting; unprompted mentions of the delegation preview, fallback routing, the one-card rule; library components needed per surface, which should be fewer than the last module's (zero candidates is the target).

After launch (the proposal's measures): time from Critical creation to server-confirmed acknowledgment; Needs action and Waiting aging by role; share of Critical items with an owner, a fallback, evidence and a clear next action; duplicate items per condition; Critical reclassification and false-positive rates; delegation gaps and orphaned obligations; optional-mute rate without missed obligations.

## 6. Open questions

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|
| Q-A1 | Name: keep **Notifications** on the bell, the drawer and the page, or test *Attention Center*? | copy everywhere | Product | **Default: Notifications** (D-53), mirrors D-40; test the rename only if the team wants a name signal |
| Q-A2 | Where does the full page live in the nav? The proposal puts the control on company, portfolio and project screens; this shell is project-level and every screen belongs to a tool's rail (D-13) | `notifications-list` | Design | **Resolved 2026-10-26 (user):** a **Notifications** rail item under Email in the Communication tool opens the full page; the preferences page keeps it highlighted (`screens` alias in `nav.js`). Also reachable from the bell and the drawer's *View all* |
| Q-A3 | Catalog: Email, RFI and drawing events with one seeded Critical and a single project (default), or also finance / field stand-ins with stand-in record pages and a second project? | data, scope switch | Product | **Default: the lean catalog**; the scope switch renders with one project (All projects = Current) and is flagged for the design review |
| Q-A4 | Preferences depth: preset + matrix + quiet hours + delegation on one screen (default), or drawer and full page only in the first slice? | `notifications-preferences` | Product | **Default: one screen** (Flow 3 needs delegation) |
| Q-A5 | Critical's signal: the house rule reserves red for failed / expired / rejected (CLAUDE.md), one signal per value (D-17) | cards, badge | Design | **Default:** `warning` tone with strong emphasis, the word *Critical* and the reason line; `error` stays for Delivery failed and Overdue (D-54) |
| Q-A6 | Which roles may downgrade or close a Critical? | override modal | Product | **Default:** PM only in the prototype; the PE sees the action disabled with *Only a project manager can change a Critical item* |
| Q-A7 | Acknowledgment deadline for a Critical before fallback escalation | card copy, Simulate event | Product | **Default:** 4 hours from the marking (`policy.js` ACK_HOURS), shown on the card as *Acknowledge by 11:45*; the fallback (Carlos) is named on the card; past the deadline the card says it escalated |
| Q-A8 | Does *Add to Q&A* resolve the email-filing item? | RFI items | Product | **Default: yes**, the RFI stays open (consistent with D-49) |
| Q-A9 | What does a guest see in the bell? | guest role | Security | **Default:** only their own obligations; no count of hidden items; no Team scope |
| Q-A10 | Which events must reach the mailbox regardless of preferences (mandatory delivery policy)? | preferences locked rows | Product | **Default:** Delivery failed and any Critical for the owner; shown as locked rows with *Set by Vanguard Construction Group policy* |

## 7. Decisions (in `../4-decisions.md`)

D-52 Notifications is a platform surface prototyped inside the Email app, not a nav module and not a new repo · D-53 Notifications naming · D-54 Critical's signal · D-55 canonical items are derived from source state; only engagement, overrides, cover and preferences are stored.

## 8. Build order

0. **Done 2026-10-26.** This folder: plan, `spec.md`, `status-model.md`, `screens.md`, `source/` (markers stripped, F-024); decisions D-52 to D-55; library work (NotificationItem, NotificationBar) noted in `../components/README.md`.
1. **Done 2026-10-26.** Data: `src/modules/notifications/data/` (`items.js` derives one item per obligation from the Email threads, the RFI steps and the drawing seeds and projects them per role, D-55; `policy.js` the fallback, the ack clock, event rules, families and presets; `seed.js` the confirmed Critical, the Updates and the simulated events; `actions.js` acknowledge, snooze, archive, assign, take ownership, mark critical, override, cover, preferences, `simulateEvent` and `eventsSandbox`); the `status-model.md` dimensions and the audit events in `src/modules/app/status.js`; eight `ntf*` keys and four primitives in `src/modules/session.js`; **RFI-139** (in Review with Sarah, created by Alex) added to `records.js` for the static PM Needs action / PE Waiting pair. Verified with `node scripts/smoke-notifications-data.mjs` (nine items, one Critical, the pair, the guest's view, counts, every action, the four simulated events) and the Email smoke test; `yarn verify` passes.
2. **Done 2026-10-26.** Shell: the bell badge and critical state (`AppShell.vue`; a *Notifications* row in the phone's hamburger drawer, `sandbox.js`), the drawer (`NotificationsDrawer.vue`: SlideOverPanel `md`, TabNavigation with counts, Critical section, scope switch, `ItemCard` rows with the record's action, Acknowledge, More › Snooze / Assign / Take ownership / Mark as critical / Change severity / Archive / View history; `AssignModal`, `SeverityModal`), the banner (`NotificationsBanner.vue`), *Simulate event* in the sandbox bar (`SimulateEventModal.vue`, `prototype.events` on the four shelled Email screens; no remount, so a draft survives). Library: **NotificationItem** (P-054) and **NotificationBar** (P-055) built from their Figma components with stories, README and Code Connect files. `AppShell` gained `rail-mode="none"` for the rail-less screens. Verified: `node scripts/interact-notifications-drawer.mjs 5177 <out>` 31/31 (PM and PE counts, oversight, acknowledge keeps Critical and Due today, snooze keeps the count, the Critical arrival shows the banner and the bell state, the banner's Acknowledge hides it and keeps the item, the guest sees nothing internal, the phone's overflow row opens the drawer, no overflow at 390 light or dark, Reset); `yarn shot correspondence-list` light and dark at 1440 / 1024 / 390 clean; `yarn verify` passes.
3. **Done 2026-10-26.** `notifications-list`: the full page (rail-less shell, no tool highlighted, Q-A2), scopes My responsibilities · My team · Watching, the views cross-linked with the grid's Filter panel and quick filters (D-30), the `signal` cell slot, checkboxes on acknowledgeable rows and one bulk action *Acknowledge n*, a row's card in a SlideOverPanel with *View history*. Verified: `scripts/interact-notifications-list.mjs` 16/16, shots clean. Record: `../prototypes/notifications-list.md`.
4. **Done 2026-10-26.** `notifications-preferences` (preset Radio, the matrix of SelectV2 cells with locked cells, quiet hours, cover with preview and start / end, the product catalog as a disclosure, Save through a write LoadStatus) and the Critical override (`SeverityModal`, from any card's More menu; PM only, reason required, audit row). Verified: `scripts/interact-notifications-prefs.mjs` 16/16 (includes the override from the full page and the PE's blocked override), shots clean. Record: `../prototypes/notifications-preferences.md`.
5. **Done 2026-10-26.** Figma: the Documentation file's **Notifications** page ([`4187:3492`](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3492)), two sections: Level 1 (01 Email with the drawer · 02 a Critical arrives, banner · 03 card states and the More menu) and Level 2 (04 All notifications · 05 Preferences with cover · 06 Change severity modal), with the Title, Legend, labels, hotspots, pills and arrows of the Email page's pattern (D-22); every screen is library instances (Top Nav Bar, Title Bar / Page, Segmented Navigation Compact, Tab Navigation Bar, Notification Item, Notification Bar, Status Chip, Chip, Button, Radio Button, Checkbox, Input Field, Select Menu, Modal Components, Textarea) with spacing, colour, radius and text styles bound. Prototype records link the frames; `prototype.figma` set on both screens; a Notifications section in `../correspondence/demo-guide.md`. The library's `_ ☉ Candidates` page is untouched (no new candidates); NotificationItem and NotificationBar are library code against existing Figma components (P-054, P-055), unpublished until the user says so.

Each step ends with `yarn verify`, `yarn shot` light and dark at 1440 / 1024 / 390, and its interaction script. Sessions can start after step 2 with Flows 1 and 2, and after step 4 with all three.

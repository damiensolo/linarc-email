# Notifications — screen inventory and component map

One row per screen (skill §0). Titles follow `<Tool> › <Screen>`; these screens belong to no tool, so the title is `Notifications › <Screen>`. Stage: `spec` → `built` → `verified` → `figma`. Tests refer to `00-plan.md` §4. The bell, the drawer, the page and copy say **Notifications** (D-53).

## 1. Surfaces on every screen (shell, not slugs)

| Surface | Where | Pattern (`../5-ui-patterns.md`) | States (`spec.md` §12) | Tests | Stage |
|---|---|---|---|---|---|
| **Bell badge** | TopNavBar `account.notificationsBadge` on every shelled screen (not the secure link page); on a phone a *Notifications* row in the hamburger drawer | count = distinct Needs action for me or my cover; colour: `warning-high` while a Critical is unacknowledged, `standby` when acknowledged, `indeterminate` otherwise; the accessible label says the numbers | none, count, critical unacknowledged, critical acknowledged, 99+ | 1, 3 | **figma** 2026-10-26 (`AppShell.vue`; script 31/31; [01](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3531)) |
| **Drawer** | SlideOverPanel `md` from the bell; full-width sheet at 390 | On-demand detail over the page (§1, D-34); TabNavigation Needs action · Waiting · Updates · All with counts; Critical section first; scope switch All projects / RMC-04; ItemCard rows (NotificationItem + chips; actions bottom-right as text buttons, D-56); snoozed subtotal; footer *Mark updates reviewed* · *Preferences* · *View all* (shown once those screens exist) | empty per view, loading skeleton, error + Retry, snoozed subtotal, Critical acknowledged | 1, 2, 3, 4 | **figma** 2026-10-26 (`NotificationsDrawer.vue`, `ItemCard.vue`, `AssignModal.vue`, `SeverityModal.vue`; [01](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3531), [03 card states](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3759)) |
| **Banner** | under the top nav, above rail and content, when a Critical arrives for the viewer in this session | NotificationBar (library, P-055): nonblocking, *Critical · title: detail*, *Acknowledge* · the item's action · dismiss; never auto-opens the drawer, never replays on navigation, never remounts the screen (a draft survives) | arriving, acknowledged (gone), dismissed (item stays) | 3 | **figma** 2026-10-26 (`NotificationsBanner.vue`; [02](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3607)) |
| **Simulate event** | sandbox bar (`prototype.events`, `src/modules/SimulateEventModal.vue`) | a Critical bounce on RFI-142's thread, a reminder on THR-1031, RFI-143's step reassigned to Alex, Alex covers for Sarah; no remount | — | facilitator | **built** 2026-10-26 |

## 2. Screens (`src/modules/app/router.js` `SCREENS`, `src/prototypes/<slug>/`)

| Slug | Title | Persona and decision | Nav | Pattern | Records (D-27) | States (`spec.md` §12) | Tests | Stage |
|---|---|---|---|---|---|---|---|---|
| `notifications-list` | `Notifications › All notifications` | GC PM: triage across the project and the team; acknowledge in bulk; see history | from the bell and *View all*; shell with top nav, **no rail**, no tool highlighted (Q-A2) | List (§1): Title Bar / Page with *Acknowledge n* while rows are selected; scope SegmentedControl My responsibilities · My team (Person column) · Watching; views SegmentedControl Needs action · Waiting · Updates · All cross-linked with the grid Filter panel (§8); DataGrid in LoadRegion with checkboxes on acknowledgeable rows only; a row opens its ItemCard in a SlideOverPanel `sm` (actions, *View history*) | — | empty per scope, loading, error, empty segment, bulk selection | 4, 5 | **figma** 2026-10-26 ([record](../prototypes/notifications-list.md), [04](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3683)) |
| `notifications-preferences` | `Notifications › Preferences` | GC PM / PE: choose a preset, adjust by event family, set quiet hours, hand over while away | from the drawer footer and the full page; shell, no rail; back to the full page | Settings form (§1, §7, D-25): comfortable title bar + back; centred column `max-w-4xl`; preset Radio; matrix table of small SelectV2 cells (event family × channel × cadence) with locked cells as text; quiet hours (Checkbox days, time inputs, timezone); cover with delegate, dates, preview and *Start cover* / *End cover*; Advanced disclosure (product catalog, read-only); fixed bottom panel Cancel · Save with LoadStatus | — | locked cells, preview with exclusions, cover active, saving / saved, guest without cover | 4 | **figma** 2026-10-26 ([record](../prototypes/notifications-preferences.md), [05](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3760), [06](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3761)) |

Overlays: **Critical override** (compact ModalV2 from a Critical card: outcome Radio, required reason Textarea, *Change severity*) used on the drawer and the full page; **Assign** (compact ModalV2: person Select, note). Both are short single-step tasks (D-18, D-34).

### Views, scopes and filters (D-30)
- Views = `workStatus` (Needs action, Waiting), `severity = update` (Updates), All. Each non-All view is one condition and a quick filter; Critical and Overdue are quick filters, not views (the Critical section sits inside each view).
- Scopes: My responsibilities (`routing` assigned / fallback / covering / requester), My team (internal roles only; per-person counts), Watching (`routing = watching`). A guest has no scope switch (Q-A9).
- Other quick filters: Source (Email, RFIs, Drawings), Severity, Overdue, Snoozed, Unacknowledged Critical.
- Columns: Severity (chip + reason on hover) · Title · Record · Responsible · Due · Routing · Status (`workStatus`) · Age · Actions (frozen right).

## 3. Component map (skill §2)

| Element | Class | Component | Notes |
|---|---|---|---|
| Bell and badge | existing | `TopNavBar` `account.notificationsBadge { count, status }`, `account-click` id `notifications` | handled in `AppShell.vue` (today unhandled) |
| Drawer container | existing (candidate, D-34) | `SlideOverPanel` `md`, title *Notifications*, `badge` = critical count, footer slot | one panel at a time: opening the drawer closes a compose panel only after confirming (draft kept) |
| Views and scope | existing | `TabNavigation` (count badges, P-051), `SegmentedControl` md | |
| **Notification card** | **library (Figma exists, no code)** | `componentsV2/NotificationItem` from Figma *Notification Item* `40021136:37768` (New / Read, module icon, title, description, time, action), extended with severity chip + reason, record, responsible, due, routing, secondary actions | P-row; CLAUDE.md "Component in Figma but not in code" |
| **Banner** | **library (Figma exists, no code)** | `componentsV2/NotificationBar` from Figma *Notification Bar* `363:652` (Round / Square, left and right icons), with actions | P-row; replaces the legacy `AlertWrapper` for this use |
| Empty state | existing | `NoData` with the *No Notification* illustration | per view copy (`spec.md` §12) |
| Status | existing | `StatusChip` (Critical, Overdue, Due today), muted text, check, `StatusIndicator` dot / number | one signal per value |
| Avatars | existing | `Avatar` `color="auto"` (D-51) | responsible, covering |
| Table, filters | existing | `DataGrid`, `DataGridToolbar`, Filter panel, quick filters (P-044), `loading` (P-034) | row expand for history |
| Loading and write states | existing (template candidates) | `LoadRegion`, `LoadStatus`, `Skeleton`, `createLoad` | |
| Forms | existing | `FormV2` flat, `Radio`, `Checkbox`, `SelectV2`, `DatePicker`, `Textarea`, `Toggle` | left-aligned, short widths (D-26) |
| Dialogs | existing | `ModalV2` compact | override, assign |
| Shell without a rail | existing (extension) | `AppShell` `rail="none"` | small additive prop in this repo |
| Snooze menu | existing | `Popover` + rows (the Menu candidate's rows live in RecipientField today; extract if a second menu is needed) | until tomorrow · next Monday · the due date · pick a date |

**Zero new candidates** (the target set in `00-plan.md` §5): two library components drawn in Figma already but never coded, one additive prop on the shell. Fewer than the last module's four.

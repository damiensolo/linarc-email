# Notifications › All notifications (`notifications-list`)

- **Date:** 2026-10-26
- **Figma:** [04 · Notifications › All notifications](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3683) on the Documentation file's **Notifications** page (`4187:3492`); the drawer and banner are frames 01 and 02 on the same page (`4187:3531`, `4187:3607`), the card states frame 03 (`4187:3759`)
- **URL:** `/?p=notifications-list`
- **Status:** verified. Built in step 3 of `docs/notifications/00-plan.md` §8, with the shell surfaces of step 2 (the bell, the drawer, the banner) that every shelled screen now carries.

## Scope
- **Persona and decision:** GC PM: triage across the project and the team; acknowledge in bulk; see an item's history (`docs/notifications/screens.md` §2). Flow 3, Tasks 4 and 5 (the override is reached from here).
- **Nav:** Project › Communication › **Notifications**, a rail item under Email (Q-A2 resolved by the user on 2026-10-26; the first build was rail-less); also opened from the bell's *View all*.
- **Data:** `itemsFor(role)` per scope (`src/modules/notifications/data/items.js`), `teamItems` for the Team scope, rows and columns in `src/modules/notifications/listColumns.js`; the `signal` cell slot (`src/modules/notifications/gridSlots.js`) and the Email screen's `sla-due` slot for timing.
- **Patterns:** list (`5-ui-patterns.md` §1, §8): Title Bar / Page; scope SegmentedControl (My responsibilities · My team · Watching; a guest has none); the views SegmentedControl (Needs action · Waiting · Updates · All) cross-linked with the grid's Filter panel through a hidden `views` column (D-30), quick filters for the views, Critical, Overdue, Not acknowledged, Snoozed and the sources; LoadStatus meta line; DataGrid in a LoadRegion; row checkboxes only on rows the viewer may acknowledge (`:row-selectable`), the grid's own selection toolbar off, one bulk action *Acknowledge n* in the title bar; a row opens its card (ItemCard) in a SlideOverPanel `sm` with every action and *View history*; the row's action button opens the record.

## Built in this step beyond the screen
- `signal` grid slot: chip / word / check per value, so Severity and Status render one signal each.
- `AppShell` highlights no tool when `rail-mode="none"`.

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1 h |
| Time to verified done | ~2 h (most of it the interaction script's selectors) |
| Components used (library / forked / new) | 9 library (AppShell parts, DataGrid with Filter panel, SegmentedControl, Button, StatusChip, NotificationItem P-054) / 0 forked / 0 new candidates (SlideOverPanel, LoadRegion, LoadStatus reused) |
| Gaps found | 0 in the library; 3 in the test script (below) |
| Verification rounds before passing | 4 |
| Computed-value checks (pass/total) | 16/16 (`scripts/interact-notifications-list.mjs`) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| A status chip in a row and a view segment carry the same words ("Needs action"), so a text click hit the chip | The script clicks segments inside the control's accessible group (`[aria-label="View"]`) | F-026 |
| The grid draws its checkboxes as SVG on hover, not as inputs | Rows are selected through their sequence cells in the script; a user hovers and clicks the box | F-026 |
| The grid applies a segment's filter asynchronously | The script waits for the summary before selecting | F-026 |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot notifications-list` at 1440 / 1024 / 390, light and dark: no console errors, no overflow (the segments scroll in their own box at 390).
- `node scripts/interact-notifications-list.mjs 5177 <out>`: 16/16. Sarah's default view is 3 of 4 (Needs action in My responsibilities); Waiting 1 of 4; All 4; Team scope lists Alex's four obligations with a Person column; Watching lists the oversight Critical and the Updates (5); selecting the three acknowledgeable rows shows *Acknowledge 3*, acknowledging clears it and the card shows *Acknowledged 10:30* while the bell count is unchanged; the guest has no scope switch and one Waiting item; Reset restores.
- The override (Task 5) is verified from this page in `scripts/interact-notifications-prefs.mjs`: Watching › RFI-142 › More › Change severity… needs a reason, writes *Was Critical · Condition resolved* and a *Severity changed* history row; the PE then sees it as Important.

## Design flags (for the Figma review, not fixed in code)
- One project: the drawer's All projects / RMC-04 switch shows the same counts (Q-A3).
- The Team scope is a flat list with a Person column; a per-person grouping (DataGrid group panel) is a click away but not the default.
- Updates have no row action beyond *View revision*; they sit in Watching and the Updates view only.
- Bulk Acknowledge is the only bulk action (spec §6); the grid's selection toolbar (cut / copy / paste / delete) is switched off here.

## Findings
F-025 (shell surfaces), F-026 (test selectors on the grid).

## Screenshots
Scratchpad only (`shots/notifications-list-*.png`, `list-pm-*.png`, `list-override.png`, `list-guest.png`).

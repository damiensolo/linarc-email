# Communication › Email (`correspondence-list`)

- **Date:** 2026-10-16
- **Figma:** [01 · Email](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4090-93) on the Documentation file's Email page (https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4084-9896); **2026-10-28:** Compose from this screen drawn on [Level 4 · Compose](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4237-4926) as [15](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4238-3853) (the lg panel over 01, no record pinned) and [16](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4238-4196) (full screen), with Full screen → 16 and Send → 02 arrows
- **URL:** `/?p=correspondence-list`
- **Status:** done (Compose button arrives with the compose panel, step 5; *Open* leads to the thread once step 3 exists)

## Scope
- **Persona and decision:** GC PM: what needs my action, what is overdue, what arrived unlinked (`docs/correspondence/screens.md` §1).
- **Nav:** Project › Communication › Email (D-40: the upgraded project Email screen). Rails only where a screen exists.
- **Data:** `src/modules/correspondence/data/` (`visibleThreads(role)`, `slaFor`, `weakestDelivery`, `isUnmatched`, `linkThreadToRecord`); dimensions `TRIAGE`, `SLA`, `DELIVERY`, `VISIBILITY` from `status.js`.
- **Patterns:** List (`5-ui-patterns.md` §1); segments cross-linked with the grid's Filter panel (§8, D-30, as `prequal-queue`); loading through LoadRegion / LoadStatus (§6, D-24); Link to record as a compact ModalV2 inside `#content` (§1: short single-step task); role gating through the sandbox role switcher (D-41, F-007). The project address (*Mail sent to **rmc-04@mail.linarc.io** lands here.*, D-42) sits beside the title in the Title Bar as subtle 12px text with the address bold in the default text colour; the meta line count ("4 threads") is 12px with the number bold (2026-10-28) (moved there from the meta line in review on 2026-10-27; the title bar has a fixed height, so below 640px the line is hidden and the address stays in the empty state and the compose footer). 2026-10-27: the thread's *Forward mail here* copy button moved here as *Copy project address*, then became this line: the address is set up once, so a header button beside Compose overstated it.

## Reading view (2026-11-04, D-65)

- **What:** the second view in the grid toolbar's switcher (icon `PanelRight`, title *Reading pane*) beside List (the Grid view was removed in review on 2026-11-04; `views: ['list', 'reading']`): `ReadingView` registered through DataGrid `customViews`, inside the grid's frame under its toolbar. Left: the **ViewsPane** candidate (Views with counts · Tag · Object type · Object ID · Sender company · Date, as the user's reference mock). Middle: the **ThreadList** candidate in the grid's display order (search, sort and the Filter panel apply). Right: the **ReadingPane** (subject, id and Status chips, *Open thread*, AiSummary, ThreadStream, the composer) behind the **SplitPane** candidate's divider (default 640, min 360, drag / arrows / double-click reset; width kept in the demo session).
- **Figma details (review 2026-11-04):** the switchers on 01 / 05 / 06 show List · Reading pane; [07 · nothing selected](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4287-6627) and the [Reading view — details](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4287-7056) frame with numbered callouts over 05 (switcher, pane, list, divider, reading pane, responsive rule, data).
- **No meta line (review 2026-11-04):** the Reading view drops the segments row and the thread count (the pane lists the views with counts), so the panes start under the toolbar; Figma 05 / 06 follow.
- **Cross-link (D-30):** every pane choice is one condition on a hidden column (`views`, `kinds`, `recordIds`, `companyText`, `activityWithin`); the Filter badge counts them, the panel edits them, and the segments hide while the pane is open (the pane lists the same views). Counts are over every row the viewer may see.
- **Default view (review 2026-11-04):** a plain `/?p=correspondence-list` opens the Reading pane with nothing selected; `#list` opens the table (`interact-correspondence-list`, `latency-correspondence-list` and `interact-correspondence-rfi` use it; `yarn shot correspondence-list#list` draws the table). `#reading=THR-1042` opens a thread; the hash is replaced in place as the selection changes (no hash while nothing is selected), so Back from the thread screen returns to the pane. A switch to List and the pane width live in `session.settings` (Reset demo data clears them).
- **Responsive:** three panes from 1024px (the list is about 290px wide at 1024); below, the list alone, and a row opens the thread screen.
- **Data:** eight resolved threads (`data/threads-archive.js`) from the last 90 days, linked to RFI-139, S-201 Rev 1, A-302 Rev 3, SUB-088 and PCO-019, none with Dave Miller (the guest role) and none owing a response, so the Notifications counts, the RFI Email tabs and the guest view keep their numbers. The list now says **12 threads**; the interaction and latency scripts assert the new counts.
- **Library:** P-068 (DataGrid: a switch to or from a custom view no longer resets column visibility, which showed the hidden filter columns).
- **Verification:** `node scripts/interact-correspondence-reading.mjs 5177 <out>` 21/21 (view active from the hash; pane counts All 12 · Needs action 4 · Waiting 0 · Overdue 1 · Unmatched 1; Needs action → 4 of 12 with the Filter badge at 1; Overdue → 1 of 12 with the row's Overdue chip; RFI checked → 3 of 12 and *Any RFI with email (2)*; a row click opens THR-1028 and writes the hash; the divider drags to its clamp and ArrowRight narrows by 16; back to List the segments return, the filter stays and no hidden column shows; at 390 the list alone). `interact-correspondence-list.mjs` 11/11 and `latency-correspondence-list.mjs` 6/6 with the new counts. `yarn verify` passes. `yarn shot correspondence-list#reading=THR-1042` at 1440 / 1024 / 390, light and dark: no console errors, no overflow (F-039: Chrome through `EDGE_PATH`).
- **Design flags:** the reference's Sent, Drafts, Hidden and Assigned to me views need product decisions (the status model has no such values; Hidden and Drafts are not in the MVP); the grid toolbar's mode strip overlaps the right-hand icons at 390 with three modes (library toolbar, not this screen); the Views pane could collapse behind the Figma toolbar's *Show Left Side Panel* toggle instead of living in the view.
- **Figma (Level 1, Email page):** [05 · Email — Reading pane](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4283-8170) (THR-1042 open; cloned from 01, the grid's Tab Switcher at Count=3 with the third Selector selected and the panel-right icon) and [06 · Email — Reading pane, filtered](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4284-6270) (RFI ticked, *Any RFI with email (2)*, 3 of 12, THR-1028 resolved); arrows 01 → 05 *Reading pane (view switcher)* (dashed), 05 → 02 *Open thread* (solid), 05 → 06 *Tick RFI · select THR-1028* (dashed); the Level 1 section widened to 6566. Frame 01's count reads *12 threads*. Candidates on `_ ☉ Candidates`: [ViewsPane](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2560), [ThreadList Row](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2656) (State=Default / Selected) + [ThreadList](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2657), [SplitPane](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2706) (State=Default / Active); every text carries a library style and every fill, stroke, padding, gap and radius a variable. The Figma toolbar's Filter button has no count property, so 06's badge is described in its label, not drawn. Library unpublished (ask before publishing).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1.5 h (including the data layer, step 1) |
| Time to verified done | ~2.5 h |
| Components used (library / forked / new) | 7 library (AppShell parts, DataGrid, SegmentedControl, ModalV2, StatusChip, Button via grid, InputV2 / Chip / SelectV2ListItem inside the picker) / 0 forked / 0 new; 2 template candidates (LoadRegion, LoadStatus) + SmartPicker (D-61, 2026-10-28; replaced SelectV2 in *Link to record*) |
| Gaps found | 1 (a conditional status cell: chip only when the due date asks for action) |
| Verification rounds before passing | 2 (segment strip clipped at 390; table wider than needed) |
| Computed-value checks (pass/total) | 10/10 (interaction script) |

## Components
- `AppShell screen="email" title="Email"` (default Title Bar / Page).
- `SegmentedControl size="md"` with All, Needs action, Waiting, Overdue, Unmatched; in a `max-w-full overflow-x-auto` box so five segments fit a 390 screen (F-070 pattern).
- `DataGrid` list view, `quick-filters` = the views + Has attachments + Confidential; hidden filter-only columns `views` (MultiSelect), `attachmentsText`, `visibilityLabel`; Status column `status-chip` cell; Response due column `sla-due` cell (`src/modules/correspondence/gridSlots.js`, registered through the grid's slot registry); row action `Open` / `Link to record` (per-row label); Cost impact column only for `canSeeCost` roles.
- `ModalV2` (Link to record): title, description = the subject, the **SmartPicker** candidate (D-61, 2026-10-28; was a `SelectV2` of every record): `pickerRecords()` with *Suggested* = `suggestRecordIds(subject)` (a code in the subject, or three shared title words; the demo's unmatched mail suggests SUB-088) and *Recent* = `recentRecordIds()`, a checkbox per kind from `RECORD_KINDS` (D-62), single pick, `size="md"` (P-059); primary *Link* disabled until a record is chosen, `close-on-primary-click=false` so the write completes first.
- `LoadRegion content-loads` + `LoadStatus` in the meta line; empty state as plain text with the project address (§3: info = plain text).

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| A status cell that shows a chip only for some values (Overdue, Due today) and muted text otherwise | A small slot component registered with the grid's public `registerSlotType` (as the first module's `gridSlots.js`); no library change | — |
| Five segments overflow 390px | Scroll box around the SegmentedControl (the F-070 pattern for the stepper) | — |
| Role-gated content needs a viewer switch outside the screen | `prototype.roles` meta + a "Viewing as" select in the sandbox bar, kept in `session.settings.role` | F-007 |
| First `yarn shot` on a cold dev server times out | Run after the first page load; template follow-up logged | F-007 |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-list` at 1440 / 1024 / 390, light and dark: no console errors, no horizontal page overflow. Overdue shows the red chip with the date, Due today the yellow chip, on-track dates as muted text, no due date as "—"; Waiting on them as a neutral chip.
- `node scripts/interact-correspondence-list.mjs 5177 <out>`: 11/11 (2026-10-28; was 10/10). Overdue segment → 1 of 4; Unmatched → 1 of 4 with *Link to record*; the modal opens, SUB-088 is picked (since 2026-10-28 through the SmartPicker, where it is the one *Suggested* row), *Link* writes through `linkThreadToRecord`, the Unmatched view empties and the subject gains the `[RMC-04] SUB-088` prefix; the guest role sees 1 thread and no Cost column; Reset demo data restores 4 threads.
- Status loop: every triage, sla, delivery and visibility value in the data renders with text and tone (`node scripts/smoke-correspondence-data.mjs`, F-006).
- Latency scenarios (`node scripts/latency-correspondence-list.mjs 5177`, 6/6): `slow` → the region is `aria-busy` with the skeleton, "Still loading…" after 5s, then the rows; `fail` → "Couldn't load the email." with Retry; `fail-once` → Retry recovers. The refresh-after-link path ("Updating…" with the rows kept) runs in the interaction script but its indicator is too brief to assert at instant latency; not separately verified.

## Design flags (for the Figma review, not fixed in code)
- A row can carry two yellow chips (Status *Needs action* and Response due *Due today*). The status model gives each dimension its own signal; if the review finds this noisy, *Due today* can become a muted word and keep the chip for Overdue only.
- The table is wider than 1440 with the Cost column shown; Last activity scrolls into view. Candidates to drop at review: Last activity (the thread has it) or Delivery (the thread has it per recipient).

## Findings
F-006 (data smoke test through Vite SSR), F-007 (cold-start shot timeout; `prototype.roles` role switcher).

## Screenshots
Scratchpad only (`shots/correspondence-list-*.png`, `list-link-modal.png`, `list-guest.png`); none kept in `docs/case-study/assets/`.

# Communication › Email (`correspondence-list`)

- **Date:** 2026-10-16
- **Figma:** [01 · Email](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4090-93) on the Documentation file's Email page (https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4084-9896)
- **URL:** `/?p=correspondence-list`
- **Status:** done (Compose button arrives with the compose panel, step 5; *Open* leads to the thread once step 3 exists)

## Scope
- **Persona and decision:** GC PM: what needs my action, what is overdue, what arrived unlinked (`docs/correspondence/screens.md` §1).
- **Nav:** Project › Communication › Email (D-40: the upgraded project Email screen). Rails only where a screen exists.
- **Data:** `src/modules/correspondence/data/` (`visibleThreads(role)`, `slaFor`, `weakestDelivery`, `isUnmatched`, `linkThreadToRecord`); dimensions `TRIAGE`, `SLA`, `DELIVERY`, `VISIBILITY` from `status.js`.
- **Patterns:** List (`5-ui-patterns.md` §1); segments cross-linked with the grid's Filter panel (§8, D-30, as `prequal-queue`); loading through LoadRegion / LoadStatus (§6, D-24); Link to record as a compact ModalV2 inside `#content` (§1: short single-step task); role gating through the sandbox role switcher (D-41, F-007).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1.5 h (including the data layer, step 1) |
| Time to verified done | ~2.5 h |
| Components used (library / forked / new) | 7 library (AppShell parts, DataGrid, SegmentedControl, ModalV2, SelectV2, StatusChip, Button via grid) / 0 forked / 0 new; 2 template candidates (LoadRegion, LoadStatus) |
| Gaps found | 1 (a conditional status cell: chip only when the due date asks for action) |
| Verification rounds before passing | 2 (segment strip clipped at 390; table wider than needed) |
| Computed-value checks (pass/total) | 10/10 (interaction script) |

## Components
- `AppShell screen="email" title="Email"` (default Title Bar / Page).
- `SegmentedControl size="md"` with All, Needs action, Waiting, Overdue, Unmatched; in a `max-w-full overflow-x-auto` box so five segments fit a 390 screen (F-070 pattern).
- `DataGrid` list view, `quick-filters` = the views + Has attachments + Confidential; hidden filter-only columns `views` (MultiSelect), `attachmentsText`, `visibilityLabel`; Status column `status-chip` cell; Response due column `sla-due` cell (`src/modules/correspondence/gridSlots.js`, registered through the grid's slot registry); row action `Open` / `Link to record` (per-row label); Cost impact column only for `canSeeCost` roles.
- `ModalV2` (Link to record): title, description = the subject, `SelectV2` of every record, primary *Link* disabled until a record is chosen, `close-on-primary-click=false` so the write completes first.
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
- `node scripts/interact-correspondence-list.mjs 5177 <out>`: 10/10. Overdue segment → 1 of 4; Unmatched → 1 of 4 with *Link to record*; the modal opens, SUB-088 is picked, *Link* writes through `linkThreadToRecord`, the Unmatched view empties and the subject gains the `[RMC-04] SUB-088` prefix; the guest role sees 1 thread and no Cost column; Reset demo data restores 4 threads.
- Status loop: every triage, sla, delivery and visibility value in the data renders with text and tone (`node scripts/smoke-correspondence-data.mjs`, F-006).
- Latency scenarios (`node scripts/latency-correspondence-list.mjs 5177`, 6/6): `slow` → the region is `aria-busy` with the skeleton, "Still loading…" after 5s, then the rows; `fail` → "Couldn't load the email." with Retry; `fail-once` → Retry recovers. The refresh-after-link path ("Updating…" with the rows kept) runs in the interaction script but its indicator is too brief to assert at instant latency; not separately verified.

## Design flags (for the Figma review, not fixed in code)
- A row can carry two yellow chips (Status *Needs action* and Response due *Due today*). The status model gives each dimension its own signal; if the review finds this noisy, *Due today* can become a muted word and keep the chip for Overdue only.
- The table is wider than 1440 with the Cost column shown; Last activity scrolls into view. Candidates to drop at review: Last activity (the thread has it) or Delivery (the thread has it per recipient).

## Findings
F-006 (data smoke test through Vite SSR), F-007 (cold-start shot timeout; `prototype.roles` role switcher).

## Screenshots
Scratchpad only (`shots/correspondence-list-*.png`, `list-link-modal.png`, `list-guest.png`); none kept in `docs/case-study/assets/`.

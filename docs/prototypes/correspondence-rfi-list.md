# RFIs › All RFIs (`correspondence-rfi-list`)

- **Date:** 2026-10-26
- **Figma:** [14 · RFIs › All RFIs](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4196-3492) on the Email page's Level 3 section
- **URL:** `/?p=correspondence-rfi-list`
- **Status:** verified. Asked for in review on 2026-10-26: the RFIs rail opened the RFI detail directly; the product has an RFI log (as it has a Submittal log) that the detail belongs to.

## Scope
- **Persona and decision:** GC PM: find an RFI by status, step, ball in court or due date and open it; see which RFIs have an email waiting for an answer (`docs/correspondence/screens.md` §1).
- **Nav:** Project › RFIs › All RFIs (the rail item now lands here); a row or its *Open* opens `correspondence-context-rfi`; the detail's back button returns here (not to wherever history pointed).
- **Data:** `RFIS` through `getRecord` (session patches applied), `currentStep`, `stepStatus`, `rfiThreads` + `viewFor` for the Email column; rows, columns, views and quick filters in `src/modules/correspondence/rfiColumns.js`; `visibleRfis` keeps a guest to the RFIs they are a party to or distributed on (D-41).
- **Patterns:** list (`5-ui-patterns.md` §1, §8): Title Bar / Page; SegmentedControl All · Open · Answered · Closed · Overdue cross-linked with the grid's Filter panel through the hidden `views` column (D-30); quick filters for the views, High priority and Needs an email answer; LoadStatus meta line; DataGrid in a LoadRegion with the grid's row checkboxes, as the Email screen (the first build switched them off; corrected in review). Status is one signal per value (`signal` slot: chip for Open / Answered / Rejected, check for Closed, word for Draft); Due reuses the Email screen's `sla-due` slot.
- **Columns:** RFI (frozen) · Title · Type · Priority · Status · Ball in court (the step's party and company) · Step (action · state, Overdue computed) · Due · Email (threads to answer) · Location · Created · Open (frozen right).

## Metrics
| Measure | Value |
|---|---|
| Time from request to verified done | ~40 min |
| Components used (library / forked / new) | 6 library (AppShell parts, DataGrid with Filter panel, SegmentedControl, StatusChip, Button) / 0 forked / 0 new candidates |
| Gaps found | 0 |
| Verification rounds before passing | 1 |
| Computed-value checks (pass/total) | 12/12 (`scripts/interact-correspondence-rfi-list.mjs`) |

## Verification
- `yarn verify` passes.
- `yarn shot correspondence-rfi-list` at 1440 / 1024 / 390, light and dark: no console errors, no overflow.
- `node scripts/interact-correspondence-rfi-list.mjs 5177 <out>`: 12/12. The PM sees 3 RFIs; Open 2 of 3, Answered 1 of 3 (RFI-139), Overdue 0 of 3; a row's Open lands on `correspondence-context-rfi#RFI-142` with its tabs; back returns to the log; the RFIs tool in the top nav lands on the log; the guest sees 1 RFI (RFI-143, where Dave is on the distribution) and not RFI-142; Reset restores.
- `interact-correspondence-rfi.mjs` still passes with the detail's back button pointing at the log.

## Design flags (for the Figma review, not fixed in code)
- No *Create RFI* button: there is no create screen in this app (the ☉ Create RFI page is the Figma reference), and a dead button is worse than none.
- Ball in court shows the step's party and company; the product shows the company. The person is what the Email tab composes to.
- The Email column counts threads in Needs action that the viewer may see; it is text, not a badge, so the row carries one signal (Status).

## Findings
None.

## Screenshots
Scratchpad only (`shots/correspondence-rfi-list-*.png`, `rfi-list-pm.png`, `rfi-list-guest.png`).

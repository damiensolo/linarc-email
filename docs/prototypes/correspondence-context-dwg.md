# Drawings › Sheet (`correspondence-context-dwg`)

- **Date:** 2026-10-16
- **Figma:** [05 · Drawings › Sheet](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4101-1416), [06 · Compose](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4102-1843) on the Email page. **Updated 2026-10-19** to match the code: To labelled *To* (was the Select Menu's default "Label"); *Add a guest user* group (heading `label/sm/bold`, the one line `label/xs/regular` text/subtle, spacing bound to space-2 / space-8 / space-12) over the email Input Field (label row hidden, 40px) and Button lg *Add guest*, top-aligned; Message as Text Editor + Text Box stacked flush (the select shows *Normal Text*, the size stepper and the paperclip are hidden on this instance, P-049); Drop Area *browse or drag and drop* · *Any file type*, no icon on *Browse to Upload*; the panel grew 110px to fit; the frame's note says To = anyone in the project directory (D-46). **Updated again 2026-10-19 (D-47):** the To select and the CC input became `[candidate] RecipientField / To` (Kenji as an amber Status Chip with an xs Avatar, *Bcc* text button) and `/ Cc`, in a Recipients group (gap 8) with the *Add a guest user* group; the candidate's component sets and specs are on the design system's `_ ☉ Candidates` page. **Updated 2026-10-28 (D-60):** the *Add a guest user* group removed (the Recipients group is To · Cc; the frame shrank 94px) and the frame's note rewritten; on the Candidates page the typeahead example's *Add … as a guest user…* Menu Item became the directory message row. **Updated 2026-10-28 (D-58 / D-59):** the panel is lg (720) with a Full screen Header Tool Icon beside Close; the Drop Area and the 20 MB line are gone (Attachments = label + help icon + *Nothing attached yet.*, then the project-address line); the footer is the tool row (Icon Buttons for a file, a link, a cloud-drive file, a record; Discard · Save draft · Send); the Level 2 Send hotspot, arrow and pill moved with the button. The Text Editor instance still draws two rows at 680px (no one-line variant in the library, P-057): flagged for design
- **URL:** `/?p=correspondence-context-dwg#A-302-Rev3` (also `#S-201-Rev1`, superseded)
- **Status:** done. A **stand-in** for the product's sheet viewer (`docs/correspondence/00-plan.md` §2): review the compose-from-markup flow, not the viewer.

## Scope
- **Persona and decision:** GC PE: a clash at Grid B-4; email a consultant without leaving the sheet (bet 1; `screens.md` §1). Test task 1.
- **Nav:** Project › Drawings › Sheets (detail).
- **Data:** `getRecord` (drawing with `pins[]`, `revisionStatus`, `supersededBy`), `getThread` for a pin's existing thread, `createThread` with `pinId` through the shared ComposePanel.
- **Patterns:** detail (`5-ui-patterns.md` §1, D-25) with the sheet as the one container; the markup as a button over its cloud; a library `Popover` (`variant="card"`) with the markup's facts and two actions; compose in the SlideOverPanel with the drawing pinned at its revision and the **DrawingPinPreview** candidate under the linked record (spec §5); the superseded note that keeps the pin (D-17: one signal).

## Built in this step beyond the screen
- **DrawingPinPreview** candidate (`src/candidates/DrawingPinPreview/`): thumbnail (image or `thumbnail` slot), code · revision with one signal (Superseded chip or the word Current), title, grid and label, the "stays pinned" note; `sm` row and `md` card. Stage `candidate`.
- **SheetSvg** (`src/modules/correspondence/components/SheetSvg.vue`): a plan sheet drawn with colour variables (grid A–F / 1–8, rooms, corridor ceiling grid, title block, markup clouds in the primary accent); `crop` renders the 3:2 window around a pin for the preview. Prototype-only stand-in content, not a component for the system.

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1 h |
| Time to verified done | ~1.5 h |
| Components used (library / forked / new) | 9 library (AppShell parts, HeaderToolIcon, Chip, StatusChip, Button, Popover, plus the ComposePanel's) / 0 forked / 1 new candidate (DrawingPinPreview); reuses SlideOverPanel, LoadRegion, Skeleton |
| Gaps found | 0 in the library; the sheet itself is stand-in content |
| Verification rounds before passing | 1 (plus one data fix: the cloud sat over C–D while labelled B-4) |
| Computed-value checks (pass/total) | 18/18 (interaction script) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| No drawing or markup thumbnail exists in Figma or the Drawings tool (Q-13) | DrawingPinPreview candidate; thumbnail through a slot so the prototype can pass the cropped SVG | — |
| No real sheet image | SheetSvg stand-in with token colours; the product's viewer replaces it | — |
| Popover needs an element anchor | The pin button's element, from `$refs` | — |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-context-dwg` (A-302) and `#S-201-Rev1` at 1440 / 1024 / 390, light and dark: no console errors, no overflow; the sheet scales with its box.
- `node scripts/interact-correspondence-dwg.mjs 5177 <out>`: 18/18. The pin opens the popover with the markup's facts, *Email about this markup* and *Open THR-1042 in Email*; compose opens with `A-302 · Rev 3` pinned, the cropped SVG thumbnail and `Grid B-4 · Corridor 3E`; subject prefilled; no record-PDF option for a drawing; suggested recipients first (Kenji, Dave, Elena); Esc closes the dropdown only; send acknowledged "with A-302 · Rev 3 at Grid B-4 · Corridor 3E pinned" and a link to the new thread. S-201: Superseded chip in the title bar, no pins, compose says "This message stays pinned to Rev 1". Guest role: no compose, popover still opens the thread they are on.

## Design flags (for the Figma review, not fixed in code)
- The markup cloud is the primary accent (blue) so red stays "failed"; construction markups are often red. Design to decide the markup colour.
- The popover's two actions are a solid primary and a text link; if "Open in Email" should weigh the same, make both outline.
- The 390 view shows the whole sheet scaled down; pins are small targets there. A zoom is the viewer's job, not this stand-in's.

## Findings
None new. Shares F-006 to F-009.

## Screenshots
Scratchpad only (`shots/correspondence-context-dwg-*.png`, `dwg-popover.png`, `dwg-compose.png`, `dwg-superseded-compose.png`).

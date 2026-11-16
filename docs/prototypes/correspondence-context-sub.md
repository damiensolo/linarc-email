# Submittals › Submittal (`correspondence-context-sub`)

- **Date:** 2026-11-14
- **Figma:** [26 · Submittal — Email tab](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4372-9926) on the Email page (Level 1)
- **URL:** `/?p=correspondence-context-sub#SUB-088` (`#SUB-088/email` opens the Email tab)
- **Status:** done

## Scope
- **Persona and decision:** Subcontractor PM and GC PM: the submittal's email where the submittal lives, with the same tab as the RFI's (`docs/correspondence/screens.md` §1; D-74).
- **Nav:** Project › Submittals › Submittals (stand-in: one record; no log screen). Back goes to the Email screen.
- **Data:** `getRecord('SUB-088')` (`data/records.js`, enriched for D-74: status, assignee, ball in court, due, distribution list, description, items), `threadsForRecord` for its threads, `rfiActivity` for the Activity rows (generic enough for any record); writes through `sendMessage` / `postNote` / `createThread` (Compose).
- **Patterns:** record detail (`5-ui-patterns.md` §1, D-25): comfortable title bar with back, the code chip, Status (one signal: In review as an info chip) and Due; tabs Details · Email; the Email tab is the RFI's composition extracted as `RecordEmailTab` (Compose at the top of the tab, D-50; ThreadStream + composer per thread); right panel Activity · Distribution, inline below 1024px.

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1 h (with the shared screen) |
| Time to verified done | ~1.5 h |
| Components used (library / forked / new) | 9 library (AppShell parts, HeaderToolIcon, Chip, StatusChip, TabNavigation, Button, Avatar, AttachmentThumbnail, the composer's SelectV2 + TextEditorV2) / 0 forked / 0 new candidates (reuses ThreadStream, SlideOverPanel + RecipientField + SmartPicker through ComposePanel, FileViewer, LoadRegion, Skeleton) |
| Gaps found | 0 |
| Verification rounds before passing | 2 (the script's tab and rail selectors) |
| Computed-value checks (pass/total) | shared `interact-correspondence-records.mjs` (see below) |

## Components
- `RecordEmailScreen kind="submittal"` (`src/modules/correspondence/components/record/`): the whole screen; this prototype only names the kind and the sandbox metadata (records, roles, inbound, events).
- `RecordEmailTab`: Compose (disabled on a closed record, with the tooltip), the empty state, one `ThreadStream` + `Composer` per thread with *Open in Email*; the RFI keeps its own tab for *Add to Q&A* (D-49).
- `ComposePanel` with the record pinned: subject `[RMC-04] SUB-088 — <title>`, To = the assignee, the distribution list suggested first, the record's PDF attached (D-74 extends the RFI's prefill to every non-drawing record).
- Right panel: `RfiActivity` rows (record events + the threads' email events for internal roles) and a local `DistributionList`.

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| A status dimension for change orders | `CHANGE_ORDER` added to `status.js` (Draft · Pending owner approval · Approved · Rejected); submittals use the template's `SUBMITTAL` | — |
| The rail label "Change orders" wraps to two lines at 82px | As the rail rules allow (two short lines) | — |

## Verification

- **2026-11-15 (F-051):** the Email tab's composer footer bleeds over the scroller's bottom padding (`footer-class="-bottom-space-20 pb-space-20"`, as the thread page), so the thread no longer shows under it; `node scripts/shot-record-footer.mjs 5177 <out>` checks the Submittal, Change Order and RFI tabs (6/6).
- `yarn verify` passes; `yarn shot correspondence-context-sub#SUB-088` at 1440 / 1024 / 390, light and dark: no console errors, no overflow.
- `node scripts/interact-correspondence-records.mjs 5177 <out>`: 18 checks shared with the change order (D-76 added the turnaround date and note): the title bar, Details facts, the tabs, Linked items, the rail and tool strip, the Email tab's threads and chips, Compose prefilled (subject, To, PDF), a reply from the tab, PCO-019's two threads and amount, the thread's Linked items opening the submittal, the guest role (no Confidential thread, no amount).
- Demo guide step 16 shows the submittal's Email tab after *Link to record* (walkthrough 99 checks at D-74, 100 since D-79).

## Findings
None.

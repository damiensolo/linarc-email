# RFIs › RFI (`correspondence-context-rfi`)

- **Date:** 2026-10-16
- **Figma:** [04 · RFI — Email tab](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4100-1012) on the Email page
- **URL:** `/?p=correspondence-context-rfi#RFI-143` (also `#RFI-142`)
- **Status:** done. Rebuilt 2026-10-20 from a stand-in into the RFI detail the Documentation file's ☉ Create RFI page draws, with Email built in (`docs/correspondence/rfi-integration.md`, D-48, D-49). The 2026-10-16 notes below describe the first build.

## 2026-10-20 · The RFI with Email
- **2026-10-21 (D-51, P-052):** avatars show a profile photo when the person has one (six AI-generated fictional personas, `public/avatars/`), otherwise initials in a palette colour from their name (ThreadStream, Q&A, recipient chips and list rows). Light and dark checked.
- **2026-10-21 (D-50):** the workflow move is now the title bar's action; Compose moved into the Email tab (top of its content, secondary, shown only on that tab). Script 50/50.
- **Screen:** title bar with Type, Due (an `sla` chip only when due today or overdue) and Status; TabNavigation **Details · Q&A · Workflow · Email** (Q&A counts steps, Email counts threads in Needs action); the workflow move in the title bar (Route; Reject · Revise · Approve; Close; D-50); Compose at the top of the Email tab only; right panel **Activity · Watchers** (`isWide` ≥ 1024, otherwise under the tab content).
- **Parts** (`src/modules/correspondence/components/rfi/`): `RfiDetails` (fields, question with files, proposed solution, custom details, linked items), `RfiQa` (steps with kind chip, *From email · View message*, *Email this*; the response editor), `RfiWorkflow` (template, steps, parties with company type, process days, in / due / out, `workflowStep`), `RfiActivity`. Panels: `AddToQaPanel` (D-49), `RouteModal` (compact ModalV2).
- **Data:** RFI-142 and RFI-143 gain type, priority, sequence, location, reference, impacts as yes/no + amount, proposed solution, custom fields, distribution list, watchers, Q&A steps and a four-step workflow (`records.js`). `data/rfi.js`: vocabularies, `currentStep`, `stepStatus` (Overdue computed), `rfiRecipients` (Compose suggestions, To, Response due), `rfiThreads`, `rfiActivity`, `stripQuoted`, and the writes `addToQa`, `postQaStep`, `routeRfi`, `approveRfi`, `reviseRfi`, `rejectRfi`, `closeRfi`, `setWatchers`. Status: `RFI_STATUS` + `rejected`, `WORKFLOW_STEP`, `AUDIT_EVENT.QA_ADDED`.
- **ComposePanel:** on an RFI, suggestions from the step's parties then the distribution list, To = ball in court, Subject with the RFI name, Response due = step due; new `prefill` prop (*Email this*).
- **Figma:** [Level 3 · RFIs › RFI with Email](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4122-2257) on the Email page: screens 08–13 as library instances (Title Bar / Workflow, Tab Navigation Bar, Status Chip, Chip, Button, Avatar, Image Links Thumbnail, Select Menu, Textarea, Checkbox, Modal Components) with labels, hotspots and arrows; text styles and spacing, colour and radius variables bound. The ☉ Create RFI page was not edited.
- **Library:** P-051, the dark-mode count badge (F-019).
- **Verification:** `yarn verify` passes; `interact-correspondence-rfi.mjs` 46/46 (tabs; Workflow; origin message is Step 1; Compose prefill; Kenji's emailed answer → Add to Q&A as Step 3 with the sign-off left out; Route; Revise emails Kenji; Returned; Activity mixes record and email rows; Approve; Close disables Compose; guest role); dwg, list, thread, portal scripts, the smoke test and the RecipientField test pass; light and dark at 1440 / 1024 / 390 with no console errors or horizontal overflow.
- **Design flags:** Reject is drawn as red text; the library Button has no destructive scheme, so it is a secondary minimal button. Details are read-only (no Edit). Status labels proposed (`rfi-integration.md` §G). Comments vs internal notes, Distribution List placement, and whether Add to Q&A may write the official answer are open (§5).

## Scope
- **Persona and decision:** GC PM: see the RFI created from email and its thread on the upgraded Email tab; follow up (`screens.md` §1). Test task 3.
- **Nav:** Project › RFIs › All RFIs (detail).
- **Data:** `getRecord`, `threadsForRecord` plus the thread the RFI was created from (`record.threadId`), `createThread` (new in this step), `sendMessage`, `postNote`.
- **Patterns:** detail (`5-ui-patterns.md` §1, D-25) with TabNavigation (Details, Email, Activity); the Email tab is the same ThreadStream and composer as the Email thread (spec §1.2, D-40); Compose in the SlideOverPanel with the RFI pinned and *Attach a PDF of RFI-143* (today's parity, spec §5); today's rule kept: a closed RFI's Compose is disabled with a tooltip.

## Built in this step beyond the screen
- **ComposePanel** (`src/modules/correspondence/components/ComposePanel.vue`), shared by the RFI, the Email screen (its *Compose* button now exists) and, in step 5, the drawing. Fields in spec §5 order: Linked record (pinned chip, superseded note, a `pin-preview` slot for step 5), From (read-only), To / Cc / Bcc (**RecipientField** candidate since 2026-10-19, D-47: typeahead over the project directory but the sender, suggested first; avatars off (`showAvatar=false`); chips amber outside the company domain with the tooltip *Outside Vanguard Construction Group*, red when invalid with a guiding line that blocks Send; Bcc behind a link; drag or *Move to …* between rows; an unknown address stays in the field under the line *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.*, nothing created: the *Add a guest user* row and inline form of 2026-10-16 (D-36, D-46) were removed on 2026-10-28, D-60), then `FormV2 flat` for Subject (prefilled `[RMC-04] RFI-143 — `), Response due (`date`, `width: 'short'`, default three working days) and Message (`rich-text`, the product's TextEditorV2, redrawn to Figma's Text Editor on 2026-10-19 with Figma's tool set through `props.toolbar`, P-049; trimmed to one line on 2026-10-28, P-057: Highlight removed, alignment as one menu button, the style select hugging its longest option, tighter gaps), Attachments as chips (`AttachmentChips.vue`, with the how-to and the 20 MB limit in a Tooltip on a CircleHelp icon beside the label; the record's PDF attached by default, generated as a real PDF since 2026-10-18, `src/modules/mock/pdf.js`, removable). The footer is the tool row (`MessageTools.vue`, D-58): attach a file, a link, a cloud-drive file or a record; *Discard draft* (confirms), *Save draft*, *Send*; no Cancel (the header's Close keeps an unsaved draft for the context, `session.drafts['compose:<record>']`, and reopening restores it). The panel is `lg` (720px) with the SlideOverPanel's full-screen toggle. Send is disabled until To, Subject and Message are set.
- **`createThread`** in `data/actions.js` and `session.newThreads` + `addThread` in `session.js`: a composed message starts a thread in Waiting with the record linked, the recipients' delivery and a Sent audit row; the Email screen lists it; sending from the Email screen opens it.
- **SlideOverPanel** fix: Esc closes the panel only when no dropdown inside it is expanded (F-009).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~1.5 h (compose panel included) |
| Time to verified done | ~2.5 h |
| Components used (library / forked / new) | 13 library (AppShell parts, HeaderToolIcon, Chip, StatusChip, TabNavigation, Button, InputV2, SelectV2, Checkbox, DropArea, FormV2 with text / date / rich-text fields) / 0 forked / 0 new candidates (reuses SlideOverPanel, ThreadStream, LoadRegion, Skeleton) |
| Gaps found | 1 (Esc inside a dropdown closed the panel) |
| Verification rounds before passing | 3 (two were test-script issues: the editor's debounce; two Send buttons on screen) |
| Computed-value checks (pass/total) | 51/51 (interaction script, 2026-10-28) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| Esc pressed to close the recipients dropdown also closed the SlideOverPanel | The panel ignores Esc while an `[aria-expanded="true"]` element is inside it | F-009 |
| TextEditorV2 emits its value debounced (~500 ms), so Send enables half a second after typing stops | Accepted (the product's editor); noted for the review | F-009 |
| FormV2 has no "rich text in a panel" precedent | Works in `flat` mode; the toolbar fits the 560 panel | — |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-context-rfi` at 1440 / 1024 / 390, light and dark: no console errors, no overflow.
- `node scripts/interact-correspondence-rfi.mjs 5177 <out>`: 51/51 (2026-10-28). Details show "Created from an email"; the Email tab shows the origin thread THR-1042 with *Open in Email*; Compose opens with RFI-143 pinned, the PDF option and the prefilled subject; an unknown address shows the directory line, Enter keeps the text and adds no chip, no *Add … as a guest user* row and no *Add a guest user* row (D-60); Kenji joins To from the typeahead; the rich-text body enables Send; sending shows "Sent to 2 recipients with RFI-143 pinned", the new thread with `RFI-143.pdf` appears on the tab; the Email screen counts 5 threads; Compose from the Email screen with Elena as recipient lands on the new thread; Esc closes the dropdown, not the panel; the guest role sees no notes and no cost; Reset restores.
- `node scripts/interact-correspondence-composer.mjs 5177 <out>`: its last 14 checks run here (2026-10-28, D-59): Compose on the Email tab opens the `lg` panel with the editor bar on one line (style, bold / italic / underline / strikethrough, colour, alignment menu, lists, link; no Highlight), the alignment menu opens vertically and the trigger shows the pick, the record PDF is a default chip, Full screen takes the viewport and comes back, a typed message with a link survives Close and reopens as *Draft saved.*, Discard restores the defaults.
- Data loop: `node scripts/smoke-correspondence-data.mjs` (F-006).

## Design flags (for the Figma review, not fixed in code)
- Today's Compose is a full pane in the record's Email tab; this is a 560 panel over the record. Clients used to the pane may want the width option (`lg` 720) for long messages.
- *Add a guest user* (Q-02 option b, a row under the recipients) was removed on 2026-10-28 (D-60). If sessions show people typing an address that isn't on the project and expecting it to work, that is the signal to revisit.
- The RFI stand-in shows the question and a placeholder "Official response"; the real RFI tool has more. Keep the review on the Email tab.

## Findings
F-009 (Esc in a panel with an open dropdown; editor debounce; test selectors). Also F-006 to F-008.

## Screenshots
Scratchpad only (`shots/correspondence-context-rfi-*.png`, `rfi-email-tab.png`, `rfi-compose-panel.png`, `rfi-after-send.png`).

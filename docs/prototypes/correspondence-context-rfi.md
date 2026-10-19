# RFIs › RFI (`correspondence-context-rfi`)

- **Date:** 2026-10-16
- **Figma:** [04 · RFI — Email tab](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4100-1012) on the Email page
- **URL:** `/?p=correspondence-context-rfi#RFI-143` (also `#RFI-142`)
- **Status:** done. A **stand-in** for the product's RFI detail (`docs/correspondence/00-plan.md` §2): review the Email tab, not the record.

## Scope
- **Persona and decision:** GC PM: see the RFI created from email and its thread on the upgraded Email tab; follow up (`screens.md` §1). Test task 3.
- **Nav:** Project › RFIs › All RFIs (detail).
- **Data:** `getRecord`, `threadsForRecord` plus the thread the RFI was created from (`record.threadId`), `createThread` (new in this step), `sendMessage`, `postNote`.
- **Patterns:** detail (`5-ui-patterns.md` §1, D-25) with TabNavigation (Details, Email, Activity); the Email tab is the same ThreadStream and composer as the Email thread (spec §1.2, D-40); Compose in the SlideOverPanel with the RFI pinned and *Attach a PDF of RFI-143* (today's parity, spec §5); today's rule kept: a closed RFI's Compose is disabled with a tooltip.

## Built in this step beyond the screen
- **ComposePanel** (`src/modules/correspondence/components/ComposePanel.vue`), shared by the RFI, the Email screen (its *Compose* button now exists) and, in step 5, the drawing. Fields in spec §5 order: Linked record (pinned chip, superseded note, a `pin-preview` slot for step 5), From (read-only), To / Cc / Bcc (**RecipientField** candidate since 2026-10-19, D-47: typeahead over the project directory but the sender, suggested first; avatars off (`showAvatar=false`); chips amber outside the company domain with the tooltip *Outside Vanguard Construction Group*, red when invalid with a guiding line that blocks Send; Bcc behind a link; drag or *Move to …* between rows; an unknown address opens the guest form for its row), **Add a guest user** (heading and one line, *Not in the directory yet? Add them by email.*, over `InputV2` large + *Add guest* `Button` large on one row: a known address joins To, an unknown one opens the inline guest form with name and company guessed from the address and a role select; *Add guest user* creates the guest user, D-36; an invalid address shows *Enter a valid email address* via `helper-text`, F-016), CC, then `FormV2 flat` for Subject (prefilled `[RMC-04] RFI-143 — `), Response due (`date`, `width: 'short'`, default three working days) and Message (`rich-text`, the product's TextEditorV2, redrawn to Figma's Text Editor on 2026-10-19 with Figma's tool set through `props.toolbar`, P-049), Attachments (`DropArea`, several files of any type, no icon on its button; picked files as tiles with remove, over 20 MB marked *By secure link*; they don't open over the panel), *Attach a PDF of the record* (generated as a real PDF since 2026-10-18, `src/modules/mock/pdf.js`, and viewable on the Email tab). Send is disabled until To, Subject and Message are set.
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
| Computed-value checks (pass/total) | 24/24 (interaction script) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| Esc pressed to close the recipients dropdown also closed the SlideOverPanel | The panel ignores Esc while an `[aria-expanded="true"]` element is inside it | F-009 |
| TextEditorV2 emits its value debounced (~500 ms), so Send enables half a second after typing stops | Accepted (the product's editor); noted for the review | F-009 |
| FormV2 has no "rich text in a panel" precedent | Works in `flat` mode; the toolbar fits the 560 panel | — |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-context-rfi` at 1440 / 1024 / 390, light and dark: no console errors, no overflow.
- `node scripts/interact-correspondence-rfi.mjs 5177 <out>`: 24/24. Details show "Created from an email"; the Email tab shows the origin thread THR-1042 with *Open in Email*; Compose opens with RFI-143 pinned, the PDF option and the prefilled subject; an unknown address opens the inline guest form with "M Vance / Acoustix" guessed; *Add guest user* adds Marcus Vance to To; the rich-text body enables Send; sending shows "Sent to 2 recipients with RFI-143 pinned", the new thread with `RFI-143.pdf` appears on the tab; the Email screen counts 5 threads; Compose from the Email screen with Elena as recipient lands on the new thread; Esc closes the dropdown, not the panel; the guest role sees no notes and no cost; Reset restores.
- Data loop: `node scripts/smoke-correspondence-data.mjs` (F-006).

## Design flags (for the Figma review, not fixed in code)
- Today's Compose is a full pane in the record's Email tab; this is a 560 panel over the record. Clients used to the pane may want the width option (`lg` 720) for long messages.
- "Add a guest user" is a row under the To select (Q-02 option b). If sessions show people trying to type into To itself, option a (a `searchable` multi-select) is the fallback, logged against P-041.
- The RFI stand-in shows the question and a placeholder "Official response"; the real RFI tool has more. Keep the review on the Email tab.

## Findings
F-009 (Esc in a panel with an open dropdown; editor debounce; test selectors). Also F-006 to F-008.

## Screenshots
Scratchpad only (`shots/correspondence-context-rfi-*.png`, `rfi-email-tab.png`, `rfi-compose-panel.png`, `rfi-after-send.png`).

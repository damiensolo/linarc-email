# Communication › Email thread (`correspondence-thread`)

- **Date:** 2026-10-16
- **Figma:** [02 · Email thread](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4093-741), [03 · Promote to record](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4099-984) on the Email page
- **URL:** `/?p=correspondence-thread#THR-1042` (also `#THR-1039` promoted, `#THR-1031` bounced and Confidential, `#THR-1050` unmatched)
- **Status:** done

## Scope
- **Persona and decision:** GC PM / PE: read the summary, keep cost talk internal, decide to promote, check delivery (`docs/correspondence/screens.md` §1). Test tasks 3, 4 and 6.
- **Nav:** Project › Communication › Email (detail of a row).
- **Data:** `viewFor(getThread(id), role)` from `src/modules/correspondence/data/`; entries, summary, linked items and delivery rows resolved by `src/modules/correspondence/view.js`; writes through `data/actions.js` (sendMessage, postNote, promoteToRfi, updateContactAndResend).
- **Patterns:** detail without a decision (`5-ui-patterns.md` §1, D-25); Promote in a SlideOverPanel beside the thread with the source message highlighted (D-34, D-37); the bounce fix as a compact ModalV2 (§1, §3 "a warning guides"); AI content per §9 and D-44; whitespace between sections, one container level (§2, §3); loading through LoadRegion with a skeleton stream (§6).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~2 h (three candidates included) |
| Time to verified done | ~3.5 h |
| Components used (library / forked / new) | 12 library (AppShell parts, HeaderToolIcon, Chip, StatusChip, TabNavigation, Tooltip, Avatar, Button, ModalV2, InputV2, SelectV2, FormV2 + TextareaField, DropArea) / 0 forked / 3 candidates built (SlideOverPanel, ThreadStream, AiSummary) + 2 template candidates (LoadRegion, Skeleton, InlineNotice) |
| Gaps found | 3 (CommonJS `lodash.throttle` default import; number badge blank in dark; FormV2 checkbox field takes one label per field) |
| Verification rounds before passing | 3 (module load error; spacing and label fixes; checkbox labels) |
| Computed-value checks (pass/total) | 22/22 (interaction script) + fail state |

## Components
- `AppShell screen="thread" header-size="comfortable"` with the Title Bar / Workflow slot: back (`HeaderToolIcon type="back"`), subject, `Chip` with the thread id, `Status:` triage `StatusChip`, a Confidential chip when restricted.
- **AiSummary** (candidate): AI `StatusChip` in a focusable span with the §9 `Tooltip`; Decisions / Open questions / Commitments; "Source" buttons trace a bullet to its message (highlight + scroll); evidence line; "Not accurate" feedback.
- **ThreadStream** (candidate): hairline entries; `Avatar` initials; one delivery signal per message (chip only for Delivery failed); file rows with the paperclip glyph; `InlineNotice warning` for internal notes with the fixed heading; `InlineNotice error` for a bounce with the `bounce-actions` slot; muted event rows with an in-document link; `message-actions` slot carries *Promote to record* (inbound, internal role, unpromoted thread).
- **Composer** (composition, `src/modules/correspondence/components/Composer.vue`): `SelectV2` mode (Reply to all / Internal team note, internal roles only), FormV2's `TextareaField` standalone, `DropArea` behind an *Attach files* toggle, one button whose label follows the mode; note mode tints the composer.
- **PromotePanel** (`components/PromotePanel.vue`): **SlideOverPanel** `md` with `FormV2 flat` (Title, Question, Assigned to, Due date `width: 'short'`, one checkbox field per "Include" item). The Question field's slot adds the *Drafted by AI* chip and tooltip until the text is edited (then "Edited"); *Create RFI* stays disabled until the Question field has been visited (D-44).
- **FixContactModal** (`components/FixContactModal.vue`): `ModalV2` with `InputV2` pre-filled with the suggested address; *Update and resend*.
- Right panel: `TabNavigation` (Linked items, Delivery for internal roles) over two small local lists; inline at the end below 1024px.

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| `lodash.throttle` (vue-color via FormV2's rich-text field) has no default export under Vite | ESM shim `src/shims/lodash.throttle.js` + alias in `vite.config.mjs` (same as `clamp`) | F-008 |
| TabNavigation count badges blank in dark (StatusIndicator number + disabled) | Counts dropped; library check noted | F-008 |
| FormV2 `checkbox` with `options` rendered one unlabelled box | One boolean checkbox field per include item, label via `props.checkboxLabel` | — |
| LoadRegion wraps its slot, so a `gap` on it does not space the sections | Inner column `flex flex-col gap-space-32` | — |
| A conditional delivery signal (chip only when failed) | Done in ThreadStream's template, no new component | — |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-thread` (THR-1042) and `#THR-1031` at 1440 / 1024 / 390, light and dark: no console errors, no horizontal overflow. Summary, three entry types, the Confidential chip, the bounce notice with its action, Linked items with the superseded / Open signals.
- `node scripts/interact-correspondence-thread.mjs 5177 <out>`: 22/22. Bounce → modal pre-filled with the corrected address → resend acknowledged, notice gone, "Resent" shown, Delivery tab gains the contact update; Source trace highlights an entry; Promote panel opens with the AI chip, *Create RFI* disabled until the Question is visited, then enabled; create → "RFI-143 created", event row, status Waiting, action gone; reply appended and acknowledged; note posted; guest role sees no notes, no Delivery tab, no Promote; Reset restores.
- `?latency=fail` → "Couldn't load the thread." with Retry (one-off check); `slow` and `fail-once` share the LoadRegion path verified on the list.
- Data loop: `node scripts/smoke-correspondence-data.mjs` (F-006).

## Design flags (for the Figma review, not fixed in code)
- The AI chip in the panel sits between the Question label and its control; Figma may prefer it inline with the label. The slot renders either.
- `Due date` shows the DatePicker's US format (10/21/2026) while the thread shows "21 Oct"; a locale decision for the library.
- The thread keeps the hybrid-model line ("Replies from any mail client are kept here · Forward mail here") above the summary; it may belong in the title bar's right side.

## Findings
F-008 (lodash.throttle shim; dark badge). Also F-006, F-007 (shared with the list).

## Screenshots
Scratchpad only (`shots/correspondence-thread-*.png`, `thread-promote-panel.png`, `thread-after-promote.png`, `thread-after-resend.png`, `thread-guest.png`).

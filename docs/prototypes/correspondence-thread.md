# Communication › Email thread (`correspondence-thread`)

- **Date:** 2026-10-16
- **Figma:** [02 · Email thread](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4093-741), [03 · Promote to record](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4099-984) on the Email page
- **URL:** `/?p=correspondence-thread#THR-1042` (also `#THR-1039` promoted, `#THR-1031` bounced and Confidential, `#THR-1050` unmatched)
- **Status:** done

## Scope
- **Persona and decision:** GC PM / PE: read the summary, keep cost talk internal, decide to promote, check delivery (`docs/correspondence/screens.md` §1). Test tasks 3, 4 and 6.
- **Nav:** Project › Communication › Email (detail of a row).
- **Data:** `viewFor(getThread(id), role)` from `src/modules/correspondence/data/`; entries, summary, linked items and delivery rows resolved by `src/modules/correspondence/view.js`; writes through `data/actions.js` (sendMessage, postNote, promoteToRfi, updateContactAndResend).
- **Patterns:** detail without a decision (`5-ui-patterns.md` §1, D-25); Promote in a SlideOverPanel beside the thread with the source message highlighted (D-34, D-37); the bounce fix as a compact ModalV2 (§1, §3 "a warning guides"); AI content per §9 and D-44; whitespace between sections, one container level (§2, §3); loading through LoadRegion with a skeleton stream (§6). No forward-address line (removed 2026-10-27: the address belongs to the project, not the thread; it's on the Email screen).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~2 h (three candidates included) |
| Time to verified done | ~3.5 h |
| Components used (library / forked / new) | 12 library (AppShell parts, HeaderToolIcon, Chip, StatusChip, TabNavigation, Tooltip, Avatar, Button, ModalV2, InputV2, SelectV2, TextEditorV2, Chip, Tooltip, FormV2) / 0 forked / 3 candidates built (SlideOverPanel, ThreadStream, AiSummary) + 2 template candidates (LoadRegion, Skeleton, InlineNotice) |
| Gaps found | 3 (CommonJS `lodash.throttle` default import; number badge blank in dark; FormV2 checkbox field takes one label per field) |
| Verification rounds before passing | 3 (module load error; spacing and label fixes; checkbox labels) |
| Computed-value checks (pass/total) | 22/22 (interaction script) + fail state |

## Components
- `AppShell screen="thread" header-size="comfortable"` with the Title Bar / Workflow slot: back (`HeaderToolIcon type="back"`), subject, `Chip` with the thread id, `Status:` triage `StatusChip`, a Confidential chip when restricted.
- **AiSummary** (candidate): AI `StatusChip` in a focusable span with the §9 `Tooltip`; Decisions / Open questions / Commitments; "Source" buttons trace a bullet to its message (highlight + scroll); evidence line; "Not accurate" feedback.
- **ThreadStream** (candidate): hairline entries; `Avatar` initials; one delivery signal per message (chip only for Delivery failed); files as `AttachmentThumbnail` tiles (P-048) with a name / size caption, opening in the **FileViewer** candidate (D-45); `InlineNotice warning` for internal notes with the fixed heading; `InlineNotice error` for a bounce with the `bounce-actions` slot; muted event rows with an in-document link; `message-actions` slot carries *Promote to record* (inbound, internal role, unpromoted thread).
- **Composer** (composition, `src/modules/correspondence/components/Composer.vue`, D-58, 2026-10-28): `SelectV2` mode (Reply to all / Internal team note, internal roles only); the product's `TextEditorV2` with its toolbar hidden until the *Formatting* toggle shows bold / italic / underline / lists / link (P-056 trims the set); attachments as `Chip type="icon"` with a `Tooltip` (size, provider, URL, the record) and remove; a compact tool row of icon-only `Button`s (`secondary` / `minimal` / `medium`, each in a `Tooltip`): Paperclip (hidden file input), Link (`AttachLinkModal.vue`: a full web address, optional label), Cloud and FileBox (`AttachPickerModal.vue`: a `ModalV2` `size="md"` (P-059) around the **SmartPicker** candidate, D-61 / D-62, 2026-10-28: `pickerCloudFiles()` with a checkbox per drive, Linarc Drive first (2026-10-28), then Google Drive, OneDrive, Dropbox; `pickerRecords()` with `RECORD_KINDS`, the thread's records as *Suggested* and `recentRecordIds()` as *Recent*; multiple picks, *Attach 2*; a drive file is copied in as a generated PDF, a record is sent as its PDF) and Type (the toggle); on the right Trash2 (disabled while empty; `ModalV2` *Discard this draft?*), *Save draft* (`session.drafts[threadId]`: mode, HTML, text, attachments; restored on mount; *Draft saved.* in a live region) and the primary *Send* / *Post note*. A message is sent with `body`, `bodyHtml` and `links`; files in the file store (`src/modules/fileStore.js`). Note mode tints the composer. Replaced the *Attach files* toggle + `DropArea` + tiles of 2026-10-16.
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
| Attachments were names only; opening one showed a "not in this prototype" notice | Library `AttachmentThumbnail` for Figma's Image Links Thumbnail; `FileViewer` candidate; real sample files | P-048, D-45 |
| Files attached to a reply vanished once sent (ids not in the static file table) | Reply files travel inline on the entry, like a new thread's | F-014 |
| Previews of stored files didn't appear after a reload | `fileStore` keeps its map one level inside `Vue.observable` | F-013 |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-thread` (THR-1042) and `#THR-1031` at 1440 / 1024 / 390, light and dark: no console errors, no horizontal overflow. Summary, three entry types, the Confidential chip, the bounce notice with its action, Linked items with the superseded / Open signals.
- `node scripts/interact-correspondence-thread.mjs 5177 <out>`: 22/22. Bounce → modal pre-filled with the corrected address → resend acknowledged, notice gone, "Resent" shown, Delivery tab gains the contact update; Source trace highlights an entry; Promote panel opens with the AI chip, *Create RFI* disabled until the Question is visited, then enabled; create → "RFI-143 created", event row, status Waiting, action gone; reply appended and acknowledged; note posted; guest role sees no notes, no Delivery tab, no Promote; Reset restores. (2026-10-28: the reply and note steps type into the editor; the role select is scrolled into view before it opens, F-032.)
- `node scripts/interact-correspondence-composer.mjs 5177 <out>`: 49/49 (2026-10-28, D-58; the last 14 checks cover the compose panel on RFI-143's Email tab, D-59: toolbar on one line, no Highlight, alignment menu vertical, style select hugging, `lg` panel, full screen on and off, a draft kept on Close and restored on reopen, Discard back to the defaults). The tool row (Attach file, Attach link, Choose from cloud drive, Attach a record, Formatting, Discard draft, Save draft, Send; no *Attach files*, no drop area); Send, Save draft and Discard disabled while empty; Formatting shows bold / italic / underline / lists / link and nothing else, with `aria-pressed`; bold applied; a file, a link (invalid address guided, valid one enables *Attach link*), a record and a cloud file each add a chip; Save draft → *Draft saved.*, a reload restores text, bold and all four chips; a change clears *Draft saved.*; Discard asks and counts the attachments, *Keep editing* keeps, *Discard* clears and the draft does not return; a sent reply shows its bullet, the link and the record PDF; a note keeps its italic; no overflow at 390; dark. Screenshots `composer-1440-light.png`, `composer-sent.png`, `composer-390.png`, `composer-1440-dark.png`.
- `?latency=fail` → "Couldn't load the thread." with Retry (one-off check); `slow` and `fail-once` share the LoadRegion path verified on the list.
- Data loop: `node scripts/smoke-correspondence-data.mjs` (F-006).

- Attachments (2026-10-18): `/private/tmp/…/scratchpad/viewer-test.mjs`, `flow-test.mjs`, `states-test.mjs` (one-off, Chrome): tiles and hover; viewer opens on the markup with focus on the name, + + zooms to 150%, → plays the clip (8s, 960 wide), Esc closes and focus returns to the tile; PDF in the browser viewer; reply with a photo → tile → reload → preview and viewer still work; RFI-143 compose with *Attach a PDF* → generated PDF opens; portal open → "Streamed … from the secure link" on the Delivery tab; `.dwg` → No preview; PDF 404 → Couldn't open + Retry; remove a picked file. Light and dark, 1440 and 390, no console errors.

## Sample files
Mock attachments point at real files in `public/files/` (PLACEHOLDER DATA). PDFs come from `node scripts/make-sample-files.mjs` (`src/modules/mock/pdf.js`); *Attach a PDF of the record* is generated the same way in the browser. The site photos are the Figma Image Links Thumbnail photo (resized and cropped with `sips`), so `IMG_4471_Level2_Door_Frame.jpg` doesn't show a door frame yet: replace it with real project photos when they exist. The A-302 markup is the prototype's own sheet drawing captured at 2x; the site-walk clip (8s, H.264) was recorded from a canvas pan over the site photo in Chrome, with its poster frame.

## Design flags (for the Figma review, not fixed in code)
- Attachment tiles have no video marker (P-048); the viewer's stage is dark in light mode; the ✕ stays visible on touch screens. See `docs/components/FileViewer.md` › Open questions.
- The AI chip in the panel sits between the Question label and its control; Figma may prefer it inline with the label. The slot renders either.
- `Due date` shows the DatePicker's US format (10/21/2026) while the thread shows "21 Oct"; a locale decision for the library.

## Findings
F-008 (lodash.throttle shim; dark badge). Also F-006, F-007 (shared with the list). Attachments: F-011 to F-014.

## Screenshots
Scratchpad only (`shots/correspondence-thread-*.png`, `thread-promote-panel.png`, `thread-after-promote.png`, `thread-after-resend.png`, `thread-guest.png`).

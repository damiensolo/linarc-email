# External › Secure link (`correspondence-portal`)

- **Date:** 2026-10-16
- **Figma:** [07 · Secure link page](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4102-2174) on the Email page
- **URL:** `/?p=correspondence-portal#tk-marcus-a302` (also `#tk-kenji-rfi142`, account holder; `#tk-expired`)
- **Status:** done

## Scope
- **Persona and decision:** a recipient without an account, or anyone opening a large file or the markup from the mail: understand the ask on a phone, see the revision and files, reply (`screens.md` §1; spec §10, D-39, D-43). Test task 2.
- **Nav:** none. External-user pattern (`5-ui-patterns.md` §1): the Linarc top nav in its reduced Company configuration (logomark, no module switcher, tools or project context), no side rail, no shell; the reply's Send in a fixed bottom panel.
- **Data:** `getLink(token)` (state computed from `sentAt` + 30 days and the session's revocations), the thread it belongs to, `replyFromLink` (threads the reply as inbound mail, marks the link replied).
- **Patterns:** mobile first, one centred `max-w-3xl` column; link state first as an InlineNotice (expired, withdrawn) or a plain status line (replied); the pinned markup through **DrawingPinPreview** with a toggle to the full sheet; files as `AttachmentThumbnail` tiles (P-048) that open in the **FileViewer** candidate (D-45), any size; nothing internal (D-39). The project address closes the valid page (*Something new about {project}? Email {address} and it's filed in the project.*, D-42), standing in for the outbound mail footer, which the prototype doesn't render (added 2026-10-27).

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~45 min |
| Time to verified done | ~1.25 h |
| Components used (library / forked / new) | 7 library (TopNavBar, AppLayout, Button, Chip, FormV2 TextareaField, icons) / 0 forked / 0 new (reuses DrawingPinPreview, LoadRegion, LoadStatus, Skeleton, InlineNotice, SheetSvg) |
| Gaps found | 0 |
| Verification rounds before passing | 1 |
| Computed-value checks (pass/total) | 17/17 (interaction script) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| None in the library. The page's file actions were intents only | 2026-10-18: files open in FileViewer and download for real; the first open and the first download of each file per visit add a *File downloaded* row ("Streamed / Opened / Downloaded … from the secure link") to the sender's Delivery tab (`recordFileOpened`) | P-048, D-45 |

## Verification
- `yarn verify` passes (conventions + build).
- `yarn shot correspondence-portal` at 1440 / 1024 / 390, light and dark; `#tk-expired` at 390; `#tk-kenji-rfi142` at 1440: no console errors, no overflow.
- `node scripts/interact-correspondence-portal.mjs 5177 <out>`: 17/17, the valid link on a 390 phone viewport. Sender and recipient named, Response requested by, the pinned markup with grid, the 45 MB video offered as Stream, nothing internal, no Open in Linarc for a recipient without an account, no horizontal overflow, the full sheet toggles; a reply moves the page to "Reply sent", removes the reply box, and the Email thread then shows Marcus's reply with the thread back in Needs action. Expired: the notice, no message or reply, "Send me a new link" acknowledges to the recipient's address. Account holder: "Open in Linarc" lands on the thread.

## Design flags (for the Figma review, not fixed in code)
- The thumbnail's `md` card on desktop fills the column width and letterboxes the 3:2 crop; a fixed card width (e.g. 360) may read better.
- The sheet stand-in in dark mode shows dashed grid lines more strongly than in light; the product's viewer decides the drawing palette.
- The expired page offers only the renewal; the sender's name and the subject still show so the recipient knows what it was.

## Findings
None new. Shares F-006 to F-009.

## Screenshots
Scratchpad only (`shots/correspondence-portal-*.png`, `portal-390.png`, `portal-replied.png`, `portal-expired.png`).

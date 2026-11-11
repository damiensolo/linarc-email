# ThreadStream

- **Stage:** figma (drawn 2026-10-16 on the library's `_ ☉ Candidates` page; built 2026-10-16, `src/candidates/ThreadStream/ThreadStream.vue`)
- **Proposed:** 2026-10-16 (Correspondence) · **Used on:** `correspondence-thread`, `correspondence-context-rfi` (Email tab), `correspondence-list` (the Reading pane, D-65)
- **Candidate code:** `src/candidates/ThreadStream/ThreadStream.vue`
- **Figma:** [`_ ☉ Candidates` › ThreadStream](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024481-1478) (unpublished, variables bound) · **Library:** — · **Log:** —
- **Rules:** D-17, D-38; `docs/5-ui-patterns.md` §3

## Purpose
The list of entries in a correspondence thread (external messages, internal notes, system events), divided by hairlines, with one delivery signal per message. It is the same list in the Inbox's thread view and in any record's Email tab. Scope narrowed by D-38: the AI summary is `AiSummary`, and the reply composer is composed on the screen from existing components.

## Why not an existing component
- **DataGrid:** tabular; messages are prose with attachments and notices.
- **Activity-timeline lists** in the first module were closed as compositions; this one is reused across two tools with role gating and three entry types, which is why it is proposed as a component rather than repeated.
- **Figma V3.2:** no message list or comment thread component found; check the Documentation file's RFI and Submittal detail screens for a comment list before promotion.

## Anatomy
Entries top to bottom (oldest first), each separated by a `border/subtle` hairline, no outline on the list:
- **Message**: avatar or initials → name, company, time → delivery signal → body (`bodyHtml` when written in the composer, else the plain `body`) → attached links (`links`: name and URL, opening in a new tab) → attachment tiles (library `AttachmentThumbnail`, P-048: preview or file type; caption with name, size and *By secure link*; open in `FileViewer`, D-45) → row action slot (*Promote to record*).
- **Internal note**: an InlineNotice `warning` with the fixed heading; hidden for external roles.
- **System event**: a muted single line with an in-document link.
- **Bounce**: an InlineNotice `error` under the message, with an action slot.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `entries` | Array | `[]` | `{ id, type: 'message' \| 'note' \| 'event', … }` resolved by the screen (`src/modules/correspondence/view.js`), oldest first; the screen applies the role before passing them (an external role never receives notes), so the component has no `role` prop |
| `highlightId` | String | `''` | the entry kept highlighted while a panel acts on it |
| `loading` | Boolean | `false` | renders skeleton entries (the consumer wraps in LoadRegion) |
| `emptyText` | String | `'No messages yet.'` | or the `empty` slot |

Slots: `message-actions` (scoped: entry; rendered in the header row, right of the sender metadata, as text buttons, D-57), `bounce-actions` (scoped: entry; the notice's right side), `empty`. Events: `open-attachment` (file, files, index), `download-attachment` (file), `navigate` (record code; the screen calls `router.go`). Entries are not selectable (no `select` event); the host highlights one through `highlightId`.

## States and variants
Empty (*No messages yet*); loading (three skeleton entries); highlighted entry; external role; both themes.

## Tokens
`border/subtle`, `text/default`, `text/subtle`, `text/primary` and `text/primary-link` (attached links, event links), `surface/container`, `surface/primary/muted` + `radius-6` (the highlighted entry), `surface/warning/low/subtle` and `surface/error/subtle` (through InlineNotice), `space-4 / 8 / 12 / 16` (entry padding and gaps; `space-24` is the rich-text list indent), `label/sm/regular`, `label/sm/bold`; Avatar `sm` with `color="auto"` (P-052, D-51).

## Behaviour
Responsive: metadata wraps under the name at 390px and the utilities wrap under the metadata; attachment tiles wrap and end the message (nothing under them, D-57). Keyboard: entries are not focus stops; actions and links are. ARIA: `role="list"` / `listitem`; a note announces its heading. Long bodies are not truncated (a thread is read in full). Quoted history is not collapsed (not built; the composer leaves it out when filing an answer, D-49).

## Content
Delivery labels from `correspondence/status-model.md`. Note heading: *Internal team note (hidden from external recipients)*. Event copy: *Promoted to RFI-143 by Alex Morgan · View RFI*.

## Open questions for design
- ~~Avatars or initials for external senders with no account?~~ Answered by D-51: a profile photo when there is one, otherwise initials in the person's own colour (Avatar `color="auto"`, P-052).
- Grouping by day, or a continuous list?

## Acceptance (for promotion to the library)
- [ ] Figma component (entry types as variants; the list as a frame of instances), variables bound, both modes — drawn 2026-10-16 with variables bound (link above); dark mode not yet checked, so the box stays open
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

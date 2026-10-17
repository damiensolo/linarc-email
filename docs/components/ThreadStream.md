# ThreadStream

- **Stage:** figma (drawn 2026-10-16 on the library's `_ ☉ Candidates` page; built 2026-10-16, `src/candidates/ThreadStream/ThreadStream.vue`)
- **Proposed:** 2026-10-16 (Correspondence) · **Used on:** `correspondence-thread`, `correspondence-context-rfi` (Email tab)
- **Candidate code:** `src/candidates/ThreadStream/ThreadStream.vue` (once built)
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
- **Message**: avatar or initials → name, company, time → delivery signal → body → attachment rows (file glyph, name, size, *by link* when streamed) → row action slot (*Promote to record*).
- **Internal note**: an InlineNotice `warning` with the fixed heading; hidden for external roles.
- **System event**: a muted single line with an in-document link.
- **Bounce**: an InlineNotice `error` under the message, with an action slot.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `entries` | Array | required | `{ id, type: 'message' \| 'note' \| 'event', … }` from the module data |
| `role` | `'internal' \| 'external'` | `'internal'` | hides notes and internal-only actions when external |
| `highlightId` | String | `''` | the entry kept highlighted while a panel acts on it |
| `loading` | Boolean | `false` | renders skeleton entries (the consumer wraps in LoadRegion) |

Slots: `message-actions` (scoped: entry), `bounce-actions` (scoped: entry), `empty`. Events: `select` (entry), `open-attachment` (file), `navigate` (record code; the screen calls `router.go`).

## States and variants
Empty (*No messages yet*); loading (three skeleton entries); highlighted entry; external role; both themes.

## Tokens
`border/subtle`, `text/default`, `text/subtle`, `surface/container`, `surface/warning/low/subtle` and `surface/error/subtle` (through InlineNotice), `space-16` and `space-24` (entry padding), `label/sm/regular`, `label/sm/bold`.

## Behaviour
Responsive: metadata wraps under the name at 390px; attachment rows stack. Keyboard: entries are not focus stops; actions and links are. ARIA: `role="list"` / `listitem`; a note announces its heading. Long bodies are not truncated (a thread is read in full); quoted previous messages collapse behind *Show quoted text*.

## Content
Delivery labels from `correspondence/status-model.md`. Note heading: *Internal team note (hidden from external recipients)*. Event copy: *Promoted to RFI-143 by Alex Morgan · View RFI*.

## Open questions for design
- Avatars or initials for external senders with no account?
- Grouping by day, or a continuous list?

## Acceptance (for promotion to the library)
- [ ] Figma component (entry types as variants; the list as a frame of instances), variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

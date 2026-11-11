# ThreadList

- **Stage:** figma
- **Proposed:** 2026-11-04 · **Used on:** `correspondence-list` (Reading view, D-65)
- **Candidate code:** `src/candidates/ThreadList/ThreadList.vue`
- **Figma:** [`_ ☉ Candidates` › ThreadList Row](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2656) (drawn 2026-11-04; Layout and Unread properties added 2026-11-06, 8 variants, each with the Checkbox since D-68; variables bound, unpublished) and [ThreadList](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2657) (the list of rows) · [ThreadList Header](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024919-1525) (Select all = None · Some · All, D-71) and [ThreadList · List layout](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024919-1526) (the header over three List rows) · **Library:** — · **Log:** —

## Purpose
The compact list of conversations beside a reading pane: one row per thread with who wrote last, when, the subject, the first line of the last message, a paperclip when files are attached and one status signal. It is the column a reader scans while the pane shows the selected thread; the table (grid / list views) stays the place to sort and compare columns.

## Why not an existing component
- **DataGrid ListView** draws table rows: one line, fixed columns, horizontal scroll at 400px. A conversation row is three lines (sender and time, subject, snippet) that truncate to the pane's width.
- **NotificationItem** (P-054) is a card with a module icon, time, description and actions for an obligation; it has no sender / subject / snippet shape and ends with actions (D-56), which a list row must not.
- **SelectV2ListItem detailed** is a two-line option for a menu, not a selectable list with a time column and a status.
- Figma V3.2: no message row (`search_design_system` 2026-11-04: ThreadStream, mail icons).

## Anatomy
Rows divided by 1px `border/subtle` hairlines (D-17), 16px inset, 10px vertical:
1. Line 1: **sender** (14/20 medium, `text/default`, truncates) · **time** (12/16 `text/subtle`, right).
2. Line 2: **subject** (14/20 `text/default`, truncates).
3. Line 3: **snippet** (12/16 `text/subtle`, truncates) · paperclip 14px `icon/inactive` when the thread has files · the `status` slot (one chip or nothing).
Selected row: `surface/datatable/row-active` (the grid's active row), `aria-selected`. Hover: `surface/datatable/row-hover`. Loading: Skeleton lines in the same three-line layout. Empty: plain text (§3).

**List layout (D-67, D-71):** one 40px line per row (Checkbox · sender 124px · subject · signal · paperclip · time 48px right) under a **column header** as the DataGrid's: 40px, `surface/datatable/header`, 12px semibold uppercase `text/subtle` (From · Subject · Time), a hairline below, sticky at the top of the scroll. The header's Checkbox ticks every row shown and is indeterminate while some are ticked; a second click clears them. Preview has no header (its rows have no columns).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | Array | `[]` | `{ id, from, time, subject, snippet, hasAttachments, unread? }` in display order (the grid's: search, filter, sort applied); `unread` sets sender and subject bold (D-67) |
| `selectedId` | String | `''` | |
| `selectable` | Boolean | `false` | a Checkbox at the left of every row (D-68); ticking emits `check` and never selects; in `list` the header's Checkbox emits `check-all` (D-71) |
| `checkedIds` | Array | `[]` | the ticked rows |
| `layout` | String | `'preview'` | `preview` (sender + time, subject, snippet + signal: three lines) or `list` (one line: sender, subject, signal, paperclip, time, under the column header); D-67, D-71 |
| `loading` | Boolean | `false` | Skeleton rows |
| `loadingRowCount` | Number | `8` | |
| `emptyText` | String | `'No email matches.'` | |
| `label` | String | `'Conversations'` | listbox name |

Slots: `status` (`{ item }`): one signal per row, decided by the host from `status.js`. Events: `select(id)` (click, Up / Down / Home / End), `open(id)` (double-click, Enter), `check({ id, checked })` (the Checkbox, Space on the selected row), `check-all(checked)` (the List header's Checkbox; the host ticks every shown row or none).

## States and variants
Two layouts (`preview`, `list`). Row: default, hover, selected, checked (`data-checked`, the hover tint), unread (bold sender and subject, `data-unread`), focused list (a `border/primary-focused` inset ring on the listbox, `focus-visible` only). List: loading (skeletons in the layout's shape), empty, rows. The List header's Checkbox: none, some (indeterminate), all (Figma: ThreadList Header, Select all = None · Some · All). Unread is per viewer (`unreadBy` on the thread, D-67); a row's signal still says whether it needs action. Both themes.

## Tokens
`surface/container`, `surface/datatable/header` (the List header), `surface/datatable/row-active`, `surface/datatable/row-hover`, `border/subtle`, `text/default`, `text/subtle`, `icon/inactive`, `space-2 / 4 / 8 / 10 / 12 / 16 / 40 / 48 / 124`, `label/sm/regular`, `label/sm/medium`, `label/sm/bold` (unread), `label/xs/regular`, `label/xs/semibold` uppercase (the header).

## Behaviour
- Entries arrive resolved (names, labels, times); the component holds no module data.
- Keyboard: the list is a `listbox` with `aria-activedescendant` (`aria-multiselectable` when `selectable`); Up / Down / Home / End move the selection and scroll it into view; Enter opens; Space ticks the selected row.
- Scrolls inside itself; the host decides the width (the SplitPane's start pane).
- Responsive: the host shows the list alone below 1024px and opens the thread screen on select.

## Content
Time as a mail client: the clock today (*10:14*), the day otherwise (*28 Oct*). The snippet is the first 140 characters of the last message, one line, no markup. Sender is the last message's author (*Dave Miller*), company omitted (the pane header carries it).

## Open questions for design
- An avatar at the left (as RecipientField's rows) or none (as Gmail)? Built without one to keep the row to three lines at 320px.
- Should resolved threads read lighter (muted subject) rather than carrying no signal?
- Unread is bold text only (as Gmail); a dot at the left (as Outlook) would also show at a glance in the List layout. Built without one.

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes — Row (Layout × Unread × State), Header (Select all) and the list drawn 2026-11-04 / 06 with variables bound; dark mode not yet checked, so the box stays open
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

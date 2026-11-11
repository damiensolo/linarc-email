# ThreadList (candidate)

Compact conversation rows beside a reading pane: who wrote last, when, subject, first line, a paperclip, one status signal. Two layouts: `preview` (three lines) and `list` (one 40px line under a column header with a select-all Checkbox, D-67 / D-71); unread rows read bold; every row can carry a Checkbox (D-68). Proposal: `docs/components/ThreadList.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | Array | `[]` | `{ id, from, time, subject, snippet, hasAttachments, unread? }` in display order (the grid's: search, filter, sort applied) |
| `selectedId` | String | `''` | the row with `surface/datatable/row-active` and `aria-selected` |
| `selectable` | Boolean | `false` | a Checkbox at the left of every row; ticking emits `check` and never selects; in `list` the header's Checkbox emits `check-all` |
| `checkedIds` | Array | `[]` | the ticked rows (`data-checked`) |
| `layout` | `'preview' \| 'list'` | `'preview'` | `list` adds the sticky column header (From 124px · Subject · Time 48px) |
| `loading` | Boolean | `false` | Skeleton rows in the layout's shape |
| `loadingRowCount` | Number | `8` | |
| `emptyText` | String | `'No email matches.'` | |
| `label` | String | `'Conversations'` | listbox name |

Slot `status` (`{ item }`): one signal per row, decided by the host from `status.js`. Events: `select(id)` (click, Up / Down / Home / End), `open(id)` (double-click, Enter), `check({ id, checked })` (the row's Checkbox, Space on the selected row), `check-all(checked)` (the List header's Checkbox; the host ticks every shown row or none).

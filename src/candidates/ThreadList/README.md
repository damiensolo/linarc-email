# ThreadList (candidate)

Compact conversation rows beside a reading pane: who wrote last, when, subject, first line, a paperclip, one status signal. Proposal: `docs/components/ThreadList.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | Array | [] | `{ id, from, time, subject, snippet, hasAttachments }`, display order |
| `selectedId` | String | '' | the row with surface/primary/subtle and `aria-selected` |
| `loading` | Boolean | false | Skeleton rows in the final layout |
| `loadingRowCount` | Number | 8 | |
| `emptyText` | String | 'No email matches.' | |
| `label` | String | 'Conversations' | listbox name |

Slot `status` (`{ item }`): one signal per row. Events `select(id)` (click, arrow keys), `open(id)` (double-click, Enter).

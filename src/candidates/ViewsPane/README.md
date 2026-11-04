# ViewsPane (candidate)

The narrow pane at the left of a list: views with counts, checkbox groups with counts, compact selects. Holds no filter logic; the host writes every change to the grid's Filter panel (D-30). Proposal: `docs/components/ViewsPane.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sections` | Array | [] | `{ id, label, type: 'list' \| 'checks' \| 'select', value, items?, options?, helper?, placeholder? }` |
| `label` | String | 'Views and filters' | nav name |

Items: `{ id, label, count?, tone?, muted? }` (`tone: 'error'` tints a non-zero count). Event `change({ id, value })`.

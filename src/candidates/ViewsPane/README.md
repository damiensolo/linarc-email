# ViewsPane (candidate)

The narrow pane at the left of a list: views with counts, checkbox groups with counts, compact selects. Holds no filter logic; the host writes every change to the grid's Filter panel (D-30). Proposal: `docs/components/ViewsPane.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sections` | Array | [] | `{ id, label, type: 'list' \| 'checks' \| 'select', value, items?, options?, helper?, placeholder? }` |
| `label` | String | 'Views and filters' | nav name |
| `collapsed` | Array | null | ids of the closed sections (D-81); controlled when given, else the pane keeps its own |

Items: `{ id, label, count?, tone?, muted? }` (`tone: 'error'` tints a non-zero count). Events `change({ id, value })`, `toggle({ id, collapsed })`.

Sections collapse (D-81): the heading is a button with `aria-expanded`; a 12px caret in the pane's left padding shows on hover or focus and stays while closed; a closed heading carries the value (*Views · All 12*). Hooks for checks: `section[data-section][data-collapsed]`, `.vp-toggle`, `.vp-caret`, `#vp-body-<id>`.

# SplitPane (candidate)

Two panes side by side with a draggable divider; the end pane keeps a width in px (v-model). Proposal: `docs/components/SplitPane.md`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` (v-model) | Number | null | end pane width in px; null = `defaultValue` |
| `defaultValue` | Number | 560 | also the double-click reset |
| `min` | Number | 320 | end pane minimum |
| `minStart` | Number | 320 | start pane minimum; the maximum follows from the container |
| `label` | String | 'Resize panes' | accessible name of the separator |
| `stacked` | Boolean | false | start pane only (the host decides the breakpoint) |

Slots `start`, `end`. Events `input(px)` while dragging or on a key, `change(px)` when a drag or key ends.

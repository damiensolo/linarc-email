# SlideOverPanel (candidate)

Proposal and rules: `docs/components/SlideOverPanel.md` (D-34). Import as `~/candidates/SlideOverPanel/SlideOverPanel.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | Boolean | `false` | focus moves to the title on open, back to the opener on close |
| `title` | String | required | |
| `badge` | String | `''` | context chip next to the title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 420 / 560 / 720px; full width below 640px |
| `closeOnBackdrop` | Boolean | `true` | |

Slots: `default` (scrolling body, `p-space-20` inside the scroller), `header-meta`, `footer` (secondary left, primary right).
Events: `close` (Esc, backdrop, close button), `opened`, `closed`.

Mount it inside the screen's `#content` slot. One panel at a time (D-36: nothing stacks on it).

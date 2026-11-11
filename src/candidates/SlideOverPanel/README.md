# SlideOverPanel (candidate)

Proposal and rules: `docs/components/SlideOverPanel.md` (D-34). Import as `~/candidates/SlideOverPanel/SlideOverPanel.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | Boolean | `false` | controlled by the host: set it and listen to `close`; focus moves to the title on open, back to the opener on close |
| `title` | String | required | |
| `badge` | String | `''` | context chip next to the title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 420 / 560 / 720px; full width below 640px |
| `closeOnBackdrop` | Boolean | `true` | |
| `expandable` | Boolean | `false` | a full-screen toggle next to Close (Maximize2 / Minimize2, *Full screen* / *Exit full screen*, `aria-pressed`); the panel takes the whole viewport; resets on close |

Slots: `default` (scrolling body, `p-space-20` inside the scroller), `title-aside` (something small beside the title, e.g. a help icon with a Tooltip, D-69), `header-meta`, `footer` (secondary left, primary right; rendered only when filled, `min-height` 64px, wraps when it holds a tool row). The compose panel keeps its attachments and tool row in the body instead (D-70).
Events: `close` (Esc, backdrop, close button), `opened`, `closed`, `expand` (Boolean).

Mount it inside the screen's `#content` slot. One panel at a time (D-36: nothing stacks on it). It starts under any band the host reserves with `--sandbox-offset` (F-029).

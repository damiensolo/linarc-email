# InlineNotice (candidate)

Proposal and status: `docs/components/InlineNotice.md`. Import: `~/candidates/InlineNotice/InlineNotice.vue`.

| Prop | Type | Default |
|---|---|---|
| `tone` | warning \| error \| info \| success | `warning` |
| `title` | String | `''` |
| `message` | String | `''` (or default slot) |

Slot `actions` for buttons. `role="alert"` for warning / error, `status` otherwise. Warning and error are a tinted box (`surface/<tone>/subtle`, no outline) with the tone icon; info and success are plain text (bold title, `text/subtle` message), no box, no icon (D-17).

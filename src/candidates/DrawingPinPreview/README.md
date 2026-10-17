# DrawingPinPreview (candidate)

Proposal and rules: `docs/components/DrawingPinPreview.md` (Q-13 confirmed nothing exists to reuse). Import as `~/candidates/DrawingPinPreview/DrawingPinPreview.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `drawing` | Object | required | `{ code, title, revision, revisionStatus, supersededBy? }` |
| `pin` | Object | `null` | `{ grid, label?, box? }`; null = the whole sheet |
| `src` | String | `''` | thumbnail image, or use the `thumbnail` slot (the prototype passes a cropped SVG) |
| `size` | `'sm' \| 'md'` | `'md'` | row (72×48 thumb) vs card (3:2, up to 200px tall) |

Slots: `thumbnail`. Events: `open` (view the sheet).
The pin is immutable: a superseded revision is announced ("Superseded by Rev 2 · This message stays pinned to Rev 1"), never moved.

# InlineNotice

- **Stage:** candidate (built 2026-10-09 in the first module; shipped with the template, used by LoadRegion / LoadStatus for failures)
- **Proposed:** 2026-10-09 · **Used on:** every screen that shows a load failure; in the first module: field mismatches, disclosures, readiness and sample-data notices
- **Candidate code:** `src/candidates/InlineNotice/InlineNotice.vue`
- **Figma:** — · **Library:** — · **Log:** —

## Purpose
A notice that sits in the page flow, under a field or above a section: tone + icon + message, optional title and actions. The PRD's "Action needed: your entered limit does not match the uploaded document" is this component.

## Why not an existing component
- `AlertWrapper`: a notification-event wrapper (objectId), not a visual notice.
- `Toastification` / Snackbar: transient toasts; the mismatch must stay on screen next to the field.
- `StatusChip`: a label, no message body or actions.
- Figma V3.2: Banners page exists ("☉ Banners"); check whether a banner component covers the in-page case before promotion. If it does, this becomes an extension of Banner, not a new component.

## Anatomy
Revised 2026-10-09 (D-17). **Warning / error:** tinted box (`surface/<tone>/subtle`, radius-4, padding 12/8, no outline) → tone icon (16px) → title (bold, `text/default`) → message (`text/default`) with the actions on the right, parallel to the message (bottom-right when the width narrows, D-57). **Info / success:** no box and no icon: title (bold, `text/default`) → message (`text/subtle`) → actions row. The two boxed tones are the ones that ask the user to act; the fill is the signal and the icon keeps it readable without colour.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `tone` | warning \| error \| info \| success | `warning` | |
| `title` | String | `''` | |
| `message` | String | `''` | or the default slot |

Slots: `default` (message), `actions`. Role: `alert` for warning/error, `status` otherwise.

## Tokens
`surface/warning/low/subtle`, `surface/error/subtle`, `icon/warning/low`, `icon/error`, `text/default`, `text/subtle`, `radius-4`, `space-8`, `space-12`.

## Open questions for design
- Banner vs inline notice: one component with a `placement` axis, or two?
- Should warning use `warning-low` (yellow) or `warning-medium` (orange)? The status model reserves orange for "missing / failed".

## Acceptance
- [ ] Figma component (4 tones × with/without title × with/without actions), variables bound, both modes
- [ ] `.vue`, `.stories.js`, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390

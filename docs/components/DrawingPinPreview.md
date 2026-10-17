# DrawingPinPreview

- **Stage:** figma (drawn 2026-10-16 on the library's `_ ☉ Candidates` page; built 2026-10-16, `src/candidates/DrawingPinPreview/DrawingPinPreview.vue`; Q-13 confirmed no markup thumbnail exists in Figma or the Drawings tool; design draws it in the candidate flow, D-15)
- **Proposed:** 2026-10-16 (Correspondence) · **Used on:** `correspondence-context-dwg` (compose panel), `correspondence-thread` (Linked items), `correspondence-portal`
- **Candidate code:** `src/candidates/DrawingPinPreview/DrawingPinPreview.vue` (once built)
- **Figma:** [`_ ☉ Candidates` › DrawingPinPreview](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024481-1528) (unpublished, variables bound) · **Library:** — · **Log:** —

## Purpose
Shows which spot on which revision a message is about: a cropped markup thumbnail, sheet code and title, grid location, the pinned revision, and a warning when a newer revision exists.

## Why not an existing component
- **A plain image plus text** repeated on three screens would be a lookalike; the superseded state and the fixed layout make it a component.
- **Figma / Drawings tool:** checked (Q-13, 2026-10-16): no sheet thumbnail or markup card exists on either side, so this is a true candidate.

## Anatomy
Thumbnail (cropped to the markup box, `radius-4`) → sheet code and title → grid location → revision chip (`drawingRevision` from `correspondence/status-model.md`) → optional superseded note (*Superseded by Rev 2, issued Oct 14. This message stays pinned to Rev 3.*).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `drawing` | Object | required | `{ code, title, revisionLabel, revisionStatus, supersededByLabel }` |
| `pin` | Object | `null` | `{ gridLocation, label, boxCoords }` |
| `src` | String | `''` | thumbnail image |
| `size` | `'sm' \| 'md'` | `'md'` | row vs card |

Events: `open` (view the sheet).

## States and variants
Current, superseded; with and without a pin; sm (a row in Linked items) and md (compose panel and portal). Both themes.

## Tokens
`border/subtle`, `surface/container`, `text/default`, `text/subtle`, `radius-4`, `space-12`, `space-16`; chip tones through StatusChip.

## Behaviour
The pin is immutable: the component never offers to move it to the newer revision; it only says a newer one exists. The thumbnail's `alt` names the sheet and grid.

## Open questions for design
- Thumbnail crop: fixed aspect (3:2) with the markup box centred, or the markup box's own aspect?

## Acceptance (for promotion to the library)
- [ ] Figma component (current / superseded × sm / md), variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390
- [ ] Used by at least one prototype through the library path; candidate folder deleted

# FileViewer

- **Stage:** candidate
- **Proposed:** 2026-10-18 · **Used on:** `correspondence-thread`, `correspondence-context-rfi`, `correspondence-portal`
- **Candidate code:** `src/candidates/FileViewer/FileViewer.vue`
- **Figma:** — (to draw on `_ ☉ Candidates`) · **Library:** — · **Log:** P-048 (the tile that opens it), D-45

## Purpose
Shows a message's files in place: a full-screen viewer opened from an attachment tile, stepping through the message's files, with Download. People check a markup, a sketch or a site clip without leaving the thread or downloading first.

## Why not an existing component
- **Legacy `AttachmentModal` / `AttachmentZoomViewer`** (`src/components/AttachmentViewer/`): images only, legacy `Modal`, hardcoded colours, zoom capped at 200%, no navigation between files, no PDF or video, no loading or error state.
- **ModalV2:** a dialog with a title, body and footer buttons sized for forms; it has no full-viewport size and its body isn't a dark stage.
- **GalleryView:** a grid of tiles, not a viewer.
- **Figma V3.2:** Image Links Thumbnail draws an Open action, but nothing it opens into.

## Anatomy
1. **Header** (light, `surface/container`, hairline below, 64 high): file name (`label/md` bold, truncates) over the meta line (`n of m · 3.4 MB · by secure link`, 12/16 `text/subtle`); for images, zoom out · zoom level button (*Fit* / *150%*, which fits again) · zoom in (hidden below 768px); **Download** (outline; icon-only below 640px); Close (`HeaderToolIcon`).
2. **Stage** (dark, `surface/container-invert`): the file. Image fitted (contain) or at a zoom level in a scroller; PDF in the browser's own viewer (pages, search, print); video with the native player and its poster.
3. **Previous / Next** (secondary solid icon buttons, 40, vertically centred at the stage's edges, inset 16) when the set has more than one file; disabled at the ends.
4. **No preview / error panel** (centred on the stage): file glyph, a bold line and a hint in `text/on-surface/default-inverse`, **Retry** (error only) and **Download** (primary).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | Boolean | `false` | |
| `files` | Array | `[]` | `[{ id, name, url, kind?, posterUrl?, meta? }]`. `kind` (image · pdf · video · other) defaults from the extension; a file without `url` shows *No preview* |
| `index` | Number | `0` | the file shown; `.sync` |

Events: `close`, `update:index`, `download` (file), `view` (file; each time a file is shown, so a page can record it). Exported helper: `fileKind(file)`.

## States and variants
Loading (nothing for 200ms, then a skeleton block in the stage; "Loading <name>" for screen readers) · ready · error (*Couldn't open this file.* + Retry + Download) · no preview (*No preview for .dwg files.* + Download). Image zoom: 25–300% in seven steps from the fitted scale; double-click toggles Fit and 100%. Both themes: the header follows the theme, the stage is dark in both.

## Tokens
`surface/container`, `border/subtle`, `text/default`, `text/subtle`, `surface/container-invert`, `text/on-surface/default-inverse`, `icon/on-surface/light`, `surface/skeleton` (via Skeleton). Spacing 12/16/20/48/72; radius from the library buttons. No width token: the viewer fills the viewport.

## Behaviour
- Full viewport above everything (z 70, over the SlideOverPanel at 40); the page behind doesn't scroll.
- Focus moves to the file name on open and back to the tile on close; Tab stays inside. Keys: Esc closes; ← → step (not while the video has focus: the player's own arrows seek); + − 0 zoom images. Clicking the empty stage closes.
- A PDF is fetched before it's shown, because an iframe reports "loaded" even on a 404; a failure shows the error state.
- 390px: header keeps name, meta, the Download icon and Close; previous / next overlap the stage edges.

## Content
Meta line from the page (`3.4 MB · by secure link`). Error: *Couldn't open this file.* / *Check your connection and try again, or download it.* No preview: *No preview for .dwg files.* / *Download it to open it in the app you use for these.*

## Open questions for design
- Dark stage in light mode (common for media viewers) or `surface/page`?
- Should Previous / Next sit in the header on mobile instead of over the stage?
- A video marker on the tile (P-048 flag) and in the meta line?
- Annotate / markup from the viewer (today's AttachmentsView has a `markup` hook)?

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

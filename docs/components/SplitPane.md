# SplitPane

- **Stage:** figma
- **Proposed:** 2026-11-04 · **Used on:** `correspondence-list` (Reading view, D-65)
- **Candidate code:** `src/candidates/SplitPane/SplitPane.vue`
- **Figma:** [`_ ☉ Candidates` › SplitPane](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2706) (drawn 2026-11-04, variables bound, unpublished) · **Library:** — · **Log:** —

## Purpose
Two panes side by side with a divider the reader can drag: a list and the item it opens (the Email screen's reading pane), a canvas and an inspector, a form and its preview. The end pane keeps a width the host can remember; the start pane takes what is left.

## Why not an existing component
- **AppLayout** has resizable left / right panels, but they are the page's panels (outside the grid toolbar, with their own persistence and the module's `right-panel` slot semantics); the reading pane lives inside the DataGrid's view, under its toolbar, and must split the grid's own area.
- **GanttView's divider** (DataGrid) is a private `mousedown` handler between the task list and the timeline: no keyboard, no ARIA, no touch, no v-model; it cannot be used outside the gantt.
- **SlideOverPanel** is an overlay with a backdrop, not a persistent split.
- Figma V3.2: no split or divider component (`search_design_system` 2026-11-04).

## Anatomy
`start` pane (flex: 1) · **divider**: an 8px hit area with a centred 1px `border/subtle` line that becomes 2px `surface/primary/default` on hover, focus and while dragging · `end` pane at the model's width.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` (v-model) | Number | `null` | end pane width in px; `null` = `defaultValue` |
| `defaultValue` | Number | `560` | also the double-click reset |
| `min` | Number | `320` | end pane minimum |
| `minStart` | Number | `320` | start pane minimum; the maximum width follows from the container |
| `label` | String | `'Resize panes'` | accessible name of the separator |
| `stacked` | Boolean | `false` | start pane only; the divider and the end pane are not rendered |

Slots: `start`, `end`. Events: `input(px)` while dragging or on a key; `change(px)` when a drag or key ends (the host persists this one).

## States and variants
Divider: rest, hover, focus-visible, dragging. Stacked (narrow screens). Both themes.

## Tokens
`border/subtle`, `surface/primary/default`, `space-8` (hit area), `border-1` / `border-2` (line widths). Motion 120ms on the line, none under `prefers-reduced-motion`. No divider token exists in Figma (needs-token if the line should differ from `border/subtle`).

## Behaviour
- Pointer events with capture, so a drag survives leaving the divider; text selection and iframes are inert while dragging.
- Keyboard: the divider is a focusable `role="separator"` with `aria-orientation`, `aria-valuenow / min / max`; Left / Right move 16px, Home / End go to the limits, double-click resets.
- The width is clamped to `[min, container − minStart − 8]` on every change and on container resize (ResizeObserver).
- Responsive: the host sets `stacked` below its breakpoint (1024px on the Email screen) and places the end pane's content elsewhere (a full screen).

## Content
—

## Open questions for design
- Should the divider show a grip glyph at rest (as some apps) or stay a hairline until hovered (as built)?
- Default split for the Email screen: 640px pane at 1440 (list 480). Confirm against the reference.

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes — State = Default / Active drawn 2026-11-04 with variables bound (link above); dark mode not yet checked, so the box stays open
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

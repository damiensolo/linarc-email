# SlideOverPanel

- **Stage:** figma (drawn 2026-10-16 on the library's `_ ☉ Candidates` page; built 2026-10-16, `src/candidates/SlideOverPanel/SlideOverPanel.vue`)
- **Proposed:** 2026-10-16 (Correspondence) · **Used on:** `correspondence-context-dwg` (compose), `correspondence-thread` (promote), `correspondence-context-rfi` (compose)
- **Candidate code:** `src/candidates/SlideOverPanel/SlideOverPanel.vue` (once built)
- **Figma:** [`_ ☉ Candidates` › SlideOverPanel](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024481-1436) (unpublished, variables bound) · **Library:** — · **Log:** —
- **Rules:** D-34; `docs/5-ui-patterns.md` §1 (contextual create), §2 (scroll padding, F-051)

## Purpose
A right-anchored overlay panel for contextual creation and on-demand supporting detail, where leaving the page would destroy the user's spatial context (a drawing markup, an email thread being read).

## Why not an existing component
- **AppShell `right-panel` (AppLayout):** a persistent split pane (380px) for detail that stays beside a record; not an on-demand overlay with a backdrop and its own footer, and too narrow for a compose form.
- **ModalV2:** centred, for short single-step tasks (§1); it hides the canvas or thread the task refers to and cramps a rich-text editor.
- **Figma V3.2:** no drawer or side-sheet component found (Modal Components set, Documentation file). If design adds one, this becomes that component.

## Anatomy
Backdrop (`surface/overlay`) → panel (`surface/container`): fixed header (title, optional context chip such as `A-302 · Rev 3`, close icon button) → scrollable body with padding inside the scroller → fixed footer with a top hairline (secondary action left, primary label-only action right).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | Boolean | `false` | v-model-able; traps focus while open |
| `title` | String | required | `label/md/bold` |
| `badge` | String | `''` | context chip next to the title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 420 / 560 / 720px; full width below 640px |
| `closeOnBackdrop` | Boolean | `true` | |

Slots: `default` (body), `header-meta`, `footer`. Events: `close` (Esc, backdrop, close button), `opened`, `closed`.

## States and variants
Sizes sm / md / lg; open / closing; with and without footer; body loading (the consumer renders a LoadRegion). Both themes.

## Tokens
`surface/container`, `surface/overlay`, `border/subtle` (header and footer hairlines), `space-20` (body padding), `space-16` (header and footer gap), `space-64` (header and footer height, matching the comfortable title bar), `radius-0`. Motion: 160ms translate and opacity, none under `prefers-reduced-motion` (no motion tokens exist; needs-token, patterns §5).

## Behaviour
Below 640px the panel takes the full width and the footer stays fixed. Focus moves to the title on open and returns to the trigger on close; Esc closes; `role="dialog"`, `aria-modal`, `aria-labelledby` the title. The page behind does not scroll while open. One panel at a time; a second request replaces the first (no stacking, D-36). Layer `z-index: 40`: above the page, below dialogs that fields inside the panel open (the rich text editor's emoji, link and table pickers, legacy Modal z-50), below ModalV2, dropdowns, tooltips and the FileViewer (F-017).

## Content
The title names the task (*Message stakeholder*, *Promote to record*); the primary button is label-only and names the outcome (*Send message*, *Create RFI*).

## Open questions for design
- Should the panel sit over the content area only (rail and top nav stay interactive) or over the whole viewport?
- A Figma side-sheet component would let the app map use an instance instead of a `[candidate]` frame.

## Acceptance (for promotion to the library)
- [ ] Figma component (3 sizes × with/without footer), variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

# ViewsPane

- **Stage:** figma
- **Proposed:** 2026-11-04 · **Used on:** `correspondence-list` (Reading view, D-65)
- **Candidate code:** `src/candidates/ViewsPane/ViewsPane.vue`
- **Figma:** [`_ ☉ Candidates` › ViewsPane](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024872-2560) (drawn 2026-11-04, variables bound, unpublished) · **Library:** — · **Log:** —

## Purpose
The narrow pane at the left of a list that says which slice of it is shown and lets the reader change it without opening a panel: the views with their counts, a checkbox group per facet with counts, and compact selects for long lists (a record, a company, a date range). It is the mail-client pattern the user asked for (Gmail's left column) applied to the Email screen's Reading view, where the table's segments are not on screen.

## Why not an existing component
- **SegmentedControl** (D-30's views) is horizontal and carries no counts; five segments already overflow a phone.
- **SideNavV2** is the module rail (tools and screens), with its own selection model, accent and width; a filter pane inside it would read as navigation.
- **DataGrid Filter panel** (`FilterPanelContent`) is the editor of conditions, opened on demand; the pane is the always-visible summary of the same conditions. The pane writes to the panel (D-30), it does not replace it.
- **Checkbox** and **SelectV2** are used inside; the pane is the composition around them plus the counted list rows, which no component draws.
- Figma V3.2: no side filter pane, no list row with a count (`search_design_system` 2026-11-04: Heat Map, icons).

## Anatomy
Top to bottom, 16px inset, 24px between sections:
1. **Section heading**: 12/16 bold uppercase, `text/subtle`, letter-spacing 1.
2. **List section** (`type: 'list'`): rows of 32px, label left, count right (12/16 `text/subtle`); the chosen row has `surface/datatable/row-active` (the grid's active-row tint) and `text/primary/default` bold; hover `surface/datatable/row-hover`. A row whose item carries `tone: 'error'` and a count above zero shows the count in an `surface/error/subtle` pill with `text/error/default` (the Overdue view; red only for overdue / failed, D-17).
3. **Checks section** (`type: 'checks'`): rows of 32px, a small Checkbox with its label left, the count right.
4. **Select section** (`type: 'select'`): a SelectV2 `small` (32, D-64) and an optional helper line (12/16 `text/subtle`).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `sections` | Array | `[]` | `{ id, label, type: 'list' \| 'checks' \| 'select', value, items?, options?, helper?, placeholder? }` |
| `label` | String | `'Views and filters'` | the `nav` name |

Items: `{ id, label, count?, tone?, muted? }`. Options (select): `{ value, label }`.
Slots: none. Events: `change({ id, value })` (list: the item id; checks: the array of checked ids; select: the option value).

## States and variants
One size. Rows: default, hover, selected (list) / checked (checks), keyboard focus ring (`border/primary/focused`). Counts are the host's and are not animated. No loading state of its own: the host keeps the previous counts while rows refresh (D-24) and passes `count: undefined` before the first answer (the count is then hidden). Both themes through tokens only.

## Tokens
`surface/container`, `surface/datatable/row-active`, `surface/datatable/row-hover`, `surface/error/subtle`, `text/default`, `text/subtle`, `text/primary/default`, `text/error/default`, `border/primary/focused`, `space-4 / 8 / 12 / 16 / 24 / 32`, `radius-6`, `radius-round`, `label/sm/regular`, `label/sm/bold`, `label/xs/regular`, `label/xs/bold`. Width 240px: no side-pane width token (needs-token, as SlideOverPanel).

## Behaviour
- Holds no filter logic: every change is emitted and the host writes it as one condition on one grid field (D-30), so the Filter badge, the panel and the pane agree; a condition edited or cleared in the panel moves the pane.
- Counts are over every row the viewer may see, not the filtered rows (as the reference: *All 148*, *Triage 3*).
- Scrolls inside itself with its padding inside the scroller (F-051).
- Keyboard: list rows are buttons in a `listbox` (Tab, Enter / Space); checkboxes and selects keep their own keys.
- Responsive: the host hides the pane below 1024px (its conditions stay reachable in the Filter panel).

## Content
Headings in title case as on the reference: *Views*, *Tag · Object type*, *Object ID*, *Sender company*, *Date*. The record select's first option names the checked kind and the count: *Any RFI with email (3)*; helper *Lists only records that have email.* Selects' neutral option: *All companies*, *Any time*.

## Open questions for design
- Counts as plain text (as built) or in a Number Badge? The disabled badge loses its digit in dark mode (F-008).
- Should the pane collapse behind a toolbar button (the Figma Grid Primary Toolbar has a *Show Left Side Panel* toggle mapped to AppLayout)? Today it is part of the Reading view.

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

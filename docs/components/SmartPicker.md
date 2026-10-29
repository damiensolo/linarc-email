# SmartPicker

- **Stage:** candidate (built, drawn in Figma for review; see Figma below)
- **Proposed:** 2026-10-28 · **Used on:** `correspondence-list` (*Link to record*), `correspondence-thread`, `correspondence-context-rfi`, `correspondence-context-dwg` and the Compose panel (*Attach a record*, *Choose from cloud drive* in the composer tool row)
- **Candidate code:** `src/candidates/SmartPicker/SmartPicker.vue`, ranking in `smartPicker.js`
- **Figma:** `_ ☉ Candidates` page: [SmartPicker](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024682-1515) (6 states), [specs](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024683-1284) (examples, anatomy & tokens, keyboard, behaviour), [Modal / Size (proposal)](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024683-938) (sm 486 · md 640 with the picker inside · lg 800, built from the published Modal Components) · **App map:** [19](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4238-7737) Choose from cloud drive and [20](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4238-7949) Attach a record on the Documentation file's Email page, Level 4 (2026-10-28) · **Library:** — · **Log:** P-058 (InputV2 `inputAttrs`), P-059 (ModalV2 `size`, padding, Close), P-060 (InputV2 icon gap), D-61, D-62

## Purpose
A picker for *which record / which file*: type a code or a word and the best match is ready for Enter; or browse, with the kinds of item as quick filters and the ones the page already knows about (the thread's records, records the mail names, the latest threads' records) at the top. It replaces a plain select of 7 records and a checkbox list of 3 files, which stop working at 70 or 300.

## Why not an existing component
- **SelectV2 (Select Menu)** with `allowSearch`: a trigger plus a flat list; the search is a substring filter on the label only (no code without the dash, no description, no ranking), no groups, no quick filters, no second line, and `multiple` shows at most two tags. Used today by *Link to record*.
- **InputV2 `variant="multiselect"`** (Input Field Type=Multi-Select): tags plus free text, no list, no search.
- **DataGrid in a modal** (the legacy `LinkModules` picker): a full grid with its toolbar for a short single-step task; too much for a modal (D-18) and nothing of it is in Figma V3.2.
- **RecipientField** (candidate): a typeahead for people into chips, one row under the field; a picker needs a list that stays open, groups and filters.
- **The parts exist:** Input Field Type=Search Bar, Chip (Solid / Outline, sm), Dropdown Row (candidate; code SelectV2ListItem detailed with a checkbox when multiselect, P-050), Checkbox, Button. SmartPicker composes them and draws only the list card and its group headers.

## Anatomy
Parts stack with `space-16` between them; nothing moves while the picker is used (D-62).
1. **Search** (Input Field Type=Search Bar, Size=sm): search icon, placeholder from the host (*Search by code or title*, *Search by file name or folder*), focused on open, a clear ✕ (Icon R) once there is text. The input is a combobox (P-058); icon-to-text gap `space-8` (P-060).
2. **Kinds** (Checkbox Size=sm, one per kind in the host's order, gap `space-16`, wraps): all on by default; untick to hide a kind; no *All*. Each label carries how many items match the current query (*RFIs · 3*).
3. **Picked** (`multiple` only; a 24px line that is always there): *Nothing selected yet.* or *2 selected* and one removable Chip (Outline, sm) per pick in pick order, with the item's short label (`chipLabel`: *RFI-143*, *A-302 · Rev 3*). Lets a pick hidden by the query or a filter be undone.
4. **List** (card: `surface/container`, 1px `border/subtle`, `radius-6`, padding 4 / 0; **fixed height** `visibleRows` × 56 + 8, scrolls inside): **Dropdown Rows** (candidate; SelectV2ListItem detailed): title = label, description = second line (`text/neutral`), meta right (`text/muted`). Highlighted (↑ ↓, hover): `surface/soft`. Selected: `surface/info/subtle` + 2px `border/info/strong` left. With `multiple` a Checkbox (small) leads the row and reflects the pick.
   - **Group headers** while nothing is typed: *Suggested*, *Recent*, then the kinds in order (each headed). label/xs semibold `text/muted`, padding 8 / 12 / 4.
   - While typing: one ranked list, no headers.
5. **Empty** (in the card): *No records match “{query}”. Try a code or a word from the title.* (the kinds still shown named instead of the noun: *No drawings match …*) plus, when a kind is hidden, a minimal small Button *Show all types*. No items at all: *No records to choose from.*
6. **Live region** (sr-only): result counts, kind changes, picks.

The host is a ModalV2 `size="md"` (640, P-059; D-34): title bar 16 / 20 with the Close button, body 16 / 20, Cancel and the primary button, whose label carries the count when more than one is picked (*Attach 2*). The Figma Modal has one width (486); md and lg are drawn as a proposal (link above).

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | String, Number, Array | `null` | v-model: the picked id (single) or the picked ids in pick order (`multiple`) |
| `items` | Array | `[]` | `[{ id, label, description?, meta?, kind?, keywords?, chipLabel?, suggested?, recent? }]`, resolved by the host; the picker holds no module data |
| `kinds` | Array | `[]` | `[{ id, label }]` kind checkboxes in order, all on at first; empty hides them |
| `multiple` | Boolean | `false` | checkbox rows, Enter toggles, picks as removable chips |
| `placeholder` | String | `'Search'` | |
| `noun` | String | `'items'` | accessible names and the empty state: *records*, *files* |
| `suggestedLabel` / `recentLabel` | String | `'Suggested'` / `'Recent'` | group headings |
| `visibleRows` | Number | `6` | the list's fixed height in rows (a row is 56px); the pickers use 5 |
| `maxResults` | Number | `50` | most rows for one query |
| `autofocus` | Boolean | `true` | focus the search box on mount |

Events: `input` (the id or the ids), `pick` (the item; single mode). No slots yet (an avatar on a row would come from `avatarInitials` / `avatarUrl` on the item, as RecipientField).

## States and variants
Browsing (grouped) · typing (ranked, first row active) · filtered (a kind unticked) · multiple (checkbox rows, empty picked line) · multiple picked · no matches (with and without a kind hidden) · nothing to choose from. Both themes: every colour is a token; rows follow Dropdown Row, picked chips follow Chip, kinds follow Checkbox.

## Tokens
`surface/container`, `border/subtle`, `border radius/radius-6`, `surface/soft`, `surface/info/subtle`, `border/info/strong`, `text/default`, `text/neutral`, `text/muted`, `text/subtle`, `icon/default`, `spacing/space-4`, `space-8`, `space-12`, `space-16`; Input Field, Checkbox, Chip and Button tokens through the instances; the modal's `space-16` / `space-20` paddings through ModalV2. Text: label/sm (search, empty state), label/xs (picked line, group headers semibold), title/sm semibold + body/xs (rows, from Dropdown Row). `needs-token`: modal widths (486 / 640 / 800 have no spacing token; ModalV2 keeps them as pixel classes).

## Behaviour
- **Ranking** (`smartPicker.js`): every word of the query must match somewhere; a word at the start of the label (or of a word in it) counts most, then keywords and the description, then anywhere; a word also matches the compacted text, so `rfi143` and `143` find *RFI-143*; suggested, then recent items win ties. The kind filter is applied after ranking, so the chip counts stay true to the query.
- **Grouping** while nothing is typed: Suggested (`suggested`), Recent (`recent`, not already suggested), then the kinds in order, then items without a kind (always shown). Order inside a group is the host's.
- **Nothing moves (D-62):** the list has a fixed height and the picked line is always rendered, so the modal is the same size before and after a query, a kind change or a pick.
- **Keyboard:** ↑ ↓ move the active row (wrap; scrolls into view); the first row is active as soon as something is typed, nothing is active while browsing; Enter in the search picks (single) or toggles (multiple) the active row; Home / End on an empty query jump; Esc clears the query first (stopped, so the modal stays), a second Esc reaches the host; Space on a kind checkbox shows / hides it.
- **Pointer:** click a row to pick / toggle; tick or untick a kind (counts stay true to the query); the ✕ in the search clears it; click a picked chip's ✕ to undo.
- **ARIA:** the input is `role="combobox"` with `aria-expanded`, `aria-controls` the list and `aria-activedescendant` the active row (InputV2 `inputAttrs`, P-058); the list is `role="listbox"` (`aria-multiselectable` when `multiple`), rows `role="option"` with `aria-selected`; the kind checkboxes sit in a `role="group"` named *Show {noun} of type*; a polite live region reads result counts, kind changes and picks.
- **Responsive:** fills the modal body (640 at `md`); kinds and picked chips wrap; rows truncate title and description; at 390 the modal is the sheet and the list keeps 5 rows.
- **Loading:** the host passes resolved items; a slow source would use the LoadRegion skeleton in the list card (not built; the demo data is local).

## Content
Placeholders say what to type (*Search by code or title*, *Search by file name or folder*). Kinds: *RFIs · 3*. Group headers: *Suggested*, *Recent*. Empty: *No records match “{query}”. Try a code or a word from the title.* · *Show all types* · *Every type is hidden. Tick a type to see records.* · *No records to choose from.* Picked line: *Nothing selected yet.* · *2 selected*. Rows: `{code} · {title}` / `{discipline or spec} · {revision or who has it}` / kind; files: name / `{folder} · {modified}` / `{size} MB` (+ *· by secure link*).

## Open questions for design
- A Size property on the Figma Modal (md 640 / lg 800), as proposed on the candidates page; code has it (P-059).
- Should a typed query also highlight the matched text in the row title? Dropdown Row has one Title text; it would need a rich-text layer.
- Group headers (label/xs semibold `text/muted`) are new; Select Menu Drop Down has no section header. Add one to the library (Dropdown Row family) or keep them in the picker?
- Suggested vs Recent: one group (*For this thread*) or two? Two read clearly in the demo; one may be enough once a project has hundreds of records.
- ~~Input Field Search Bar Size=sm draws Icon L at 20px and Size=lg at 16px; code draws 16 at both (P-060 note). A slip to confirm.~~ Answered 2026-10-29 (F-037): it was a slip. The form-control proposal fixes icons at 16 (sm) / 20 (lg) in every state; the field inset is 12. Applied to the library Figma the same day (P-061); once InputV2 follows the spec, the picker's sm search box text starts at 36 (was 40). Spec: `linarc-design-components/PRPs/figma/form-controls-spec.2026-10-29.md`.

Settled 2026-10-28 (D-62): kind filters are checkboxes, not chips or a segmented control; no *All*.

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

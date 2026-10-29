# RecipientField

- **Stage:** candidate (drawn in Figma for review; see Figma below)
- **Proposed:** 2026-10-19 · **Used on:** `correspondence-context-rfi`, `correspondence-context-dwg`, `correspondence-list` (the shared Compose panel)
- **Candidate code:** `src/candidates/RecipientField/RecipientField.vue`, helpers `recipients.js`
- **Figma:** `_ ☉ Candidates` page: [RecipientField](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024505-562) (8 states), [Recipient Chip](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024503-293) (Kind × State × Avatar On/Off), the shared candidates [Dropdown Row](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024508-696) (typeahead rows), [Menu Item](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024508-621) (also the typeahead's action row when a page offers one) and [Menu](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024508-622) (chip menu), the library Tooltip, [specs](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024507-529) (examples, anatomy & tokens, keyboard, behaviour). Documentation file: Email page › 06 · Compose (`[candidate] RecipientField / To`, `/ Cc`) · **Library:** — · **Log:** P-050 (library parts it needs), D-47

## Purpose
An address field that behaves like a modern mail client's To / Cc / Bcc: type a name or an address, pick from the directory, and every recipient becomes a chip you can check at a glance (who, inside or outside the company, valid or not), fix, move or remove without the mouse.

## Why not an existing component
- **InputV2 `variant="multiselect"`** (Figma Input Field Type=Multi-Select): tags plus an input, but no typeahead, no chip states (external, invalid), no avatar, no keyboard editing of tags, no drag between fields. Its tags are internal (no slot). Extending it would change a field used across the product.
- **SelectV2 `multiple`** (Select Menu Type=Tags): picks from a fixed list only; no free typing, up to two tags then "+N" (P-041), by design.
- **Chip / StatusChip, Avatar, SelectV2ListItem, Popover, MemberCardV2:** the parts. RecipientField composes them; it draws only the field container (Input Field tokens) and the chip menu rows, which exist in neither Figma nor the library.

## Anatomy
1. **Container** (Input Field Type=Multi-Select tokens): min height 40, `radius-4`, 1px `border/input/default`, `surface/input/default`, padding 4 / 8 / 4 / 12, gap 4, wraps. Focus: 1px `border/info/default` + 3px `border/input/focus` ring. Error: 2px `border/error/default`. Drop target: dashed `border/info/default` on `surface/info/subtle`. Disabled: `surface/input/disabled`.
2. **Label** inside the field, leading: *To*, *Cc*, *Bcc* (label/sm/regular, `text/subtle`), the input's `<label>`.
3. **Chips** in order: Status Chip Type=Avatar + Remove, Style=Subtle (`fill-style="outline"`), 24 high, with a 16px Avatar (Size=xs, initials; P-050) and the ✕.
   - Internal (address on an `internalDomains` domain): Status=Neutral (`warning-neutral`).
   - External (any other domain): Status=Warning-Low (`warning-low`), amber.
   - Invalid (not an address): Status=Error (`error`), the raw text as label.
   - Selected (Backspace cascade, click, right-click): 2px `border/primary/focused` outline, 1px offset.
   - Avatar optional (`showAvatar`); without it the chip is label + ✕.
   - **Tooltip** (library Tooltip, top, 300ms, also on keyboard focus of the ✕): external *Outside {organization}*; internal the address (the name while masked); invalid *"bad@x" isn't a valid email address. Double-click to fix it.*
4. **Input**: raw text, label/sm/regular, `text/default`; placeholder `text/input/default`; min width 124 so it wraps to its own line before it gets cramped.
5. **Trailing slot** (optional): right-aligned, e.g. the *Bcc* link on the To row.
6. **Typeahead** (Popover card under the field, field width, max 6 rows visible, scrolls): **Dropdown Row** (candidate; code SelectV2ListItem detailed type, with a 24px Avatar when `showAvatar`, P-050): name (title/sm/semibold), email (12/16 `text/neutral`) and company right (`text/muted`). Highlight `surface/soft`. Optional last row (`unknownActionLabel`, when the page adds people itself) with a user-plus icon; without one an unknown address gets a plain line in the list, *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.* (Compose since 2026-10-28, D-60). Empty: *No one in the directory matches. Enter a full email address.*
7. **Chip menu** (Popover card at the chip): **Menu** of **Menu Items** (candidates): rows 14/20 with a 16px icon, hover / focus `surface/soft`: View contact · Copy email address · Show email address (Show name) · Move to Cc / Bcc… · Edit · Remove. Disabled rows `text/inactive`.
8. **Contact card** (Popover at the chip): Member Card (MemberCardV2) with role, company and email.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | Array | `[]` | v-model. `[{ email, name?, company?, role?, avatarUrl?, id?, invalid? }]`, in order |
| `label` | String | `'To'` | the leading label |
| `contacts` | Array | `[]` | the directory searched (same shape); order kept for the empty query (suggested first) |
| `internalDomains` | Array | `[]` | the organization's domains; any other is external. Empty: no external marking |
| `organizationName` | String | `''` | named in the external chip's tooltip: *Outside {organizationName}* (fallback *your organization*) |
| `showAvatar` | Boolean | `true` | avatars on chips and list rows (photo from `avatarUrl`, else the first initial). The Compose panel sets it `false` |
| `allowUnknown` | Boolean | `true` | `false`: a valid address not in `contacts` emits `unknown` instead of becoming a chip |
| `unknownActionLabel` | String | `''` | the list row offered for an unknown address when `allowUnknown` is false and the page adds people itself (e.g. `'Add {email}'`); empty: no row |
| `unknownMessage` | String | *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.* | the line shown in the list (and announced) for an unknown address when there is no action row; the text stays in the field |
| `group` | String | `'recipients'` | fields with the same group take each other's chips by drag and drop |
| `moveTargets` | Array | `[]` | `[{ id, label }]`: *Move to …* menu rows (the keyboard and touch alternative to dragging) |
| `suggestOnFocus` | Boolean | `true` | open the list on focus before anything is typed |
| `maxSuggestions` | Number | `8` | |
| `placeholder` | String | `''` | shown only while the field is empty |
| `error` | Boolean | `false` | error outline; the page says what is wrong next to it |
| `disabled` | Boolean | `false` | |

Events: `input` (the new array), `unknown` (`{ email, name }`), `move` (`{ recipient, to }`; the source has already removed it), `focus`, `blur`. Slot: `trailing`.

## States and variants
Empty · focused (list open) · typing (filtered list, first row active) · filled · chip selected · invalid chip (field error) · drop target · disabled · no matches · unknown address offered. Both themes: every colour is a token; chips and rows follow Status Chip and Select Menu Item.

## Behaviour
- **Click target:** a mousedown anywhere in the container focuses the input (caret); chips and the trailing slot keep their own clicks.
- **Typing:** plain text; the list filters on name, email and company (word starts first, then anywhere), excluding people already in the field; ↑ ↓ move the active row (wraps); the first row is active as soon as there is text.
- **Commit to a chip:** pick a row (click or Enter / Tab on the active row); Enter, Tab or `,` / `;` after typing; paste of several values (`,` `;` or new lines; `Name <email>` and `"Last, First" <email>` understood); blur with a complete address in the buffer. An address already in the field is skipped and announced. A token that isn't an address becomes an invalid chip.
- **Unknown address** (`allowUnknown=false`): Enter / Tab / comma emit `unknown`. With an `unknownActionLabel` the list offers that row and the text clears for the page to act; without one (Compose, D-60) the list shows `unknownMessage`, the live region announces it and the text stays in the field, so a typo can be fixed and nothing is created.
- **Chip:** optional avatar (photo or first initial) and the name (the address when there is no name, or while masked); a Tooltip says why an amber chip is amber (*Outside Vanguard Construction Group*), gives an internal chip's address, or how to fix an invalid one; ✕ removes.
- **Backspace cascade:** with an empty buffer, Backspace selects the last chip (announced), Backspace or Delete again removes it. ← → walk the chips; typing deselects. ⌘/Ctrl+C copies the selected chip as `Name <email>`, ⌘/Ctrl+X cuts it.
- **Edit:** double-click (or *Edit*) unpacks the chip into the input as its address, caret at the end; any text already typed is committed first.
- **Drag and drop:** chips drag between fields of the same group (dashed drop state); the target adds, the source removes on drop. Touch and keyboard: *Move to …*.
- **Right-click:** the chip menu (↑ ↓ move, Enter runs, Esc closes); *View contact* opens the contact card; *Show email address* masks the name on that chip until toggled back.
- **Esc:** closes the list or clears a chip selection first; otherwise it bubbles (the Compose panel then closes, as before).
- **ARIA:** input `role="combobox"`, `aria-expanded`, `aria-controls` the listbox, `aria-activedescendant` the active row, `aria-autocomplete="list"`; rows `role="option"`; the menu `role="menu"` / `menuitem`; a polite live region announces adds, removes, the cascade and copies; a hidden hint describes the keys.
- **Responsive:** chips wrap; at 390 the input takes its own line once chips fill the row; the list takes the field's width.

## Content
Labels: *To*, *Cc*, *Bcc*. Tooltips: *Outside {organization}* · the address · *"bad@x" isn't a valid email address. Double-click to fix it.* Placeholder (To): *Name or email address*. List: *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.*, *No one in the directory matches. Enter a full email address.*, *Type a name or an email address.* Menu: *View contact*, *Copy email address*, *Show email address* / *Show name*, *Move to Cc*, *Edit*, *Remove*. Invalid (page, under the rows): *"bad@x" in To isn't a valid email address. Double-click it to fix it, or remove it.*

## Open questions for design
- Internal chips use Status Chip Neutral so all three kinds share one height (24); Chip (neutral) is 20 or 32. Keep, or give Chip a 24px size?
- Dropdown Row (drawn 2026-10-19): a candidate of its own, or a two-line type of Select Menu Item?
- Menu / Menu Item (drawn 2026-10-19) for every context and overflow menu; the code rows still live inside RecipientField (extract as a Menu candidate when a second screen needs one). Member Card is the legacy card (fixed colours in dark).
- Is the colour plus the tooltip (*Outside Vanguard Construction Group*, added 2026-10-19) enough, or also a line under the field (*2 recipients are outside Vanguard*)?
- Drag handle: whole chip (as built) or a grip on hover?

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

# Figma readiness: making the design machine-readable

**Thesis:** an AI agent can only be as accurate as the data it reads. A Figma file that *looks* right isn't enough; it has to be *structured* right. Bound variables, consistent variants, descriptions and Code Connect turn a picture into a specification the agent can read and verify against.

## What the agent reads, and what it needs from Figma

| Agent tool | Returns | Needs from Figma |
|---|---|---|
| `get_metadata` | Layer tree: names, types, sizes | Meaningful layer and variant names (`Size=md, Hierarchy=Primary, …`) |
| `get_screenshot` | Visual target | Frames at real product widths; separate tablet/mobile frames where layouts differ |
| `get_design_context` | Layout and styles as reference code | Auto-layout instead of absolute positioning; component instances instead of detached copies |
| `get_variable_defs` | Variables used by the node | **Values bound to variables**. Raw values come back as bare numbers with no token to map to |
| Code Connect (`*.figma.js`) | Figma property → component prop | A Code Connect file per published component |
| Component description | Usage, props, tokens, notes | Current descriptions (an out-of-date one misleads, F-009) |

## Checklist (per component)

- [ ] Width, height, padding, gap and radius bound to `spacing/*` / `border radius/*` variables.
- [ ] Fills and strokes bound to semantic colour variables (`surface/*`, `text/*`, `border/*`, `icon/*`), not primitives or hex.
- [ ] Text uses text styles built from typography variables.
- [ ] Every variant consistent on the axes that should match (icon size per size, stroke per icon size, padding per size). **Audit with a script, not by eye** (F-009).
- [ ] Icon sizes bound to variables, sized to the component (no 24px icon instance left at its native size inside a 16px slot, F-040). Stroke: Icon Button scales it (1.5px × size/24); Chip and Tag keep 1.5px at 16px (`absolute-stroke-width` in code). Match the sibling component.
- [ ] Variant property names and values match the code's vocabulary, or the Code Connect file maps them.
- [ ] A Code Connect file exists **and is published** (`yarn figma:publish`). Unpublished mappings are invisible to the agent (F-014).
- [ ] No unbound or off-scale type sizes, such as an italic 11px label (F-018).
- [ ] New variants made by cloning keep their component-property links (Label, Icon, Show…). Cloning drops them (F-022).
- [ ] Declared padding equals rendered padding: fixed heights or widths must not silently override padding variables. Hug unless fixed is intended (F-025).
- [ ] No "recoloured" instances standing in for a missing variant (e.g. a Success chip painted violet). Add the variant instead (F-023).
- [ ] The component set description states code usage, the prop mapping, the tokens and the date of the last structural change.
- [ ] Light and dark modes both defined for every colour variable used.

## Checklist (per screen)

- [ ] Built from published component instances, not detached copies.
- [ ] Auto-layout throughout, so the structure is explicit.
- [ ] Spacing between sections uses spacing variables.
- [ ] Frame width matches a real target viewport. Responsive behaviour is shown or described for tablet and mobile.
- [ ] Interaction patterns (modal, drawer, panel, toast) use the documented pattern components.
- [ ] After cloning a variant that contains nested instances, reset the nested instances' overrides (not the parent's: that also resets its variant) and screenshot it.
- [ ] Nav labels fit their rail: the module rail and side nav are 82px, and a single word longer than about 12 characters breaks mid-word.
- [ ] Dark mode: run `PRPs/figma/scripts/23-dark-mode-audit.js` (no pale backgrounds in Dark, text ≥ 4.5:1 and icons ≥ 3:1 on the dark container) and mirror any fix in `tokens/src/mapped/Dark.json` and Tokens Studio.

## Evidence so far

- **F-009:** 23 of the 30 md Icon Button variants had an unbound 20px icon after a partial manual fix. Strokes were inconsistent and the description was out of date. A scripted read of all 90 variants found it in one pass; a visual check didn't.
- **F-012:** where Figma was bound to variables, the rendered UI matched Figma exactly (size, colour, radius) with no manual adjustment.
- **F-007:** variable naming differs between Figma and code. Either align them or keep a mapping table the agent always loads.
- **F-008:** Code Connect files let the agent choose the right component props without guessing.
- **F-014:** on the first product screen, none of the library Code Connect mappings were visible to the agent: they exist in the repo but aren't published.
- **F-017:** on a full layout, 14 of 18 measured values matched Figma exactly. All 4 misses trace to library defaults, not the prototype.
- **F-020:** Code Connect looked set up but one stale template blocked every publish. After the fix, 156 of 156 instances on the screen resolve.

## How to audit a component set (agent prompt)

> Read every variant in component set `<node-id>` and report, per variant: icon size, bound variables on width/height/padding/radius, stroke weights and fill variables. Group identical rows, and flag any variant that differs from its size group.

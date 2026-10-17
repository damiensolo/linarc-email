# <ComponentName>

- **Stage:** proposed | candidate | figma | library | connected
- **Proposed:** YYYY-MM-DD · **Used on:** screens (slugs)
- **Candidate code:** `src/candidates/<Name>/<Name>.vue` (once built)
- **Figma:** <component URL once drawn> · **Library:** <path once promoted> · **Log:** P-NNN

## Purpose
One or two sentences: what it shows and the decision it helps.

## Why not an existing component
Which library and Figma components were considered and why each falls short. If it's a variant of one, this should be an extension (P-row), not a candidate.

## Anatomy
Parts, top to bottom / left to right. Which are required, which optional.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|

Slots: … · Events: …

## States and variants
Size · tone · interactive/static · loading · empty · error. Both themes.

## Tokens
Every colour, spacing, radius and type token used (Figma variable names). `needs-token` entries if any.

## Behaviour
Responsive rules (390 → 1440), truncation, keyboard and focus, ARIA role/labels.

## Content
Copy rules; example values from the spec.

## Open questions for design
-

## Acceptance (for promotion to the library)
- [ ] Figma component with the same props as variants/properties, variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

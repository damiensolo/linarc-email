# Candidate components

Components proposed for the design system that exist on neither side yet (no Figma component, no library code). Policy: D-15 in `docs/4-decisions.md`; backlog and proposal docs in `docs/components/`.

- One folder per component: `src/candidates/<Name>/<Name>.vue` plus `README.md` (copy the API table from the proposal). Import as `~/candidates/<Name>/<Name>.vue`.
- Header comment on the `.vue`: `<!-- CANDIDATE <date>: proposed design-system component, see docs/components/<Name>.md. Not a prototype-local widget. -->`
- Same rules as the library: Vue 2.7 Options API, token classes only, both themes, responsive, no lookalike of an existing component.
- Build it as it will ship: props, not page-specific data; slots for content; no imports from `src/prototypes/`.
- When promoted to `../linarc-design-components/src/componentsV2/<Name>/`, delete the folder here and switch imports to `@/componentsV2/<Name>/<Name>.vue`.

## Shipped with the template

These four are generic and the loading rule (D-24, `docs/5-ui-patterns.md` §6) depends on them. They are drawn in Figma on the design system's `_Candidates` page and wait for promotion into the library; until then every app uses them from here.

| Candidate | Purpose | Proposal |
|---|---|---|
| `LoadRegion` + `createLoad.js` | The region that loads: skeleton after 200ms, content kept on refresh, error + Retry, latest request wins, announcements | `docs/components/LoadingStates.md` |
| `LoadStatus` | The inline meta-line indicator ("Updating…", "Still loading…" + Cancel, "Couldn't update." + Retry) | same |
| `Skeleton` | Line / block / circle placeholders in the final layout | same |
| `InlineNotice` | In-page notice: tone + icon + message + actions (warning / error boxed; info / success plain) | `docs/components/InlineNotice.md` |

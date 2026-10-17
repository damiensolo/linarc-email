---
name: figma-to-prototype
description: Build or update a prototype view in this repo from a Figma URL. Use whenever a Figma frame link is given with a request to build, prototype, match, or fix a UI in this repo.
---

# Figma → prototype

Stack: Vue 2.7 Options API, plain JS. Design system from source (`@` = `../linarc-design-components/src`).
The rules, the design-system change policy and the Figma-variable → Tailwind table are in `CLAUDE.md`. Follow them.

## 1. Read the design (Figma MCP)

From `figma.com/design/<fileKey>/<name>?node-id=1-2`, take `fileKey` and `nodeId = 1:2`. For a `/branch/<branchKey>/` URL, use the branchKey as the fileKey.

1. `get_metadata` → layer tree. For large frames, note the section node IDs and work section by section.
2. `get_screenshot` → visual target. Keep it for step 5. If Figma has separate tablet or mobile frames, get those too.
3. Load the `figma:figma-design-to-code` skill, then `get_design_context` per frame or section.
   Its React/Tailwind output is a **spec**. Rewrite it in Vue 2 with our components and token classes. Never paste it.
4. `get_variable_defs` → exact tokens. Translate them with the CLAUDE.md table. If a variable isn't in the table, look it up in `tailwind.config.js` / `tokens.css`.

## 2. Map and report gaps

- Map each Figma instance to `@/componentsV2/*`, then `@/components/*`. The component's `*.figma.js` (Code Connect) gives the property → prop mapping: Size → `size`, Hierarchy → `color-scheme`, Type → `variant`, State → `is-disabled` / `is-focused` / `is-active`.
- List every gap in one line each: missing component, missing prop or state, wrong value, missing token. Classify each one as **fix in place**, **fork** or **new component**, following the policy in CLAUDE.md.
- **Stop and ask** only if: the right interaction pattern is unclear, a gap needs a fork or a new component (confirm scope first), or a fix would visibly change existing production usage. Small in-place fixes can go ahead.

## 3. Fix the design system (only if there are gaps)

Follow `../linarc-design-components/PRPs/prototype-changes/README.md`:
- Add a `// PROTOTYPE-CHANGE <date> (P-NNN): …` comment at each changed spot and a row in its log.
- **New component:** model it on an existing V2 component with similar structure. Use the Figma component's variables, and create `.vue`, `.stories.js` (with `<UsageDocs>`), `.figma.js` and `README.md`.
- **Fork:** `src/forks/<Name>/<Name>.vue`, with a header naming the source path and summarising the diff.
- If Figma itself is inconsistent across variants, report it. Fix Figma only when asked.

## 4. Build

- Copy `src/prototypes/_blank/` to `src/prototypes/<slug>/` (slug `<module>-<screen>`). Export `prototype: { title, figma: '<frame URL>' }` from the component options; the picker lists it automatically. Add the screen to `src/modules/app/router.js` `SCREENS` and, if it sits on a rail, to `nav.js`.
- Shell: `~/modules/app/AppShell.vue` (props `screen`, `title`, `rightPanel`, `bottomPanel`, `scrollableContent`, `headerSize`; slots `header`, `header-actions`, `content`, `right-panel`, `bottom-panel`). Links between screens: `~/modules/app/router.js` (`go`, `href`). Status labels: `~/modules/app/status.js`. Loading: `LoadRegion` + `createLoad` (reference: `example-list`, `example-detail`).
- A screen outside the module shell (an external user's portal) uses `AppLayout` (`@/componentsV2/AppLayout/AppLayout.vue`) directly: `#header`, `#content`, `#left-panel`, `#right-panel`, `#bottom-panel` slots, with a reduced `TopNavBar` when the frame shows one.
- Split complex screens into `src/prototypes/<slug>/components/*.vue`. Put mock data in `src/prototypes/<slug>/data.js`, marked `// PLACEHOLDER DATA`.
- Token classes only: no hex, no primitive palette (`bg-gray-*`), no raw (`p-6`) or arbitrary (`h-[56px]`) values.
- Responsive: design for the Figma frame width, then make sure it reflows down to 390px with Tailwind breakpoints.
- Icons: `import { Name } from '@development/linarc-icons'`, placed in the Button `#leftIcon` / `#rightIcon` slots (Button sizes them itself).

## 5. Verify (required before reporting done)

1. `yarn verify` (conventions + build) passes. With the dev server running (`yarn dev`), run `yarn shot <slug> <scratchpad>/shots`. That captures 1440, 1024 and 390px wide, in light and dark. It must exit 0 (no console errors) with no overflow warnings.
2. Compare the screenshot at the Figma frame's width with the Figma screenshot: layout, spacing, sizes, colours, type. At the other widths, check for overflow, clipping or broken reflow.
3. Spot-check 2–3 computed values (element size, background colour, radius) against `get_variable_defs`. Measure with a one-off puppeteer-core script in the scratchpad (see `docs/3-verification.md`), with no prototype edits needed.
4. State check: measure the main interactive elements (CTA, toolbar buttons) at rest, keyboard-focused and pressed. Their size and position must not change (`docs/3-verification.md`, F-029).
5. Report: the URL (`/?p=<slug>`), what matched, any deviations, the gap list with how each gap was handled (with log IDs), and anything that needs a decision.

## 6. Record (required, feeds the case study)

1. Write `docs/prototypes/<slug>.md` from `docs/prototypes/_template.md`. Fill in the metrics honestly; write "not measured" rather than estimating. Note the time the Figma link arrived and the time verification passed.
2. Add a `docs/findings-log.md` entry (next F-NNN, template at the top) for anything that broke, surprised you, or worked notably well. Say whether it's case-study material.
3. If a step changed, update `docs/1-setup-playbook.md`, `docs/2-figma-readiness.md` (Figma issues that affected accuracy) or `docs/3-verification.md` (new failure modes). Record significant choices in `docs/4-decisions.md`.
4. Copy screenshots worth keeping from the scratchpad to `docs/case-study/assets/<F-id>-<what>.png` (create the folder when first needed).
5. Add the screen to the module's Figma app map (the `spec-to-prototype` skill, step 6) so design reviews there.

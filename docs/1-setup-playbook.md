# Setup playbook

Repeat this to stand up accurate, design-system-based prototyping from Figma with an AI agent. Each step ends with a **Check**. Don't move on until it passes. Findings referenced as F-NNN are in the template's findings log or, for the originals, in `linarc-prototypes/docs/findings-log.md`.

## 0. Prerequisites

- Node 22, Yarn classic, Git, Microsoft Edge (used for headless verification; Chrome as a fallback).
- Cursor (or VS Code) with the Claude Code extension.
- A Figma seat with access to the design system file (`1HxMANBEaYWFqEFtazB20l`) and the Documentation file (`9ANM41f3QwNjt27Sl08i8O`).
- The design system library checked out as a sibling folder: `../linarc-design-components`.

**Check:** `node -v`, `yarn -v` and `git --version` all work, and Edge exists at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` (or set `EDGE_PATH`; if Edge won't launch headless after an update, restart it or point `EDGE_PATH` at Chrome, F-041).

## 1. Prepare Figma first

The quality of the generated UI is capped by the quality of the Figma source. Work through [2-figma-readiness.md](2-figma-readiness.md) for every component and screen you'll prototype from. At minimum:
- Sizes, spacing, radius, colour and type are **bound to variables**, not raw values.
- All variants in a component set are consistent (scripted audit, F-009).
- Components have descriptions and Code Connect mappings, **published**.

**Check:** `get_variable_defs` on a sample component returns variable names, not just hex/px values.

## 2. Library ready to consume

```bash
cd ../linarc-design-components && yarn install
```

**Check:** `ls node_modules/vue node_modules/@development/linarc-icons` succeeds.

## 3. Create the app from the template

```bash
cd ../linarc-prototype-base && yarn install && yarn create-app linarc-<module>-prototypes
cd ../linarc-<module>-prototypes && yarn install
```

The template already has the wiring the first module needed (all of it was found the hard way):
- `vite.config.mjs`: aliases `@` → library `src`, `~` → this `src`, `@development/linarc-icons` → the library's installed copy; `resolve.dedupe: ['vue']` (F-002); the plugin that serves the library's CommonJS `tailwind.config.js` as ESM (F-003); a dependency fallback resolver so prototype files can import the library's dependencies (F-015); an alias for webpack-style `~package` SCSS imports (F-015); `define: { 'process.env': { NODE_ENV } }` with no `VUE_APP_*` values so prototypes never call real APIs (F-015); `.vue` in `resolve.extensions` and a `clamp` shim (F-036); `fs.allow` for the library folder. The library path is resolved once (`LINARC_DS_PATH`, default `../linarc-design-components`) and the config fails with a clear message when it's missing.
- `src/main.js` registers what the library's `install()` would: PortalVue, Vuelidate, `$moment`, a mock Vuex store (DatePicker, grid, FormData; F-065) and a `<Teleport>` shim for TopNavBar (F-016).
- `tailwind.config.js` spreads the library config and adds the library's `src` to `content`.
- `src/style.css` imports the library's `global.css`, then rebinds `body` colour and background to tokens (F-004).
- No secrets in `.npmrc` (F-001).

**Check:** `yarn verify` passes, **and** `yarn dev` + `yarn shot example-list <out>` exits 0 with both themes rendered (F-003: building isn't enough).

## 4. Connect the agent to Figma

- Claude Code: connect the Figma connector in claude.ai settings.
- Cursor's own agent (optional): add the Figma MCP server in Cursor's MCP settings.

**Check:** ask the agent to run `whoami` (it should show your Figma account and seat) and `get_metadata` on the design system file (it should list pages).

## 5. Agent instructions

| File | Role |
|---|---|
| `CLAUDE.md` | Always-on rules: stack, components, tokens, the change policy, the Figma-variable → Tailwind table, known limits |
| `.claude/skills/figma-to-prototype/SKILL.md` | Step-by-step workflow, loaded only for Figma → UI tasks |
| `.claude/skills/spec-to-prototype/SKILL.md` | Workflow for a screen built from a written spec, ending in the Figma app map |
| `.cursor/rules/prototype.mdc` | Points Cursor's agent to the files above |
| `../linarc-design-components/PRPs/prototype-changes/README.md` | How to change the library during prototyping, plus the change log |

Keep the token mapping table current (F-007). Don't duplicate rules between files (F-013).

**Check:** in a new session, both skills appear in the agent's skill list, and asking "what framework do we use?" gets "Vue 2.7 Options API".

## 6. Make it your module

1. `src/modules/app/nav.js`: module tile, tools, rails, Quick Create, project context. Rail labels must fit the 82px rail (two short lines).
2. `src/modules/app/router.js`: `SCREENS`, one line per screen.
3. `src/modules/app/status.js`: the status vocabulary, one `def` per dimension, labels from the spec.
4. `docs/<module>/`: plan and open questions, distilled spec, status model, screen inventory (when building from a spec).

The two example screens are the wiring test the first module needed (a simple component passed while a full layout failed, F-015): a shell with TopNavBar and SideNavV2, a DataGrid in a LoadRegion, a Title Bar / Workflow detail with a right panel. Keep them until your first two screens pass the same checks, then delete them.

**Check:** `yarn verify` passes and `yarn shot` of your first screen exits 0 at 1440 / 1024 / 390 in both themes.

## 7. Start prototyping

Give the agent a Figma frame URL (`figma-to-prototype`) or name a screen from `docs/<module>/screens.md` (`spec-to-prototype`). It reads the design or spec, maps components and reports gaps, fixes the design system if needed (flagged and logged), builds, verifies, records, and adds the screen to the Figma app map.

## Resolution gaps found later (F-036)

The library was built for webpack; each of these appeared the first time a prototype imported the component that needed it. All are in the template now; listed so the next gap is recognised quickly.
- **Plugins the library expects on the Vue instance:** `Vue.use(PortalVue)`, `Vue.use(Vuelidate)` (InputV2, SelectV2, FormV2), `Vue.prototype.$moment`: mirror `src/build.js` in `src/main.js`.
- **`.vue` directory imports** (`@/components/TextEditorV2` → `index.vue`): `resolve.extensions` must include `.vue`.
- **Root-absolute imports** (`/src/components/Icon.vue`) resolve only with the library as root; fix in the library (P-018 lists the occurrences).
- **CommonJS default imports from the library's node_modules** (`clamp`): Vite doesn't pre-bundle deps resolved from the sibling repo; alias an ESM shim in `src/shims/`.
- **A Vuex store** (F-065): DatePicker (FormV2 `date` fields) reads `DatePicker/getHolidays` and `getWorkingDays` from the host app's store. `src/main.js` installs Vuex with the same mock modules as Storybook's `preview.js`. Add a module there when another store-bound component appears.

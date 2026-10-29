# CLAUDE.md — Linarc prototypes

A repo for building **view prototypes** of Linarc platform screens with the Linarc design system. It consumes the sibling `../linarc-design-components` **from source** through Vite aliases (D-01). Created from the `linarc-prototype-base` template; the template's own README explains the setup.

**Building from a Figma URL?** Follow the `figma-to-prototype` skill (`.claude/skills/figma-to-prototype/SKILL.md`). **Building a screen from a written spec (no frame yet)?** Follow `spec-to-prototype` (`.claude/skills/spec-to-prototype/SKILL.md`); it reads `docs/<module>/` and ends by pushing an editable reference to Figma. This file holds the always-on rules and reference.

**Documenting the process is part of the work.** `docs/` holds the setup playbook, Figma readiness checklist, verification steps, decisions, UI patterns, findings log and per-prototype records; see `docs/README.md`. When any setup problem, workaround or surprise comes up, add a `docs/findings-log.md` entry right away, not at the end.

## Commands

- `yarn dev` → http://localhost:5173 (`?p=<slug>` picks a prototype, `?theme=dark|light` forces a theme, `?latency=` simulates loading)
- **Prototype controls** (the sandbox bar: picker, records, roles, *Simulate inbound email* on screens that declare `prototype.inbound`, reset; theme, loading speed and the Figma link in the ··· overflow menu at its right): shown and hidden with the settings gear in each screen's top nav (or its hamburger drawer on a phone); remembered per browser, `?chrome=0` starts hidden. State in `src/modules/sandbox.js` (the gear is P-045 in the library).
- `yarn run check` → the conventions linter (`scripts/check-conventions.mjs`; plain `yarn check` is Yarn 1's built-in integrity check, F-012): hex colours, primitive palette, raw or arbitrary values, bad `border-*` classes, `<script setup>` / TypeScript, reload navigation. `yarn verify` = check + build. **Run `yarn verify` before calling anything done.**
- `yarn build` → production build (catches import/compile errors)
- `yarn shot <slug>[#hash] [out-dir] [port] [widths] [height]` → full-page light + dark PNGs at exact viewport widths (default 1440, 1024 and 390), plus console errors and a horizontal-overflow warning. Exits 1 on errors. Uses the installed Edge (on macOS Edge or else Chrome, F-011) via puppeteer-core (if it fails to launch after an Edge update, restart Edge or set `EDGE_PATH` to Chrome, F-041); the dev server must be running. Write output to the scratchpad, not the repo.
- Sandbox **record picker**: screens that declare `prototype.records` get a second select to open any record (D-27).
- `yarn deploy` → build and publish to the Vercel production URL (`yarn deploy:preview` for a throwaway URL); see Hosting below.

## Rules

- **Vue 2.7 Options API, plain JS.** No Composition API, no `<script setup>`, no TypeScript (same as the library).
- **Use existing components.** Prefer `@/componentsV2/*` (fully V3.2-compliant: AppLayout, SideNavV2, InputV2, SelectV2, ModalV2, Popover, Tooltip, SegmentedControl, FormV2, StatusIndicator, TabNavigation, ProgressStepper, HeaderToolIcon, …), then `@/components/*` (Button, Checkbox, Radio, Toggle, Chip, StatusChip, Avatar, DataGrid, TopNavBar, …). Each has a `*.figma.js` Code Connect file mapping Figma properties to props. Storybook: `yarn storybook` in `../linarc-design-components` (:6006).
- **No lookalikes.** Never hand-build a one-off copy of a library component inside a prototype. If the library is wrong or missing something, fix or add it in the library (see below).
- **Tokens only.** No hex values, no primitive palette classes (`bg-gray-100`, `bg-slate-900`), no raw (`p-6`, `space-x-3`) or arbitrary (`h-[56px]`) values. Use the scales below. `yarn check` enforces this.
- **Responsive by default.** Layouts must work from 390px (mobile) to 1440px+ (desktop). Use Tailwind's default breakpoints (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536) with flex/grid that reflows; no fixed page widths.
- **Imports:** `import Button from '@/components/Button/Button.vue'`; icons are `import { Search } from '@development/linarc-icons'` (lucide-vue re-exports plus Linarc module icons), rendered in Button `#leftIcon` / `#rightIcon` slots. `@` = library `src`, `~` = this repo's `src`. Don't write `import { X } from '@development/linarc-design-components'`: `build.js` has only a default export.
- **Check both themes.** Theme is the `.dark` class on `<html>`.
- **Scroll areas:** scrollbars come from the library's global styles (Figma Scrollbar; don't restyle them). Padding goes inside the scrolling element, so content never touches the bar (`docs/5-ui-patterns.md` §2, F-051).
- **Border colour classes are `border-border-*`** (`border-border-inactive`, `border-border-subtle`). A bare `border-default` or `border-subtle` matches no token and silently takes Tailwind's preflight grey in both themes (F-043). `yarn check` catches it.
- **Patterns and copy come from Figma.** The Figma references define interaction patterns (modal vs drawer vs panel, toasts, tables, states) and writing conventions. If it's unclear which pattern applies, stop and ask; don't guess.
- **Mock data** lives in `src/prototypes/<slug>/data.js`; screens of one module share it in `src/modules/<module>/data/` so a row on one screen leads to the same entity on the next. Make it plausible for construction project management, and mark it `// PLACEHOLDER DATA` until it's been verified.
- **UI patterns are decided; read `docs/5-ui-patterns.md` before building or changing a screen.** In short: create flows are **full-page create screens** (module nav + Title Bar / Workflow `Size=Comfortable` with the back button = `HeaderToolIcon type="back"`, D-25 + centred form column, 56rem for wide forms + fixed bottom-panel footer aligned to that column), **never modals**; a create started from context (e.g. Compose Email from a Drawing/RFI) may open in a SlideOverPanel (candidate) or a compact modal (D-34); otherwise modals only for short single-step tasks. One container level, hairlines not boxes, whitespace not rules between sections, colour only where the user must act, one signal per status, label-only buttons (D-17, D-18). Alternatives for comparison are a second slug `<slug>-<variant>` sharing state and components.
- **Never blank the screen (D-24, `docs/5-ui-patterns.md` §6).** Move between screens with `router.go()` / `href()` (in-document; never `location.assign`). Data that loads goes through `createLoad` + `LoadRegion` / `LoadStatus` (tables: DataGrid `loading`): nothing for 200ms, then a skeleton in the final layout or, on refresh, the content kept with "Updating…"; "Still loading…" after 5s; error + Retry; no full-screen spinners, no fake progress, no artificial delays. Review with the sandbox **Latency** select (`?latency=`).
- **Data entry is left-aligned (D-26, `docs/5-ui-patterns.md` §7).** Inputs of every type left-aligned and sized to their value (FormV2 `props.width: 'short'` for years, counts, rates); table-style entry hugs its content; only read-only numbers in table columns are right-aligned.
- **Tables filter through the grid's Filter panel (D-30, `docs/5-ui-patterns.md` §8).** Quick filters for the common cases, "is any of" for several values, the Filter badge shows it's active (no count line or Clear link above the table); segmented views that are a screen's navigation stay and are cross-linked with the panel. No filter selects above a table.
- **Status is never a string literal in a template.** Labels and tones come from the module's status vocabulary (`src/modules/app/status.js`): text plus colour, never colour alone; red only for failed / expired / rejected.
- **A warning guides** (`docs/5-ui-patterns.md` §3): it says what is wrong, how to fix it and where, and its action lands on the item. Never a link to a step the user then has to scan; never a dead link.
- **No prototype-only notices inside product screens.** Sandbox affordances (picker, record picker, reset) live in the sandbox bar, never in a screen.

## Changing the design system

**Figma is the source of truth (D-14).** When Figma and the library disagree, change the code to match Figma and log it. If a Figma value looks like a slip, keep it as drawn and flag it for design.

Allowed when the library is incorrect, missing a component or token, or lacks functionality the design needs, **as long as every change is flagged and documented**. The full process and the change log are in `../linarc-design-components/PRPs/prototype-changes/README.md`. In short:

- **Bug or mismatch, or an additive prop/slot/variant:** edit in place in the library, minimal and backwards-compatible.
- **Risky change to a widely used component, or experimental:** fork it to `src/forks/<Name>/<Name>.vue` in this repo, with a header comment naming the source path and summarising the diff. Import it as `~/forks/<Name>/<Name>.vue`.
- **Component in Figma but not in code:** create it in the library's `src/componentsV2/<Name>/` with `.vue`, `.stories.js`, `.figma.js` and `README.md`, following existing V2 patterns and Figma variables.
- **Component in neither Figma nor code:** a **candidate** (D-15, next section). Not a library edit yet, and not a prototype-local widget either.
- **Missing token:** don't edit `tokens.css` (it's generated). Log it as `needs-token` and use the closest existing token.
- **Every change:** add a `// PROTOTYPE-CHANGE <date> (P-NNN): …` comment and a row in the log. Read the log's tail before appending (other work may be editing it). Library work goes on a `feature/proto-<topic>` branch; ask before switching if the working tree is dirty.

## Module screens and candidate components

A module is built as a set of screens that behave as one product area.

- **Slugs:** `<module>-<screen>` (the template ships `example-list`, `example-detail` and a hidden `_blank` starter). Shell = the module's top nav + the rail of the tool that lists the screen (D-13), through `~/modules/app/AppShell.vue`; an external-user screen (a portal) uses a reduced top nav and no rail, without the shell.
- **Module config:** `src/modules/app/nav.js` (module tile, tools, rails, quick create, project context), `router.js` (`SCREENS`: screen name → slug; `go(screen, id)`, `href(screen, id)` set `?p=<slug>` and put the record id in the hash, so each screen stays its own slug for the picker and `yarn shot`), `status.js` (vocabulary). Shared data: `src/modules/<module>/data/`; the demo session: `src/modules/session.js` (D-29).
- **Candidate components** (D-15): when a screen needs a component that exists in neither Figma nor the library, it's proposed first (`docs/components/<Name>.md` from `_template.md`, row in `docs/components/README.md`), then built in `src/candidates/<Name>/<Name>.vue` (rules in `src/candidates/README.md`), imported as `~/candidates/<Name>/<Name>.vue`, then drawn in Figma with variables bound for a design iteration, and only then promoted into the library with stories, README, `.figma.js` and a P-row. A candidate is built as it will ship: props and slots, no page data, no imports from `src/prototypes/`. Header comment `CANDIDATE <date>`. The template ships four (loading states, InlineNotice).
- **Before proposing a candidate**, check the library, the Figma component list and the backlog; a variant of an existing component is an extension (P-row), not a candidate. Each screen should need fewer candidates than the one before; if not, say so.
- **Every screen ends in Figma** on the Documentation file's app-map page for its module: editable light-mode screens and states as library instances, connected by labelled arrows (skill step 6, D-22), so design reviews there. Every generated node carries a text style and bound variables (F-055). **The Figma update is part of every change (F-036):** when a prototype change alters what a screen shows (a state, panel, modal, copy, option order, seeded record), update or add its frames on the app map in the same piece of work, including frames cloned from it, and say so in the closing reply. Ask before publishing a Figma library.

## Figma variable → Tailwind class

| Figma variable | Tailwind class |
|---|---|
| `--text-*` (e.g. `--text-default`, `--text-inactive`) | `text-text-default`, `text-text-inactive` |
| `--surface-*` (e.g. `--surface-container`, `--surface-primary-default`) | `bg-surface-container`, `bg-surface-primary` (`-hover`, `-active`, `-disabled`) |
| `--border-*` | `border-border-default`, `border-border-subtle` |
| `--icon-primary-default`, `--icon-inactive` | `border-icon-primary`, `bg-icon-primary`, `text-icon-inactive` |
| `--space-N` | `p-space-N`, `gap-space-N`, `m-space-N`, `w-space-N`, `h-space-N` (0,2,4,8,10,12,16,18,20,24,28,32,36,40,44,48,56,64,72,80,84,88,124) |
| `--radius-N` | `rounded-radius-N` (0,2,4,6,12,20,32,round) |
| `--font-size-N` | `text-fontsize-N` (8,12,14,16,18,20,24,28,32,36) |
| `--line-height-N` | `leading-lineheight-N` |
| `--letter-spacing-N` | `tracking-letterspacing-N` |
| `--font-family-label` / heading | `font-label` / `font-heading` |
| text style `label/md/regular` | `font-label font-normal text-fontsize-16 leading-lineheight-24 tracking-letterspacing-4` |
| text style `label/sm/regular` | `font-label font-normal text-fontsize-14 leading-lineheight-20 tracking-letterspacing-0` |

Not in the table? Look it up: `../linarc-design-components/tailwind.config.js` (class → CSS var) and `src/styles/tokens.css` (`:root` = light, `.dark` = dark). Content widths have no token: `max-w-4xl` (wide forms) / `max-w-3xl` (short forms) are the agreed exceptions (D-20).

Design system Figma file: `1HxMANBEaYWFqEFtazB20l` (Linarc Design System V3.2). Documentation file (app maps): `9ANM41f3QwNjt27Sl08i8O`.

## Setup notes / known limits

- `src/style.css` loads the library's `global.css` (same as production), then rebinds `body` colour to tokens because `global.css` hardcodes a body colour (D-03).
- `vite.config.mjs` resolves the library once (`LINARC_DS_PATH`, default `../linarc-design-components`): `resolve.dedupe: ['vue']` keeps a single Vue instance; a small plugin serves the library's CommonJS `tailwind.config.js` as ESM; a fallback resolver lets prototypes import the library's dependencies; `.vue` is in `resolve.extensions`; CommonJS `clamp` is aliased to a shim in `src/shims/`. A new "could not resolve / no default export" error from a library import is usually another of these; see the playbook's "Resolution gaps" list.
- Library dependencies (including `@development/linarc-icons`) resolve from `../linarc-design-components/node_modules`, so that repo must have `yarn install` done.
- `src/main.js` mirrors the plugins the library's `build.js` installs: PortalVue, **Vuelidate** (InputV2, SelectV2, FormV2 validate through `this.$v`), `$moment`, a mock Vuex store (DatePicker, grid, FormData modules, as Storybook's `preview.js`), and a `<Teleport>` shim for TopNavBar.
- No production app shell is available yet. `AppShell.vue` composes one from `TopNavBar`, `SideNavV2` and `AppLayout`.
- **Hosting (Vercel, prebuilt):** Vercel can't build this repo (it compiles the sibling library from source), so the site is built locally and only `dist/` is uploaded. `vercel.json` skips Vercel's install/build and serves `dist`; `.vercelignore` uploads nothing else; `.vercel/` is gitignored. Whatever is in both working trees at that moment ships, uncommitted library changes included. The site is `noindex`. One-time setup: `npm i -g vercel`, `vercel login`, `vercel link` (answer No to Git auto-deploy and to customising settings). Web Analytics is optional: `@vercel/analytics` `inject()` in `main.js` (framework-agnostic entry; report the slug as the path).
- Legacy `@/components/TextEditor` uses webpack-only `require()` in its template and won't work under Vite. Use `TextEditorV2`.
- CSS output is ~8 MB because the library safelists every class (`pattern: /.*/`) to support dynamic class names. This is expected; don't override it (D-04).

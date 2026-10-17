# linarc-email

Linarc platform prototypes, created 2026-10-15 from `linarc-prototype-base`. The template's own README (how the repo works, how to add a screen, how to verify and deploy) is kept below.

---


The starting point for a Linarc platform prototypes app: Vue 2.7 + the Linarc design system consumed from source, with the sandbox, the app shell, the loading pattern, the agent instructions, the conventions check and the docs already wired. Copy it, name it, and start on screens.

Everything in here was proven on the first module built this way (Prequalification, in `linarc-prototypes`); the module-specific parts were left behind, the conventions were kept.

## What you get

| Area | What it is |
|---|---|
| **Wiring** | `vite.config.mjs`, `tailwind.config.js`, `src/style.css`, `src/main.js`: the library from `../linarc-design-components` (or `LINARC_DS_PATH`), one Vue instance, the plugins and store mocks the library expects, the token stylesheet with dark mode working |
| **Sandbox** | `src/App.vue`: prototype picker, record picker, simulated latency, reset demo data, light / dark; hidden with the settings gear in each screen's top nav or `?chrome=0` |
| **App shell** | `src/modules/app/AppShell.vue`: top nav (module tile, tools, Quick Create, account rail), side-nav rail, AppLayout; configured in `nav.js`; `router.js` for in-document links; `status.js` for the status vocabulary; `src/modules/session.js` for the demo session |
| **Loading pattern** | `src/candidates/`: LoadRegion + `createLoad`, LoadStatus, Skeleton, InlineNotice (the never-blank rule, D-24) |
| **Examples** | `src/prototypes/example-list` (list pattern: Title Bar / Page, DataGrid in a LoadRegion, Filter panel) and `example-detail` (detail pattern: Title Bar / Workflow with back button, hairline facts, right-panel activity, record from the hash); `_blank` as a starter |
| **Agent instructions** | `CLAUDE.md` (always-on rules), `.claude/skills/figma-to-prototype` and `spec-to-prototype` (workflows), `.cursor/rules/prototype.mdc` (pointer) |
| **Checks** | `yarn check` (conventions linter), `yarn verify` (check + build), `yarn shot` (screenshots at 1440 / 1024 / 390 in both themes with console errors) |
| **Docs** | `docs/`: setup playbook, Figma readiness, verification, decisions, UI patterns, findings log, record templates, candidate backlog |
| **Hosting** | `vercel.json`, `.vercelignore`, `yarn deploy` (prebuilt `dist/` upload) |

## Prerequisites

- Node 22, Yarn classic, Git, Microsoft Edge (headless verification; Chrome works as a fallback).
- The design system checked out as a sibling folder, with its dependencies installed:
  ```bash
  git clone <linarc-design-components> ../linarc-design-components
  cd ../linarc-design-components && yarn install
  ```
- Cursor or VS Code with Claude Code, and the Figma connector enabled in claude.ai (for Figma MCP).

## Create a new app

From this folder:

```bash
yarn install                      # once, for the scaffold script
yarn create-app linarc-<module>-prototypes
cd ../linarc-<module>-prototypes
yarn install
yarn dev                          # http://localhost:5173 — the two example screens
yarn verify                       # conventions + build
```

`create-app` copies the template next to it (a sibling of the design system, which the new app consumes from source), sets the package name, starts a fresh findings log, drops the scaffold script and runs `git init`. Pass a second argument to create it elsewhere, then set `LINARC_DS_PATH` in that app's `.env` (see `.env.example`).

Then make it your module:

1. `src/modules/app/nav.js`: the module tile, tools, rails, Quick Create items, project context.
2. `src/modules/app/router.js`: `SCREENS`, one line per screen.
3. `src/modules/app/status.js`: the status vocabulary (one `def` per dimension).
4. Copy `src/prototypes/_blank` to `src/prototypes/<module>-<screen>` for each screen; keep the examples as references until you don't need them, then delete them (and their `SCREENS` lines).
5. Start a `docs/<module>/` folder for the spec, status model and screen inventory if you're building from a written spec (the `spec-to-prototype` skill reads it).

## Day to day

- **Build a screen from a Figma frame:** give the agent the frame URL; it follows `figma-to-prototype`.
- **Build a screen from a spec:** name the screen; the agent follows `spec-to-prototype` and ends by pushing an editable reference to Figma.
- **Before "done":** `yarn verify`, `yarn shot <slug> <out-dir>` exits 0 at all three widths in both themes, and the checks in `docs/3-verification.md`.
- **Record:** one `docs/prototypes/<slug>.md` per screen; anything surprising in `docs/findings-log.md` as it happens.
- **Library changes:** allowed, flagged `PROTOTYPE-CHANGE`, logged in `../linarc-design-components/PRPs/prototype-changes/README.md` (CLAUDE.md › Changing the design system).

## Sharing (Vercel)

The site is built locally and only `dist/` is uploaded (Vercel can't build it: it compiles the sibling library from source).

```bash
npm i -g vercel     # once
vercel login        # once
vercel link         # once, in the app folder: No to Git auto-deploy, No to customising settings
yarn deploy         # build + publish to the production URL
```

`yarn deploy:preview` publishes a throwaway preview URL instead. Demo changes live in each viewer's browser tab; "Reset demo data" restores the starting data.

## Updating the template

Improvements made in an app that every future app should have (a wiring fix, a new candidate, a changed rule) go back here. Keep the template free of module-specific code: if it only makes sense for one module, it belongs in that app.

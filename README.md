# linarc-email

---


The starting point for a Linarc platform prototypes app: Vue 2.7 + the Linarc design system consumed from source, with the sandbox, the app shell, the loading pattern, the agent instructions, the conventions check and the docs already wired. Copy it, name it, and start on screens.

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

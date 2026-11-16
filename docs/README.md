# Prototyping docs

How we build repeatable, design-system-accurate prototypes from Figma or a written spec with an AI agent (Claude Code in Cursor), and what we keep learning. These files came with the template; the playbook, readiness checklist, verification steps and UI patterns are standing conventions. The decisions and findings log start from the template's and grow with this app.

## Files

| File | What it's for | When it changes |
|---|---|---|
| [1-setup-playbook.md](1-setup-playbook.md) | Step-by-step setup to repeat this from zero, with a check for each step | When a setup step is added, changed or found wrong |
| [2-figma-readiness.md](2-figma-readiness.md) | What "machine-readable Figma" means, as a checklist with evidence | When a Figma issue affects code accuracy |
| [3-verification.md](3-verification.md) | The verification steps, what each one catches and how to run it, and every script in `scripts/` | When a check is added or a new failure mode appears |
| [4-decisions.md](4-decisions.md) | Key choices, the reasons for them, and the alternatives rejected | When a significant choice is made or reversed |
| [5-ui-patterns.md](5-ui-patterns.md) | **Read before building any screen.** Page patterns (full-page create vs modal), layout and white space, containers / colour / icons, which components to use, loading and navigation, data entry, filtering | When the user decides a UI or pattern question in review |
| [findings-log.md](findings-log.md) | Append-only, dated findings: the raw material for everything else | Whenever something breaks, surprises us, or works notably well |
| [prototypes/](prototypes/) | One record per prototype: gaps, fixes, checks, metrics (`_template.md`). Ten records: `correspondence-list`, `-thread`, `-portal`, `-rfi-list`, `-context-rfi`, `-context-dwg`, `-context-sub`, `-context-co`, `notifications-list`, `notifications-preferences` | At the end of every prototype (skill step 6) |
| [correspondence/](correspondence/) | The Email upgrade (slugs `correspondence-*`): [00-plan.md](correspondence/00-plan.md) (bets, personas, open questions, build order), [spec.md](correspondence/spec.md) (distilled spec), [status-model.md](correspondence/status-model.md), [screens.md](correspondence/screens.md) (inventory and component map), [flows.md](correspondence/flows.md) (IA and flowcharts, the text of the Email Flows FigJam board), [rfi-integration.md](correspondence/rfi-integration.md) (RFIs × Email review, D-48, D-49), [demo-guide.md](correspondence/demo-guide.md) (the demo script, run as written by `scripts/demo-correspondence-walkthrough.mjs`); `source/` (the first-pass generated spec and its README), `reference/` (the PRD pass's drafts: `correspondenceData.js`, `nav.js`, `router.js`, `sessions.js`, `status.js`; history only, see its README) | Plan: when a question is answered or a decision made. Spec: only when the source changes. Screens: as each screen moves stage. Flows: with the board |
| [notifications/](notifications/) | The Notifications upgrade, a platform surface hosted here (D-52): [00-plan.md](notifications/00-plan.md), [spec.md](notifications/spec.md), [status-model.md](notifications/status-model.md), [screens.md](notifications/screens.md), [overview-and-demo.md](notifications/overview-and-demo.md) (stakeholder overview and the demo, run by `scripts/demo-notifications-walkthrough.mjs`); `source/` (the Unified Communication Model proposal v2 and its README) | As above |
| [components/](components/) | Candidate-component backlog ([README.md](components/README.md), stages per candidate) and one proposal doc per candidate from `_template.md` (D-15): AiSummary, DrawingPinPreview, FileViewer, InlineNotice, LoadingStates, RecipientField, SlideOverPanel, SmartPicker, SplitPane, ThreadList, ThreadStream, ViewsPane | When a candidate is proposed, built, drawn in Figma or promoted |
| `case-study/` (not created yet) | Internal and public write-ups at milestones; screenshots worth keeping in `case-study/assets/` | At milestones |

## How these docs stay current

1. **During work:** any setup problem, workaround or surprise gets a `findings-log.md` entry when it's discovered (rule in `CLAUDE.md`).
2. **After each prototype:** step 6 of the `figma-to-prototype` skill (step 7 of `spec-to-prototype`) writes `prototypes/<slug>.md`. It also updates the playbook, readiness checklist or verification doc if a step changed, and for module screens the `<module>/screens.md` status and the `components/` backlog stages.
3. **Back to the template:** a finding or rule that applies to every future app goes into `linarc-prototype-base` too, so the next app starts with it.

## Where the first module's history is

The Prequalification module (`linarc-prototypes`) is the reference implementation these conventions came from: 74 findings, 32 decisions, 12 candidates, two case studies and a Figma app map. When a rule here cites an F- or P- number you can't find, it's in that repo's `docs/findings-log.md` (the template's log, `linarc-prototype-base/docs/findings-log.md`, carries the same numbers) or the library's `PRPs/prototype-changes/README.md`. This app's own findings are F-001 to F-051 in [findings-log.md](findings-log.md); the numbers overlap, so the playbook, verification and UI-patterns docs say *template F-NNN* where they mean the template's.

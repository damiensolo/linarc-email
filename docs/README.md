# Prototyping docs

How we build repeatable, design-system-accurate prototypes from Figma or a written spec with an AI agent (Claude Code in Cursor), and what we keep learning. These files came with the template; the playbook, readiness checklist, verification steps and UI patterns are standing conventions. The decisions and findings log start from the template's and grow with this app.

## Files

| File | What it's for | When it changes |
|---|---|---|
| [1-setup-playbook.md](1-setup-playbook.md) | Step-by-step setup to repeat this from zero, with a check for each step | When a setup step is added, changed or found wrong |
| [2-figma-readiness.md](2-figma-readiness.md) | What "machine-readable Figma" means, as a checklist with evidence | When a Figma issue affects code accuracy |
| [3-verification.md](3-verification.md) | The verification steps, what each one catches and how to run it | When a check is added or a new failure mode appears |
| [4-decisions.md](4-decisions.md) | Key choices, the reasons for them, and the alternatives rejected | When a significant choice is made or reversed |
| [5-ui-patterns.md](5-ui-patterns.md) | **Read before building any screen.** Page patterns (full-page create vs modal), layout and white space, containers / colour / icons, which components to use, loading and navigation, data entry, filtering | When the user decides a UI or pattern question in review |
| [findings-log.md](findings-log.md) | Append-only, dated findings: the raw material for everything else | Whenever something breaks, surprises us, or works notably well |
| [prototypes/](prototypes/) | One record per prototype: gaps, fixes, checks, metrics (`_template.md`) | At the end of every prototype (skill step 6) |
| `<module>/` | The module being built: plan and open questions, distilled spec, status model, screen inventory (create it when building from a spec; `spec-to-prototype` reads it) | Plan: when a question is answered or a decision made. Spec: only when the source changes. Screens: as each screen moves stage |
| [components/](components/) | Candidate-component backlog and one proposal doc per candidate (D-15) | When a candidate is proposed, built, drawn in Figma or promoted |
| `case-study/` (optional) | Internal and public write-ups at milestones; screenshots worth keeping in `case-study/assets/` | At milestones |

## How these docs stay current

1. **During work:** any setup problem, workaround or surprise gets a `findings-log.md` entry when it's discovered (rule in `CLAUDE.md`).
2. **After each prototype:** step 6 of the `figma-to-prototype` skill (step 7 of `spec-to-prototype`) writes `prototypes/<slug>.md`. It also updates the playbook, readiness checklist or verification doc if a step changed, and for module screens the `<module>/screens.md` status and the `components/` backlog stages.
3. **Back to the template:** a finding or rule that applies to every future app goes into `linarc-prototype-base` too, so the next app starts with it.

## Where the first module's history is

The Prequalification module (`linarc-prototypes`) is the reference implementation these conventions came from: 74 findings, 32 decisions, 12 candidates, two case studies and a Figma app map. When a rule here cites an F- or P- number you can't find, it's in that repo's `docs/findings-log.md` or the library's `PRPs/prototype-changes/README.md`.

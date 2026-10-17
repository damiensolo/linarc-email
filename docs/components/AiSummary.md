# AiSummary

- **Stage:** figma (drawn 2026-10-16 on the library's `_ ☉ Candidates` page; built 2026-10-16, `src/candidates/AiSummary/AiSummary.vue`)
- **Proposed:** 2026-10-16 (Correspondence) · **Used on:** `correspondence-thread`, `correspondence-context-rfi`; later candidates: RFI and Submittal detail, Daily Logs
- **Candidate code:** `src/candidates/AiSummary/AiSummary.vue` (once built)
- **Figma:** [`_ ☉ Candidates` › AiSummary](https://www.figma.com/design/1HxMANBEaYWFqEFtazB20l/Linarc-Design-System-V3.2?node-id=40024481-1504) (unpublished, variables bound) · **Library:** — · **Log:** —
- **Rules:** `docs/5-ui-patterns.md` §9; D-24 (never blank); D-38

## Purpose
A block that presents AI-generated summary content with the mandatory tag, disclaimer and evidence line, and honest loading and failure states. Split out of ThreadStream (D-38) because the same block will appear on other records.

## Why not an existing component
- **StatusChip (AI) + Tooltip** are the tag; they don't carry the content, the evidence line or the states.
- **InlineNotice:** a notice asks for action; a summary is reading content and must not look like a warning.

## Anatomy
Heading row (title *Summary*, AI StatusChip in a focusable span with the §9 tooltip) → grouped bullets (*Decisions*, *Open questions*, *Commitments*; empty groups are omitted) → evidence line in `text/subtle` (*Summarised from 3 messages and 2 files in THR-1042*). Loading: skeleton lines in the same layout after 200ms. Failed: *Summary unavailable* with *Retry*; the rest of the screen is unaffected.

## API
| Prop | Type | Default | Notes |
|---|---|---|---|
| `groups` | Array | `[]` | `{ label, items: [String] }` |
| `evidence` | String | required | the evidence line |
| `status` | `'ready' \| 'loading' \| 'error'` | `'ready'` | or pass a `load` controller |
| `title` | String | `'Summary'` | |

Slots: `default` (custom content instead of groups). Events: `retry`.

## States and variants
Ready, loading, error, empty (not rendered). Both themes.

## Tokens
`text/default`, `text/subtle`, `surface/skeleton`, `space-8`, `space-16`, `label/sm/*`. No fill or outline of its own (one container level, D-17).

## Behaviour
Static content; the tag is reachable by keyboard; `aria-busy` while loading; the error uses `role="alert"`. Content is never copied anywhere without a user editing step (`correspondence/spec.md` §6.2).

## Content
Disclaimer text fixed by §9. The evidence line names counts and the record id, never a model name.

## Open questions for design
- Does the Documentation file already show an AI summary block on any screen (RFI, Daily Log) to align with?

## Acceptance (for promotion to the library)
- [ ] Figma component (ready / loading / error), variables bound, both modes
- [ ] `.vue`, `.stories.js` with UsageDocs, `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390; no size change across states
- [ ] Used by at least one prototype through the library path; candidate folder deleted

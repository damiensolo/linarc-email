# AiSummary (candidate)

Proposal and rules: `docs/components/AiSummary.md` (D-38, D-44; `docs/5-ui-patterns.md` §9). Import as `~/candidates/AiSummary/AiSummary.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `groups` | Array | `[]` | `{ label, items: [{ text, sourceIds? }] }`; empty groups are omitted |
| `evidence` | String | required | the evidence line under the content |
| `status` | `'ready' \| 'loading' \| 'error'` | `'ready'` | loading = skeleton lines in place; error = "Summary unavailable." + Retry |
| `title` | String | `'Summary'` | |

Events: `retry`, `trace` (sourceIds: the screen scrolls to or highlights the source entries), `feedback` ("Not accurate").
Exports `AI_NOTE`, the §9 disclaimer, for other AI-tagged fields.

# LoadStatus (candidate)

Proposal, API and status: `docs/components/LoadingStates.md`. Rules: `docs/5-ui-patterns.md` §6 (D-24). Import: `~/candidates/LoadStatus/LoadStatus.vue`. Reference use: `src/prototypes/example-list/index.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `load` | Object | required | a `createLoad` controller (a load or an action) |
| `cancellable` | Boolean | `true` | Cancel once a load is slow (never for actions) |
| `variant` | `'inline' \| 'notice'` | `'inline'` | `notice` = a failure as an InlineNotice |
| `active` | Boolean | `true` | one controller, several forms: only the submitting one shows |
| `size` | `'sm' \| 'xs'` | `'sm'` | `xs` = 12/16 for meta lines set in 12px |

Default slot: the resting text ("12 threads", "Saved 2 min ago"). Event: `retry`. Fixed 24px line, no wrap.

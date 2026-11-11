# Skeleton (candidate)

Proposal, API and status: `docs/components/LoadingStates.md`. Rules: `docs/5-ui-patterns.md` §6 (D-24). Import: `~/candidates/Skeleton/Skeleton.vue`. Reference use: `src/prototypes/example-detail/index.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `shape` | `'line' \| 'block' \| 'circle'` | `'line'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | line height 20 / 24 / 28; width from the parent's class |

`aria-hidden`; shimmer through `--skeleton-shimmer-ms` (1600ms), static under reduced motion.

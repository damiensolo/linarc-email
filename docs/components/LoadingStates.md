# Loading states: Skeleton · LoadRegion · LoadStatus (+ `createLoad`)

- **Stage:** figma (drawn 2026-10-11; needs building in the library)
- **Proposed:** 2026-10-10 (first module) · **Used on:** `example-list` and `example-detail` (reference implementations); every screen that loads data
- **Candidate code:** `src/candidates/Skeleton/Skeleton.vue`, `src/candidates/LoadRegion/LoadRegion.vue` + `createLoad.js`, `src/candidates/LoadStatus/LoadStatus.vue`
- **Figma:** design system `_Candidates` page: Skeleton `40024347:89` (Shape = Line sm / md / lg · Block · Circle), Load Status `40024347:169` (State = Default · Loading · Updating · Still loading · Couldn't update; Summary text), Load Region `40024347:224` (State = Skeleton · Error · Cancelled); tables: Data Table / Sheet Cell `Type=Skeleton Loader` (40016391:36860) · **Library:** DataGrid `loading` (P-034), tokens (P-035) · **Log:** P-034, P-035, P-036, D-24, F-057, F-058
- **Rules:** `docs/5-ui-patterns.md` §6

## Purpose
One way to load data anywhere in the app: answer at once, show nothing for fast results, show the final layout as a skeleton for slow first loads, keep content during refreshes, be honest when slow or failed, and always end.

## Why not an existing component
- **Spinner** (`@/components/Spinner.vue`, Figma Spinner): a 100px hard-coded orange ring meant for the whole content area, which is the full-screen loader the rules forbid. Not exported.
- **StatusIndicator `type="spinner"`**: the right 16px indeterminate marker, used *inside* LoadStatus.
- **DataGrid**: had no loading state (its Code Connect said so); now has `loading` (P-034) using the Figma Skeleton Loader cell. LoadRegion wraps it (`content-loads`).
- **DataGridToolbar "Loading views…" pill**: specific to saved views.
- Nothing in the library owns the timing, the stale-request rule or the announcements, which is most of the value.

## Anatomy
- **`createLoad({ label, action? })`**: a reactive controller per data region, or per write when `action` is given (`{ busy: 'Saving', done: 'Saved', error: "Couldn't save." }`): same timing and latest-wins rules, action wording, no Cancel, completion always announced. State: `status` (idle / loading / ready / error / cancelled), `hasData`, `indicator`, `slow`, `fromSkeleton`, `error`, `announcement`. Methods: `run(request, apply)`, `cancel()`, `destroy()`.
- **LoadRegion**: the region that loads. `aria-busy`, a polite live region, then one of: content (fades in once after a seen skeleton) · the `#skeleton` slot (invisible for the first 200ms, reserving the layout) · an error/cancel notice with Retry. `content-loads` keeps a self-loading child (DataGrid) mounted and passes `skeleton`.
- **LoadStatus**: the inline meta-line indicator: spinner + "Loading…" / "Updating…" / "Still loading…" (+ Cancel when slow), or "Couldn't update." + Retry after a failed refresh; for an action, "Saving…" / "Still saving…" and the action's error + Retry (`variant="notice"`: as an InlineNotice); otherwise its default slot (e.g. "12 requests", "Saved 2 min ago"). Fixed 24px line, no wrap.
- **Skeleton**: `line` (sm/md/lg = 20/24/28 line boxes), `block`, `circle`; width from the parent's class.

## API
| Part | Prop | Type | Default | Notes |
|---|---|---|---|---|
| createLoad | `label` | String | `'content'` | lower case, for announcements |
| createLoad | `indicatorDelayMs` | Number | 200 | `LOAD_TIMING` |
| createLoad | `slowAfterMs` | Number | 5000 | `LOAD_TIMING` |
| createLoad | `action` | `{ busy, done, error }` | null | makes it a write (save / send / submit) |
| LoadRegion | `load` | Object | required | controller |
| LoadRegion | `content-loads` | Boolean | false | default slot gets `{ skeleton }` and stays mounted |
| LoadRegion | `secondary` | Boolean | false | another region of the same load: no live region, no error notice |
| LoadStatus | `load` | Object | required | same controller |
| LoadStatus | `cancellable` | Boolean | true | Cancel once a load is slow (never for actions) |
| LoadStatus | `variant` | String | `'inline'` | `notice` = failure as InlineNotice |
| LoadStatus | `active` | Boolean | true | one controller, several forms: only the submitting one shows |
| LoadStatus | `size` | String | `'sm'` | `xs` = 12/16 for meta lines set in 12px |
| KpiCard | `loading` | Boolean | false | value and hint as Skeleton blocks (36 / 16), label kept, not clickable |
| Skeleton | `shape` | String | `'line'` | line / block / circle |
| Skeleton | `size` | String | `'sm'` | line height sm 20 / md 24 / lg 28 |

Slots: LoadRegion default (put content in `<template #default>` or use `v-slot`: plain children are evaluated at once and throw while data is null), `skeleton`, `error` (`{ error, retry }`); LoadStatus default. Events: `retry` (LoadRegion, LoadStatus).
CSS custom properties: `--skeleton-shimmer-ms` (1600ms), `--load-reveal-ms` (160ms).

## States and variants
idle → loading (hidden 0–200ms → indicator → slow at 5s) → ready | error | cancelled. First load vs refresh (`hasData`). Both themes; reduced motion = static skeleton, no fade.

## Tokens
`surface/skeleton` (placeholder fill), `surface/skeleton-highlight` (shimmer band) (P-035), `radius-6`, `space-8` (cell padding), `space-20/24/28` (line heights), text `label/sm` + `text/subtle` (LoadStatus). **needs-token:** motion durations (none exist in Figma or `tokens.css`).

## Behaviour
Region-scoped; never covers the shell. Latest request wins; superseded answers are ignored. Timers cleared on settle and on `destroy()`. Skeletons `aria-hidden`; announcements only on start (after the delay), slow, and done (only if start was announced); errors `role="alert"`. Writes (`action`) announce through one app-level live region (`announce()` in `createLoad.js`, appended to `body`), so "Changes saved" is heard even when success closes the form or modal that started it.

## Content
"Loading…", "Updating…", "Still loading…", "Cancel", "Couldn't load the {label}.", "Couldn't update.", "Loading stopped.", "Retry". No stage names, percentages or time estimates unless the backend reports them.

## Open questions for design
- Should the shimmer exist in Figma at all (Smart Animate prototype), or stay a code-only behaviour documented here?
- Button busy state for submits: Figma has `Type=Spinner-*`; code needs it (P-036).
- Motion tokens: `motion/duration/fast` 160, `motion/duration/loop` 1600, `motion/delay/indicator` 200?

## Acceptance (for promotion to the library)
- [x] Figma: Skeleton (line / block / circle), Load Status and Load Region states as variants, variables bound, both modes (2026-10-11; library publish pending)
- [ ] `.vue`, `.stories.js` with UsageDocs (stories driven by a fake latency), `README.md`, `.figma.js`; Code Connect published
- [ ] Verified in both themes at 1440 / 1024 / 390 with the loading-state timeline check (`docs/3-verification.md`)
- [ ] Used by at least one prototype through the library path; candidate folders deleted

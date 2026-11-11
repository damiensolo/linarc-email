# LoadRegion (candidate)

Proposal, API and status: `docs/components/LoadingStates.md`. Rules: `docs/5-ui-patterns.md` §6 (D-24). Import: `~/candidates/LoadRegion/LoadRegion.vue`. Reference use: `src/prototypes/example-list/index.vue`.
The controller `createLoad.js` (+ `LOAD_TIMING`, `announce`) lives here too: `import { createLoad } from '~/candidates/LoadRegion/createLoad'`.

| Part | Prop | Type | Default | Notes |
|---|---|---|---|---|
| createLoad | `label` | String | `'content'` | lower case, for announcements |
| createLoad | `indicatorDelayMs` | Number | 200 | `LOAD_TIMING` |
| createLoad | `slowAfterMs` | Number | 5000 | `LOAD_TIMING` |
| createLoad | `action` | `{ busy, done, error }` | null | makes it a write (save / send / submit): action wording, no Cancel |
| LoadRegion | `load` | Object | required | the controller |
| LoadRegion | `content-loads` | Boolean | false | default slot gets `{ skeleton }` and stays mounted (DataGrid `loading`) |
| LoadRegion | `secondary` | Boolean | false | another region of the same load: no live region, no error notice |

Slots: default (use `<template #default>`: plain children are evaluated at once and throw while data is null), `skeleton`, `error` (`{ error, retry }`). Event: `retry`. `run(request, apply)` resolves to `{ ok, value }`, `{ ok: false, error }`, `{ stale: true }` or `{ cancelled: true }`.

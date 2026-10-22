# Findings log

Append-only. Newest at the bottom. One entry per finding, using the template below. Don't edit old entries except to add a `Resolved:` line. The findings the template's conventions came from (F-001 to F-074 of the first module) are in `linarc-prototypes/docs/findings-log.md`; the rules that resulted are in `CLAUDE.md`, `5-ui-patterns.md` and `3-verification.md`, with their F-numbers.

```
## F-NNN · YYYY-MM-DD · <short title>
Tags: figma | tooling | design-system | ai-workflow | security
What happened:
Why it mattered:
How it was caught:
What changed: (playbook / code / Figma / docs; link log IDs like P-NNN)
Case study: Y/N, with the one-line lesson if Y
```

---

## F-001 · 2026-10-15 · App created from linarc-prototype-base
Tags: tooling
What happened: scaffolded with `yarn create-app linarc-email`.
Why it mattered: records the template version this app started from.
How it was caught: —
What changed: —
Case study: N

## F-002 · 2026-10-15 · Module mega menu: the library's mock categories are out of date with Figma
Tags: figma | design-system
What happened: wiring the top nav's module mega menu, the obvious data source was the library's `megaMenuFullAppMock.js` (what Storybook shows). Checked against Figma Mega Menu / Size=lg (40017883:93451) it is stale: no Admin, Directory or Config rows; Financials has 5 rows instead of 8 (no Owner / Sub's Contract, Owner / Sub's Billing; "Prime Contract" instead of "OwnerContract"); Documentation is in a different order; Scheduler is cyan instead of indigo and Quality violet instead of red; Portfolio's row is "Project" instead of "Project Portfolio". The categories were transcribed from Figma instead (`src/modules/app/nav.js` MEGA_MENU, 7 sections, 29 rows). Figma's icons are "Main Menu / …" components with no code mapping; their exported SVG paths are lucide glyphs at 20px, so each maps exactly (Directory = Bolt, WBS = Network, T & M = CalendarClock, Punchlist = ListX, RFI = the package's FileSearchBottomRight).
Why it mattered: the Storybook menu would have shown the wrong areas of the product, wrong colours and missing rows.
How it was caught: comparing a Figma screenshot of the component with the mock before using it.
What changed: code (nav.js MEGA_MENU, AppShell, session bookmarks); library P-047 (module tile keyboard-operable). Flags for design, kept as drawn: "OwnerContract" has no space; Config repeats Closeout's tagline and icon; Admin's icon stroke is bound to border/default and Project Portfolio's to border/accent/grey (other sections use icon/accent/*). Library follow-up: refresh `megaMenuFullAppMock.js` from Figma.
Case study: Y — a Storybook mock is not the design; check the Figma component before reusing its data.

## F-003 · 2026-10-16 · PRD pass produced docs outside the skill's contract, with a decision that conflicted with a library change
Tags: ai-workflow | design-system
What happened: the Correspondence PRD was turned into a plan, spec, screen inventory, two candidate proposals and five draft code files by a generation pass. Reviewed against the repo: the files sat in `docs/prd/` with spaced names instead of `docs/<module>/00-plan.md|spec.md|status-model.md|screens.md` (no status model at all); every line carried generator citation markers (`cite: N` in square brackets) pointing at sources not in the repo; decisions D-35–D-38 were only in the plan, not in `4-decisions.md`, and D-34 was duplicated with narrower wording; candidates were outside `docs/components/` with no backlog rows; the draft `router.js` / `sessions.js` / `nav.js` would have replaced the template's wiring (against D-33); the status draft used a `danger` tone the template lacks; the user's real name was the demo user; the plan had zero open questions, no problem statement, no metrics and no test script. One "resolved" question (Q-02, inline guest creation by typing into `SelectV2 multiple`) depended on typing that P-041 had removed four days earlier.
Why it mattered: `spec-to-prototype` would not have found the module docs; the build would have started on a component change the library log had already rejected; and client sessions would have had nothing to measure.
How it was caught: a review pass comparing the docs with `SKILL.md` §0, `docs/README.md`, `4-decisions.md`, the template's `src/modules/app/*` and `session.js`, and the library's `PRPs/prototype-changes/README.md` tail.
What changed: docs restructured into `docs/correspondence/` (plan rewritten with bets, scope, personas, three test flows, metrics, Q-02 reopened and Q-05–Q-13 added, build order; spec gains Who sees what, inbound mail, AI rules, bounce handling, link lifecycle, states and copy; new `status-model.md`); D-35–D-39 in `4-decisions.md`; four proposals in `docs/components/` with backlog rows; drafts kept in `docs/correspondence/reference/` with a README saying what is superseded. Template follow-up: add to `spec-to-prototype` §0 "read the tail of the library change log for P-rows that touch the components the spec extends", and to the readiness checks "no generator citation markers in docs".
Case study: Y — a generated spec that answers all of its own questions hasn't met a user; check its decisions against the change log before building.

## F-004 · 2026-10-16 · `yarn check` runs Yarn 1's built-in integrity check, not the conventions linter
Tags: tooling
What happened: `CLAUDE.md` and the playbook say `yarn check`. Under Yarn 1.22 (`yarn --version`), `check` is a built-in command that shadows the `check` script in `package.json`, so the call printed dependency-integrity errors ("picomatch is wrong version", "vite@8.3.2 doesn't satisfy @vitejs/plugin-vue2") and never ran `scripts/check-conventions.mjs`. `yarn run check` (or `yarn verify`, which has no built-in to collide with) runs the linter.
Why it mattered: the documented command silently checks the wrong thing; a convention violation would pass unnoticed by anyone following the docs.
How it was caught: running the documented command after a docs-only change and reading the output.
What changed: docs (this entry). Template follow-up: rename the script to `lint` (or document `yarn run check`) in `linarc-prototype-base`, `CLAUDE.md` and `1-setup-playbook.md`; the integrity errors themselves (vite 8 vs the plugin's peer range) are worth a look separately.
Case study: N

## F-005 · 2026-10-16 · The platform already has Email; the PRD pass specified it as new
Tags: ai-workflow | design-system
What happened: the help centre (Email an RFI / Submittal / Change Order to external stakeholders; Exchange emails with collaborators; Distribution lists) shows a per-record Email tab and a project Email screen with compose to guest users, CC, prefilled subject, rich text, 20 MB attachments from device or project files, record PDF, per-recipient delivery status, auto-threaded replies and reply notifications. The first-pass spec described an "Inbox" tool and "Correspondence" tabs as new capabilities and never mentioned the existing ones, so it would have renamed and rebuilt what exists. Separately, the "original PRD" added to `source/` turned out to be the first-pass generated spec itself (same text, same `cite` markers), not the raw PRD.
Why it mattered: a client would have read the prototype as a regression (missing CC, record PDF, guest users) under a new name, and the real delta (compose from a drawing, inline guest creation, large files, triage, Unmatched inbound, internal notes, promote, open tracking) would have been buried.
How it was caught: the user pointed at the help articles; reading them against the spec.
What changed: `correspondence/00-plan.md` §0 parity table and D-40 (upgrade, not replace; Email naming); spec rewritten with "today" markers per field; Q-02 settled as an add-by-email row (no library change), Q-06 yes (Unmatched + Link to record); modal variant, proof-pack export, quick-response radios and Quick create item moved to follow-ups. Template follow-up: `spec-to-prototype` §0 should read the product's help centre for the area before distilling a PRD, and `source/` should hold the raw PRD, not a derivative.
Case study: Y — before specifying a "new" capability, read the help centre for the one that exists.

## F-006 · 2026-10-16 · A data module can be smoke-tested through Vite SSR before any screen exists
Tags: tooling | ai-workflow
What happened: build step 1 of Correspondence produced only data, status and session code, which `yarn verify` compiles but never executes. A node script that calls Vite's `createServer({ middlewareMode: true })` and `ssrLoadModule('/src/modules/correspondence/data/index.js')` loads the module with the repo's aliases and plugins, with `session.js` falling back to an empty in-memory session (no `window`). It loops every thread, entry, recipient and audit row against the status dimensions, checks each role's view (D-41), the link states (D-43) and runs every mutation in `actions.js`, in about five seconds. Kept as `scripts/smoke-correspondence-data.mjs`; Node must resolve `vite` from the repo's `node_modules` (a script outside the repo needs a `file:` import).
Why it mattered: the skill's §5 check "every status value in the data renders; every role renders" otherwise waits for the screens, and a data bug then looks like a screen bug.
How it was caught: wanting to verify step 1 without building a hidden check screen (which would be prototype-only code).
What changed: the script; this entry. Template follow-up: a generic `scripts/smoke-data.mjs <module>` that loops `getThreads`-style accessors against `status.js`, and a line in `spec-to-prototype` §3 to run it after the data step.
Case study: Y — verify the data layer on its own; the screens then only have to be right about layout.

## F-007 · 2026-10-16 · First screenshot of a cold dev server times out; a role switcher as `prototype.roles`
Tags: tooling
What happened: (1) `yarn shot` against a freshly started dev server failed with a 30s navigation timeout: the first request compiles the whole library (8 MB CSS, every component). The second run took 20s for six captures. (2) The Correspondence screens gate content by viewer role (D-41). Rather than a role control inside a screen (prototype-only UI in a product screen is not allowed), the sandbox bar gained a generic **role switcher**: a screen declares `prototype.roles = () => ({ options, value, set })` (as `prototype.records` does for the record picker, D-27), App.vue shows a "Viewing as" select, the choice is kept in the demo session (`settings.role`) and the screen remounts. An interaction script (`scripts/interact-correspondence-list.mjs`, puppeteer-core on the installed Edge) drives segments, the Link to record modal, the role switcher and Reset demo data, since static shots can't show state changes.
Why it mattered: a timeout on a healthy screen looks like a broken screen; and a role switch is the only way to verify D-41 without reading code.
How it was caught: running the documented verification right after `yarn dev`.
What changed: App.vue and `src/prototypes/index.js` (`roles` meta); the interaction script. Template follow-up: `screenshot.mjs` should warm the page once (or use a 90s timeout on the first navigation) and document "run `yarn shot` after the first page load"; `prototype.roles` belongs in `linarc-prototype-base` with a line in the skill's §5 ("every role renders").
Case study: N

## F-008 · 2026-10-16 · `lodash.throttle` default import fails through FormV2's rich-text field; disabled number badge blank in dark
Tags: tooling | design-system
What happened: (1) The first screen to import FormV2 (the Promote panel) went blank with "The requested module …/lodash.throttle/index.js does not provide an export named 'default'". FormV2 registers a rich-text field that imports TextEditorV2, whose colour picker (`vue-color`) does a default import of the CommonJS `lodash.throttle`; Vite serves packages from the sibling repo raw (not pre-bundled), so the import has no default. Same gap as `clamp` (F-036 in the first module). Fixed with an ESM shim, `src/shims/lodash.throttle.js`, aliased in `vite.config.mjs`; self-contained so it does not depend on how `lodash` itself resolves. (2) TabNavigation count badges (StatusIndicator `number`, status `disabled`) rendered as empty circles in dark mode in the thread's right panel; the §5 flag says Figma loses the digit in dark and "code renders it readably", which did not hold here. The thread drops the counts (they added nothing).
Why it mattered: a blank page with one console line looks like a broken screen, and it only appears once a prototype reaches FormV2; the badge issue would have shipped a tab bar with blank circles in dark.
How it was caught: `yarn shot` reporting the page error on every capture; reading the dark capture.
What changed: the shim and alias (template follow-up: add both `clamp` and `lodash.throttle` shims to `linarc-prototype-base`, and the playbook's resolution-gaps list); library follow-up: check StatusIndicator `number` + `disabled` in dark (`surface/*disabled` vs text) before any screen relies on count badges.
Case study: N

## F-009 · 2026-10-16 · Esc inside a dropdown closed the slide-over panel; the rich-text editor enables Send half a second late
Tags: design-system | tooling
What happened: (1) In the compose panel, pressing Esc to close the recipients dropdown (SelectV2 `multiple`) also closed the SlideOverPanel: the panel listened for Esc on its root and the select does not stop the event. Fix in the candidate: Esc is ignored while an `[aria-expanded="true"]` element exists inside the panel, so the dropdown gets its Esc and the next one closes the panel. (2) FormV2's `rich-text` field (TextEditorV2) emits its value debounced (~500 ms), so a Send button gated on the body enables about half a second after typing stops. Accepted as the product's editor behaviour. (3) Test-script lessons: with a panel over a screen there can be two visible buttons with the same label (the composer's Send behind the panel and the panel's Send); pick the last in DOM order, as the click helper already did.
Why it mattered: an Esc that closes the whole panel loses a half-written message; the check and the click disagreeing looked like a UI bug until the second button was found.
How it was caught: the interaction script's Escape step; a check that failed while the following click succeeded.
What changed: `src/candidates/SlideOverPanel/SlideOverPanel.vue` (`onEsc`); proposal doc behaviour line to add at promotion; `scripts/interact-correspondence-rfi.mjs`. Library follow-up: SelectV2 could `stopPropagation` on the Esc that closes its list, which would make every host dialog safe.
Case study: N

## F-010 · 2026-10-16 · The Email app map in Figma: what the library could and couldn't express
Tags: figma | design-system
What happened: the module's map was built on the Documentation file's existing (empty) **Email** page (4084:9896), two sections: Level 1 (01 Email → 02 Thread → 03 Promote panel → 04 RFI Email tab) and Level 2 (05 Sheet → 06 Compose → 07 Secure link page, 390). Reference frames were cloned from the Prequalifications map and retargeted; new content was built from auto-layout frames with every text style and colour, padding, gap and radius bound (audit: 0 unbound outside instances and the annotation layer). Four candidates were drawn as components on the library's `_ ☉ Candidates` page (unpublished). Gaps met: (1) `Side Nav Project` has no Communication › Email rail item, so 01 and 02 select the rail's Communication item while the prototype shows an Email rail; `Top Nav Bar Module=Project` has no Drawings or RFIs tool, so 04 and 05 select nothing (flag for design: the Project module's tool strip and rails). (2) Two look-alike sets: `Tab Navigation` (one tab, key f20ea14…) and `Tab Navigation Bar` (the strip, key 958c3272…); the skill's key list names the single tab, which rendered one lonely tab until swapped. (3) Setting a variant or property re-creates an instance's nested nodes: any list of nested ids taken before the change is stale (as F-053 says); classify first, then mutate by top-level id. (4) New Button, Input Field, Select Menu and Textarea instances arrive with every optional layer on (icons, label, helper, description, actions, button); the keys differ per component (`Show Icon L#…`, `Show Description#…`), so hide by matching keys loosely. The Button set's fallback variant is State=Disabled when a name filter misses. (5) `Top Nav Bar / Sizes` sm shows the Projects module tile; the Company variant with the logomark exists only at desktop size, so 07 carries the module tile (flag). (6) The map's arrows in the reference are not variable-bound (raw colours); the audit skips the annotation layer, as the first module did. (7) The reference "01→02 KPI filter" arrow is the dashed orange state-change arrow, not navigation; copying its paint made three navigation arrows orange until swapped for the "02→03 Review now" stroke.
Why it mattered: the design review happens on this page; wrong rails, blank tabs or default icon layers would read as design decisions.
How it was caught: one screenshot per frame after composition; the binding audit.
What changed: the Email page and `_ ☉ Candidates` page; `prototype.figma` on the five screens; records and backlog links. Template follow-up: correct the Tab Navigation Bar key in `spec-to-prototype` §6 (958c3272602e134ab7bea91a97e9526629cc20a1), add "hide optional layers by key pattern" and "classify instances before mutating them", and note the Button fallback. Library follow-ups for design: Project module rails and tools for Communication › Email, Drawings and RFIs; a Company (logomark) top nav at the sm size.
Case study: Y — clone the reference, retarget by property, and audit bindings; the library's gaps become the design review's agenda.

## F-011 · 2026-10-18 · `yarn shot` assumed Windows; `yarn` itself wasn't on the Mac
Tags: tooling
What happened: on a fresh Mac checkout, `yarn` was not installed and `corepack enable` failed (no write access to `/usr/local/bin`); Yarn 1 ran through `corepack yarn@1.22.22 …`. `scripts/screenshot.mjs` defaulted to the Windows Edge path, so every capture would have failed to launch without `EDGE_PATH`.
Why it mattered: `yarn verify` and `yarn shot` are the done-checks in CLAUDE.md; a setup that can't run them can't verify a screen.
How it was caught: setting the repo up to run, then the first screenshot on macOS.
What changed: `scripts/screenshot.mjs` picks the first installed browser (Edge on Windows; Edge, then Chrome, on macOS). Setup note for the playbook: `sudo corepack enable` once, or `corepack yarn@1.22.22 <script>`. Template follow-up: same change in `linarc-prototype-base`.
Case study: N

## F-012 · 2026-10-18 · `yarn check` runs Yarn's built-in, not the conventions linter
Tags: tooling
What happened: under Yarn 1, `yarn check` is a built-in command (dependency integrity) and wins over the `check` script, so it printed "picomatch is wrong version… Found 6 errors" instead of linting. `yarn verify` was unaffected (it calls the script file directly).
Why it mattered: CLAUDE.md lists `yarn check` as the linter; anyone running it gets unrelated dependency errors and no convention check.
How it was caught: running the linter after the attachments change.
What changed: use `yarn run check` (or `node scripts/check-conventions.mjs`); CLAUDE.md updated. Template follow-up: rename the script (e.g. `lint:conventions`) in `linarc-prototype-base`.
Case study: N

## F-013 · 2026-10-18 · Keys added to the root of `Vue.observable()` are not reactive in Vue 2
Tags: tooling
What happened: the file store kept `id → object URL` in `Vue.observable({})` and added keys with `Vue.set`. After a reload the stored files were read back, but tiles never showed their previews: Vue 2 only notifies for keys added to an object reached through a reactive property, and a computed that read a missing key at the root had no dependency to wake.
Why it mattered: a reply's photo looked lost after any reload.
How it was caught: the attach → send → reload flow test (`after reload tiles []`).
What changed: `src/modules/fileStore.js` nests the map (`Vue.observable({ urls: {} })`) and exposes `fileUrl(id)`. Rule of thumb for session-like modules: never `Vue.set` on an observable's root.
Case study: N

## F-014 · 2026-10-18 · Files attached to a reply vanished once sent; an iframe reports "loaded" for a 404
Tags: tooling | design-system
What happened: (1) The thread and RFI composers passed `attachmentIds` of files picked in the demo to `sendMessage`, but only the static file table resolves ids, so the sent reply showed no files at all. New threads already carried their files inline. (2) In the FileViewer, a PDF that 404s still fired the iframe's `load`, so the stage showed the browser's error page instead of the viewer's error state.
Why it mattered: (1) the demo silently dropped what the user attached; (2) a broken link would look like a blank viewer with no way forward.
How it was caught: (1) reading `sendMessage` while wiring real attachments; (2) the states test with the request intercepted to 404.
What changed: (1) `sendMessage` takes `attachments` and stores them inline (`attachmentIds` still works for static files); (2) FileViewer fetches a PDF before showing it and keeps the error state when the iframe's late `load` arrives. Both in D-45's change.
Case study: N

## F-015 · 2026-10-19 · The rich text editor wasn't the live app's or Figma's; two traps redrawing it
Tags: design-system | figma
What happened: the compose panel's Message field (FormV2 `rich-text` → the library's legacy `TextEditorV2`) showed filled navy icons, undo / redo and a bare select, unlike both the live app and Figma's Text Editor. The library checkout here (3.0.71, `feature/figma-code-connect`) has no newer editor; the live app's version is unknown for now. Redrawing the toolbar to Figma with library Buttons (P-049) hit two traps: (1) real `<button>`s take focus on mouse-down, so keys typed right after a click went to the button and a space toggled Bold again, losing text; (2) `bg-surface-input-default` / `border-border-input-default` are not classes (the config maps `DEFAULT`, so `bg-surface-input`), which left the select white in dark mode.
Why it mattered: reviewers compare the prototype with the live app; an editor that drops what you typed after pressing Bold would fail any test session.
How it was caught: comparing the user's live-app screenshot with Figma and the code; a typing test that clicked Bold mid-sentence; the dark capture.
What changed: P-049 (toolbar and surface to Figma, mouse-down prevented on tools, `todoList` honoured, strikethrough; FormV2 `props.toolbar`); the compose panel asks for Figma's tool set. Follow-up: bring in the live app's editor when its library version is known, then recheck parity. Rule of thumb: for a `DEFAULT` token, the class has no `-default` suffix; check `tailwind.config.js`, not the CSS variable name.
Case study: N

## F-016 · 2026-10-19 · InputV2 never shows an `errorMessage` set by the page
Tags: design-system
What happened: the compose panel's *Add by email* passed `state="error"` and `error-message` for an invalid address, but InputV2 only shows `errorMessage` when its own Vuelidate rules fail (`isInvalid` = `$v.$error` for the default variant), so the message never appeared, and `state="error"` colours the helper line only, not the border. Found while realigning the row (the Add button was Button medium 32px next to InputV2 large 40px, aligned to the bottom of the label stack).
Why it mattered: an invalid address silently did nothing.
How it was caught: the error-state screenshot after the alignment fix.
What changed: the panel passes the message as `helper-text` with `state="error"` (shown in the error colour); the row is heading + explanation above a label-less InputV2 (`id` tied to the heading's `<label>`) and Button large, aligned at the top. Library follow-up: InputV2 should show `errorMessage` and an error border whenever `state="error"`, as Figma's Input Field State=Error does.
Case study: N

## F-017 · 2026-10-19 · The editor's emoji, link and table pickers opened behind the compose panel
Tags: design-system
What happened: TextEditorV2 opens its emoji picker, link dialog and table dialog with the legacy `Modal`, mounted on `<body>` at `z-50`. The SlideOverPanel candidate sat at `z-index: 60`, so inside the compose panel the pickers opened behind it (only their left edge showed, under the backdrop). Visible once P-049 put the emoji and table tools in the compose panel's toolbar.
Why it mattered: the tools looked broken; a picker behind a backdrop can't be used or closed.
How it was caught: the user's screenshot.
What changed: SlideOverPanel moves to `z-index: 40` (above the page, whose highest layer is AppLayout's header at z-10; below the legacy Modal, ModalV2 at 9999, dropdowns and tooltips at 2000+, and the FileViewer at 70). Proposal doc's Behaviour line records the layer. Checked: emoji picker and Create Table on top and usable from the drawing's compose panel. Library follow-up: the overlay layers have no scale (z-50, 2000, 9999, 10000 and 10003 in different components); a z-index token scale would stop this recurring.
Case study: N

## F-018 · 2026-10-19 · RecipientField: two traps in the parts it reuses
Tags: design-system
What happened: (1) MemberCardV2 paints itself selected (blue fill, `#2B76E780`) whenever `index === selectedMemberIndex`; both props default to undefined, so a card placed alone (the chip's *View contact*) always looked selected. (2) Chip and StatusChip Type=Avatar took a photo URL only, while Figma nests a 16px Avatar with initials, and code Avatar had no xs; every recipient without a photo would have had no avatar.
Why it mattered: a contact card that looks like a selection, and chips missing the avatar the design shows.
How it was caught: the View contact screenshot; reading the chip anatomy in Figma before building.
What changed: the candidate passes `:index="0" :selected-member-index="-1"`; P-050 adds Avatar xs, `avatarInitials` on Chip / StatusChip, and an avatar on SelectV2ListItem detailed rows. Library follow-up: MemberCardV2 should treat an undefined selection as none, and its hardcoded colours need tokens (light avatar band in dark).
Case study: N

## F-019 · 2026-10-20 · Tab count badges were empty circles in dark mode
Tags: design-system
What happened: TabNavigation's default count badge (StatusIndicator number, subtle `disabled`) drew its digit in `text-on-surface-default`, which is #131313 in both themes, on `surface-warning-neutral-subtle` (#ffffff1a in dark). In dark the digit disappeared.
Why it mattered: every tab count in dark (the RFI's Q&A and Watchers, any screen using `count`) read as an empty circle.
How it was caught: the dark-mode screenshot of the rebuilt RFI at 390 and 1440.
What changed: P-051, the subtle disabled badge's text is `text-text-default` (unchanged in light). Flagged for design to confirm the Figma variable.
Case study: N

## F-020 · 2026-10-20 · Session patches replace arrays; a scripted list edit can delete instead of insert
Tags: process
What happened: (1) RFI Q&A steps, workflow steps and activity live in `session.patches[id]`, which is a shallow merge: writing `qa` replaces the whole array, so every action reads the current record and writes the full list. (2) While splicing the new RFI records into `records.js` with a script, the slice assignment ran without the new block and removed 49 lines (the RFIs and the end of DRAWINGS); caught at once by `git diff --stat` and restored from HEAD before re-splicing.
Why it mattered: (1) appending to a patched array in place would not be reactive and would drop earlier demo changes; (2) a silent deletion in mock data breaks every screen.
How it was caught: (1) by design; (2) printing the lines around the edit.
What changed: `rfi.js` writes whole arrays through `patchRecord`; large data edits are written to a scratch file and spliced with asserted line anchors.
Case study: N

## F-021 · 2026-10-21 · Two traps adding avatar colours and photos
Tags: design-system, figma
What happened: (1) The obvious palettes failed contrast: white initials (`text/default-invert`, white in both themes) on the chart colours turn unreadable in dark, where the charts are pastel; the accent palette is mid-tone in both themes. Only `text/on-surface/neutral` (white → #131313) works with the charts. (2) Figma `generate_image` with a `nodeId` didn't fill the target: it created new frames on the file's first page (the Thumbnail cover), returning their ids.
Why it mattered: (1) illegible initials in one theme; (2) generated images left on the cover page.
How it was caught: (1) computing contrast for every pair in both themes before choosing; (2) checking the returned node ids' page.
What changed: (1) Avatar uses charts + on-surface/neutral, minus teal (3.7:1) and red/grey by meaning (P-052); (2) the fills were copied into the slots by image hash and the stray frames removed. Generated photos are face-cropped (prototype files cropped with `sips`; Figma fills with an image transform) so faces read at 24px.
Case study: N

---
name: spec-to-prototype
description: Build a module screen from a written spec (no Figma frame yet), using the design system, candidate components for what's missing, then add the screen and its states to the module's Figma app map. Use for any request that names a screen from docs/<module>/screens.md or a PRD rather than a Figma URL.
---

# Spec → prototype → Figma reference

Stack and rules: `CLAUDE.md` (always-on rules, change policy, token table, candidate-component rules). This skill is the workflow. When design hands a Figma frame back for a screen, switch to `figma-to-prototype` for that revision.

## 0. Read (every session, before planning)

1. `docs/<module>/00-plan.md` → open questions and decisions. **Don't build against an unanswered question that changes the screen; ask.**
2. `docs/<module>/spec.md` (the distilled spec, not the raw PRD files), `docs/<module>/status-model.md`, the screen's row and section in `docs/<module>/screens.md`. If the module folder doesn't exist yet, create these four files from the source material first (plan: questions and decisions; spec: the facts the screens need, with line references to the source; status model: dimensions, values, labels, tones; screens: one row per screen with persona, purpose, nav position, stage).
3. `docs/components/README.md` → which candidates exist already and at what stage. `src/modules/app/` → shell, router, status vocabulary; `src/modules/<module>/data/` → shared mock data.
4. The previous screen's record in `docs/prototypes/` for conventions already chosen.
5. **`docs/5-ui-patterns.md`**: the page pattern for each kind of task (create = full-page with Title Bar / Workflow, not a modal), layout, white space and visual rules already decided. Don't re-open them.

## 1. Scope the screen

Write, in the prototype record (`docs/prototypes/<slug>.md`, from `_template.md`, started now, finished in step 7):
- Persona and what they must decide on this screen (one sentence each).
- Nav position (module › tool › rail item; D-13) and the page title.
- Data the screen needs: which shared entities and which status dimensions.
- The Figma pattern to use for each interaction (modal vs drawer vs panel, table vs list, toasts). Start from `docs/5-ui-patterns.md`; then the V3.2 library's existing product screens in the Documentation file; if none fits, **stop and ask** rather than inventing one.

## 2. Component map

For every element on the screen, one line: element → `existing` (library component + props) / `extend` (library component + the additive change, gets a P-row) / `candidate` (name, proposal doc). Rules:
- Check `@/componentsV2` first, then `@/components`, then the Figma component list (`get_metadata` on the V3.2 file's component pages or `search_design_system`), then the backlog, before calling anything a candidate.
- A variant of an existing component is an **extend**, not a candidate.
- Each candidate gets `docs/components/<Name>.md` (template `_template.md`) **before** it's built, and a row in `docs/components/README.md`.
- Count them. If a screen needs more candidates than the previous one, say so in the record; the component boundaries probably need rethinking.

## 3. Data

- Shared, module-wide mock data lives in `src/modules/<module>/data/` and the status vocabulary in `src/modules/app/status.js`. Screens import from there; a row on a list must lead to the same record on the detail screen.
- Every status rendered on screen comes from `status.js` (label + tone); never a string literal in a template.
- Realistic construction companies, trades, CSI divisions, dollar values and dates; fictional names; marked `// PLACEHOLDER DATA`. Dates relative to a `TODAY` constant so the demo never goes stale.
- Role-restricted fields are present in the data and gated in the view by a `role` value, so the same prototype can show each role's view.
- Changes a person makes go through `src/modules/session.js` (D-29), so the whole workflow runs end to end across screens and survives a reload.

## 4. Build

- Copy `src/prototypes/_blank/` to `src/prototypes/<module>-<screen>/`. `prototype: { title: '<Tool> › <Screen>', figma: '' }` until the Figma reference exists; then put the Light frame URL there. Add the screen to `src/modules/app/router.js` `SCREENS` and, if it sits on a rail, to `nav.js`.
- Shell: `~/modules/app/AppShell.vue` (props `screen`, `title`, `rightPanel` (sets the panel enabled **and** visible, F-046), `bottomPanel`, `scrollableContent`, `headerSize`; slots `header` (Title Bar / Workflow for create, review and detail screens), `header-actions`, `content`, `right-panel`, `bottom-panel`). Cross-screen links go through `~/modules/app/router.js` (`go(screen, id)` / `href(screen, id)`): each screen keeps its own slug, the record id travels in the hash. An external user's screen (a portal) uses a reduced Linarc top nav (Company variant, logomark), no side rail, and doesn't use the shell. Modals go inside the `#content` slot.
- Pass 1 with existing components only; candidates are stubbed with the nearest existing component so the page works end to end. Pass 2 builds the candidates in `src/candidates/<Name>/` and swaps them in.
- Everything else as `CLAUDE.md`: Vue 2.7 Options API, tokens only, responsive 390 → 1440+, both themes, icons from `@development/linarc-icons`.

## 5. Verify (required before reporting done)

Same as `figma-to-prototype` step 5: `yarn verify` passes; `yarn shot <slug> <scratchpad>/shots` exits 0 with no overflow warnings; inspect all six captures; spot-check 2–3 computed values; run the state-change check on any new interactive candidate (no size change at rest / focus / pressed). Plus for this workflow:
- Every status value in the data renders with text and tone (loop the data; no unmapped status).
- Every role renders (toggle `role` in data) with the restricted columns hidden.
- Each `?latency=` scenario for every loading region (`docs/3-verification.md` › Loading states).
- Dark mode of each candidate uses tokens that pass the dark audit rules (text ≥ 4.5:1, icons ≥ 3:1 on `surface/container`).

## 6. Add to the Figma app map (editable reference)

Target: Documentation file `9ANM41f3QwNjt27Sl08i8O`, the module's page (D-22; the first module's is **Prequalifications**, `3766:33584`, the model to copy: one section per level, 200px gaps, stacked at x 0). A new module gets its own page named after it, with a Title, a Legend (clone the Prequalifications one) and a first section. Light mode only (dark is verified in code).

1. **Start from the nearest frame on the map** and clone it (`node.clone()`, then `section.appendChild`). The Prequalifications page has reference frames for every pattern: a list screen with the shell, title bar, toolbar and data table (`3769:6402`), a review with Title Bar / Workflow, right panel and tabs (`3769:6710`), a create flow with stepper, form column and bottom panel (`3769:6836`), a record (`3783:8437`), a portal (`3793:4665`), list screens with a Filters row (`3818:6279`, `3818:5154`). Text is easiest to make by cloning an existing text node of the right style and changing `characters`.
2. **Full screen or crop:** draw a full 1440 screen when the shell, stepper, nav selection or footer changes; otherwise a close-up crop of the region that changes (right panel 380, tab content 980, form column 936) on a `surface/container` frame. Long pages are drawn full length with the footer at the bottom and labelled "full length".
3. **Map layer:** numbered label above each frame (blue badge, 26px bold title, route + one-line purpose); arrows as vectors (`setVectorNetworkAsync`, last vertex `strokeCap: 'ARROW_EQUILATERAL'`, `cornerRadius: 16`, weight 3) routed orthogonally without crossings: solid blue = navigation, dashed orange `[10,6]` = state change on the same screen, grey = back / cancel; a white pill with the action name on each arrow; a tinted rounded outline (8% fill, 2px stroke) on the element clicked; targets on another level are solid connectors.
4. **Library sets** (import with `importComponentSetByKeyAsync`): Top Nav Bar `214148172a3102db4d886021f46636c4c06a409c`, Title Bar / Page `352b8ee7d08099fc9ca86b57acaf0f8c66ddee12`, Title Bar / Workflow `5f42dedac45814b81a39bd51a8114ae302fcd9d0`, Grid Primary Toolbar `d3b264181ce98895d7192c3f434f50c40fcd26c9`, Data Table / Header `c02b4fcc7103c7dccf34378ff3d7a623e62327d6`, Data Table / Cell `e9034498a4e881d69878eb249ef95bce12e25f29`, Button `aaf2138f3c34d96f0f5e984ca4107da5e810cd52`, Checkbox `961da2ae4c4004557d1469b1645db5bc2843ac9b`, Radio `eff5daf1bb886aa46cf7ef279e149dbd9528aead`, Input Field `f8fce8f3272b71dcfa4a37827b0bfad60018a3c1`, Textarea `a7b44347be0e10de85c6cf44d2698b3462b37fe3`, Select Menu `334e75323e7bc37bd35a55ce93abf523a80403be`, Status Chip `2946d7443d53d0441cefefe9238b48b946a8f14d`, Status Indicator `b287e4b7e7b87ad92b4e798575361236a74e1380`, Tab Navigation `f20ea14d492f406e2052fadca056b372fa131bf2`, Modal Components `4def56dd505e21f084dd093d89f50892033d5061`, Drop Area `27caab02310db87425a10a343dc9e1c96e6f7f04`, Progress Bar `52b73b7ccfc6d5b9c53f6993a30fa6cfad8447e2`. The side nav is a per-module set (Side Nav Preconstruction `f3ee73389c0c6171750f81976ca0b0d4b8edac65`; find yours with `search_design_system`).
   - **Side nav: never override its items.** Keep the variant's items; select the item the app selects by setting the old item's `State` to Default and the new one's to Selected, then copy the module accent paint onto the selector (the library's Selected state alone is orange, F-068). Grid toolbars match the screen's DataGrid (no paint-roller or upload buttons, Tab Switcher `Count=2`); a SegmentedControl `md` is **Segmented Navigation Compact** (28px), not Segmented Navigation (40px).
   - **Detail and create screens use Title Bar / Workflow `Size=Comfortable`** (64px, back button = Header Tool Icons `Type=Back`, D-25), matching `AppShell header-size="comfortable"`. Cloned frames may still carry the 48px `Size=Default` bar: swap it (`swapComponent`, then re-set `Title`), move everything below down 16px, grow the frame by 16 (F-067).
   - New Button / Input / Select instances show default icons and helper text: set `Show Icon L` / `Show Icon R` / `Show Helper Icon` false. Set `figma.skipInvisibleInstanceChildren = false` before hiding instance layers by index; changing an instance sublayer re-creates its nested nodes, so look them up again after each change (F-053).
   - Textarea `State=Default` draws its label 24px above its own top: wrap it in a frame with `paddingTop = 24`. A cloned text node keeps `layoutAlign=STRETCH`: reset to `INHERIT` before `textAutoResize`. `findOne` / `findAll` search inside instances; find a screen's own frames with `frame.children.find(...)`. Empty auto-layout frames keep 100px height; give them a size. API frames get a white fill; clear `fills`. Bind hairlines to the library border variable, never a hand colour. Component descriptions: write `<` plain, never `&lt;`.
5. **Candidates** are built as components in the **V3.2 library file** (`1HxMANBEaYWFqEFtazB20l`) on the page **`_Candidates`** (unpublished), variables bound, text in Lato, `description` from the proposal doc. On the map a candidate appears as a plain frame named `[candidate] <Name>` with the same bindings; replace it with an instance once published. **Ask before publishing the library.**
6. **Bind everything to the design system (F-055).** Nothing on a screen may rely on a raw value or on inheritance from a component: every text node carries a library text style, every fill / stroke a `mapped` colour variable, every padding / gap a `spacing/space-N` variable, every radius a `border radius/radius-N` variable. Cloning a text node copies its colour binding but **not** its style: `await node.setTextStyleIdAsync(style.id)` (`importStyleByKeyAsync`); mixed-weight text gets a style per range. Map by size and weight: 14/20 → `label/sm/regular` `8c4d80a293fb933d7c4a8d45e0c9ca74f15bfd5e` · bold `7a8253cf21ad1446d1dc10a4fb1ba0cbb51ac19b` · medium `060438e2d6f8168e961dff5c0463bfdbc83ad21b`; 12/16 → `label/xs/regular` `028d00aa1db06a8a0d04cdbfa53f4c3b19243473` · bold `956c97265ec041fe95daf2c3e74785d4ce888a83` · medium `b988b89190617eb5de8c359f032a600e0169bd06`; 16/24 → `label/md/regular` `892c31e88e6b4f9c2e9925a70dd46c25fabd54d7` · bold `22f308ef9701a671b2922f3c5948fbb564889b97`; 20 → `title/lg/bold` `4e3f66f22df046196373f1fb7092ef7f51012d8a`; 28/36 → `heading/md/bold` `08d5175969a844cd3ca6475671ae22112b5bcf51`; 8 → `label/2xs` `e39f40dd1e95e13f7f382aa289c1c208bb80ebfa`. Spacing (`importVariableByKeyAsync`, then `setBoundVariable('paddingTop' | 'itemSpacing' | …, v)`): space-2 `7be4bec5452f2d8ce1b5e98634b752ddcbbd2606`, 4 `46316124fc5b61af7afb82c549f7515603dee7d6`, 8 `e8bcc8b719e879ee07f531cf61cb22ab6ec34c32`, 10 `e9deac146faa50ef961c21d707516d24ae081053`, 12 `69528479245475567ffca81c71d0608f9aca5ef5`, 16 `222c3536e4f45a16ff44644ceaeeda11e9d81241`, 20 `6ec668840f737be2ce702b82bc5d540f0817b308`, 24 `9486e88f1c857647b8de0ead1e8bcac001690ca9`, 32 `286496fe237c3b3100c8b3d097bdd41167617056`, 40 `d844a08f15cc1bc20bd9cff89d89d0aaf751149f`; radius-4 `253c267b063f63ecbda8ea7f479950ae7dccf5f1`, 6 `2caaba435ba332d323acc2f7d6b77e9ecb4ca91b`, 12 `845723177698dae56361b8f737fbaf51f8154e23` (bind all four corners). Skip gaps on `SPACE_BETWEEN` frames and anything inside an instance you did not override. **Audit before reporting:** walk the section, skip nodes inside instances and the map annotation layer, and count text without `textStyleId`, SOLID paints without `boundVariables.color`, paddings / gaps / radii without a binding; all counts must be 0.
7. **Check:** one `get_screenshot` per new frame and one of the whole section; fix overlaps and arrows that miss their target. Record node IDs in the prototype record and set `prototype.figma` in the `.vue`.

Figma shows the library **as last published**; variable fixes pending publish won't appear. Say so in the report.

## 7. Record

1. Finish `docs/prototypes/<slug>.md`: metrics (measured or "not measured"), component map with how each gap was handled, candidate list, verification results, Figma node IDs.
2. `docs/<module>/screens.md`: status column and any decided TBDs. `docs/components/README.md`: stage per candidate. `docs/<module>/00-plan.md`: answers received, decisions made.
3. `docs/findings-log.md` entry for anything that broke, surprised, or worked notably well.
4. Report: URL (`/?p=<slug>`), both Figma links, the component map summary (n existing / n extended / n candidates), what needs a decision, and what Figma won't show until the library is published.

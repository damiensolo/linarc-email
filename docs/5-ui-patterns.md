# UI patterns and visual rules

**Read this before building or changing any screen.** These are decisions the user has made in review on the first module, not defaults to re-derive. Each rule points at its decision (`4-decisions.md`) or finding (F-NNN in `linarc-prototypes/docs/findings-log.md`). If a screen seems to need something that breaks a rule here, stop and ask; don't quietly diverge. Reference screens in this template: `example-list`, `example-detail`; in the first module (`linarc-prototypes`): `prequal-wizard` (create), `prequal-review` (review with a decision), `prequal-portal` (external user).

## 1. Page patterns: which container for which task (D-18, D-34)

| Task | Pattern | Library parts | Reference |
|---|---|---|---|
| **Primary multi-step / long create flow** | **Full-page create screen** | `AppShell` (`header-size="comfortable"`), `HeaderToolIcon type="back"`, centred column (`max-w-4xl`), `bottom-panel` | `prequal-wizard` |
| **Multi-step create** | As above, with **ProgressStepper** at the top of the column; `navigable` so completed steps can be revisited; `labels="active"` under 640px; a six-step stepper needs short labels and a scroll box at 390px (F-070) | `componentsV2/ProgressStepper` (P-025) | `prequal-wizard` |
| **Contextual / in-place create or triage escalation** (e.g. Compose Email from a Drawing/RFI, Promote Email to Record) | **Slide-over panel (`SlideOverPanel` candidate)** or **Compact `ModalV2`** | Keeps the underlying canvas/thread visible for spatial reference. Fixed header, scrollable `p-space-20` body, fixed footer | `correspondence-context-dwg`, `correspondence-thread` |
| **List / dashboard** | Full page, **Title Bar / Page** (title + primary action) | `AppShell` default header | `example-list` |
| **External user, long application** (no account) | Reduced Linarc top nav (Company variant, logomark), **no side rail**, section nav in the left panel, fixed bottom panel for Previous / Save and exit / Next | AppLayout left + bottom panels | `prequal-portal` |
| **Review / detail of one record with a decision** | Full page, **Title Bar / Workflow** header (back · name · ID chip · `Status:` chip); content left; **decision or activity in AppLayout's right panel** (sticky, own scroll); below 1024px the panel moves inline under the summary | TabNavigation (P-028) for sections; `AppShell` `right-panel` | `prequal-review` |
| **Detail of one record without a decision** | Same frame: Title Bar / Workflow header; record on the left; **activity / audit trail in the right panel**; inline at the end below 1024px. Record-level actions in the title bar's right side | `AppShell` `right-panel` | `example-detail` |
| **Supporting detail or contextual inspector** | **`AppShell right-panel`** (persistent split) or **`SlideOverPanel`** (overlay) | Use `right-panel` when persistent alongside a record; use `SlideOverPanel` (`size="md"` / `560px`) when triggered on demand over a canvas or table | `correspondence-thread` |
| **Modal (ModalV2)** | Only for short, single-step tasks: confirmations, a few fields, a choice, and the compact contextual create above (D-34). **Not for primary create flows.** Mount modals inside the shell's `#content` slot (a modal in the default slot never renders) | ModalV2 | `prequal-record` Request renewal |

- Alternatives the user wants to compare are kept as a **second prototype slug**, `<slug>-<variant>` (picker title "… (version B: …)", or `hidden: true` once decided), sharing state and step components with the default so only the pattern differs.
- The default slug is always the chosen pattern; links from other screens (`router.js`) go to the default.

## 2. Layout and white space (D-17, D-18)

- **Form and reading content sit in a centred column** on create screens. Don't leave a left-aligned column with empty space on the right unless a right panel fills it.
- **Column width (D-20):** `max-w-4xl` (**56rem / 896px**) for wide forms: two-column field pairs, tables, checklists or summaries. `max-w-3xl` (48rem / 768px) or narrower for short single-column forms. Two columns from about six fields, 24px gutter, one column below 768px. If a paragraph runs past two lines at 56rem, shorten it rather than narrowing the form.
- **A fixed footer's buttons align to the content column** (Back / Cancel at the column's left edge, primary action at its right edge); the bar itself spans the content area with its top rule.
- **Whitespace separates sections, not lines or boxes.** Section breaks: a heading plus space (`gap-space-24` to `gap-space-40`); no left rules or indent lines to mark a subsection.
- **Page / section title needs room below the title-bar rule:** content starts with `pt-space-16` on top of AppLayout's own padding.
- **Subsections inside a form get their own 16px bold heading**, with ~40px between subsections; the 13px form label is not used for a subsection.
- Responsive from 390 to 1440+: rows that pair text with a chip and an action wrap so the text takes the full width on phones (`w-full sm:w-auto sm:flex-1`).
- **Scroll areas (F-051, P-030):** one scrollbar style everywhere, from the global styles (Figma Scrollbar); never style one locally. **Padding goes inside the scrolling element** so the bar sits at the panel's edge and content ends at least 16px before it: AppLayout does this for `scrollable-content`; a custom scroller (`overflow-y-auto`) gets its own `p-space-20`. No nested vertical scroll areas; horizontal scrolling only inside data grids. A scroll box that contains an `sr-only` label must be `relative`, or the label escapes it and widens the page (F-064).
- **Data tables (DataGrid):** size each column to its widest real content plus the cell padding (measure, don't guess); the name column is `frozen` (pinned left) and the row action is a `type: 'Actions'`, `frozen: true` column (pinned right). Don't repeat in one cell what another column already says.

## 3. Containers, lines, colour, icons (D-17)

- **One container level per view.** Lists are rows divided by 1px `border-border-subtle` hairlines; the list has no outline of its own. Never a card inside a card. Use FormV2 `flat` (P-021) when the form is the page.
- **Colour means "act here".** Only the primary button and states that need action are coloured. Done = a check mark or a muted word; neutral states = muted words. Red only for failed / expired / rejected.
- **One signal per status:** a check *or* a word *or* a chip, never two together.
- **A message's utilities sit top-right; a notice's action sits right (D-57).** In a thread, a message's utilities (Promote to record, Add to Q&A) are text buttons in the header row, parallel to the sender's name, so the body and its files end clean with nothing under them. In a warning or error block the text is on the left and the contextual action on the right, parallel to the description (bottom-right when the width narrows). Nothing floats bottom-left under files or under an alert's text.
- **A card's actions end bottom-right (D-56).** In a list of cards (the Notifications drawer, the full page's card panel) the actions sit in a row at the bottom-right of the card, where the reader finishes: secondary text buttons first, the card's own action last as a text button in the primary colour. A solid primary button is a page's one primary action (the title bar, a modal's confirm, a footer Save), never repeated per card: twenty blue buttons in a list all compete, and none wins.
- **Buttons are label-only.** No `+` on Add / New, no Send icon on Submit, no chevrons on Previous / Next / Continue. An icon only where it carries meaning the label lacks (icon-only buttons, the title bar back button, a file glyph on a file row).
- **Notices:** warning / error = tinted fill + tone icon, no outline (InlineNotice); info / success = plain text block.
- **A warning guides:** it says what is wrong, how to fix it and where; its action names the step *and* the item ("Go to Requirements › Safety › Drug and alcohol program"), lands on that item scrolled to the middle of the view with a short warning tint, and the item carries its own marker and note. Never a link to a step the user then has to scan, never a dead link when the fix is on the same screen ("Acknowledge below" scrolls to the checkbox).
- **A control that opens an editor** (a row's Configure, Add) scrolls the editor into the middle of the view, with a short open / close animation (opacity + translate, ~160ms, off under reduced motion), so its Save and Cancel are never below the fold.

## 4. Components to use (instead of hand-built versions)

| Need | Use | Not |
|---|---|---|
| Multi-value select | **SelectV2 `multiple`** (P-024) = Figma Select Menu `Type=Tags`; FormV2 `multiselect` renders it | a hand-rolled chip select |
| Step progress | **ProgressStepper** (P-025) | custom dots / numbered lists |
| Create or detail header | Title Bar / Workflow pattern through `AppShell` `#header` + `header-size="comfortable"` | Title Bar / Page with a back button added by hand |
| Back button in a title bar | **HeaderToolIcon `type="back"`** (D-25, P-038) | a minimal Button with a chevron (doesn't read as a button) |
| Step navigation bar | AppLayout bottom panel (`AppShell` `bottom-panel`) | buttons at the end of a long scroll |
| Page sections as tabs | **TabNavigation** (P-028) | SegmentedControl (that's for view modes) |
| Switching a list's view or filtering its rows | **SegmentedControl**, with All first and selected by default (F-071) | a select |
| A per-item state beside its heading | **SelectV2** small, or radios | a SegmentedControl, which reads as a filter (F-071) |
| A right panel from `AppShell` | `right-panel` prop (sets enabled **and** visible, F-046) | AppLayout `right-panel-enabled` alone (stays hidden) |
| Upload zone | library DropArea (P-020) | — |
| Top-nav Create menu | **StaticMegaMenu** (Figma Quick Create Menu) in the `#create-dropdown` slot; items with `iconBgColor: 'transparent'`, neutral icons | a hand-built list |
| Top-nav module menu (the module tile) and Bookmarks | **StaticMegaMenu** (Figma Mega Menu) floating under the tile (`target-ref` = TopNavBar `moduleIconEl()`, module `clickToToggle` + `chevronOpen`); data in `nav.js` MEGA_MENU as drawn in Figma (F-002), a tool's row via `TOOLS[].menuItem`; bookmarks in the demo session, listed by **DynamicMegaMenu** in `#bookmarks-dropdown` | the library's Storybook mock (`megaMenuFullAppMock.js`, out of date) |
| Moving between screens | `router.go(screen, id)` / `href()` (in-document, D-24) | `location.assign`, `<a href>` page loads |
| Data that loads (first load, refresh, failure) | **LoadRegion** + **LoadStatus** + `createLoad()` (§6); DataGrid `loading` (P-034) for tables; **Skeleton** for other layouts | a full-screen spinner, an empty state shown while loading, a hand-made pulse |
| A table row's secondary editing (repeat rows, matrices) in a form | FormV2 `repeat` / `matrix` field types (candidate FormTableFields in the first module) | a DataGrid inside a form |

## 5. Open design flags (don't "fix" in code without a decision)

- Figma Number Badge `Status=Disabled` loses its number in Dark mode; code renders it readably (needs-figma).
- Figma Modal has no wide size (ModalV2 `size` md 640 / lg 800 since 2026-10-28, P-059; proposal drawn on `_ ☉ Candidates` › Modal / Size, needs-figma); Title Bar / Workflow has no module-neutral Create variant (needs-figma).
- No content-width token: the form columns use Tailwind `max-w-4xl` / `max-w-3xl` (needs-token: `layout/form-wide`, `layout/form`).
- ProgressStepper active label is bold in code, Regular in Figma (P-025); no narrow mode in Figma (F-070).
- No motion tokens (duration, easing) exist in Figma or `tokens.css`; the loading timings in §6 are CSS custom properties and JS constants until they do (needs-token).
- The top-nav account rail has no settings gear in Figma; code has an opt-in one (P-045) used by the sandbox.

## 6. Navigation, loading and transitions (D-24)

The goal is an interface that answers every action at once and makes waiting calm, without pretending work is done. These rules apply to every screen and module; the parts are reusable (§4).

### Never blank the app

- **Moving between screens never reloads the page.** `router.go()` pushes the URL and swaps only the screen; the top nav and rail stay where they are, Back / Forward work (`popstate`). A full reload blanks everything, white even in Dark mode, until the scripts and CSS load again (F-057).
- **Keep what's valid on screen.** The shell, the title bar, the page heading, filters and table headers don't depend on the data, so they render at once. Only the region whose data is pending changes.
- **Never a full-screen or page-blocking spinner.** Loading is shown inside the region that is loading (a `LoadRegion`), never over the whole page.

### Timing

| When | What shows | Value (configurable) |
|---|---|---|
| Answer in under 200ms | **Nothing.** The result replaces the old view directly; no loader flash | `LOAD_TIMING.indicatorDelayMs` = 200 |
| After 200ms, nothing on screen yet (first load) | **Skeleton** in the final layout (headings, labels and value rows in place); the grid header stays real | same |
| After 200ms, content already on screen (refresh, filter, sort) | **Keep the content**; a small inline indicator ("Updating…") in the page's meta line | same |
| After 5s | Add **"Still loading…"** and a **Cancel** (no stage names, no percentages, no time remaining) | `LOAD_TIMING.slowAfterMs` = 5000 |
| Result arrives | Show it **immediately**. If a skeleton was seen, fade it in once (opacity only) | `--load-reveal-ms` = 160ms |
| Skeleton animation | One soft highlight sweeping left to right, all skeletons in phase | `--skeleton-shimmer-ms` = 1600ms |

- **No artificial waiting.** Never hold a result to finish a shimmer cycle or meet a minimum display time. (A deliberate, labelled wait that simulates real processing, such as a document intake check, is a documented exception; D-28 in the first module.)
- **The 200ms grace period also reserves space.** The skeleton is rendered invisible from the first frame, so when it appears nothing moves, and when content replaces it nothing jumps.
- **Navigation itself is not a request.** A screen swap takes well under 100ms, so it shows no loader; the new screen and its selected rail item are the acknowledgement.

### Acknowledge, and never double-submit

- The control the user touched changes **at once**: the segmented filter selects, the rail item highlights, a submit button is disabled (`is-disabled` while `load.status === 'loading'`) before the request starts, so a second click does nothing.
- **Latest request wins.** A new request supersedes the running one; the old answer is ignored when it arrives, never applied (`createLoad` does this). An indicator already showing stays on across superseding requests.

### Honest states, always ending

- Unknown progress = **indeterminate** indicator (StatusIndicator `type="spinner"`). Use a percentage only when the backend reports real progress.
- Don't show results that aren't results: no "0 records" or empty state while loading, no "Saved" before the server confirms.
- Every load ends in **ready, error or cancelled**; timers are cleared and pending answers dropped when the screen is left (`load.destroy()` in `beforeDestroy`).
- **Failure with nothing on screen:** an error notice in the region ("Couldn't load the submittals.") with **Retry**; the table frame stays. **Failure on refresh:** keep the content, and show "Couldn't update." with Retry in the meta line. **Cancel:** with content, back to it; without content, "Loading stopped." with Retry.

### Accessibility

- The loading region has `aria-busy="true"` while its request runs.
- One polite live region per loading region announces **meaningful changes only**: "Loading submittals…" (only once the indicator shows), "Still loading…", "Submittals loaded" (only if the start was announced). Never per animation cycle. Errors use `role="alert"`.
- Skeletons are `aria-hidden`.
- **`prefers-reduced-motion: reduce`:** skeletons are static (no shimmer), content appears without the fade.

### Tokens and Figma

- Placeholder fill **`surface/skeleton`**, shimmer band **`surface/skeleton-highlight`**; Tailwind `bg-surface-skeleton`. Never `surface/neutral` for a placeholder: in Dark it equals the table row (P-035).
- Figma: **Skeleton**, **Load Status** and **Load Region** are candidate components on the design system's `_Candidates` page; tables use Data Table / Sheet Cell `Type=Skeleton Loader`. Draw screens' loading states from these instances.
- Submit buttons: Figma's Button has `Type=Spinner-*` busy types; code has no busy state yet (P-036), so code disables the button while sending.

### How to build it

```js
// data():
load: createLoad({ label: 'submittals' }),   // ~/candidates/LoadRegion/createLoad.js
// created(): this.fetch();   beforeDestroy(): this.load.destroy();
fetch() {
  this.load.run(
    (signal) => mockRequest(() => rows, { signal }),   // the real app: api.getList({ filter }, { signal })
    (result) => { this.rows = result; },               // applied before the state turns ready
  );
},
```

```vue
<LoadStatus :load="load" @retry="fetch">{{ summary }}</LoadStatus>     <!-- in the page's meta line -->
<LoadRegion v-slot="{ skeleton }" :load="load" content-loads @retry="fetch">
  <DataGrid :data="rows" :loading="skeleton" … />                      <!-- tables: DataGrid's own skeleton rows -->
</LoadRegion>
<!-- Other layouts: <LoadRegion :load="load"> <template #default>content</template> <template #skeleton> <Skeleton … /> rows </template> -->
<!-- A second region of the same load (right panel, nav): <LoadRegion secondary :load="load"> -->
```

```js
// A write: same controller, action wording; the button disables while load.status === 'loading'
save: createLoad({ label: 'changes', action: { busy: 'Saving', done: 'Saved', error: "Couldn't save." } }),
```

- Put LoadRegion content in `<template #default>`: plain slot children are evaluated by the page at once and throw while the data is still null.
- **Reviewing loading states:** prototype data is static and answers instantly. **Loading speed** in the sandbox bar's overflow menu (···) (or `?latency=fast|medium|slow|fail|fail-once`) delays or fails the mock request (`src/modules/mock/request.js`). Reference: `example-list`.

## 7. Data entry: alignment and width (D-26)

| Where | Rule |
|---|---|
| **Form inputs** (text, number, currency, year, phone, date) | **Left-aligned**, always. Width fits the expected value: short values (year, count, rate, percent) use a short input (FormV2 `props: { width: 'short' }`, 124px) under the label; names, addresses and money keep the column width. Money is formatted (`$1,000,000`), still left-aligned |
| **Table-style entry** (matrices) | The table **hugs its content**, never stretched to the form width. Inputs 124px, left-aligned, headers left over them. Too wide for the screen: the table scrolls inside its own box |
| **Read-only numbers in a table** | **Right-aligned**, `tabular-nums`, header right over them: values are compared down a column |
| **Editing in a data-grid cell** | Right-aligned, matching the read-only column |

- Don't right-align to "line up" inputs of different widths in a form; line them up on the left edge with the labels.
- Check: at 1440 / 1024 / 390, every value sits under or next to its own label; no table input wider than its value needs; no horizontal page overflow.

## 8. Filtering lists (D-30)

| Where | Rule |
|---|---|
| **Filters on a table** | In the grid's **Filter panel** (toolbar Filter button; the button shows the number of active conditions). No selects or chips above the table for the same thing. Columns that should filter by value get `customProps: { treatAsSelectFilter: true, options }`; a value that isn't a column is a hidden filter-only column (`invisible: true`) |
| **Quick filters** | The 3–6 filters people use most, as one-click chips at the top of the panel (`quick-filters`). Each adds an ordinary condition the user can edit or remove |
| **Several values** | "is any of" (one condition), not several OR groups |
| **Filtered state** | The Filter button's count badge; clearing happens in the panel. No count line or "Clear filters" link above the table |
| **Segmented views** | Stay above the grid when they are the screen's main navigation, and are **cross-linked** with the panel: a view other than All is one condition, the views are also quick filters, the panel moves the segment, a filter that isn't one view selects no segment (reference: `prequal-queue`) |
| **Multi-select fields** | SelectV2 `multiple`: one line, up to 2 tags then "+N" (`maxVisibleTags: 0` → "3 selected" text in narrow fields), one clear ×, no typing (P-041) |

- The panel is 800px with the value column twice the others, so date ranges and multi-values fit (P-044).
- Check: open the panel, use each quick filter, pick several values, a date range, clear; the badge and (where there is one) the segment agree at every step, in both themes.

## 9. AI-generated content

AI output is tagged with the AI StatusChip, and the tag carries the library **Tooltip** (hover and keyboard focus: wrap the chip in a focusable span) with this text: "This content was generated using AI and may contain errors or omissions. Verify important information before relying on it." Keep the line under the content that says what the record is (the evidence, not the summary).

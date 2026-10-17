# Verification

Each check below has caught a real bug that the previous check missed. Run them in order; a prototype isn't done until all of them pass.

| # | Check | How | Catches | Found |
|---|---|---|---|---|
| 1 | Conventions and build pass | `yarn verify` (= `yarn check` + `yarn build`) | Hex / palette / raw values, bad `border-*` classes, `<script setup>`, reload navigation; import errors, compile errors, missing files | F-043, F-057 |
| 2 | Renders in dev with no console errors or failed requests | `yarn dev`, then `yarn shot <slug>[#hash] <out> 5173 <widths> <frame height>` (exits 1 on errors; logs failing URLs; hides sandbox chrome; `#hash` captures a sub-route such as a portal section) | Dev-only crashes the build hides, SCSS/import failures | F-003, F-015, F-019 |
| 3 | Both themes | `yarn shot` captures light and dark | Hard-coded colours, tokens missing in one mode | F-004 |
| 4 | Exact viewports | `yarn shot` at 1440, 1024 and 390 (exact, full page, overflow warning) | Broken reflow, horizontal overflow, clipped controls | F-010 |
| 5 | Visual match | Compare the screenshot at the Figma frame width with `get_screenshot` | Layout, spacing and hierarchy differences | — |
| 6 | Computed values match variables | Read `getComputedStyle` for 2–3 key elements and compare with `get_variable_defs` | Wrong token class, wrong size, sub-pixel drift you can't see | F-012 |
| 7 | One Vue instance | Bundle contains one `2.7.16` runtime string (check after adding plugin-heavy components) | Duplicate Vue breaking plugins | F-002 |

## Running the computed-value check (6)

**Preferred (no prototype edits):** a one-off puppeteer-core script in the scratchpad that opens `/?p=<slug>&chrome=0` at the Figma frame size and returns `getBoundingClientRect()` plus `getComputedStyle()` for chosen selectors. Run it with `NODE_PATH=<repo>/node_modules node measure.cjs`. First used on the first module's registry list (18 values).

**Alternative:**

1. Temporarily add to the prototype:
   ```js
   mounted() {
     setTimeout(() => {
       const el = this.$el.querySelector('<selector>');
       const cs = getComputedStyle(el);
       const r = el.getBoundingClientRect();
       document.body.setAttribute('data-m', [r.width + 'x' + r.height, cs.backgroundColor, cs.borderRadius].join(' | '));
     }, 800);
   },
   ```
2. Read it with `msedge --headless=new --virtual-time-budget=20000 --dump-dom "<url>" | grep -o 'data-m="[^"]*"'`.
3. Compare against `get_variable_defs` for the matching Figma node (for example `--space-32` = 32 → 32×32; `--surface-primary-default` #2563eb → `rgb(37, 99, 235)`).
4. Remove the code.

## Verify the verifier

**The right server (template F-001).** Ports 5173–5175 are often held by other sessions' dev servers. `yarn shot` on a port another app answers on captures *that* app's fallback screen (an unknown `?p=` slug opens the first prototype in the picker), with no error. Start this app's server with `--strictPort` on a free port (`npx vite --port 5180 --strictPort`), pass that port to `yarn shot`, and look at the capture before trusting an exit 0.

When a result looks wrong, check the tool before the UI. F-010: headless Edge quietly ignored the requested window width.

## Scrollbars (added 2026-10-09, F-051)
Headless Chrome hides scrollbars unless told not to; `yarn shot` now keeps them. When reviewing captures, check every scroll area at a height that makes it scroll (e.g. `yarn shot <slug> <out> 5173 1440 900`): thin rounded thumb, no arrow buttons, and content ending ≥ 16px before the bar. To measure: `el.offsetWidth - el.clientWidth` is the bar width; the gap is the scrollport's inner right edge minus the rightmost child's right edge.

**Unwanted scroll axes (F-052).** A strip that should only scroll sideways (tabs, toolbars) must have `scrollHeight === clientHeight`. `overflow-y: hidden` hides the overflow but doesn't fix it; Windows Edge still showed a bar. Find the overlap (negative margins, borders drawn twice) and remove it.

**Pixel-snapped centring (F-052).** Badges, icons and digits centred with `absolute` + `translate(-50%)` drift off-centre on half-pixel rows: the translated box isn't snapped, but its text is. Use flex centring, then check that the child's centre equals the parent's centre at 1×, 1.25× and 1.5× (`deviceScaleFactor`).

## Loading states (added 2026-10-10, F-058)

For any screen that loads data through `createLoad` (`docs/5-ui-patterns.md` §6), run each `?latency=` scenario (`instant`, `fast`, `medium`, `slow`, `fail`, `fail-once` + Retry) plus a refresh (change a filter) and two superseding changes 300ms apart. Sample every 50ms with a puppeteer-core script: the region's `aria-busy`, skeleton count, real row count, the meta-line text and the live-region text. Pass when: `instant` and `fast` show no skeleton and announce nothing; skeletons appear only after ~200ms; the header's `y` never changes while loading; a refresh keeps the rows; "Still loading…" appears at ~5s; the final rows match the last request; every run ends with `aria-busy="false"`. Check the skeleton's `animation-name` is `none` under `emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`, and look at each state in both themes.

**Navigation:** a link between screens must not reload. Set `window.__same = 1`, click, and check it survives; a CDP screencast (`Page.startScreencast`) of the click should have no frame where the top nav is blank.

## Open-and-pick check for popovers (added 2026-10-11, F-065)

`yarn shot` never opens a popover, so a date picker, select or menu can look right and still fail. For each one a screen adds: open it in a script, check the panel has a real size and content (a date grid of 42 cells, the option list), pick a value, and read it back from the field, in both themes, with console errors collected after the open.

## Half-pixel check (added 2026-10-11, F-060)

When a fixed-size item (badge, icon button) is centred in a box that has a CSS border, measure its `getBoundingClientRect().top` relative to the box at `deviceScaleFactor` 1 and 1.25, in every state. A fractional top (15.5) means a blurred edge and a digit or glyph that snaps apart from its container. Figma strokes take no layout space, so draw such lines as inset box-shadows or outlines, not borders. 2x screenshots hide this.

## State-change check (added 2026-10-07, F-029)

Interactive components must not change size or position between states. For each button, tab, chip or input on the page, measure the bounding box at rest, with keyboard focus (Tab, so `:focus-visible` applies) and while pressed (`mouse.down()` without `mouse.up()`). Width, height, x and y must match in all three. Also read `getComputedStyle(el).outlineWidth` / `outlineOffset` to confirm the state stroke is drawn. Pattern: P-015 / F-029 (a puppeteer-core script in the scratchpad, as in the computed-value check).

## If the browser won't launch

`Failed to launch the browser process: Code: 0` with an empty stderr means the browser itself exited at once, not that puppeteer is misconfigured. Seen with Edge while an update was pending (two version folders under `Program Files (x86)/Microsoft/Edge/Application`; F-035). Either restart Edge once to let it finish updating, or point the script at another Chromium: `EDGE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" yarn shot <slug> …`.

**New files and responsive classes (F-045).** If a responsive class (`sm:…`, `md:…`) used only by a file created after `yarn dev` started has no effect in screenshots but works in `yarn build`, the dev server's Tailwind output is stale. `touch src/style.css`, wait for `/src/style.css` to answer (about a minute), then re-shoot.

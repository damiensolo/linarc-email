// Screenshot check for the Views pane's collapsible sections (D-81, 2026-11-19): the caret is hidden until the section
// is hovered or its heading focused, a click closes the section (its rows hide, the heading keeps a summary of the
// value), the closed state survives a reload (per browser), and a second click opens it again. Writes light and dark
// crops of the pane. Needs the dev server. Run from the repo root:
//   node scripts/shot-views-pane.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(pathToFileURL(process.cwd() + '/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default;
const [port = '5177', out = '.'] = process.argv.slice(2);
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
const errors = [];
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed = true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  await page.setViewport({ width: 1440, height: 900 });
  const base = `http://localhost:${port}`;
  const SEC = (id) => `.vp-root section[data-section="${id}"]`;
  const state = (id) => page.evaluate((sel) => {
    const s = document.querySelector(sel);
    if (!s) return null;
    const caret = s.querySelector('.vp-caret');
    const body = s.querySelector('[id^="vp-body-"]');
    return {
      caret: getComputedStyle(caret).opacity,
      collapsed: s.hasAttribute('data-collapsed'),
      expanded: s.querySelector('.vp-toggle').getAttribute('aria-expanded'),
      bodyShown: !!(body && body.offsetParent),
      heading: s.querySelector('h3').textContent.replace(/\s+/g, ' ').trim(),
      labelX: Math.round(s.querySelector('.vp-toggle > span:nth-child(2)').getBoundingClientRect().left),
    };
  }, SEC(id));
  const away = async () => { await page.mouse.move(1200, 850); await sleep(250); };

  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => localStorage.removeItem('linarc-prototypes:views-pane:collapsed'));
  await page.reload({ waitUntil: 'networkidle0' });
  await away();
  const sections = await page.evaluate(() => [...document.querySelectorAll('.vp-root section[data-section]')].map((s) => s.getAttribute('data-section')));
  check(sections.length === 5, `five sections in the pane (${sections.join(', ')})`);
  const views = sections[0];
  const rest = await state(views);
  check(rest.caret === '0' && rest.expanded === 'true' && rest.bodyShown, `at rest the caret is hidden and the section open (opacity ${rest.caret})`);

  await page.hover(`${SEC(views)} .vp-toggle > span:nth-child(2)`);
  await sleep(500);
  const hovered = await state(views);
  check(hovered.caret === '1' && hovered.labelX === rest.labelX, `hover shows the caret without moving the label (opacity ${hovered.caret}, label x ${rest.labelX} → ${hovered.labelX})`);
  await page.screenshot({ path: `${out}/views-pane-hover.png`, clip: { x: 80, y: 120, width: 360, height: 520 }, captureBeyondViewport: false });

  await page.click(`${SEC(views)} .vp-toggle`);
  await sleep(250);
  await away();
  const closed = await state(views);
  check(closed.collapsed && closed.expanded === 'false' && !closed.bodyShown, 'a click closes the section: rows hidden, aria-expanded false');
  check(closed.caret === '1' && /Views ?· All 12/.test(closed.heading), `the closed heading keeps the caret and the value (${closed.heading})`);
  // the next section's heading did not move sideways
  const next = await state(sections[1]);
  check(next.labelX === rest.labelX, `the other headings stay aligned (${next.labelX})`);

  await page.reload({ waitUntil: 'networkidle0' });
  await away();
  const after = await state(views);
  check(after.collapsed && !after.bodyShown, 'the closed section stays closed after a reload (remembered per browser)');
  await page.screenshot({ path: `${out}/views-pane-collapsed.png`, clip: { x: 80, y: 120, width: 360, height: 520 }, captureBeyondViewport: false });

  // keyboard: Tab to the heading shows the caret; Enter opens it
  await page.focus(`${SEC(views)} .vp-toggle`);
  await sleep(150);
  await page.keyboard.press('Tab');
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  await sleep(150);
  const focused = await state(views);
  check(focused.caret === '1', `keyboard focus on the heading shows the caret (opacity ${focused.caret})`);
  await page.keyboard.press('Enter');
  await sleep(250);
  const reopened = await state(views);
  check(!reopened.collapsed && reopened.expanded === 'true' && reopened.bodyShown, 'Enter opens it again');
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('linarc-prototypes:views-pane:collapsed') || '[]').length === 0), 'nothing closed is remembered once opened');

  // dark crop with two sections closed
  await page.click(`${SEC(sections[1])} .vp-toggle`);
  await page.click(`${SEC(sections[2])} .vp-toggle`);
  await page.goto(`${base}/?p=correspondence-list&theme=dark&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await away();
  const dark = await state(sections[1]);
  check(dark.collapsed && !dark.bodyShown, 'two sections stay closed in the dark theme');
  await page.screenshot({ path: `${out}/views-pane-collapsed-dark.png`, clip: { x: 80, y: 120, width: 360, height: 520 }, captureBeyondViewport: false });
  await page.evaluate(() => localStorage.removeItem('linarc-prototypes:views-pane:collapsed'));
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'SHOT FAILED' : 'SHOT OK');
process.exit(failed ? 1 : 0);

// Interaction check for the Email screen's Reading view (D-65): the toolbar's third view, the Views pane cross-linked
// with the grid's Filter panel, the list in the grid's display order, the reading pane, the divider, the hash, and the
// hidden filter columns staying hidden after a trip through the view (library P-068). Needs the dev server:
//   node scripts/interact-correspondence-reading.mjs <port> <out-dir>
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
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text()}`); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light&chrome=0#reading=THR-1042`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(400);

  const summary = async () => page.evaluate(() => { const el = document.querySelector('.load-status'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const listRows = async () => page.evaluate(() => [...document.querySelectorAll('.tl-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  const paneSubject = async () => page.evaluate(() => { const h = document.querySelector('[aria-label="Reading pane"] h2'); return h ? h.textContent.trim() : ''; });
  const viewsPane = async () => page.evaluate(() => [...document.querySelectorAll('.vp-root [role="listbox"] [role="option"]')].map((o) => `${o.textContent.replace(/\s+/g, ' ').trim()}${o.getAttribute('aria-selected') === 'true' ? '*' : ''}`));
  const filterBadge = async () => page.evaluate(() => { const b = document.querySelector('button[title="Filter"]'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const clickPane = async (text) => { await page.evaluate((t) => { const b = [...document.querySelectorAll('.vp-root button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(t)); if (!b) throw new Error(`no pane row ${t}`); b.click(); }, text); await sleep(350); };
  const modeButton = async (title) => page.evaluate((t) => { const b = document.querySelector(`button[title="${t}"]`); if (!b) return null; return { active: b.className.includes('surface-container') }; }, title);

  // Arrival through the hash: Reading view active, THR-1042 open, the pane lists the views with counts
  check((await modeButton('Reading pane')) && (await modeButton('Reading pane')).active, 'Reading pane is the active view');
  check((await summary()) === '', `no meta line in the Reading view (${await summary()})`);
  check((await listRows()).length === 12, `list has 12 rows (${(await listRows()).length})`);
  check((await paneSubject()).includes('Grid B-4 HVAC duct'), `pane shows THR-1042: ${await paneSubject()}`);
  const views = await viewsPane();
  check(views[0] === 'All12*' && views.includes('Needs action4') && views.includes('Overdue1') && views.includes('Unmatched1'), `views pane: ${views.join(' | ')}`);
  check(await page.evaluate(() => !document.querySelector('[aria-label="Email view"]')), 'segments hidden in the Reading view');
  const paneTop = await page.evaluate(() => { const tb = document.querySelector('.rv-root'); const tool = document.querySelector('button[title="Reading pane"]'); return tb && tool ? Math.round(tb.getBoundingClientRect().top - tool.getBoundingClientRect().bottom) : -1; });
  check(paneTop >= 0 && paneTop <= 24, `panes start right under the toolbar (${paneTop}px gap)`);
  await page.screenshot({ path: `${out}/reading-1442.png` });

  // Pane → grid: a view is one condition; the Filter badge counts it; the list follows the grid's display
  await clickPane('Needs action');
  check((await listRows()).length === 4, `Needs action → ${(await listRows()).length} rows`);
  check((await filterBadge()).includes('1'), `Filter badge shows 1 (${await filterBadge()})`);
  await clickPane('Overdue');
  check((await listRows()).length === 1 && (await listRows())[0].includes('Overdue'), `Overdue → 1 row with the Overdue signal`);
  await clickPane('All');
  check((await listRows()).length === 12 && (await filterBadge()) === '', `All → 12 rows, badge '${await filterBadge()}'`);

  // Object type checkbox → "is any of" on the hidden column; the record select narrows to that kind
  await page.evaluate(() => { const l = [...document.querySelectorAll('.vp-root label')].find((x) => x.textContent.trim() === 'RFI'); l.click(); });
  await sleep(350);
  check((await listRows()).length === 3, `RFI checked → ${(await listRows()).length} rows`);
  // SelectV2 shows its value in an input, so textContent never has it
  const selects = await page.evaluate(() => [...document.querySelectorAll('.vp-root input:not([type="checkbox"])')].map((i) => i.value));
  check(selects[0] === 'Any RFI with email (2)', `record select narrows to the checked kind: ${selects.join(' | ')}`);
  await page.screenshot({ path: `${out}/reading-filtered.png` });

  // A list row selects the thread and writes the hash
  await page.evaluate(() => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes('anchor bolt embedment')); r.click(); });
  await sleep(400);
  check((await paneSubject()).includes('anchor bolt embedment'), `row click opens THR-1028 in the pane: ${await paneSubject()}`);
  check((await page.evaluate(() => location.hash)) === '#reading=THR-1028', `hash follows the selection: ${await page.evaluate(() => location.hash)}`);

  // The divider: drag 120px left widens the pane; ArrowLeft adds 16
  const sep = await page.$('[role="separator"]');
  const box = await sep.boundingBox();
  const before = Number(await page.evaluate((el) => el.getAttribute('aria-valuenow'), sep));
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + 200, { steps: 6 });
  await page.mouse.up();
  await sleep(200);
  const after = Number(await page.evaluate((el) => el.getAttribute('aria-valuenow'), sep));
  const max = Number(await page.evaluate((el) => el.getAttribute('aria-valuemax'), sep));
  check(after === Math.min(before + 120, max), `drag widens the pane ${before} → ${after} (max ${max})`);
  await sep.focus();
  await page.keyboard.press('ArrowRight');
  await sleep(100);
  const afterKey = Number(await page.evaluate((el) => el.getAttribute('aria-valuenow'), sep));
  check(afterKey === after - 16, `ArrowRight narrows by 16 (${afterKey})`);
  await page.screenshot({ path: `${out}/reading-resized.png` });

  // Back to the list view: segments return, the filter stays, and the hidden filter columns stay hidden (P-068)
  await page.click('button[title="List"]');
  await sleep(400);
  check(await page.evaluate(() => !!document.querySelector('[aria-label="Email view"]')), 'segments back in the List view');
  const headers = await page.evaluate(() => [...document.querySelectorAll('.dg-list-header-cell')].map((h) => h.textContent.trim()).filter(Boolean));
  check(!headers.some((h) => ['OBJECT TYPE', 'RECORD', 'COMPANY', 'LAST ACTIVITY WITHIN', 'VIEW'].includes(h.toUpperCase())), `hidden filter columns stay hidden (${headers.join(', ')})`);
  check((await summary()) === '3 of 12 threads', `the RFI filter is still applied in the list: ${await summary()}`);
  check((await page.evaluate(() => location.hash)) === '#list', `hash says #list in the table view (${await page.evaluate(() => location.hash)})`);
  await page.screenshot({ path: `${out}/reading-back-to-list.png` });

  // A fresh tab with no hash lands in the Reading pane (the default since 2026-11-04)
  const fresh = await browser.createBrowserContext();
  const p2 = await fresh.newPage();
  await p2.setViewport({ width: 1440, height: 900 });
  await p2.goto(`http://localhost:${port}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await sleep(400);
  check(await p2.evaluate(() => !!document.querySelector('.rv-root') && !document.querySelector('[aria-label="Email view"]') && location.hash === ''), 'a plain load opens the Reading pane with nothing selected and no hash');
  await p2.screenshot({ path: `${out}/reading-default.png` });
  await fresh.close();

  // Narrow: the list alone
  await page.click('button[title="Reading pane"]');
  await sleep(300);
  await page.setViewport({ width: 390, height: 844 });
  await sleep(400);
  check(await page.evaluate(() => !document.querySelector('[role="separator"]') && !document.querySelector('.vp-root') && document.querySelectorAll('.tl-row').length === 3), 'at 390 the view is the list alone');
  await page.screenshot({ path: `${out}/reading-390.png`, fullPage: true });
} finally {
  await browser.close();
}
if (errors.length) { console.log('console errors:'); errors.forEach((e) => console.log('  ' + e)); failed = true; }
process.exit(failed ? 1 : 0);

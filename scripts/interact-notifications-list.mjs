// Interaction check for notifications-list (docs/notifications/00-plan.md §8 step 3): scope and view segments, the summary,
// the Team scope's Person column, bulk Acknowledge, the row's card panel, the guest's reduced page, Reset. Needs the
// dev server. Run from the repo root:  node scripts/interact-notifications-list.mjs <port> <out-dir>
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
  await page.goto(`http://localhost:${port}/?p=notifications-list&theme=light`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const clickText = async (text, tags = 'button, [role="option"], li, span, div, label') => {
    const done = await page.evaluate((text, tags) => {
      const els = [...document.querySelectorAll(tags)].filter((e) => e.offsetParent !== null && e.textContent.trim() === text);
      const el = els[els.length - 1];
      if (!el) return false;
      el.click();
      return true;
    }, text, tags);
    if (!done) throw new Error(`no visible element with text "${text}"`);
    await sleep(400);
  };
  const body = async () => page.evaluate(() => document.body.innerText);
  const has = async (s) => (await body()).includes(s);
  const summary = async () => page.evaluate(() => { const el = [...document.querySelectorAll('span, div, p')].find((e) => /notifications?$/.test(e.textContent.trim()) && e.children.length === 0); return el ? el.textContent.trim() : ''; });
  /** Click a segment by its label inside the named SegmentedControl ("View" or "Scope"); rows may carry the same words. */
  const clickSegment = async (group, label) => {
    const done = await page.evaluate((group, label) => {
      const root = document.querySelector(`[aria-label="${group}"]`);
      const el = root && [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === label);
      if (!el) return false;
      el.click();
      return true;
    }, group, label);
    if (!done) throw new Error(`no segment "${label}" in "${group}"`);
    await sleep(600);
  };
  const setRole = async (label) => {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText(label);
    await sleep(900);
  };

  // 1. Sarah: Needs action by default, the summary explains the filter, no tool highlighted, no rail.
  check((await summary()) === '3 of 4 notifications', `PM default view (Needs action, My responsibilities): ${await summary()}`);
  check(await has('NOTIFICATION') && await has('SEVERITY') && await has('WHY YOU'), 'columns present');
  check(!(await page.evaluate(() => !!document.querySelector('nav[aria-label="Communication"]'))), 'no rail on the page');
  await page.screenshot({ path: `${out}/list-pm-needs-action.png` });
  await clickSegment('View', 'Waiting');
  check((await summary()) === '1 of 4 notifications' && await has('Response from Valerie Chen'), `Waiting view: ${await summary()}`);
  await clickSegment('View', 'All');
  check((await summary()) === '4 notifications', `All view: ${await summary()}`);

  // 2. Team scope: Alex's and Carlos's obligations with a Person column.
  await clickSegment('Scope', 'My team');
  check(await has('PERSON') && await has('Alex Morgan') && (await summary()).startsWith('4 notifications'), `Team scope: ${await summary()}`);
  await page.screenshot({ path: `${out}/list-pm-team.png` });
  await clickSegment('Scope', 'My responsibilities');
  check((await summary()) === '4 notifications', `back to My responsibilities: ${await summary()}`);
  await clickSegment('Scope', 'Watching');
  check((await summary()) === '5 notifications' && await has('Project oversight'), `Watching scope (incl. oversight and Updates): ${await summary()}`);
  await clickSegment('Scope', 'My responsibilities');

  // 3. Bulk Acknowledge: select all acknowledgeable rows, the header action appears, rows are acknowledged.
  await clickSegment('View', 'Needs action');
  check((await summary()) === '3 of 4 notifications', `Needs action applied before selecting: ${await summary()}`);
  // Each row's sequence cell toggles its checkbox (rows the viewer may not acknowledge have none, so nothing toggles).
  const selectAll = await page.evaluate(() => { const cells = [...document.querySelectorAll('.dg-list-row .dg-list-cell--seq')]; cells.forEach((c) => c.click()); return cells.length; });
  await sleep(500);
  const bulkLabel = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && /^Acknowledge \d+$/.test(x.textContent.trim())); return b ? b.textContent.trim() : ''; });
  check(selectAll === 3 && bulkLabel === 'Acknowledge 3', `selected ${selectAll} rows → bulk action "${bulkLabel}"`);
  await page.screenshot({ path: `${out}/list-pm-selected.png` });
  await clickText(bulkLabel, 'button');
  await sleep(700);
  check(!(await page.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.offsetParent && /^Acknowledge \d+$/.test(x.textContent.trim())))), 'bulk action gone after acknowledging');

  // 4. A row opens its card in the panel, acknowledged; the bell is unchanged by acknowledging.
  await page.evaluate(() => { const cell = [...document.querySelectorAll('span.dg-cell-text')].filter((e) => e.textContent.trim().startsWith('Review RFI-139')).pop(); cell.click(); });
  await sleep(700);
  check(await page.evaluate(() => !!document.querySelector('[role="dialog"]')) && await has('Acknowledged 10:30'), 'row opened its card, acknowledged');
  await page.screenshot({ path: `${out}/list-pm-detail.png` });
  await page.keyboard.press('Escape');
  await sleep(400);
  check((await page.evaluate(() => (document.querySelector('[aria-label^="Notifications:"]') || {}).getAttribute?.('aria-label') || '')).startsWith('Notifications: 3 need action'), 'acknowledging left the bell count as it was');

  // 5. The guest: no scope switch, one Waiting item.
  await setRole('Subcontractor (guest)');
  check(!(await has('My team')), 'guest has no scope switch');
  await clickSegment('View', 'Waiting');
  check((await summary()) === '1 of 1 notification' || (await summary()) === '1 notification', `guest Waiting: ${await summary()}`);
  await page.screenshot({ path: `${out}/list-guest.png` });

  // 6. Reset.
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(600);
  check((await summary()) === '3 of 4 notifications', `after reset: ${await summary()}`);
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

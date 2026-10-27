// Interaction check for correspondence-rfi-list: the views and their counts, a row opens the RFI with Email, the
// detail's back button returns to the log, the rail's All RFIs lands on the log, the guest's reduced log, Reset.
// Needs the dev server. Run from the repo root:  node scripts/interact-correspondence-rfi-list.mjs <port> <out-dir>
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
  await page.goto(`http://localhost:${port}/?p=correspondence-rfi-list&theme=light`, { waitUntil: 'networkidle0' });
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
  const clickSegment = async (label) => {
    const done = await page.evaluate((label) => { const root = document.querySelector('[aria-label="RFI view"]'); const el = root && [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === label); if (!el) return false; el.click(); return true; }, label);
    if (!done) throw new Error(`no segment ${label}`);
    await sleep(600);
  };
  const body = async () => page.evaluate(() => document.body.innerText);
  const has = async (s) => (await body()).includes(s);
  const summary = async () => page.evaluate(() => { const el = [...document.querySelectorAll('span, div, p')].find((e) => /RFIs?$/.test(e.textContent.trim()) && e.children.length === 0 && /^\d/.test(e.textContent.trim())); return el ? el.textContent.trim() : ''; });
  const slug = () => page.evaluate(() => new URLSearchParams(window.location.search).get('p') + window.location.hash);
  const setRole = async (label) => {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText(label);
    await sleep(900);
  };

  // 1. The log as the PM: three RFIs, columns, statuses as one signal each.
  check((await summary()) === '3 RFIs', `PM log: ${await summary()}`);
  check(await has('BALL IN COURT') && await has('STEP') && await has('RFI-139') && await has('RFI-142') && await has('RFI-143'), 'columns and the three RFIs');
  check(await has('Answered') && await has('Kenji Takahashi, AIA · Studio West Architecture'), 'RFI-139 Answered, RFI-142 with Kenji');
  await page.screenshot({ path: `${out}/rfi-list-pm.png` });
  await clickSegment('Open');
  check((await summary()) === '2 of 3 RFIs', `Open view: ${await summary()}`);
  await clickSegment('Answered');
  check((await summary()) === '1 of 3 RFIs' && await has('RFI-139'), `Answered view: ${await summary()}`);
  await clickSegment('Overdue');
  check((await summary()) === '0 of 3 RFIs', `Overdue view: ${await summary()}`);
  await clickSegment('All');

  // 2. A row's Open lands on the RFI with Email; the detail's back returns to the log.
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent && x.textContent.trim() === 'Open')[1]; b.click(); });
  await sleep(900);
  check((await slug()).startsWith('correspondence-context-rfi#RFI-'), `row Open → ${await slug()}`);
  check(await has('Details') && await has('Email'), 'the RFI detail with its tabs');
  await page.evaluate(() => { const b = document.querySelector('button[aria-label="Back"], [aria-label="Back"]'); b.click(); });
  await sleep(900);
  check((await slug()) === 'correspondence-rfi-list', `back → ${await slug()}`);

  // 3. The rail: from the Email screen, RFIs › All RFIs lands on the log.
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.evaluate(() => { const t = [...document.querySelectorAll('header *')].find((e) => e.offsetParent && e.children.length === 0 && e.textContent.trim() === 'RFIs'); t.click(); });
  await sleep(900);
  check((await slug()) === 'correspondence-rfi-list', `rail RFIs → ${await slug()}`);

  // 4. The guest sees only the RFIs they are on.
  await setRole('Subcontractor (guest)');
  check((await summary()) === '1 RFI' && await has('RFI-143') && !(await has('RFI-142')), `guest log: ${await summary()}`);
  await page.screenshot({ path: `${out}/rfi-list-guest.png` });

  // 5. Reset.
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(600);
  check((await summary()) === '3 RFIs', `after reset: ${await summary()}`);
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

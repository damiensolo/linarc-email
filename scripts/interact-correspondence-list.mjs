// Interaction check for correspondence-list (spec-to-prototype §5): segments ↔ grid filter, Link to record end to end,
// the sandbox role switcher and Reset demo data. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-list.mjs <port> <out-dir>
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
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
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
    await sleep(350);
  };
  const summary = async () => page.evaluate(() => { const el = [...document.querySelectorAll('span, div, p')].find((e) => /threads?$/.test(e.textContent.trim()) && e.children.length === 0); return el ? el.textContent.trim() : ''; });
  const rowActions = async () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent && ['Open', 'Link to record'].includes(b.textContent.trim())).map((b) => b.textContent.trim()));

  check((await summary()) === '4 threads', `initial summary: ${await summary()}`);
  check((await rowActions()).length === 4, `4 row actions (${(await rowActions()).join(', ')})`);
  await page.screenshot({ path: `${out}/list-with-chrome.png` });

  await clickText('Overdue');
  check((await summary()) === '1 of 4 threads', `Overdue segment → ${await summary()}`);
  await clickText('Unmatched');
  check((await summary()) === '1 of 4 threads' && (await rowActions())[0] === 'Link to record', `Unmatched segment → ${await summary()}, action ${(await rowActions())[0]}`);
  await page.screenshot({ path: `${out}/list-unmatched.png` });

  await clickText('Link to record', 'button');
  await sleep(300);
  const modalOpen = await page.evaluate(() => !![...document.querySelectorAll('*')].find((e) => e.offsetParent && e.textContent.trim() === 'Link to record' && e.tagName !== 'BUTTON'));
  check(modalOpen, 'Link to record modal opened');
  await page.screenshot({ path: `${out}/list-link-modal.png` });
  // Open the record select and pick SUB-088
  await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Choose a record'); inp.focus(); inp.click(); });
  await sleep(400);
  const picked = await page.evaluate(() => { const opt = [...document.querySelectorAll('*')].filter((e) => e.offsetParent && e.children.length === 0 && e.textContent.includes('SUB-088')).pop(); if (!opt) return false; opt.click(); return true; });
  check(picked, 'picked SUB-088 in the select');
  await sleep(300);
  await clickText('Link', 'button');
  await sleep(600);
  const afterLink = await summary();
  check(afterLink === '0 of 4 threads', `after linking, Unmatched view → ${afterLink}`);
  await clickText('All');
  const linkedCell = await page.evaluate(() => document.body.innerText.includes('[RMC-04] SUB-088 — Level 2 door frames'));
  check(linkedCell, 'subject gained the record prefix after linking');
  await page.screenshot({ path: `${out}/list-after-link.png` });

  // Role switcher → guest sees one thread, no cost column
  await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
  await sleep(400);
  await clickText('Subcontractor (guest)');
  await sleep(900);
  const guestSummary = await summary();
  const costHeader = await page.evaluate(() => document.body.innerText.includes('COST IMPACT'));
  check(guestSummary === '1 thread' && !costHeader, `guest role → ${guestSummary}, cost column ${costHeader ? 'shown' : 'hidden'}`);
  await page.screenshot({ path: `${out}/list-guest.png` });

  // Reset demo data (the session persisted the link and the role)
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(500);
  check((await summary()) === '4 threads', `after reset → ${await summary()}`);
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

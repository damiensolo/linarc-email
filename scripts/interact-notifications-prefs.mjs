// Interaction check for notifications-preferences and the Critical override (docs/notifications/00-plan.md §8 step 4): the
// preset fills the matrix, a cell edit makes it Custom, locked cells, Save, the cover preview and start / end, the
// PM's override from the full page with its audit row, the PE's blocked override, Reset. Needs the dev server.
// Run from the repo root:  node scripts/interact-notifications-prefs.mjs <port> <out-dir>
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
  await page.goto(`http://localhost:${port}/?p=notifications-preferences&theme=light`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const clickText = async (text, tags = 'button, [role="option"], [role="menuitem"], li, span, div, label') => {
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
  const radioChecked = async (label) => page.evaluate((label) => { const l = [...document.querySelectorAll('label')].find((x) => x.textContent.trim() === label); const i = l && l.querySelector('input'); return !!(i && i.checked); }, label);
  const cellValue = async (aria) => page.evaluate((aria) => { const el = document.querySelector(`[aria-label="${aria}"]`); const inp = el && (el.tagName === 'INPUT' ? el : el.querySelector('input')); return inp ? inp.value : ''; }, aria);
  const setRole = async (label) => {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText(label);
    await sleep(900);
  };
  /** Open a SelectV2 (by its input's placeholder or the select's aria-label) and pick an option by text. The input is
      read-only when search is off, so the trigger around it is clicked when the input alone doesn't open it. */
  const pickOption = async (placeholderOrLabel, option) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.evaluate((p, attempt) => {
        const byPlaceholder = [...document.querySelectorAll('input')].find((i) => i.placeholder === p);
        const root = byPlaceholder ? null : document.querySelector(`[aria-label="${p}"]`);
        const inp = byPlaceholder || (root && (root.tagName === 'INPUT' ? root : root.querySelector('input')));
        let el = inp;
        for (let i = 0; i < attempt; i += 1) el = el.parentElement;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.click();
      }, placeholderOrLabel, attempt);
      await sleep(400);
      const found = await page.evaluate((text) => {
        const els = [...document.querySelectorAll('[role="option"], li, span, div')].filter((e) => e.offsetParent !== null && e.textContent.trim() === text && e.children.length === 0);
        const el = els[els.length - 1];
        if (!el) return false;
        el.click();
        return true;
      }, option);
      if (found) { await sleep(300); return; }
    }
    throw new Error(`could not pick "${option}" in "${placeholderOrLabel}"`);
  };

  // 1. Sarah: the Project manager preset, locked cells, the matrix.
  check(await radioChecked('Project manager'), 'PM starts on the Project manager preset');
  check(await has('Set by Vanguard Construction Group policy'), 'locked cells show the policy');
  check((await cellValue('Drawings and documents, Email')) === 'Digest', `Documents / Email cell: ${await cellValue('Drawings and documents, Email')}`);
  await page.screenshot({ path: `${out}/prefs-pm.png`, fullPage: true });
  await clickText('Superintendent', 'label');
  await sleep(300);
  check((await cellValue('Drawings and documents, Email')) === 'Immediate' && (await cellValue('Financials, Email')) === 'Off', 'the Superintendent preset refilled the matrix');
  await pickOption('Drawings and documents, Email', 'Off');
  check(await radioChecked('Custom') && (await cellValue('Drawings and documents, Email')) === 'Off', 'editing a cell makes the preset Custom');
  await clickText('Save', 'button');
  await sleep(600);
  check(await has('Saved'), 'Save confirms');

  // 2. Cover: preview, exclusions, start, end.
  await pickOption('Choose a team member', 'Alex Morgan · GC project engineer');
  await sleep(300);
  check(await has('Alex Morgan will cover 2 items') && await has('Not covered: 2') && await has('not a participant of this Confidential thread'), 'cover preview lists covered and excluded items with the reason');
  await page.screenshot({ path: `${out}/prefs-cover-preview.png`, fullPage: true });
  await clickText('Start cover', 'button');
  await sleep(400);
  check(await has('Alex Morgan is covering for you until'), 'cover active');
  await setRole('GC project engineer');
  const bell = await page.evaluate(() => (document.querySelector('[aria-label^="Notifications:"]') || {}).getAttribute?.('aria-label') || '');
  check(bell.startsWith('Notifications: 3 need action'), `Alex now carries Sarah's items: ${bell}`);
  await setRole('GC project manager');
  await clickText('End cover', 'button');
  await sleep(400);
  check(await has('Someone takes your open items while you are away.'), 'cover ended');

  // 3. The override: from the full page's Watching scope, the PM changes RFI-142's severity with a reason; the PE can't.
  await page.goto(`http://localhost:${port}/?p=notifications-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.evaluate(() => { const root = document.querySelector('[aria-label="Scope"]'); [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === 'Watching').click(); });
  await sleep(700);
  await page.evaluate(() => { const cell = [...document.querySelectorAll('span.dg-cell-text')].filter((e) => e.textContent.trim().startsWith('Respond RFI-142')).pop(); cell.click(); });
  await sleep(700);
  await clickText('More', 'button');
  await clickText('Change severity…', '[role="menuitem"]');
  await sleep(500);
  check(await has('Change severity of RFI-142') && await has('Reason (required)'), 'override modal opened');
  const disabledBefore = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.trim() === 'Change severity'); return b ? b.disabled || b.getAttribute('aria-disabled') === 'true' : null; });
  check(disabledBefore === true, 'Change severity disabled without a reason');
  await page.evaluate(() => { const ta = [...document.querySelectorAll('textarea')].find((t) => t.offsetParent); ta.focus(); });
  await page.keyboard.type('Framing restarted after the site call');
  await sleep(600);
  await clickText('Change severity', 'button');
  await sleep(600);
  check(await has('Was Critical') && await has('Framing restarted after the site call'), 'override applied with its reason on the card');
  await page.screenshot({ path: `${out}/list-override.png` });
  await clickText('More', 'button');
  await clickText('View history', '[role="menuitem"]');
  await sleep(300);
  check(await has('Severity changed'), 'audit row in the history');
  await page.keyboard.press('Escape');
  await sleep(400);
  await setRole('GC project engineer');
  await page.evaluate(() => { const root = document.querySelector('[aria-label="View"]'); [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === 'Waiting').click(); });
  await sleep(700);
  check(await has('Important') && !(await has('Critical because')), 'the PE sees RFI-142 as Important now');

  // 4. Reset.
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(600);
  await page.goto(`http://localhost:${port}/?p=notifications-preferences&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(500);
  check(await radioChecked('Project manager') && (await cellValue('Drawings and documents, Email')) === 'Digest', 'reset restored the defaults');
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

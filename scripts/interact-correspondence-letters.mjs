// Interaction check for correspondence numbers, letter types and templates (D-78, 2026-11-14): Compose's Type and
// Template selects and the number note, a Delay notice template filling the subject and the body with the project
// letterhead, the sent thread carrying its number and type in the title bar and the reading pane, the Email screen's
// Letter column and the Notices quick filter, and seeded numbers on the threads the GC started. Needs the dev server:
//   node scripts/interact-correspondence-letters.mjs <port> <out-dir>
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
  const has = (t) => page.evaluate((t) => document.body.innerText.includes(t), t);
  const waitText = async (t) => { for (let i = 0; i < 30; i += 1) { if (await has(t)) return true; await sleep(200); } return false; };
  const buttons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim()).filter(Boolean));
  const click = async (text, tag = 'button') => {
    const ok = await page.evaluate((text, tag) => {
      const els = [...document.querySelectorAll(tag)].filter((e) => e.offsetParent !== null && e.textContent.trim() === text);
      const el = els[els.length - 1];
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, text, tag);
    if (!ok) throw new Error(`no visible "${text}"`);
    await sleep(500);
  };
  const openSelect = async (match) => { const found = await page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m)); if (!i) return false; i.scrollIntoView({ block: 'center' }); return true; }, match); if (!found) return false; await sleep(300); return page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m)); i.focus(); i.click(); return true; }, match); };
  const pickOption = async (label) => click(label, 'li, [role="option"], span, div');
  const inputValue = (startsWith) => page.evaluate((s) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && x.value.startsWith(s)); return i ? i.value : ''; }, startsWith);
  const editorText = () => page.evaluate(() => { const e = [...document.querySelectorAll('.ProseMirror')].filter((x) => x.offsetParent).pop(); return e ? e.innerText.replace(/\s+/g, ' ') : ''; });
  const typeInTo = async (text) => { const f = await page.evaluateHandle(() => [...document.querySelectorAll('.rf')].find((x) => x.querySelector('label').textContent.trim() === 'To')); const input = await f.$('input'); await input.click(); await page.keyboard.type(text); await sleep(500); };

  // --- Compose from the Email screen: Type, Template, the number
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Compose');
  await click('Compose');
  await waitText('Numbered C-0041 on send');
  check(await has('Numbered C-0041 on send') && (await inputValue('General')) === 'General', 'Compose offers the letter type (General) and names the next number, C-0041');
  check(await openSelect('General'), 'opened the Type select');
  await pickOption('Notice');
  await sleep(400);
  check(await has('Template'), 'a Notice offers templates');
  check(await openSelect('None'), 'opened the Template select');
  await pickOption('Delay notice');
  await sleep(800);
  const subject = await inputValue('[RMC-04] Notice of delay');
  check(subject === '[RMC-04] Notice of delay C-0041 — [subject]', `the template fills the subject with the number (${subject})`);
  const body = await editorText();
  check(body.includes('Vanguard Construction Group · Riverside Medical Center') && body.includes('Notice of delay C-0041') && body.includes("In accordance with the contract's notice provisions") && body.includes('Sarah Jenkins, Project Manager'), 'the body carries the letterhead, the notice form and the sign-off');
  await page.screenshot({ path: `${out}/letters-template.png` });
  // send it to the design team
  await typeInTo('design');
  await page.keyboard.press('Enter');
  await sleep(300);
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && x.value.startsWith('[RMC-04] Notice of delay')); i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
  await page.keyboard.press('Backspace');
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('Backspace');
  await page.keyboard.type('Level 2 ceiling grid');
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && x.value.startsWith('[RMC-04] Notice of delay')); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(300);
  await click('Send');
  await waitText('Replies land in this thread') || await waitText('Notice of delay');
  await sleep(600);
  check(page.url().includes('correspondence-thread') && await has('C-0041 · Notice'), 'the sent thread carries C-0041 · Notice in its title bar');
  await page.screenshot({ path: `${out}/letters-thread.png` });

  // --- the Email screen: the Letter column and the Notices quick filter; the reading pane header
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0#list`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(800);
  const headers = await page.evaluate(() => [...document.querySelectorAll('.dg-list-header-cell')].map((h) => h.textContent.trim().toUpperCase()).filter(Boolean));
  check(headers.includes('LETTER'), `the table has a Letter column (${headers.slice(0, 5).join(' | ')})`);
  check(await has('C-0040 · General') && await has('C-0038 · Transmittal') && await has('C-0041 · Notice'), 'seeded numbers on the threads the GC started, and the new notice');
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0#reading=THR-1031`, { waitUntil: 'networkidle0' });
  await sleep(800);
  check(await page.evaluate(() => { const h = document.querySelector('[aria-label="Reading pane"] header'); return h && h.innerText.includes('C-0038 · Transmittal'); }), "the reading pane's header shows THR-1031's number and type");
  // Ray's unmatched mail has no number
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1050`, { waitUntil: 'networkidle0' });
  await waitText('Ray Castellano');
  check(!(await has('C-00')), 'a thread the GC did not start has no number');
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

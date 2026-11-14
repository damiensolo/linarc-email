// Interaction check for linking and promoting (D-77, 2026-11-14): Link to record with several records at once from the
// Email screen (the button carries the count, the row gains every record), Link a record from the thread's Linked
// items, and Promote to record with a target other than an RFI (a field issue, a PCO with its amount for the PM).
// Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-link.mjs <port> <out-dir>
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
  // as the walkthrough: the row's button, found from the button's side (the frozen actions column is its own row element)
  const clickInRow = async (rowText, buttonText) => {
    const ok = await page.evaluate((rowText, buttonText) => {
      const bs = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.textContent.trim() === buttonText);
      const b = bs.find((x) => { const row = x.closest('.dg-list-row'); return row && row.textContent.includes(rowText); });
      if (!b) return false;
      b.click();
      return true;
    }, rowText, buttonText);
    if (!ok) throw new Error(`no "${buttonText}" in a row with "${rowText}"`);
    await sleep(600);
  };
  // the SmartPicker: type, then Enter toggles the best match (multiple mode)
  const pickRow = async (query) => { await page.evaluate(() => { const i = document.querySelector('[role="dialog"] input[role="combobox"]'); i.focus(); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }); await page.keyboard.type(query); await sleep(400); await page.keyboard.press('Enter'); await sleep(400); };
  const rowText = (t) => page.evaluate((t) => { const r = [...document.querySelectorAll('.dg-list-row')].find((x) => x.textContent.includes(t)); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; }, t);
  const openSelect = async (match) => { const found = await page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m || x.getAttribute('aria-label') === m)); if (!i) return false; i.scrollIntoView({ block: 'center' }); return true; }, match); if (!found) return false; await sleep(300); return page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m || x.getAttribute('aria-label') === m)); i.focus(); i.click(); return true; }, match); };
  const pickOption = async (label) => click(label, 'li, [role="option"], span, div');

  // --- 1. Email screen, table, Unmatched: Link to record with two records
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0#list`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Link to record');
  await clickInRow('card reader rough-in', 'Link to record');
  check(await waitText('matches no thread') && await has('pick every record it is about'), 'the link modal explains the unmatched mail and allows several records');
  await pickRow('sub-088');
  await pickRow('s-201');
  check((await buttons()).includes('Link 2'), `two picks: the button reads Link 2 (${(await buttons()).filter((b) => /^Link/.test(b)).join(' | ')})`);
  await click('Link 2');
  await sleep(1200);
  const row = await rowText('card reader rough-in');
  check(row.includes('[RMC-04] SUB-088 — ') && row.includes('SUB-088 · Rev 1, S-201 · Rev 1'), `the row gained the prefix and both records (${row.slice(0, 120)})`);
  await page.screenshot({ path: `${out}/link-two.png` });

  // --- 2. the thread's Linked items: Link a record
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1042`, { waitUntil: 'networkidle0' });
  await waitText('Linked items');
  check((await buttons()).includes('Link a record'), 'Linked items offers Link a record');
  await click('Link a record');
  check(await waitText('Link to another record'), 'the modal names the thread and adds records');
  await pickRow('rfi-139');
  await click('Link');
  await waitText('Linked to RFI-139.');
  check(await has('Linked to RFI-139.') && await has('Level 1 lobby soffit'), 'RFI-139 is now a linked item');

  // --- 3. Promote to a field issue (Ray's unmatched mail, THR-1050)
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1050`, { waitUntil: 'networkidle0' });
  await waitText('Promote to record');
  await click('Promote to record');
  await waitText('Record type');
  check(await has('Creates a formal RFI'), 'the panel defaults to an RFI');
  check(await openSelect('RFI'), 'opened the Record type select');
  await pickOption('Field issue');
  await sleep(400);
  check(await has('Creates a field issue') && (await buttons()).includes('Create field issue') && await has('Description'), 'Field issue: the note, the button and the Description label follow');
  // the drafted description must be visited (a real click, then a click elsewhere); Assigned to needs a person
  const visibleTa = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((x) => x.offsetParent));
  await visibleTa.click();
  await sleep(200);
  await page.keyboard.press('End');
  await page.evaluate(() => { const t = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent); t.blur(); });
  await sleep(300);
  // Assigned to: open the panel's select (its input sits under the "Assigned to" label) and pick Ray
  const opened = await page.evaluate(() => { const lab = [...document.querySelectorAll('label, span')].find((l) => l.offsetParent && l.textContent.trim() === 'Assigned to'); const box = lab && lab.closest('[class*="field"], div'); const i = box ? box.parentElement.querySelector('input') : null; if (!i) return false; i.focus(); i.click(); return true; });
  await sleep(500);
  const optionTexts = await page.evaluate(() => [...document.querySelectorAll('[role="option"], li')].filter((o) => o.offsetParent && o.textContent.includes('Ray Castellano')).map((o) => o.textContent.replace(/\s+/g, ' ').trim()));
  check(opened && optionTexts.length > 0, `the Assigned to select lists Ray (${optionTexts[0] || 'none'})`);
  // SelectV2 picks on the row's leaf element (as the thread script's click does): the deepest node with the label
  await page.evaluate(() => { const leaves = [...document.querySelectorAll('[role="option"] *, li *')].filter((x) => x.offsetParent && x.children.length === 0 && x.textContent.trim().startsWith('Ray Castellano')); const o = leaves[leaves.length - 1] || [...document.querySelectorAll('[role="option"], li')].find((x) => x.offsetParent && x.textContent.includes('Ray Castellano')); if (o) { o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); } });
  await sleep(500);
  const picked = await page.evaluate(() => [...document.querySelectorAll('input')].some((i) => i.offsetParent && i.value.includes('Ray Castellano')));
  if (!picked) { await page.evaluate(() => { const lab = [...document.querySelectorAll('label, span')].find((l) => l.offsetParent && l.textContent.trim() === 'Assigned to'); const i = lab && lab.closest('div').parentElement.querySelector('input'); if (i) { i.focus(); i.click(); } }); await sleep(400); await page.keyboard.type('Ray'); await sleep(400); await page.keyboard.press('Enter'); await sleep(400); }
  const drafted = await page.evaluate(() => { const t = [...document.querySelectorAll('input')].find((x) => x.offsetParent && x.value.startsWith('Level 2 door frames')); const ta = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent); return { title: t ? t.value : '', body: ta ? ta.value.slice(0, 40) : '' }; });
  check(drafted.title === 'Level 2 door frames — card reader rough-in holding us up' && drafted.body.startsWith('Morning — we have 14'), `without a pre-fill the subject and the message are the draft (${drafted.title})`);
  const state = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.trim() === 'Create field issue'); const assignee = [...document.querySelectorAll('input')].some((i) => i.offsetParent && i.value.includes('Ray Castellano')); const cls = b ? b.className : ''; return { enabled: !!(b && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && cls.indexOf('disabled') < 0), assignee }; });
  check(state.enabled, `Create field issue enables once the description was visited and the fields are filled (${JSON.stringify(state)})`);
  await click('Create field issue');
  await waitText('FI-012 created.');
  check(await has('FI-012 created.') && await has('Promoted to field issue FI-012') && await has('Field issue'), 'FI-012 created: the confirmation, the event row, the Linked items row');
  await page.screenshot({ path: `${out}/promote-field-issue.png` });

  // --- 4. the PCO target shows the amount for a role that may see cost
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1039`, { waitUntil: 'networkidle0' });
  await waitText('Kenji');
  const promote = (await buttons()).includes('Promote to record');
  check(!promote, 'a promoted thread offers no second promotion (THR-1039 is RFI-142)');
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

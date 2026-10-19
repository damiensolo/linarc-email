// Interaction check for correspondence-context-rfi and the compose panel: Email tab, Compose with Add a guest user (inline
// guest), rich-text body, send → new thread on the tab; Compose from the Email screen → lands on the new thread;
// guest role on the RFI. Needs the dev server. Run from the repo root: node scripts/interact-correspondence-rfi.mjs <port> <out-dir>
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
  const has = (t) => page.evaluate((t) => document.body.innerText.includes(t), t);
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
    await sleep(400);
  };
  const typeInto = async (placeholderOrLabel, text) => {
    const ok = await page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((i) => i.offsetParent && (i.placeholder === m || i.getAttribute('aria-label') === m)); if (!i) return false; i.focus(); i.select && i.select(); return true; }, placeholderOrLabel);
    if (!ok) throw new Error(`no input "${placeholderOrLabel}"`);
    await page.keyboard.type(text);
    await sleep(200);
  };

  // --- RFI-143 details → Email tab
  await page.goto(`http://localhost:${port}/?p=correspondence-context-rfi&theme=light#RFI-143`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  check(await has('Grid B-4 W24 beam web penetration'), 'RFI-143 loaded');
  check(await has('Created from an email'), 'details say it came from an email');
  await click('Email');
  check(await has('Grid B-4 HVAC duct and acoustic cove clash') && await has('Dave Miller'), 'Email tab shows the origin thread THR-1042');
  check((await buttons()).includes('Open in Email'), 'Open in Email link present');
  await page.screenshot({ path: `${out}/rfi-email-tab.png` });

  // --- Compose from the RFI: pinned record, To pre-filled, Add a guest user → inline guest
  await click('Compose');
  await sleep(500);
  check(await has('Linked record') && await has('RFI-143') && await has('Attach a PDF of RFI-143'), 'compose panel open with the RFI pinned and the PDF option');
  const subject = await page.evaluate(() => { const i = document.querySelector('input#fv2-subject'); return i ? i.value : ''; });
  check(subject.startsWith('[RMC-04] RFI-143'), `subject prefilled: ${subject}`);
  await typeInto('name@company.com', 'm.vance@acoustix.com');
  await click('Add guest');
  await sleep(400);
  check(await has("isn't in the project directory yet. Add them"), 'unknown address opens the inline guest form');
  const guessed = await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.offsetParent).map((i) => i.value).filter((v) => /Vance|Acoustix/.test(v)));
  check(guessed.length === 2, `name and company guessed from the address: ${guessed.join(' / ')}`);
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.value === 'M Vance'); if (i) { i.focus(); i.select(); } });
  await page.keyboard.type('Marcus Vance');
  await click('Add guest user');
  await sleep(400);
  check(!(await has("isn't in the project directory yet. Add them")), 'inline form closed after adding');
  check(await has('Marcus Vance'), 'Marcus Vance is now a recipient');
  await page.screenshot({ path: `${out}/rfi-compose-panel.png` });
  // Body: TipTap editor (contenteditable)
  const typed = await page.evaluate(() => { const ed = document.querySelector('.ProseMirror, [contenteditable="true"]'); if (!ed) return false; ed.focus(); return true; });
  check(typed, 'rich-text editor focused');
  await page.keyboard.type('Marcus, please review the W24 penetration sketch against the STC-50 corridor rating.');
  await sleep(1500); // TextEditorV2 emits its value debounced (~500ms)
  const sendEnabled = await page.evaluate(() => { const all = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Send' && b.offsetParent); const b = all[all.length - 1]; return b ? !(b.disabled || /disabled/.test(b.className)) : null; });
  check(sendEnabled === true, `Send enabled once To, Subject and Message are set (${sendEnabled})`);
  await click('Send');
  await sleep(1200);
  check(await has('with RFI-143 pinned'), 'send acknowledged on the Email tab');
  check(await has('STC-50 corridor rating'), 'new thread appears on the Email tab');
  check(await has('RFI-143.pdf'), 'record PDF attached');
  await page.screenshot({ path: `${out}/rfi-after-send.png` });

  // --- Compose from the Email screen → lands on the new thread
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(300);
  check(await has('5 threads') || await has('6 threads'), `list now includes the new thread (${await page.evaluate(() => (document.body.innerText.match(/\d+ threads/) || [''])[0])})`);
  await click('Compose');
  await sleep(700);
  check(await has('Add a guest user'), 'compose panel open from the Email screen');
  const opened = await page.evaluate(() => { const i = document.querySelector('.rf input'); if (!i) return false; i.focus(); return true; });
  check(opened, 'To field focused (RecipientField, D-47)');
  await sleep(400);
  await page.evaluate(() => { const o = [...document.querySelectorAll('[role="listbox"] [role="option"]')].find((e) => e.textContent.includes('Elena Rostova')); o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); });
  await sleep(200);
  await page.evaluate(() => { const i = document.querySelector('.rf input'); i.focus(); });
  await sleep(300);
  // Esc here must close only the dropdown (SlideOverPanel ignores Esc while a dropdown inside it is expanded).
  await page.keyboard.press('Escape');
  await sleep(300);
  check(await has('Add a guest user'), 'Esc closed the dropdown, not the panel');
  await page.evaluate(() => { const i = document.querySelector('input#fv2-subject'); i.focus(); });
  await page.keyboard.type('Beam sleeve detail');
  await page.evaluate(() => { const ed = document.querySelector('.ProseMirror, [contenteditable="true"]'); ed.focus(); });
  await page.keyboard.type('Elena, sketch attached for your review.');
  await sleep(1500);
  await click('Send');
  await sleep(1200);
  const url = page.url();
  check(url.includes('p=correspondence-thread') && /THR-105\d/.test(url), `sending from the Email screen opens the new thread (${url.split('?')[1]})`);
  check(await has('Beam sleeve detail'), 'new thread shows its subject');

  // --- guest role on the RFI: Email tab without notes or Compose for a non-participant? (guest is a participant of THR-1042)
  await page.goto(`http://localhost:${port}/?p=correspondence-context-rfi&theme=light#RFI-143`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); i.focus(); i.click(); });
  await sleep(400);
  await click('Subcontractor (guest)', 'li, [role="option"], span, div');
  await sleep(1200);
  await click('Email');
  const txt = await page.evaluate(() => document.body.innerText);
  check(!txt.includes('Internal team note (hidden'), 'guest sees no internal notes on the Email tab');
  check(!txt.includes('Cost impact'), 'guest sees no cost impact');

  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'RFI INTERACT FAILED' : 'RFI INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

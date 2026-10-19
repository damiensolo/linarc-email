// Interaction check for correspondence-context-dwg: pin → popover → Email about this markup → compose with the pinned
// revision and the markup preview → send; S-201 superseded case; guest role. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-dwg.mjs <port> <out-dir>
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

  // --- A-302 Rev 3: the pin
  await page.goto(`http://localhost:${port}/?p=correspondence-context-dwg&theme=light#A-302-Rev3`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  check(await has('A-302 · Level 3 Reflected Ceiling Plan'), 'sheet A-302 loaded');
  check(await has('1 markup on this sheet'), 'markup count line');
  const pinClicked = await page.evaluate(() => { const b = document.querySelector('button.sheet-pin'); if (!b) return false; b.click(); return true; });
  check(pinClicked, 'pin button present and clicked');
  await sleep(500);
  check(await has('Grid B-4 · Corridor 3E') && await has('18" HVAC trunk duct clashes'), 'popover shows the markup facts');
  check((await buttons()).includes('Email about this markup') && (await buttons()).includes('Open THR-1042 in Email'), 'popover offers Email about this markup and the existing thread');
  await page.screenshot({ path: `${out}/dwg-popover.png` });
  await click('Email about this markup');
  await sleep(600);
  check(await has('Linked record') && await has('A-302 · Rev 3') && await has('Grid B-4 · Corridor 3E'), 'compose open with the drawing pinned and the markup preview');
  const thumb = await page.evaluate(() => !!document.querySelector('.dpp-thumb--md svg'));
  check(thumb, 'preview thumbnail is the cropped sheet');
  const subject = await page.evaluate(() => { const i = document.querySelector('input#fv2-subject'); return i ? i.value : ''; });
  check(subject.startsWith('[RMC-04] A-302 · Rev 3'), `subject prefilled: ${subject}`);
  check(!(await has('Attach a PDF of')), 'no record PDF option for a drawing');
  await page.screenshot({ path: `${out}/dwg-compose.png` });
  // recipients: suggested first (Kenji, Dave, Elena)
  await page.evaluate(() => { const i = [...document.querySelectorAll('input[role="combobox"]')].find((i) => i.offsetParent && i.placeholder === 'Choose recipients'); i.focus(); i.click(); });
  await sleep(400);
  const firstOption = await page.evaluate(() => { const o = [...document.querySelectorAll('[role="option"], li')].find((e) => e.offsetParent && /Kenji|Dave|Elena/.test(e.textContent)); return o ? o.textContent.trim().slice(0, 40) : ''; });
  check(/Kenji/.test(firstOption), `suggested recipients first: ${firstOption}`);
  await click('Kenji Takahashi, AIA · Studio West Architecture', 'li, [role="option"], span, div');
  await page.keyboard.press('Escape');
  await sleep(300);
  check(await has('Add a guest user'), 'Esc closed the dropdown only');
  await page.evaluate(() => { const ed = document.querySelector('.ProseMirror, [contenteditable="true"]'); ed.focus(); });
  await page.keyboard.type('Kenji, can the cove profile shift 4" north at B-4?');
  await sleep(1500);
  await click('Send');
  await sleep(1000);
  check(await has('Sent with A-302 · Rev 3 at Grid B-4 · Corridor 3E pinned'), 'send acknowledged with the pin');
  check((await buttons()).includes('Open in Email'), 'link to the new thread');

  // --- S-201 Rev 1: superseded
  await page.goto(`http://localhost:${port}/?p=correspondence-context-dwg&theme=light#S-201-Rev1`, { waitUntil: 'networkidle0' });
  await sleep(300);
  check(await has('Superseded by Rev 2'), 'superseded chip in the title bar');
  check(await has('No markups on this sheet'), 'no pins on S-201');
  await click('Email about this sheet');
  await sleep(600);
  check(await has('This message stays pinned to Rev 1'), 'compose notes the superseded revision and keeps the pin');
  await page.screenshot({ path: `${out}/dwg-superseded-compose.png` });

  // --- guest role: no compose
  await page.goto(`http://localhost:${port}/?p=correspondence-context-dwg&theme=light#A-302-Rev3`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); i.focus(); i.click(); });
  await sleep(400);
  await click('Subcontractor (guest)', 'li, [role="option"], span, div');
  await sleep(1200);
  check(!(await buttons()).includes('Email about this sheet'), 'guest cannot compose from the sheet');
  await page.evaluate(() => document.querySelector('button.sheet-pin').click());
  await sleep(500);
  check(!(await buttons()).includes('Email about this markup') && (await buttons()).includes('Open THR-1042 in Email'), 'guest popover: no compose, can open the thread they are on');

  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'DWG INTERACT FAILED' : 'DWG INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

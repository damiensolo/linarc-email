// Interaction check for the field persona's pieces (D-80, 2026-11-14): the composer's *Take a photo* tool (a camera
// input on a phone), a photo keeping its capture time on the chip and on the thread's tile, and *Add to daily log* as
// a promote target (no assignee; the thread keeps its triage). Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-field.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { utimesSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
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
  const buttons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim() || `[${b.getAttribute('aria-label')}]`).filter(Boolean));
  const click = async (text, tag = 'button') => {
    const ok = await page.evaluate((text, tag) => {
      const els = [...document.querySelectorAll(tag)].filter((e) => e.offsetParent !== null && (e.textContent.trim() === text || e.getAttribute('aria-label') === text));
      const el = els[els.length - 1];
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, text, tag);
    if (!ok) throw new Error(`no visible "${text}"`);
    await sleep(500);
  };
  const typeMessage = async (text) => {
    const hs = await page.$$('.ProseMirror');
    let target = null;
    for (const h of hs) if (await h.evaluate((e) => !!e.offsetParent)) target = h;
    await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await target.click();
    await page.keyboard.type(text);
    await sleep(700);
  };
  const openSelect = async (match) => { const found = await page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m)); if (!i) return false; i.scrollIntoView({ block: 'center' }); return true; }, match); if (!found) return false; await sleep(300); return page.evaluate((m) => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.value === m || x.placeholder === m)); i.focus(); i.click(); return true; }, match); };
  const pickOption = async (label) => click(label, 'li, [role="option"], span, div');

  // a site photo whose file time is this morning's walk: the capture time the tile will show
  const photo = resolve('public/files/IMG_4471_Level2_Door_Frame.jpg');
  const taken = new Date('2026-10-16T08:12:00');
  utimesSync(photo, taken, taken);
  check(Math.abs(statSync(photo).mtimeMs - taken.getTime()) < 2000, 'the sample photo carries a capture time (its file time)');

  // --- the thread composer: Take a photo, the chip's hint, the sent tile's caption
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1050`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Ray Castellano');
  check((await buttons()).includes('[Take a photo]') && await page.evaluate(() => { const i = document.querySelector('[data-photo-input]'); return i && i.getAttribute('capture') === 'environment' && i.getAttribute('accept') === 'image/*'; }), 'the tool row offers Take a photo: a camera input (capture=environment, images only)');
  const input = await page.$('[data-photo-input]');
  await input.uploadFile(photo);
  await sleep(800);
  const chipHint = await page.evaluate(() => { const li = document.querySelector('[aria-label="Attachments"] li'); return li ? li.textContent.replace(/\s+/g, ' ').trim() : ''; });
  check(chipHint.includes('IMG_4471_Level2_Door_Frame.jpg'), `the photo is a chip (${chipHint})`);
  await typeMessage('Ray, frames set this morning; photo attached for the log.');
  await click('Send');
  await waitText('Sent. Replies land in this thread.');
  check(await has('Taken 16 Oct, 08:12'), 'the sent photo\'s tile says when it was taken');
  await page.screenshot({ path: `${out}/field-photo.png` });

  // --- Add to daily log: a promote target with no assignee; the thread keeps its triage
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1050`, { waitUntil: 'networkidle0' });
  await waitText('Promote to record');
  await click('Promote to record');
  await waitText('Record type');
  check(await openSelect('RFI'), 'opened the Record type select');
  await pickOption('Daily log entry');
  await sleep(400);
  check(await has("Adds Ray Castellano's message to today's daily log") && (await buttons()).includes('Add to daily log') && !(await has('Assigned to')), 'Daily log entry: the note, the button, no assignee');
  const ta = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((x) => x.offsetParent));
  await ta.click();
  await page.keyboard.press('End');
  await page.evaluate(() => { const t = [...document.querySelectorAll('textarea')].find((x) => x.offsetParent); t.blur(); });
  await sleep(300);
  await click('Add to daily log');
  await waitText('created.');
  check(await has('DL-1016-3 created.') && await has('Added to the daily log as DL-1016-3 by Sarah Jenkins') && await has('Daily log'), 'the entry is created, the event row and the Linked items row say so');
  check(await has('Waiting on them'), "the thread's status is unchanged by the log entry (it waits on Ray after the reply)");
  await page.screenshot({ path: `${out}/field-daily-log.png` });
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

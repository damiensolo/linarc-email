// Interaction check for the correspondence log export and the file-name search (D-79, 2026-11-14): the Files column,
// the toolbar's search finding a thread by one of its file names, and Download handing the browser a CSV of the rows
// as filtered. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-export.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
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
  const summary = () => page.evaluate(() => { const el = document.querySelector('.load-status'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const downloads = join(out, 'downloads');
  mkdirSync(downloads, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0#list`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('12 threads');
  const headers = await page.evaluate(() => [...document.querySelectorAll('.dg-list-header-cell')].map((h) => h.textContent.trim().toUpperCase()).filter(Boolean));
  check(headers.includes('FILES'), `the table has a Files column (${headers.join(' | ')})`);
  check(await has('Apex_W24_Beam_Penetration_Sketch_B4.pdf'), 'a thread lists its files by name');

  // search by a file name
  await page.click('button[aria-label="Search"]');
  await sleep(400);
  const searchSel = '.dg-toolbar input, .dg-search input, input[placeholder*="Search"], input[type="search"]';
  const searchFound = await page.evaluate((sel) => { const i = [...document.querySelectorAll(sel)].find((x) => x.offsetParent); if (!i) return false; i.focus(); return true; }, searchSel);
  check(searchFound, 'the toolbar search opens an input');
  await page.keyboard.type('Beam_Penetration');
  await page.keyboard.press('Enter');
  await sleep(1500);
  const rowsShown = await page.evaluate(() => document.querySelectorAll('.dg-list-row').length);
  check(/^1 of 12 threads$/.test(await summary()) && rowsShown === 1, `searching a file name finds its one thread and the count says so (${await summary()}; ${rowsShown} rows)`);
  await page.screenshot({ path: `${out}/export-search.png` });

  // Download: the log of the rows as filtered
  await page.click('button[aria-label="Download"]');
  await sleep(1500);
  const files = readdirSync(downloads).filter((f) => f.endsWith('.csv'));
  const file = files[0] ? readFileSync(join(downloads, files[0]), 'utf8') : '';
  check(files.length === 1 && /^RMC-04-correspondence-log-\d{4}-\d{2}-\d{2}\.csv$/.test(files[0]) && file.includes('THR-1042'), `the browser received the file (${files[0] || 'none'})`);
  const lines = file.split(/\r?\n/).filter(Boolean);
  check(lines[0] === 'Number,Type,Thread,Subject,Linked records,From,Owner,Status,Response due,Delivery,Last activity,Follow up,Files' && lines.length === 2, `the export holds the one filtered row with the log's columns (${lines.length - 1} rows)`);
  const row1042 = lines.find((l) => l.includes('THR-1042')) || '';
  check(row1042.startsWith('C-0040,General,THR-1042,[RMC-04] A-302 Rev 3 — Grid B-4 HVAC duct and acoustic cove clash,A-302 · Rev 3,Dave Miller · Apex Mechanical Systems,Alex Morgan,Needs action,16 Oct,Delivered'), `the row carries its number, type, subject, record, from, owner, status, due and delivery (${row1042.slice(0, 160)})`);
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

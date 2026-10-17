// Latency scenarios for correspondence-list (5-ui-patterns.md §6): slow (skeleton, "Still loading…"), fail (error + Retry),
// fail-once (Retry recovers). Needs the dev server. Run from the repo root: node scripts/latency-correspondence-list.mjs <port>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(pathToFileURL(process.cwd() + '/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default;
const [port = '5177'] = process.argv.slice(2);
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed = true; };
const has = (page, text) => page.evaluate((t) => document.body.innerText.includes(t), text);
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  // slow: skeleton, then "Still loading…" after 5s, then rows
  await page.goto(`http://localhost:${port}/?p=correspondence-list&chrome=0&latency=slow`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const skeleton = await page.evaluate(() => !!document.querySelector('[aria-busy="true"]'));
  check(skeleton, 'slow: region is aria-busy after 1.5s');
  await sleep(4200);
  check(await has(page, 'Still loading'), 'slow: "Still loading…" after 5s');
  await sleep(2000);
  check(await has(page, '4 threads'), 'slow: rows arrive (4 threads)');
  // fail: error + Retry
  await page.goto(`http://localhost:${port}/?p=correspondence-list&chrome=0&latency=fail`, { waitUntil: 'networkidle0' });
  await sleep(1800);
  check((await has(page, "Couldn't load the email")) && (await has(page, 'Retry')), 'fail: "Couldn\'t load email." with Retry');
  // fail-once: Retry recovers
  await page.goto(`http://localhost:${port}/?p=correspondence-list&chrome=0&latency=fail-once`, { waitUntil: 'networkidle0' });
  await sleep(1800);
  check(await has(page, 'Retry'), 'fail-once: first request fails');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Retry').click());
  await sleep(1800);
  check(await has(page, '4 threads'), 'fail-once: Retry recovers (4 threads)');
} finally { await browser.close(); }
console.log(failed ? 'LATENCY FAILED' : 'LATENCY OK');
process.exit(failed ? 1 : 0);

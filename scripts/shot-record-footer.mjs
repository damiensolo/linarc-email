// Screenshot check for the record Email tabs' sticky composer footer (F-051, 2026-11-15): scrolls each tab so the
// composer sticks and asserts nothing of the thread is painted in the strip under the footer. Needs the dev server:
//   node scripts/shot-record-footer.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(pathToFileURL(process.cwd() + '/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default;
const [port = '5177', out = '.'] = process.argv.slice(2);
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed = true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCREENS = [['correspondence-context-sub', 'SUB-088', 'sub'], ['correspondence-context-co', 'PCO-019', 'co'], ['correspondence-context-rfi', 'RFI-143', 'rfi']];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 700 });
  for (const [slug, id, name] of SCREENS) {
    await page.goto(`http://localhost:${port}/?p=${slug}&theme=light&chrome=0#${id}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < 30 && !(await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].some((t) => t.textContent.trim().startsWith('Email')))); i += 1) await sleep(200);
    await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find((t) => t.textContent.trim().startsWith('Email')).click());
    await sleep(600);
    // scroll the content area so the first thread's composer sticks with entries behind it
    const r = await page.evaluate(() => {
      const footer = document.querySelector('.sticky.z-10');
      const scroller = footer && footer.closest('.overflow-auto');
      if (!footer || !scroller) return { ok: false };
      scroller.scrollTop = Math.max(0, footer.offsetTop - scroller.clientHeight + 80);
      return { ok: true };
    });
    await sleep(400);
    const m = await page.evaluate(() => {
      const footer = document.querySelector('.sticky.z-10');
      const scroller = footer.closest('.overflow-auto');
      const f = footer.getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      const bg = getComputedStyle(footer).backgroundColor;
      // anything painted in the strip between the footer's bottom and the scroller's bottom
      const probe = document.elementFromPoint(f.left + 40, f.bottom + 8);
      return { gap: Math.round(s.bottom - f.bottom), bg, probe: probe ? probe.tagName + '.' + [...probe.classList].slice(0, 3).join('.') : 'none', probeIsScroller: probe === scroller || (probe && !footer.contains(probe) && probe.closest('article') === null) };
    });
    check(r.ok && m.gap <= 0, `${name}: the composer footer reaches the scroller's bottom edge (gap ${m.gap}px, bg ${m.bg})`);
    check(m.bg !== 'rgba(0, 0, 0, 0)', `${name}: the footer is opaque (${m.bg})`);
    await page.screenshot({ path: `${out}/record-footer-${name}.png` });
  }
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
console.log(failed ? 'SHOT FAILED' : 'SHOT OK');
process.exit(failed ? 1 : 0);

// Interaction check for correspondence-portal: valid link (markup, files, reply → replied state and the thread gains the
// reply), expired link (Send me a new link), account holder (Open in Linarc). Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-portal.mjs <port> <out-dir>
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

  // --- valid link on a phone
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`http://localhost:${port}/?p=correspondence-portal&theme=light&chrome=0#tk-marcus-a302`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  check(await has('Alex Morgan') && await has('sent this to Marcus Vance'), 'sender and recipient named');
  check(await has('Response requested by'), 'response due shown');
  check(await has('A-302 · Rev 3') && await has('Grid B-4 · Corridor 3E'), 'pinned markup preview');
  check(await has('Site_Walk_Corridor3E_Grid_B4.mp4') && (await buttons()).includes('Stream'), 'large file offered as a stream');
  check(!(await has('Internal team note')) && !(await has('$4,200')), 'nothing internal on the page');
  check(!(await buttons()).includes('Open in Linarc'), 'no Open in Linarc for a recipient without an account');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, `no horizontal overflow at 390 (${overflow}px)`);
  await click('View the full sheet');
  check(await has('Hide the full sheet'), 'full sheet toggles');
  await page.screenshot({ path: `${out}/portal-390.png`, fullPage: true });
  await page.evaluate(() => { const t = document.querySelector('textarea#fv2-portal-reply'); t.focus(); t.value = 'Shifting the baffle 4" north keeps STC-50; send me the revised cove detail.'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(300);
  await click('Send');
  await sleep(1200);
  check(await has('Reply sent'), 'replied state shown');
  check(!(await buttons()).includes('Send'), 'reply box and Send gone after replying');
  await page.screenshot({ path: `${out}/portal-replied.png`, fullPage: true });

  // the thread now has the reply (desktop)
  await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await page.goto(`http://localhost:${port}/?p=correspondence-thread&theme=light#THR-1042`, { waitUntil: 'networkidle0' });
  await sleep(300);
  check(await has('Shifting the baffle 4" north') && await has('Marcus Vance'), 'the thread shows the reply from Marcus');
  check(await has('Needs action'), 'thread back to Needs action');

  // --- expired
  await page.goto(`http://localhost:${port}/?p=correspondence-portal&theme=light&chrome=0#tk-expired`, { waitUntil: 'networkidle0' });
  await sleep(300);
  check(await has('This link has expired'), 'expired state');
  check(!(await has('Response requested by')) && !(await buttons()).includes('Send'), 'expired page shows no message or reply');
  await click('Send me a new link');
  check(await has('A new link is on its way to vchen@riversidehealth.org'), 'renewal acknowledged');
  await page.screenshot({ path: `${out}/portal-expired.png` });

  // --- account holder
  await page.goto(`http://localhost:${port}/?p=correspondence-portal&theme=light#tk-kenji-rfi142`, { waitUntil: 'networkidle0' });
  await sleep(300);
  check((await buttons()).includes('Open in Linarc'), 'Open in Linarc for a recipient with an account');
  await click('Open in Linarc');
  await sleep(600);
  check(page.url().includes('p=correspondence-thread') && page.url().includes('THR-1039'), `Open in Linarc lands on the thread (${page.url().split('?')[1]})`);

  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'PORTAL INTERACT FAILED' : 'PORTAL INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

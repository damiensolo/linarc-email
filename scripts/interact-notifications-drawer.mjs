// Interaction check for the Notifications drawer, bell and banner on the Email screen (docs/notifications/00-plan.md §8
// step 2): explainable counts per role, the Critical section, acknowledge keeps severity and timing, snooze keeps the
// count, a Critical arriving shows the banner without a remount, the guest sees nothing internal, Reset. Needs the dev
// server. Run from the repo root:  node scripts/interact-notifications-drawer.mjs <port> <out-dir>
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
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
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
    await sleep(350);
  };
  const body = async () => page.evaluate(() => document.body.innerText);
  const has = async (s) => (await body()).includes(s);
  const bell = async () => page.evaluate(() => { const el = document.querySelector('[aria-label^="Notifications:"]'); return el ? el.getAttribute('aria-label') : ''; });
  const openDrawer = async () => { await page.evaluate(() => document.querySelector('[aria-label^="Notifications:"]').click()); await sleep(700); };
  const drawerOpen = async () => page.evaluate(() => !!document.querySelector('[role="dialog"][aria-labelledby]') && document.body.innerText.includes('All projects'));
  const cards = async () => page.evaluate(() => [...document.querySelectorAll('[role="dialog"] article')].filter((a) => a.offsetParent).map((a) => a.getAttribute('aria-label')));
  /** Click a button inside the drawer card whose title contains `cardText`. */
  const clickIn = async (cardText, buttonText) => {
    const done = await page.evaluate((cardText, buttonText) => {
      const card = [...document.querySelectorAll('[role="dialog"] article')].find((a) => a.offsetParent && (a.getAttribute('aria-label') || '').includes(cardText));
      const b = card && [...card.querySelectorAll('button')].find((x) => x.textContent.trim() === buttonText);
      if (!b) return false;
      b.click();
      return true;
    }, cardText, buttonText);
    if (!done) throw new Error(`no "${buttonText}" in the card "${cardText}"`);
    await sleep(400);
  };
  const setRole = async (label) => {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText(label);
    await sleep(900);
  };

  // 1. Sarah (PM, the default role): the bell is explainable; the drawer shows her three Needs action items and the
  // project's Critical under oversight.
  check((await bell()).startsWith('Notifications: 3 need action, 1 critical, 1 not acknowledged'), `PM bell: ${await bell()}`);
  await openDrawer();
  check(await drawerOpen(), 'drawer opened from the bell');
  check(await has('1 critical, not acknowledged'), 'critical state line (PM oversight)');
  let list = await cards();
  check(list.length === 4 && list.some((t) => t.includes('Respond RFI-142')), `PM Needs action: ${list.length} cards incl. the Critical (${list.join(' | ')})`);
  check(await has('Project oversight'), 'the PM sees the Critical as Project oversight');
  check(await has('Review RFI-139') && await has('Unmatched mail from Ray Castellano') && await has('Delivery failed: Valerie Chen'), 'PM cards: RFI-139 review, unmatched mail, the bounce');
  await page.screenshot({ path: `${out}/drawer-pm-needs-action.png` });
  await clickText('Waiting');
  check(await has('Response from Valerie Chen') && await has('Overdue'), 'PM Waiting: Valerie, overdue');
  await page.keyboard.press('Escape');
  await sleep(500);
  check(!(await drawerOpen()), 'Esc closes the drawer');

  // 2. Alex (PE): one Needs action, the Critical in Waiting; acknowledge changes engagement only.
  await setRole('GC project engineer');
  check((await bell()).startsWith('Notifications: 1 need action, 1 critical, 1 not acknowledged'), `PE bell: ${await bell()}`);
  await openDrawer();
  check(await has('Critical because the lead-lined partition answer is due today'), 'Critical reason shown');
  check(await has('Acknowledge by 11:45') && await has('Waiting on Kenji Takahashi'), 'ack deadline and Waiting on Kenji');
  check(await has('Reply to Dave Miller'), 'PE Needs action: reply to Dave');
  await page.screenshot({ path: `${out}/drawer-pe-critical.png` });
  await clickIn('Respond RFI-142', 'Acknowledge');
  check(await has('Acknowledged 10:30') && await has('1 critical, acknowledged') && await has('Due today') && !(await has('Acknowledge by')), 'acknowledge: engagement changed, Critical and Due today stayed, deadline line gone');
  check((await bell()).includes('1 critical, 0 not acknowledged'), `PE bell after acknowledge: ${await bell()}`);
  await clickText('Waiting');
  list = await cards();
  check(list.some((t) => t.includes('Respond RFI-143')) && list.some((t) => t.includes('Review RFI-139')) && await has('Waiting on Elena Rostova'), `PE Waiting: ${list.join(' | ')}`);
  await page.screenshot({ path: `${out}/drawer-pe-waiting.png` });

  // 3. Snooze keeps the count: Needs action empties, the snoozed subtotal appears, the bell stays at 1.
  await clickText('Needs action');
  await clickIn('Reply to Dave Miller', 'More');
  await clickText('Snooze until next monday', '[role="menuitem"]');
  await sleep(400);
  check(await has('Nothing needs your action.') && await has('1 snoozed'), 'snoozed: empty Needs action with the subtotal');
  check((await bell()).startsWith('Notifications: 1 need action'), `bell keeps the snoozed item in its total: ${await bell()}`);
  await page.screenshot({ path: `${out}/drawer-pe-snoozed.png` });
  await page.keyboard.press('Escape');
  await sleep(400);

  // 4. A Critical arrives (Simulate event): the banner, no remount, the bell's critical state; acknowledging from the
  // banner hides it and leaves the item.
  await clickText('Simulate event', 'button');
  await sleep(400);
  await clickText('Fire', 'button');
  await sleep(700);
  check(await has("Alex’s email to Kenji bounced"), 'sandbox reports the event');
  check(await has("Delivery failed: Kenji Takahashi, AIA didn't receive"), 'the banner shows the Critical');
  check((await bell()).includes('2 critical, 1 not acknowledged'), `bell after the arrival: ${await bell()}`);
  await page.screenshot({ path: `${out}/banner-critical.png` });
  const bannerAck = await page.evaluate(() => { const b = [...document.querySelectorAll('[role="status"] button')].find((x) => x.textContent.trim() === 'Acknowledge'); if (!b) return false; b.click(); return true; });
  await sleep(400);
  check(bannerAck && !(await has("Delivery failed: Kenji Takahashi, AIA didn't receive")), 'acknowledge on the banner hides it');
  await openDrawer();
  check(await has('Delivery failed: Kenji Takahashi') && await has('Acknowledged 10:30'), 'the item stays in Needs action, acknowledged');
  await page.screenshot({ path: `${out}/drawer-pe-after-bounce.png` });
  await page.keyboard.press('Escape');
  await sleep(400);

  // 5. The guest: no badge, no Critical, one Waiting item, nothing internal.
  await setRole('Subcontractor (guest)');
  check((await bell()).startsWith('Notifications: 0 need action'), `guest bell: ${await bell()}`);
  await openDrawer();
  check(await has('No critical items') && await has('Nothing needs your action.'), 'guest: no critical, nothing to do');
  await clickText('Waiting');
  list = await cards();
  check(list.length === 1 && list[0].includes('Reply to Dave Miller') && await has('Waiting on Alex Morgan'), `guest Waiting: ${list.join(' | ')}`);
  check(!(await has('RFI-142')) && !(await has('Valerie')), 'guest sees no Critical and no Confidential thread');
  await page.screenshot({ path: `${out}/drawer-guest.png` });
  await page.keyboard.press('Escape');
  await sleep(400);

  // 6. Dark theme at phone width: the banner and the full-width drawer, no horizontal overflow.
  await setRole('GC project engineer');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=dark`, { waitUntil: 'networkidle0' });
  await sleep(600);
  await clickText('Simulate event', 'button');
  await sleep(400);
  await clickText('Fire', 'button');
  await sleep(700);
  await page.screenshot({ path: `${out}/banner-390-dark.png` });
  const overflowBanner = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(!overflowBanner, 'no horizontal overflow with the banner at 390');
  // On a phone the bell lives in the hamburger drawer as a Notifications row.
  const burger = await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].find((x) => x.offsetParent && /menu/i.test(`${x.getAttribute('aria-label') || ''} ${x.textContent}`)); if (!b) return false; b.click(); return true; });
  await sleep(600);
  check(burger, 'hamburger opened at 390');
  await clickText('Notifications', 'button, li, span, div');
  await sleep(900);
  check(await drawerOpen(), 'drawer opens at 390 from the overflow menu');
  await page.screenshot({ path: `${out}/drawer-390-dark.png` });
  const overflowDrawer = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(!overflowDrawer, 'no horizontal overflow with the drawer at 390');
  await page.keyboard.press('Escape');
  await sleep(400);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${port}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(500);

  // 7. Reset restores the source truth.
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(600);
  check((await bell()).startsWith('Notifications: 3 need action, 1 critical, 1 not acknowledged'), `after reset: ${await bell()}`);
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

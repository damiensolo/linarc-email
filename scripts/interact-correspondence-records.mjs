// Interaction check for the Submittal and Change Order stand-ins with the upgraded Email tab (D-74, 2026-11-14):
// the title bar (Status, Due), Details facts, the Email tab's count and threads, Compose prefilled with the record
// (subject, To = the assignee, the record's PDF), a reply from the tab, the rail items, the thread's Linked items
// opening the record, and the guest role seeing only their own threads. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-records.mjs <port> <out-dir>
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
  // Tabs carry count badges ("Email 1"), so match the label at the start (as the RFI script)
  const tabs = () => page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].filter((t) => t.offsetParent).map((t) => t.textContent.replace(/\d+/g, '').trim()));
  const tab = async (label) => { const ok = await page.evaluate((l) => { const el = [...document.querySelectorAll('[role="tab"]')].find((t) => t.offsetParent && t.textContent.trim().startsWith(l)); if (!el) return false; el.click(); return true; }, label); if (!ok) throw new Error(`no tab "${label}"`); await sleep(500); };
  const typeMessage = async (text) => {
    const hs = await page.$$('.ProseMirror');
    let target = null;
    for (const h of hs) if (await h.evaluate((e) => !!e.offsetParent)) target = h;
    if (!target) throw new Error('no composer editor');
    await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await target.click();
    await page.keyboard.type(text);
    await sleep(700);
  };
  const reset = () => page.evaluate(() => window.sessionStorage.clear());

  // --- SUB-088 (PM)
  await page.goto(`${base}/?p=correspondence-context-sub&theme=light&chrome=0#SUB-088`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Patient room card-reader door hardware schedule');
  check(await has('SUB-088') && await has('In review') && await has('Due:'), 'SUB-088: title, code chip, Status In review, Due');
  check(await has('Keystone Door & Hardware') && await has('Studio West Architecture') && await has('Hardware set HW-12'), 'Details: submitted by, ball in court, items');
  let t = await tabs();
  check(t.slice(0, 2).join(' · ') === 'Details · Email' && t.slice(2).join(' · ') === 'Activity · Distribution', `tabs Details · Email, then Activity · Distribution (${t.join(' | ')})`);
  check(await has('Card-reader door hardware voltage mismatch') && (await buttons()).includes('Open'), 'Linked items list the SUB-088 thread with Open');
  check(await has('Submittals') && await has('Change orders'), 'the rail shows Submittals and the tool strip Change orders');
  await tab('Email');
  await waitText('Email about SUB-088');
  check(await has('Card-reader door hardware voltage mismatch') && await has('Confidential') && (await buttons()).includes('Open in Email'), 'Email tab: THR-1031 (Confidential for the PM) with Open in Email');
  const editors = (await page.$$('.ProseMirror')).length;
  check(editors === 2 && (await buttons()).includes('Compose') && (await buttons()).includes('Send'), `a composer per thread (two threads on SUB-088: the voltage mismatch and the archive's transmittal) and Compose at the top of the tab (${editors})`);
  // Compose prefilled with the record
  await click('Compose');
  await waitText('Linked record');
  const subject = await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.value && x.value.startsWith('[RMC-04] SUB-088')); return i ? i.value : ''; });
  check(subject === '[RMC-04] SUB-088 — Patient room card-reader door hardware schedule (Rev 1)', `Compose subject carries the submittal's title (${subject})`);
  check(await has('Kenji Takahashi') && await has('SUB-088.pdf'), 'To = the assignee (Kenji), the record PDF attached');
  // D-76: the contract's turnaround in the project calendar
  const due = await page.evaluate(() => { const d = [...document.querySelectorAll('input')].find((i) => /\d\d\/\d\d\/\d{4}/.test(i.value)); const n = document.querySelector('[data-turnaround]'); return { date: d ? d.value : '', note: n ? n.textContent.trim() : '' }; });
  check(due.date === '11/02/2026', `Response due defaults to ten working days with the 23 Oct closure skipped (${due.date})`);
  check(due.note.startsWith('Per the contract: 10 working days for a submittal (General conditions §3.12)'), `the rule is named under the field (${due.note.slice(0, 60)}…)`);
  await page.keyboard.press('Escape');
  await sleep(500);
  // reply from the tab
  await typeMessage('Valerie, the 24V revision is attached again; please acknowledge by Tuesday.');
  await click('Send');
  await waitText('Sent. Replies land on this tab.');
  check(await has('Sent. Replies land on this tab.') && await has('the 24V revision is attached again'), 'a reply from the tab lands on the thread');
  await page.screenshot({ path: `${out}/records-sub-email.png` });

  // --- PCO-019 (PM): Pending, two threads (one from the archive), amount for canSeeCost
  await page.goto(`${base}/?p=correspondence-context-co&theme=light&chrome=0#PCO-019/email`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Email about PCO-019');
  check(await has('Pending owner approval') && await has('imaging suite chiller pad vibration isolators'), 'PCO-019: Pending owner approval in the title bar');
  check(await has('Vibration isolator pricing backup') && await has('Card-reader door hardware voltage mismatch'), 'Email tab lists both threads linked to PCO-019 (the archive one too)');
  await tab('Details');
  await sleep(300);
  check(await has('$18,450') && await has('Owner directive') && await has('12 days'), 'Details: amount (PM may see cost), reason, schedule impact');
  await page.screenshot({ path: `${out}/records-co-details.png` });

  // --- the thread's Linked items open the record
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1031`, { waitUntil: 'networkidle0' });
  await waitText('Linked items');
  await click('SUB-088 · Rev 1');
  await sleep(800);
  check(page.url().includes('correspondence-context-sub') && await has('Patient room card-reader door hardware schedule'), 'the thread\'s Linked items open the submittal');

  // --- guest (Dave): no threads on SUB-088, no cost on PCO-019
  await page.goto(`${base}/?p=correspondence-context-sub&theme=light&chrome=0#SUB-088/email`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { window.sessionStorage.clear(); window.sessionStorage.setItem('linarc-prototypes:session:v1', JSON.stringify({ settings: { role: 'guest_sub' } })); });
  await page.reload({ waitUntil: 'networkidle0' });
  await waitText('Email about SUB-088');
  await sleep(600);
  const guestText = await page.evaluate(() => document.body.innerText.replace(/[\n\r\t ]+/g, ' '));
  check(guestText.includes('No email on this submittal yet') && !guestText.includes('Confidential') && !guestText.includes('transmittal'), `guest: none of the PM's threads (Dave is on neither) (${guestText.slice(guestText.indexOf('Email about'), guestText.indexOf('Email about') + 120)})`);
  await page.goto(`${base}/?p=correspondence-context-co&theme=light&chrome=0#PCO-019`, { waitUntil: 'networkidle0' });
  await waitText('Owner directive');
  check(!(await has('$18,450')), 'guest: no amount');
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

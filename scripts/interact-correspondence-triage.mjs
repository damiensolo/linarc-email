// Interaction check for the Email screen's triage (D-72, 2026-11-14): a thread's owner (the title bar's select, an
// @mention in a note), Send reminder (the modal, the reminder on the thread and the Delivery tab with its count), Mark
// resolved and Reopen (the title bar and the reading pane), Follow up (the modal, the date on the thread, the Follow up
// view and the list row's signal), the Assigned to me view and the Owner column, and Mark resolved as a bulk action in
// the list bar. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-triage.mjs <port> <out-dir>
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
    if (!target) throw new Error('no composer editor');
    await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await target.click();
    await page.keyboard.type(text);
    await sleep(700);
  };
  const openSelect = async (match) => {
    const found = await page.evaluate((match) => { const i = [...document.querySelectorAll('input')].find((i) => i.offsetParent && (i.placeholder === match || i.getAttribute('aria-label') === match || i.value === match)); if (!i) return false; i.scrollIntoView({ block: 'center' }); return true; }, match);
    if (!found) return false;
    await sleep(300);
    return page.evaluate((match) => { const i = [...document.querySelectorAll('input')].find((i) => i.offsetParent && (i.placeholder === match || i.getAttribute('aria-label') === match || i.value === match)); i.focus(); i.click(); return true; }, match);
  };
  // a SelectV2 option, as the thread script clicks it
  const pickOption = async (label) => { await click(label, 'li, [role="option"], span, div'); };
  // SelectV2 keeps its value in its input; the owner select is the one in `.owner-select`
  const ownerValue = () => page.evaluate(() => { const i = [...document.querySelectorAll('.owner-select input')].find((i) => i.offsetParent); return i ? i.value : null; });
  const headerText = () => page.evaluate(() => { const h = document.querySelector('header, .app-header, [class*="title-bar"]'); return (h ? h.innerText : '').replace(/\s+/g, ' '); });
  const viewsPane = () => page.evaluate(() => [...document.querySelectorAll('.vp-root [role="listbox"] [role="option"]')].map((o) => `${o.textContent.replace(/\s+/g, ' ').trim()}${o.getAttribute('aria-selected') === 'true' ? '*' : ''}`));
  const clickPane = async (text) => { await page.evaluate((t) => { const b = [...document.querySelectorAll('.vp-root button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(t)); if (!b) throw new Error(`no pane row ${t}`); b.click(); }, text); await sleep(500); };
  const listRows = () => page.evaluate(() => [...document.querySelectorAll('.tl-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  const clickRow = async (text) => { const ok = await page.evaluate((t) => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes(t)); if (!r) return false; r.click(); return true; }, text); if (!ok) throw new Error(`no list row "${text}"`); await sleep(700); };
  const tick = async (text) => { await page.evaluate((t) => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes(t)); r.querySelector('.tl-check input').click(); }, text); await sleep(300); };
  const paneActions = () => page.evaluate(() => [...document.querySelectorAll('[aria-label="Thread actions"] button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  const paneMeta = () => page.evaluate(() => { const h = document.querySelector('[aria-label="Reading pane"] header'); return h ? h.innerText.replace(/\s+/g, ' ') : ''; });
  const waitRows = async () => { for (let i = 0; i < 25; i += 1) { if (await page.evaluate(() => document.querySelectorAll('.tl-row').length)) return; await sleep(200); } };
  const reset = async () => { await page.evaluate(() => window.sessionStorage.clear()); };

  // --- Thread screen: the title bar's triage actions on a thread that waits on someone (THR-1028 is resolved, so start with a waiting one)
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1042`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Dave Miller');
  check((await ownerValue()) === 'Alex Morgan', `THR-1042's owner is Alex Morgan (${await ownerValue()})`);
  let b = await buttons();
  check(b.includes('Mark resolved') && b.includes('Follow up') && !b.includes('Send reminder'), `title bar: Mark resolved and Follow up; no reminder while the thread needs our action (${b.filter((x) => /resolved|Follow|reminder|Reopen/.test(x)).join(' | ')})`);

  // Owner select: hand it to Carlos
  check(await openSelect('Alex Morgan'), 'opened the Owner select');
  await pickOption('Carlos Reyes');
  await waitText('Assigned to Carlos Reyes');
  check((await ownerValue()) === 'Carlos Reyes' && (await has('Assigned to Carlos Reyes by Sarah Jenkins')), 'the thread is assigned to Carlos: the select, the acknowledgement and the event row');

  // Mark resolved → Reopen
  await click('Mark resolved');
  await waitText('Marked resolved');
  b = await buttons();
  check((await has('Marked resolved by Sarah Jenkins')) && b.includes('Reopen') && !b.includes('Mark resolved'), 'Mark resolved: the event row, Resolved, and Reopen in its place');
  check(await page.evaluate(() => document.body.innerText.includes('Resolved')), 'Status chip reads Resolved');
  await click('Reopen');
  await waitText('Reopened by Sarah Jenkins');
  check((await has('Needs action')) && (await buttons()).includes('Mark resolved'), 'Reopen: back to Needs action (the last message is inbound), Mark resolved back');

  // Follow up
  await click('Follow up');
  check(await waitText('Follow up on this thread'), 'the follow-up modal opened with the next working day');
  await click('Set follow-up');
  await waitText('Follow up on');
  check(await has('Follow up on 19 Oct'), `follow-up set for Monday 19 Oct (acknowledged)`);
  check(await has('Follow up: 19 Oct'), 'the title bar shows the follow-up date');

  // A note that @mentions a team member hands them the thread
  await openSelect('Reply to all');
  await pickOption('Internal team note');
  await typeMessage('@Alex can you chase Dave on the sketch?');
  await click('Post note');
  await waitText('Note posted');
  check((await ownerValue()) === 'Alex Morgan' && (await has('Assigned to Alex Morgan by Sarah Jenkins (mentioned in a note)')), 'an @mention in a note assigns the thread to Alex');

  // Send reminder on a thread that waits on them: reply first, so the last message is ours
  await openSelect('Internal team note');
  await pickOption('Reply to all');
  await typeMessage('Dave, see RFI-143 for the sign-off path.');
  await click('Send');
  await waitText('Sent. Replies land in this thread.');
  b = await buttons();
  check(b.includes('Send reminder'), 'Send reminder appears once the thread waits on them');
  await click('Send reminder');
  check(await waitText('Send a reminder'), 'the reminder modal opened');
  const modal = await page.evaluate(() => { const ta = [...document.querySelectorAll('textarea')].find((t) => t.offsetParent); return { body: ta ? ta.value : '', text: document.body.innerText.replace(/\s+/g, ' ') }; });
  check(/^Reminder: we're still waiting on your reply/.test(modal.body) && /To Alex Morgan, Dave Miller/.test(modal.text) && /Reminders sent 0/.test(modal.text), `prefilled wording, the recipients and the count (${modal.body.slice(0, 60)}…)`);
  await click('Send reminder');
  await waitText('Reminder sent.');
  check((await has('Reminder sent. It is on the Delivery tab with the count.')), 'reminder acknowledged');
  check(await page.evaluate(() => [...document.querySelectorAll('[role="list"] article')].some((a) => a.innerText.includes('Reminder') && a.innerText.includes("we're still waiting"))), 'the reminder is a message on the thread marked Reminder');
  await click('Delivery');
  await sleep(300);
  check((await has('Reminder sent')) && (await has('Reminder 1 sent via the Linarc relay')), 'the Delivery tab lists Reminder sent with the count');
  await page.screenshot({ path: `${out}/triage-thread.png` });

  // --- Email screen: Assigned to me, the Owner column, Follow up view, the pane's actions, bulk Mark resolved
  await reset();
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitRows();
  await sleep(300);
  let views = await viewsPane();
  check(views.includes('Assigned to me3') && views.includes('Follow up1'), `views pane: Assigned to me 3 and Follow up 1 for the PM (${views.join(' | ')})`);
  await clickPane('Assigned to me');
  let rows = await listRows();
  check(rows.length === 3 && rows.every((r) => /SUB-088|PCO-019/.test(r)), `Assigned to me lists Sarah's three threads (${rows.length})`);
  await clickPane('Follow up');
  rows = await listRows();
  check(rows.length === 1 && rows[0].includes('SUB-088') && rows[0].includes('Overdue'), 'Follow up lists THR-1031 with its one signal (Overdue wins)');
  await clickPane('All');
  await clickRow('chiller pad anchor');
  await waitText('Thornton Structural Engineers');
  let actions = await paneActions();
  check(actions.includes('Reopen') && actions.includes('Follow up') && !actions.includes('Send reminder'), `pane header on a resolved thread: Reopen, Follow up (${actions.join(' | ')})`);
  check((await page.evaluate(() => { const i = document.querySelector('[aria-label="Reading pane"] .owner-select input'); return i ? i.value : null; })) === 'Alex Morgan', 'pane header shows the owner');
  await click('Follow up');
  await waitText('Follow up on this thread');
  await click('Set follow-up');
  await waitText('Follow up on 19 Oct');
  views = await viewsPane();
  check(views.includes('Follow up2'), `Follow up count went to 2 (${views.find((v) => v.startsWith('Follow up'))})`);
  await clickRow('Dave Miller');
  await waitText('Static pressure');
  actions = await paneActions();
  check(actions.includes('Mark resolved') && !actions.includes('Send reminder'), 'pane header on a Needs action thread: Mark resolved, no reminder');
  await click('Mark resolved');
  await waitText('Marked resolved. Nothing is owed on this thread.');
  views = await viewsPane();
  check(views.includes('Needs action3'), `Needs action went from 4 to 3 (${views.find((v) => v.startsWith('Needs action'))})`);
  // bulk: tick two Needs action rows and resolve them from the list bar
  await tick('Kenji Takahashi');
  await tick('Ray Castellano');
  const bar = await page.evaluate(() => [...document.querySelectorAll('.rv-listbar button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  check(bar.includes('Mark resolved'), `the list bar offers Mark resolved for ticked rows (${bar.join(' | ')})`);
  await click('Mark resolved', '.rv-listbar button');
  await sleep(800);
  views = await viewsPane();
  check(views.includes('Needs action1'), `bulk Mark resolved: Needs action down to 1 (${views.find((v) => v.startsWith('Needs action'))})`);
  await page.screenshot({ path: `${out}/triage-list.png` });

  // --- Compose: the reminder at the due date is on by default and shows on the new thread
  await click('Compose');
  await waitText('Send a reminder at the due date');
  check(await page.evaluate(() => { const l = [...document.querySelectorAll('label')].find((x) => x.textContent.includes('Send a reminder at the due date')); const i = l && (l.querySelector('input') || l.previousElementSibling); return !!(i && i.checked); }), 'the compose panel offers the due-date reminder, on by default');

  // --- Guest: none of it
  await reset();
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1042`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { window.sessionStorage.setItem('linarc-prototypes:session:v1', JSON.stringify({ settings: { role: 'guest_sub' } })); });
  await page.reload({ waitUntil: 'networkidle0' });
  await waitText('Dave Miller');
  b = await buttons();
  check(!b.includes('Mark resolved') && !b.includes('Follow up') && (await ownerValue()) === null, 'a guest sees no owner, resolve or follow-up');
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

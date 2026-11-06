// Interaction check for the Email screen's mail behaviours (D-67, 2026-11-06): the Reading view's Preview / List
// layout switch, unread rows (bold until opened; Mark as unread), the Drafts and Deleted folders (views pane and
// segments), Delete / Restore from the reading pane and from the table's selection toolbar (only Delete, Mark as
// unread, Mark as read; no cut / copy / paste / Deselect / Select all), a draft reopening the compose panel with its
// record, and the sticky reply footer in the pane and on the thread screen. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-mail.mjs <port> <out-dir>
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
  const base = `http://localhost:${port}`;
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
  /** The list's rows once the answer is in (the dev server may be busy): up to 5s. */
  const waitRows = async () => { for (let i = 0; i < 25; i += 1) { if (await page.evaluate(() => document.querySelectorAll('.tl-row').length)) return; await sleep(200); } };
  const waitText = async (t) => { for (let i = 0; i < 25; i += 1) { if (await has(t)) return true; await sleep(200); } return false; };
  const listRows = () => page.evaluate(() => [...document.querySelectorAll('.tl-row')].map((r) => ({ text: r.textContent.replace(/\s+/g, ' ').trim(), unread: r.getAttribute('data-unread') === 'true', list: r.classList.contains('tl-row--list') })));
  const viewsPane = () => page.evaluate(() => [...document.querySelectorAll('.vp-root [role="listbox"] [role="option"]')].map((o) => `${o.textContent.replace(/\s+/g, ' ').trim()}${o.getAttribute('aria-selected') === 'true' ? '*' : ''}`));
  const clickPane = async (text) => { await page.evaluate((t) => { const b = [...document.querySelectorAll('.vp-root button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(t)); if (!b) throw new Error(`no pane row ${t}`); b.click(); }, text); await sleep(500); };
  const clickRow = async (text) => { const ok = await page.evaluate((t) => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes(t)); if (!r) return false; r.click(); return true; }, text); if (!ok) throw new Error(`no list row "${text}"`); await sleep(600); };
  const paneSubject = () => page.evaluate(() => { const h = document.querySelector('[aria-label="Reading pane"] h2'); return h ? h.textContent.trim() : ''; });
  // icon buttons carry their name as aria-label (the design system's Tooltip shows it, D-68)
  const paneActions = () => page.evaluate(() => [...document.querySelectorAll('[aria-label="Thread actions"] button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  const barButtons = () => page.evaluate(() => [...document.querySelectorAll('.rv-listbar button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  const tick = async (text) => { await page.evaluate((t) => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes(t)); r.querySelector('.tl-check input').click(); }, text); await sleep(300); };
  const checkedRows = () => page.evaluate(() => document.querySelectorAll('.tl-row[data-checked]').length);
  const summary = () => page.evaluate(() => { const el = document.querySelector('.load-status'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const segment = async (label) => { await page.evaluate((l) => { const el = [...document.querySelectorAll('[aria-label="Email view"] button, [aria-label="Email view"] [role="radio"], [aria-label="Email view"] label')].find((x) => x.textContent.trim() === l); if (!el) throw new Error(`no segment ${l}`); el.click(); }, label); await sleep(500); };
  const checkRowWith = async (text) => { await page.evaluate((t) => { const r = [...document.querySelectorAll('.dg-list-row')].find((x) => x.textContent.includes(t)); if (!r) throw new Error(`no table row ${t}`); r.querySelector('.dg-list-cell--seq').click(); }, text); await sleep(300); };
  const checkRow = async (i) => { await page.evaluate((i) => document.querySelectorAll('.dg-list-row')[i].querySelector('.dg-list-cell--seq').click(), i); await sleep(300); };
  // icon buttons name themselves through aria-label (the design system Tooltip, P-070); no native title anywhere
  const toolbar = () => page.evaluate(() => [...document.querySelectorAll('.dg-toolbar--selection button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim() || `[${b.getAttribute('aria-label')}]`));
  const boldCells = () => page.evaluate(() => [...document.querySelectorAll('.dg-list-row [data-unread="true"]')].length);
  const stickyFlush = () => page.evaluate(() => {
    const send = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Send');
    if (!send) return { ok: false, why: 'no Send' };
    const footer = send.closest('.sticky');
    let el = footer && footer.parentElement; let scroller = null;
    while (el) { const cs = getComputedStyle(el); if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) { scroller = el; break; } el = el.parentElement; }
    if (!scroller) return { ok: false, why: 'no scroller' };
    scroller.scrollTop = 0;
    const f = footer.getBoundingClientRect(); const s = scroller.getBoundingClientRect(); const b = send.getBoundingClientRect();
    return { ok: Math.abs(f.bottom - s.bottom) <= 1 && b.bottom <= s.bottom && b.top >= s.top, footerBottom: Math.round(f.bottom), scrollerBottom: Math.round(s.bottom), scrollTop: scroller.scrollTop };
  });

  // --- Reading view: unread rows, the layout switch
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitRows();
  await sleep(300);
  const views = await viewsPane();
  check(views.includes('Drafts2') && views.includes('Deleted1') && views[0] === 'All12*', `views pane lists Drafts 2 and Deleted 1 after the triage views (${views.join(' | ')})`);
  let rows = await listRows();
  check(rows.length === 12 && rows.filter((r) => r.unread).length === 3 && rows.find((r) => r.text.includes('Kenji Takahashi')).unread && rows.find((r) => r.text.includes('Ray Castellano')).unread, `three unread rows read bold for the PM (${rows.filter((r) => r.unread).length})`);
  check(rows.every((r) => !r.list), 'Preview layout by default');
  await click('List', '.rv-listbar button, .rv-listbar [role="radio"], .rv-listbar label');
  rows = await listRows();
  check(rows.length === 12 && rows.every((r) => r.list), 'List layout: one-line rows');
  await page.screenshot({ path: `${out}/mail-list-layout.png` });
  await click('Preview', '.rv-listbar button, .rv-listbar [role="radio"], .rv-listbar label');
  check((await listRows()).every((r) => !r.list), 'back to Preview');

  // --- opening reads; Mark as unread restores the bold
  await clickRow('RFI-142');
  check((await paneSubject()).includes('RFI-142'), 'Kenji\'s thread opens in the pane');
  await sleep(600);
  rows = await listRows();
  check(!rows.find((r) => r.text.includes('Kenji Takahashi')).unread, 'opening it reads it: the row is no longer bold');
  check((await paneActions()).join(' · ') === 'Mark as unread · Delete · Open thread', `pane actions: ${(await paneActions()).join(' · ')}`);
  const flush = await stickyFlush();
  check(flush.ok, `the reply footer sticks flush to the pane's bottom (${JSON.stringify(flush)})`);
  await page.click('[aria-label="Thread actions"] button[aria-label="Mark as unread"]');
  await sleep(300);
  check((await listRows()).find((r) => r.text.includes('Kenji Takahashi')).unread, 'Mark as unread: the row is bold again');

  // --- the list bar (D-68): ticking rows shows the actions at the left, the layout control stays at the right
  check((await barButtons()).join(' · ') === 'Preview · List' && await page.evaluate(() => document.querySelectorAll('.tl-row .tl-check input').length === 12), 'every row has a checkbox; the bar shows only Preview · List until a row is ticked');
  await tick('Dave Miller');
  await tick('Sarah Jenkins');
  check((await checkedRows()) === 2 && (await paneSubject()).includes('RFI-142'), 'ticking two rows leaves the open thread as it was');
  check((await barButtons()).join(' · ') === 'Mark as unread · Mark as read · Delete · Preview · List' && await has('2 selected'), `bar: ${(await barButtons()).join(' · ')}, count line`);
  await page.hover('.rv-listbar button[aria-label="Mark as unread"]');
  await sleep(500);
  check(await page.evaluate(() => [...document.querySelectorAll('[role="tooltip"]')].some((t) => t.textContent.trim() === 'Mark as unread')) && !(await page.evaluate(() => document.querySelector('.rv-listbar button[title]'))), 'the icon shows the design system Tooltip, no native title');
  await page.click('.rv-listbar button[aria-label="Mark as unread"]');
  await sleep(400);
  rows = await listRows();
  check((await checkedRows()) === 0 && rows.find((r) => r.text.includes('Dave Miller')).unread && rows.find((r) => r.text.includes('Sarah Jenkins')).unread, 'Mark as unread from the bar: both rows bold, ticks cleared');
  await tick('Dave Miller');
  await tick('Sarah Jenkins');
  await page.click('.rv-listbar button[aria-label="Mark as read"]');
  await sleep(400);
  rows = await listRows();
  check(!rows.find((r) => r.text.includes('Dave Miller')).unread && !rows.find((r) => r.text.includes('Sarah Jenkins')).unread, 'Mark as read from the bar');
  await tick('Valerie Chen');
  await page.click('.rv-listbar button[aria-label="Delete"]');
  await sleep(800);
  check((await listRows()).length === 11 && (await viewsPane()).includes('Deleted2'), 'Delete from the bar: the row leaves, Deleted counts 2');
  await clickPane('Deleted');
  await tick('PCO-019');
  check((await barButtons()).join(' · ') === 'Mark as unread · Mark as read · Restore · Preview · List', `Deleted folder bar: ${(await barButtons()).join(' · ')}`);
  await page.click('.rv-listbar button[aria-label="Restore"]');
  await sleep(800);
  check((await listRows()).length === 1, 'Restore from the bar');
  await clickPane('All');
  await sleep(300);

  // --- Delete from the pane → Deleted folder → Restore
  await clickRow('RFI-142');
  await page.click('[aria-label="Thread actions"] button[aria-label="Delete"]');
  await sleep(800);
  check((await listRows()).length === 11 && !(await listRows()).some((r) => r.text.includes('RFI-142')) && (await viewsPane()).includes('Deleted2'), `Delete: the row leaves the inbox, Deleted counts 2 (${(await listRows()).length} rows)`);
  check((await paneSubject()) === '' && await has('Select an email to read it here.'), 'the pane empties after a delete');
  await clickPane('Deleted');
  check((await viewsPane()).includes('Deleted2*') && (await listRows()).length === 2 && (await listRows()).some((r) => r.text.includes('RFI-142')), `Deleted folder: 2 rows, Kenji's among them`);
  await clickRow('RFI-142');
  check((await paneActions()).join(' · ') === 'Mark as unread · Restore · Open thread' && await has('This email is in Deleted. Restore it to reply.'), 'a deleted thread in the pane: Restore, no reply');
  await page.screenshot({ path: `${out}/mail-deleted.png` });
  await page.click('[aria-label="Thread actions"] button[aria-label="Restore"]');
  await sleep(800);
  check((await listRows()).length === 1 && (await viewsPane()).includes('Deleted1*'), 'Restore: back to one deleted thread');
  await clickPane('All');
  check((await viewsPane())[0] === 'All12*' && (await listRows()).length === 12, 'All: 12 rows again');

  // --- Drafts folder: a draft opens the compose panel with its record
  await clickPane('Drafts');
  rows = await listRows();
  check(rows.length === 2 && rows.every((r) => r.text.startsWith('Draft')) && rows.some((r) => r.text.includes('Re: [RMC-04] RFI-142')) && rows.some((r) => r.text.includes('S-201 Rev 1 — Imaging suite')), `Drafts folder: ${rows.length} drafts (${rows.map((r) => r.text.slice(0, 40)).join(' | ')})`);
  check(await has('A draft opens in the compose panel. Pick one from the list.'), 'the pane says where a draft opens');
  await clickRow('Imaging suite');
  await sleep(700);
  check(await page.evaluate(() => !!document.querySelector('[role="dialog"]')) && await has('Linked record') && await has('S-201 · Rev 1') && (await page.evaluate(() => document.querySelector('input#fv2-subject').value)).includes('Imaging suite ceiling access panel'), 'the compose draft opens with S-201 pinned and its subject');
  check(await page.evaluate(() => { const fs = document.querySelectorAll('[role="dialog"] footer'); const f = fs[fs.length - 1]; /* FormV2 renders an empty footer of its own first */ return !!f && f.textContent.includes('Attachments') && [...f.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Send'); }), 'the compose footer holds Attachments and Send');
  await page.screenshot({ path: `${out}/mail-draft-compose.png` });
  await page.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] [aria-label="Close"]')].find((x) => x.offsetParent); b.click(); });
  await sleep(600);
  check((await listRows()).length === 2, 'closing keeps the draft');

  // --- the table: segments with the folders, the selection toolbar
  await page.click('button[aria-label="List"]');
  await sleep(600);
  check((await summary()) === '2 drafts', `List view in Drafts: ${await summary()}`);
  await segment('All');
  // Kenji's thread was read again when it was opened in the pane from Deleted, so two rows are unread here
  check((await summary()) === '12 threads' && (await boldCells()) === 4, `All: 12 threads, 2 unread rows bold in Subject and From (${await boldCells()} cells)`);
  await checkRow(0);
  await checkRow(2);
  let tb = await toolbar();
  check(tb.includes('[Delete]') && tb.includes('Mark as unread') && tb.includes('Mark as read') && !tb.some((t) => /Cut|Copy|Paste|Deselect|Select All/.test(t)), `selection toolbar: ${tb.join(' · ')}`);
  check(await page.evaluate(() => ![...document.querySelectorAll('.dg-toolbar--selection button, .rv-listbar button, [aria-label="Thread actions"] button')].some((b) => b.getAttribute('title'))), 'no native title tooltips on the email actions (P-070)');
  await page.screenshot({ path: `${out}/mail-table-selection.png` });
  await click('Mark as unread');
  await sleep(500);
  check((await boldCells()) === 8 && (await toolbar()).length === 0, `Mark as unread on two rows: 4 unread (${await boldCells()} cells), selection cleared`);
  await checkRow(0);
  await click('Mark as read');
  await sleep(500);
  check((await boldCells()) === 6, `Mark as read: 3 unread (${await boldCells()} cells)`);
  await checkRow(5);
  await page.evaluate(() => document.querySelector('.dg-toolbar--selection button[aria-label="Delete"]').click());
  await sleep(900);
  check((await summary()) === '11 threads', `Delete from the toolbar: ${await summary()}`);
  await segment('Deleted');
  check((await summary()) === '2 threads', `Deleted segment: ${await summary()}`);
  await checkRowWith('PCO-019'); // the one just deleted; the seeded deleted thread stays for the full-screen check below
  tb = await toolbar();
  check(tb.includes('Restore') && !tb.includes('[Delete]'), `Deleted folder toolbar: ${tb.join(' · ')}`);
  // the toolbar's Restore, not a row's (every deleted row has one as its action)
  await page.evaluate(() => [...document.querySelectorAll('.dg-toolbar--selection button')].find((b) => b.textContent.trim() === 'Restore').click());
  await sleep(400);
  await sleep(900);
  check((await summary()) === '1 thread', `Restore from the toolbar: ${await summary()}`);
  await segment('Drafts');
  check((await summary()) === '2 drafts' && (await buttons()).filter((b) => b === 'Edit').length === 2, 'Drafts segment: two Edit row actions');
  await segment('All');
  check((await summary()) === '12 threads', `All again: ${await summary()}`);
  // the Unread quick filter
  await page.click('button[aria-label="Filter"]');
  await sleep(500);
  const hasUnread = await page.evaluate(() => [...document.querySelectorAll('button, label, span')].some((e) => e.offsetParent && e.textContent.trim() === 'Unread'));
  check(hasUnread, 'the Filter panel offers an Unread quick filter');
  await page.keyboard.press('Escape');

  // --- the thread screen: sticky footer, read on open
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1042`, { waitUntil: 'networkidle0' });
  await sleep(700);
  const flush2 = await stickyFlush();
  check(flush2.ok, `the thread's reply footer sticks flush to the page's bottom (${JSON.stringify(flush2)})`);
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1050`, { waitUntil: 'networkidle0' });
  await sleep(700);
  check(await has('Ray Castellano'), "Ray's thread opened on the full screen");
  // the session remembers the switch to the table above, so the hash asks for the Reading pane
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0#reading`, { waitUntil: 'networkidle0' });
  await waitRows();
  await sleep(300);
  check(!(await listRows()).find((r) => r.text.includes('Ray Castellano')).unread, "opening Ray's thread on the full screen read it");
  await page.goto(`${base}/?p=correspondence-thread&theme=light&chrome=0#THR-1001`, { waitUntil: 'networkidle0' });
  const noticed = await waitText('This email is in Deleted');
  check(noticed && (await buttons()).includes('Restore') && !(await buttons()).includes('Send'), `a deleted thread on the full screen: the notice with Restore, no composer (${noticed}; ${(await buttons()).filter((b) => /Restore|Send/.test(b)).join(' · ')})`);

  // --- Reset
  await page.goto(`${base}/?p=correspondence-list&theme=light#reading`, { waitUntil: 'networkidle0' });
  await sleep(500);
  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await waitRows();
  await sleep(300);
  check((await viewsPane()).includes('Deleted1') && (await listRows()).filter((r) => r.unread).length === 3, 'Reset: one deleted thread, three unread rows');
} catch (e) {
  failed = true;
  console.log(`FAIL threw: ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { console.log('console errors:'); errors.forEach((e) => console.log('  ' + e)); failed = true; }
process.exit(failed ? 1 : 0);

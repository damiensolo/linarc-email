// Walks the Email demo exactly as docs/correspondence/demo-guide.md §3 writes it (Opener, Acts 1 to 3, Act 2b, the hybrid
// moment, Close), asserting every "Point at" the guide promises, in the guide's order and state: the counts at step 9
// are the counts after Act 1, not the reset counts. Needs the dev server. Run from the repo root:
//   node scripts/demo-correspondence-walkthrough.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(pathToFileURL(process.cwd() + '/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default;
const [port = '5177', out = '.'] = process.argv.slice(2);
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
// the "small photo on the desktop" of §2: a 1×1 PNG
const PNG = join(out, 'site-photo.png');
writeFileSync(PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
const errors = [];
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed = true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  const desktop = async () => page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await desktop();
  const base = `http://localhost:${port}`;

  // --- helpers (the same selectors the per-screen interaction scripts prove)
  const body = async () => page.evaluate(() => document.body.innerText);
  const has = async (s) => (await body()).includes(s);
  const buttons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim()).filter(Boolean));
  const labels = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label]')].filter((b) => b.offsetParent).map((b) => b.getAttribute('aria-label')));
  const isDisabled = (b) => b.disabled || b.getAttribute('aria-disabled') === 'true' || /disabled/.test(b.className);
  const disabled = async (text) => page.evaluate((text, fn) => { const all = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.textContent.trim() === text); const b = all[all.length - 1]; return b ? eval(fn)(b) : null; }, text, isDisabled.toString());
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
  const clickFirst = async (text, tag = 'button') => {
    const ok = await page.evaluate((text, tag) => {
      const el = [...document.querySelectorAll(tag)].find((e) => e.offsetParent !== null && e.textContent.trim() === text);
      if (!el) return false;
      el.click();
      return true;
    }, text, tag);
    if (!ok) throw new Error(`no visible "${text}"`);
    await sleep(400);
  };
  const clickAria = async (label) => { await page.evaluate((l) => { const b = [...document.querySelectorAll(`[aria-label="${l}"]`)].find((x) => x.offsetParent); if (!b) throw new Error(`no "${l}"`); b.scrollIntoView({ block: 'center' }); b.click(); }, label); await sleep(500); };
  const tab = async (label) => {
    const ok = await page.evaluate((label) => { const el = [...document.querySelectorAll('[role="tab"]')].find((t) => t.offsetParent && t.textContent.trim().startsWith(label)); if (!el) return false; el.click(); return true; }, label);
    if (!ok) throw new Error(`no tab "${label}"`);
    await sleep(400);
  };
  const dialog = () => page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  const esc = async () => { await page.keyboard.press('Escape'); await sleep(400); };
  const goto = async (q) => { await page.goto(`${base}/?p=${q}`, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready); await sleep(300); };
  const setRole = async (label) => {
    await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); i.focus(); i.click(); });
    await sleep(400);
    await click(label, 'li, [role="option"], span, div');
    await sleep(1200);
  };
  /** The composer is the product's editor (TextEditorV2, debounced): click into the visible one and type. */
  const typeMessage = async (text) => {
    const hs = await page.$$('.ProseMirror');
    let target = null;
    for (const h of hs) if (await h.evaluate((e) => !!e.offsetParent)) target = h;
    if (!target) throw new Error('no composer editor');
    await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await target.click();
    await page.keyboard.type(text);
    await sleep(1500);
  };
  /** RecipientField: focus the visible To input, type, and pick the option whose text includes `optionText`. */
  const recipientInput = () => page.evaluate(() => { const i = [...document.querySelectorAll('.rf input')].find((x) => x.offsetParent); if (!i) return false; i.focus(); return true; });
  const pickRecipient = async (typed, optionText) => {
    if (!(await recipientInput())) throw new Error('no To field');
    await page.keyboard.type(typed);
    await sleep(400);
    const ok = await page.evaluate((t) => { const o = [...document.querySelectorAll('[role="listbox"] [role="option"]')].find((e) => e.textContent.includes(t)); if (!o) return false; o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); return true; }, optionText);
    if (!ok) throw new Error(`no recipient option "${optionText}"`);
    await sleep(300);
  };
  const chips = () => page.evaluate(() => [...document.querySelectorAll('.rf-chip')].filter((c) => c.offsetParent).map((c) => c.textContent.replace(/\s+/g, ' ').trim()));
  /** A SelectV2 in the open modal, found by the start of its current value (its label is not a <label>): open it
      (climbing the input's parents on retries, the input is read-only without search), optionally type to filter,
      then click the option whose text starts with `option`. */
  const pickSelect = async (valuePrefix, option, typed) => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.evaluate((valuePrefix, attempt) => {
        let el = [...document.querySelectorAll('[role="dialog"] input')].find((i) => i.offsetParent && i.value.startsWith(valuePrefix));
        if (!el) throw new Error(`no select showing "${valuePrefix}"`);
        for (let i = 0; i < attempt; i += 1) el = el.parentElement;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.click();
      }, valuePrefix, attempt);
      await sleep(400);
      if (typed) { await page.keyboard.type(typed); await sleep(400); }
      const found = await page.evaluate((text) => {
        const els = [...document.querySelectorAll('[role="option"], li, span, div')].filter((e) => e.offsetParent !== null && e.children.length === 0 && e.textContent.trim().startsWith(text));
        const el = els[els.length - 1];
        if (!el) return false;
        el.click();
        return true;
      }, option);
      if (found) { await sleep(300); return; }
    }
    throw new Error(`could not pick "${option}" in the select showing "${valuePrefix}"`);
  };
  const dialogValues = () => page.evaluate(() => [...document.querySelectorAll('[role="dialog"] input')].filter((i) => i.offsetParent).map((i) => i.value));
  // Reading view (D-65)
  const viewsPane = () => page.evaluate(() => [...document.querySelectorAll('.vp-root [role="listbox"] [role="option"]')].map((o) => `${o.textContent.replace(/\s+/g, ' ').trim()}${o.getAttribute('aria-selected') === 'true' ? '*' : ''}`));
  const listRows = () => page.evaluate(() => [...document.querySelectorAll('.tl-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  const clickPane = async (text) => { await page.evaluate((t) => { const b = [...document.querySelectorAll('.vp-root button')].find((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(t)); if (!b) throw new Error(`no pane row ${t}`); b.click(); }, text); await sleep(400); };
  const clickRow = async (text) => { const ok = await page.evaluate((t) => { const r = [...document.querySelectorAll('.tl-row')].find((x) => x.textContent.includes(t)); if (!r) return false; r.click(); return true; }, text); if (!ok) throw new Error(`no list row "${text}"`); await sleep(500); };
  const paneSubject = () => page.evaluate(() => { const h = document.querySelector('[aria-label="Reading pane"] h2'); return h ? h.textContent.trim() : ''; });
  const filterBadge = () => page.evaluate(() => { const b = document.querySelector('button[aria-label="Filter"]'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const viewActive = (title) => page.evaluate((t) => { const b = document.querySelector(`button[aria-label="${t}"]`); return !!b && b.className.includes('surface-container'); }, title);
  const summary = () => page.evaluate(() => { const el = document.querySelector('.load-status'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; });
  /** A row action (Open, Link to record) in the table row whose text includes `rowText`. */
  const clickInRow = async (rowText, buttonText) => {
    const ok = await page.evaluate((rowText, buttonText) => {
      const bs = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.textContent.trim() === buttonText);
      const b = bs.find((x) => { const row = x.closest('.dg-list-row'); return row && row.textContent.includes(rowText); });
      if (!b) return false;
      b.click();
      return true;
    }, rowText, buttonText);
    if (!ok) throw new Error(`no "${buttonText}" in a row with "${rowText}"`);
    await sleep(500);
  };
  const headers = () => page.evaluate(() => [...document.querySelectorAll('.dg-list-header-cell')].map((h) => h.textContent.trim().toUpperCase()).filter(Boolean));
  /** Sandbox › Simulate inbound email, as §3 describes it. */
  const simulateInbound = async ({ from, to, subject, text, file }) => {
    await click('Simulate inbound email');
    await sleep(500);
    check(await dialog() && (await dialogValues()).some((v) => v.startsWith('Project address')), `Simulate inbound: modal open, destination defaults to the project address (${(await dialogValues()).join(' | ')})`);
    await pickSelect('Dave Miller', from); // From defaults to the first guest
    if (to) await pickSelect('Project address', to); // every thread is rendered; typing would append to the shown value
    if (subject) { await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && x.placeholder === 'What the mail is about'); i.focus(); }); await page.keyboard.type(subject); }
    await page.evaluate(() => { const t = document.querySelector('#fv2-simulate-inbound-body, #simulate-inbound-body, textarea[placeholder="The mail as the sender wrote it"]'); t.focus(); });
    await page.keyboard.type(text);
    if (file) await pickSelect('No attachment', file);
    await click('Receive');
    await sleep(800);
  };

  // ===== §2 Before the demo: reset, Drawings sheet, 1440 light
  await goto('correspondence-context-dwg&theme=light#A-302-Rev3');
  // Reset demo data shows only once something changed (App.vue `demoChanged`); a fresh profile has nothing to reset.
  if ((await buttons()).includes('Reset demo data')) {
    await click('Reset demo data');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await sleep(600);
  }
  check(await has('A-302 · Level 3 Reflected Ceiling Plan') && await has('1 markup on this sheet'), 'Opener: the Drawings sheet with its single markup');

  // ===== Act 1 · From the drawing to a consultant's phone
  // 1: the cloud at Grid B-4
  await page.evaluate(() => document.querySelector('button.sheet-pin').click());
  await sleep(500);
  check(await has('Grid B-4 · Corridor 3E') && await has('18" HVAC trunk duct clashes') && (await buttons()).includes('Email about this markup'), "1 popover: the markup's text, author, time and two actions");
  // 2: Email about this markup
  await click('Email about this markup');
  await sleep(600);
  check(await has('Linked record') && await has('A-302 · Rev 3') && await page.evaluate(() => !!document.querySelector('.dpp-thumb--md svg')), '2 panel: Linked record A-302 · Rev 3 with the cropped markup preview');
  // 3: To: suggested first; `ken` + Enter → an amber chip
  check(await recipientInput(), '3 To field focused');
  await sleep(400);
  const firstOptions = await page.evaluate(() => [...document.querySelectorAll('[role="listbox"] [role="option"]')].slice(0, 3).map((o) => o.textContent.replace(/\s+/g, ' ').trim()));
  check(firstOptions.length === 3 && /Kenji/.test(firstOptions[0]) && firstOptions.some((o) => /Dave/.test(o)) && firstOptions.some((o) => /Elena/.test(o)), `3 suggested recipients first (architect, HVAC sub, structural engineer): ${firstOptions.map((o) => o.slice(0, 22)).join(' | ')}`);
  await page.keyboard.type('ken');
  await sleep(300);
  await page.keyboard.press('Enter');
  await sleep(300);
  check((await chips()).some((c) => c.includes('Kenji')), `3 Kenji is a To chip (${(await chips()).join(' | ')})`);
  // 4: Marcus from the list; an unknown address stays out (D-60)
  await pickRecipient('mar', 'Marcus Vance');
  check((await chips()).some((c) => c.includes('Marcus')), '4 Marcus Vance picked as a chip');
  if (!(await recipientInput())) throw new Error('no To field');
  await page.keyboard.type('p.ortiz@acme-glazing.com');
  await sleep(300);
  check(await has("p.ortiz@acme-glazing.com isn't in the project directory") && await has('add them in My Team › Guests first'), '4 unknown address: the directory line, nothing created');
  await page.keyboard.press('Enter');
  await sleep(300);
  check((await chips()).length === 2, `4 Enter adds no chip (${(await chips()).length} chips)`);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
  await sleep(200);
  // 5: the paperclip, the file chip, the tool row, the help line
  const tools = await labels();
  check(['Attach file', 'Attach link', 'Choose from cloud drive', 'Attach a record'].every((l) => tools.includes(l)), `5 tool row: paperclip, link, cloud drive, record (${tools.filter((l) => /Attach|Choose/.test(l)).join(' | ')})`);
  check(!(await has('RFI-143.pdf')) && !(await has('A-302.pdf')), '5 no record PDF pre-attached when composing from a drawing');
  const fileInput = await page.$('[role="dialog"] input[type="file"]');
  await fileInput.uploadFile(PNG);
  await sleep(600);
  check(await has('site-photo.png'), '5 the photo becomes a chip with its name and size');
  // the size rule is the tooltip on the ⓘ beside Attachments, not a line under the chips
  const attachHelp = await page.evaluate(() => { const s = [...document.querySelectorAll('[aria-label^="About attachments."]')].find((x) => x.offsetParent); return s ? s.getAttribute('aria-label') : ''; });
  check(attachHelp.includes('Files over 20 MB are delivered by secure link'), `5 the ⓘ beside Attachments: over 20 MB goes by secure link (${attachHelp.slice(0, 60)}…)`);
  await page.screenshot({ path: `${out}/demo-email-05-compose.png` });
  // 6: a line in Message, Send
  await typeMessage('Kenji, Marcus: can the cove profile shift 4" north at B-4?');
  await click('Send');
  await sleep(1200);
  check(await has('Sent with A-302 · Rev 3 at Grid B-4 · Corridor 3E pinned') && (await buttons()).includes('Open in Email'), '6 acknowledgement with the pin and Open in Email');
  // 7: the secure link page on a phone
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await goto('correspondence-portal&theme=light&chrome=0#tk-marcus-a302');
  check(await has('Alex Morgan') && await has('Response requested by') && await has('A-302 · Rev 3') && await has('Grid B-4 · Corridor 3E'), '7 sender, project, Response requested by, the pinned markup');
  check((await buttons()).includes('View the full sheet') && await has('Site_Walk_Corridor3E_Grid_B4.mp4') && await has('By secure link'), '7 View the full sheet; the Files tiles with the 45 MB video by secure link');
  await clickAria('Open Site_Walk_Corridor3E_Grid_B4.mp4');
  await sleep(500);
  check(await page.evaluate(() => !!document.querySelector('[role="dialog"] video')), '7 the video plays full screen');
  await esc();
  check(!(await dialog()), '7 viewer closed');
  await page.screenshot({ path: `${out}/demo-email-07-portal.png`, fullPage: true });
  // 8: reply from the phone; the thread on the desktop
  await page.evaluate(() => { const t = document.querySelector('textarea#fv2-portal-reply'); t.focus(); t.value = 'Shifting the baffle 4" north keeps STC-50; send me the revised cove detail.'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(300);
  await click('Send');
  await sleep(1200);
  check(await has('Reply sent'), '8 Reply sent');
  await desktop();
  await goto('correspondence-list&theme=light');
  const top = (await listRows())[0] || '';
  check(top.includes('Marcus Vance') && top.includes('Grid B-4 HVAC duct'), `8 Communication › Email: the top row is the clash thread with Marcus's reply (${top.slice(0, 60)})`);
  await clickRow('Grid B-4 HVAC duct');
  await click('Open thread');
  await sleep(600);
  check(await has('Shifting the baffle 4" north') && await has('Marcus Vance') && await has('Needs action'), "8 the thread: Marcus's reply as an entry, back in Needs action");
  await click('Delivery');
  check(await has('Streamed Site_Walk_Corridor3E_Grid_B4.mp4 from the secure link'), '8 Delivery: Streamed … from the secure link');
  await page.screenshot({ path: `${out}/demo-email-08-thread.png` });

  // ===== Act 2 · From an email to a formal RFI
  // 9: Communication in the top nav → the Email screen in the Reading pane
  // the top nav's tools are TopNavBar `.tools-item` divs, not buttons
  let navClicked = true;
  try { await clickFirst('Communication', '.tools-item'); await sleep(800); } catch (e) { navClicked = false; }
  check(navClicked && page.url().includes('p=correspondence-list'), `9 Communication in the top nav opens the Email screen (${page.url().split('?')[1]})`);
  if (!page.url().includes('p=correspondence-list')) await goto('correspondence-list&theme=light');
  await sleep(400);
  check(await viewActive('Reading pane') && !(await page.evaluate(() => document.querySelector('[aria-label="Email view"]'))), '9 it opens in the Reading pane view');
  const views = await viewsPane();
  check(views[0] === 'All13*' && views.includes('Needs action4') && views.includes('Overdue1') && views.includes('Unmatched1'), `9 Views pane after Act 1: All 13, Needs action 4, Overdue 1, Unmatched 1 (${views.join(' | ')})`);
  check(await page.evaluate(() => [...document.querySelectorAll('.vp-root label')].some((l) => l.textContent.trim() === 'RFI')), '9 the object-type checkboxes');
  const signals = (await listRows()).filter((r) => /Needs action|Overdue/.test(r)).length;
  // one signal per row (D-17): the overdue thread shows Overdue, not a second Needs action chip
  check((await listRows()).length === 13 && signals === 4, `9 conversation list: 13 rows, a chip only where action is owed (${signals})`);
  await clickPane('Overdue');
  check((await listRows()).length === 1 && (await filterBadge()).includes('1'), `9 Overdue → 1 row; the Filter badge reads ${await filterBadge()}`);
  await clickPane('Needs action');
  check((await listRows()).length === 4 && (await filterBadge()).includes('1'), `9 Needs action → 4 rows; Filter badge ${await filterBadge()}`);
  await clickRow('Grid B-4 HVAC duct');
  check((await paneSubject()).includes('Grid B-4 HVAC duct'), `9 the clash thread opens in the pane (${await paneSubject()})`);
  const sep = await page.$('[role="separator"]');
  const box = await sep.boundingBox();
  const before = Number(await page.evaluate((el) => el.getAttribute('aria-valuenow'), sep));
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 100, box.y + 200, { steps: 5 });
  await page.mouse.up();
  await sleep(200);
  const after = Number(await page.evaluate((el) => el.getAttribute('aria-valuenow'), sep));
  check(after > before, `9 the divider drags (${before} → ${after})`);
  await page.screenshot({ path: `${out}/demo-email-09-reading.png` });
  // the middle pane's Preview · List control (D-67) and the List layout's header checkbox (D-71): Needs action is still on, so 4 rows
  await page.evaluate(() => { const b = [...document.querySelectorAll('.rv-listbar button, .rv-listbar [role="radio"], .rv-listbar label')].find((x) => x.textContent.trim() === 'List'); b && b.click(); });
  await sleep(500);
  const headCells = await page.evaluate(() => [...document.querySelectorAll('.tl-head [role="columnheader"]')].map((c) => c.textContent.trim()).filter(Boolean));
  check((await page.evaluate(() => document.querySelectorAll('.tl-row--list').length)) === 4 && headCells.join(' · ') === 'From · Subject · Time', `9 List layout: one-line rows under the column header (${headCells.join(' · ')})`);
  await page.evaluate(() => document.querySelector('.tl-head input[type="checkbox"]').click());
  await sleep(400);
  const barLabels = await page.evaluate(() => [...document.querySelectorAll('.rv-listbar button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
  check(await has('4 selected') && (await page.evaluate(() => document.querySelectorAll('.tl-row[data-checked="true"]').length)) === 4 && barLabels.join(' · ') === 'Mark as unread · Mark as read · Delete · Preview · List', `9 the header checkbox ticks every row: 4 selected, the bar's actions (${barLabels.join(' · ')})`);
  await page.screenshot({ path: `${out}/demo-email-09-list-selected.png` });
  await page.evaluate(() => document.querySelector('.tl-head input[type="checkbox"]').click());
  await sleep(400);
  check((await page.evaluate(() => document.querySelectorAll('.tl-row[data-checked="true"]').length)) === 0 && (await paneSubject()).includes('Grid B-4 HVAC duct'), '9 a second click clears them; the thread stays open');
  await page.evaluate(() => { const b = [...document.querySelectorAll('.rv-listbar button, .rv-listbar [role="radio"], .rv-listbar label')].find((x) => x.textContent.trim() === 'Preview'); b && b.click(); });
  await sleep(400);
  check((await page.evaluate(() => !document.querySelector('.tl-head') && document.querySelectorAll('.tl-row--preview').length === 4)), '9 back to Preview: three-line rows, no header');
  await page.click('button[aria-label="List"]');
  await sleep(500);
  const hs = await headers();
  check(await page.evaluate(() => !!document.querySelector('[aria-label="Email view"]')) && ['STATUS', 'RESPONSE DUE', 'LINKED RECORD'].every((h) => hs.includes(h)), `9 List view: the table with Status, Response due and Linked record (${hs.join(', ')})`);
  await page.click('button[aria-label="Reading pane"]');
  await sleep(500);
  check(await viewActive('Reading pane') && (await paneSubject()).includes('Grid B-4 HVAC duct'), '9 back to the Reading pane with the thread still open');
  // 10: Open thread → summary, Source, the files
  await click('Open thread');
  await sleep(600);
  check(page.url().includes('THR-1042') && await has('Needs action') && await has('Summary') && (await buttons()).includes('Source'), '10 the thread: title bar, Needs action, Summary with Source');
  await click('Source');
  check(await page.evaluate(() => !!document.querySelector('.ts-highlight')), '10 Source highlights the message it came from');
  const opens = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Open "]')].filter((b) => b.offsetParent).map((b) => b.getAttribute('aria-label')));
  check(opens.length >= 3, `10 file tiles on the messages (${opens.join(' | ')})`);
  await clickAria(opens[0]);
  check(await dialog() && (await labels()).includes('Zoom in'), `10 the markup tile opens the viewer with zoom (${opens[0]})`);
  await clickAria('Next file');
  check(await page.evaluate(() => !!document.querySelector('[role="dialog"] video')) && (await labels()).some((l) => l.startsWith('Download')), '10 → the video, with Download');
  await esc();
  check(!(await dialog()), '10 Esc closes the viewer');
  await clickAria('Open Apex_W24_Beam_Penetration_Sketch_B4.pdf');
  check(await dialog() && await has('Apex_W24_Beam_Penetration_Sketch_B4.pdf'), "10 Apex's sketch opens in place");
  await esc();
  // 11: the internal note, and the guest's view
  check(await has('Internal team note') && await has('hold off on replying to Apex about the $4,200'), '11 the yellow Internal team note');
  await setRole('Subcontractor (guest)');
  const gb = await buttons();
  check(!(await has('hold off on replying to Apex')) && !gb.includes('Delivery') && !gb.includes('Promote to record'), '11 guest: note gone, Delivery gone, Promote gone');
  await setRole('GC project manager');
  check((await buttons()).includes('Promote to record'), '11 back as the PM');
  // 12: Promote to record
  // Dave's message is the first with Promote (Marcus's reply from Act 1 has one too, with nothing pre-filled)
  await clickFirst('Promote to record');
  await sleep(500);
  const question = await page.evaluate(() => { const t = document.querySelector('textarea#fv2-question'); return t ? t.value : ''; });
  check(question.startsWith('Per field coordination with Apex Mechanical') && await has('Drafted by AI') && (await disabled('Create RFI')) === true, "12 the panel beside Dave's message: five fields pre-filled, Drafted by AI chip, Create RFI disabled");
  await page.evaluate(() => { const t = document.querySelector('textarea#fv2-question'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
  await page.keyboard.type(' (see the attached sketch)');
  await page.keyboard.press('Tab'); // FormV2 reports the change when the field is left
  await sleep(400);
  const promoteState = await page.evaluate(() => { const t = document.querySelector('textarea#fv2-question'); return { tail: t ? t.value.slice(-30) : 'no textarea', edited: document.body.innerText.includes('Edited'), ai: document.body.innerText.includes('Drafted by AI') }; });
  check(promoteState.edited && !promoteState.ai && (await disabled('Create RFI')) === false, `12 after a change: chip reads Edited, Create RFI enabled (${JSON.stringify(promoteState)}, disabled=${await disabled('Create RFI')})`);
  await page.screenshot({ path: `${out}/demo-email-12-promote.png` });
  // 13: Create RFI
  await click('Create RFI');
  await sleep(1200);
  check(await has('RFI-143 created') && (await buttons()).includes('Open RFI-143') && await has('Promoted to RFI-143') && await has('Waiting on them'), '13 RFI-143 created · Open RFI-143; the event row; Waiting on them');
  check(await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.trim() === 'Linked items'); return !!b; }) || await has('RFI-143'), '13 Linked items show RFI-143');
  // 14: Open RFI-143
  await click('Open RFI-143');
  await sleep(800);
  check(page.url().includes('correspondence-context-rfi') && page.url().includes('RFI-143') && (await buttons()).includes('Route'), '14 the RFI with Route in the title bar');
  const tabLabels = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].filter((t) => t.offsetParent).map((t) => t.textContent.replace(/\d+/g, '').trim()));
  check(['Details', 'Q&A', 'Workflow', 'Email', 'Activity', 'Watchers'].every((l) => tabLabels.includes(l)), `14 tabs: ${tabLabels.join(' · ')}`);
  check(await has('Proposed solution') && await has('Custom details') && await has('Linked items'), '14 Details: question, proposed solution, custom details, linked items');
  check(!(await buttons()).includes('Compose'), '14 no Compose outside the Email tab');
  await tab('Email');
  check((await buttons()).includes('In Q&A · Step 1') && (await buttons()).includes('Compose'), "14 Email tab: Dave's message In Q&A · Step 1; Compose at the top");
  await click('Compose');
  await sleep(600);
  check(await has('Linked record') && await has('RFI-143.pdf') && (await chips()).some((c) => c.includes('Elena')), '14 compose from the RFI: Linked record RFI-143, To = Elena, Attach a PDF of RFI-143');
  const subj = await page.evaluate(() => { const i = document.querySelector('input#fv2-subject'); return i ? i.value : ''; });
  check(subj.includes('RFI-143'), `14 subject carries the RFI's name (${subj.slice(0, 50)})`);
  await page.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] [aria-label="Close"]')].find((x) => x.offsetParent); b.click(); });
  await sleep(500);
  check(!(await dialog()), '14 the panel closes (nothing sent)');

  // ===== Act 2b · The architect answers by email; the RFI closes
  await goto('correspondence-context-rfi&theme=light#RFI-142');
  const emailTab = await page.evaluate(() => { const t = [...document.querySelectorAll('[role="tab"]')].find((x) => x.offsetParent && x.textContent.trim().startsWith('Email')); return t ? t.textContent.trim() : ''; });
  check(/Email\s*1/.test(emailTab), `A Email tab count (${emailTab})`);
  await tab('Email');
  check(await has('Confirmed: run the lead-lined board') && (await buttons()).includes('Add to Q&A') && await has('Reply received'), "A Kenji's reply with Add to Q&A; Reply received in Activity");
  await click('Add to Q&A');
  await sleep(500);
  check(await has('Add as Step 3') && await has('Left out: Best regards, · Kenji') && await has('Shop_Drawing_Markup.pdf'), 'B the panel: Response, the sign-off left out, his PDF ticked');
  await click('Add as Step 3');
  await sleep(1000);
  check(await has('Added to RFI-142 Q&A as Step 3') && (await buttons()).includes('In Q&A · Step 3'), 'B the event and In Q&A · Step 3');
  await tab('Q&A');
  check(await has('Step 3 · Kenji Takahashi, AIA') && (await buttons()).includes('From email · View message'), 'B Q&A: Step 3 From email · View message');
  await click('Route');
  await sleep(400);
  check(await has('Review · Sarah Jenkins'), 'C Route dialog: Review · Sarah Jenkins');
  await click('Route');
  await sleep(1000);
  const reviewButtons = await buttons();
  check(await has('Routed to Review') && ['Reject', 'Revise', 'Approve'].every((b) => reviewButtons.includes(b)), 'C Answered; Reject · Revise · Approve offered');
  await click('Revise');
  await sleep(400);
  const notifyOn = await page.evaluate(() => { const c = [...document.querySelectorAll('input[type="checkbox"]')].find((x) => x.closest('div') && x.closest('div').textContent.includes('Notify them by email')); return c ? c.checked : null; });
  check(notifyOn === true, 'D Notify them by email already ticked');
  await click('Revise');
  await sleep(1200);
  check(await has('Returned for revision to Kenji Takahashi, AIA, by email.') && (await buttons()).includes('Open in Email'), 'D Returned for revision … by email, Open in Email');
  await tab('Workflow');
  check(await has('Returned') && await has('Returned for revision · emailed'), 'D Workflow: Respond is Returned; Activity: Returned for revision · emailed');
  await click('Route'); await click('Route'); await sleep(1000);
  await click('Approve'); await click('Approve'); await sleep(1000);
  check(await has('Approved. The RFI is ready to close.') && (await buttons()).includes('Close'), 'E Approved; Close offered');
  await click('Close'); await click('Close RFI'); await sleep(1000);
  check(await has('Closed.'), 'E Closed');
  await tab('Email');
  check((await disabled('Compose')) === true, 'E Closed RFI: Compose disabled');
  await page.screenshot({ path: `${out}/demo-email-2b-closed.png` });

  // ===== Act 3 · Mail that arrives on its own, and mail that failed
  // 15: Ray emails the project address
  await goto('correspondence-list&theme=light');
  await simulateInbound({ from: 'Ray Castellano · SunState Drywall & Framing', subject: 'Door frames waiting on reader box size', text: 'Alex, the Level 2 door frames are on hold until we get the reader box size from the hardware sub. Photo attached.', file: 'IMG_5120_Site_Photo.jpg' });
  // the receipt is a line in the sandbox bar with an Open link (App.vue `received`)
  const openLink = () => page.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.offsetParent && a.textContent.trim() === 'Open'));
  check(await has('Received on THR-') && await has('(Unmatched)') && await openLink(), '15 Received on THR-… (Unmatched), with Open');
  await click('Open', 'a');
  await sleep(800);
  // the thread screen says "No linked items"; Unmatched is the Email screen's view of the same fact
  check(page.url().includes('correspondence-thread') && await has('Door frames waiting on reader box size') && await has('Ray Castellano') && await has('No linked items') && (await labels()).includes('Open IMG_5120_Site_Photo.jpg'), "15 Ray's thread: his photo, No linked items");
  await clickAria('Open IMG_5120_Site_Photo.jpg');
  check(await dialog(), '15 the photo full screen');
  await esc();
  await goto('correspondence-list&theme=light');
  check((await viewsPane()).includes('Unmatched2'), `15 the Views pane: Unmatched 2 (${(await viewsPane()).join(' | ')})`);
  // 16: List view › Unmatched › Link to record on Ray's row
  await page.click('button[aria-label="List"]');
  await sleep(500);
  await click('Unmatched');
  // the total also counts the thread Act 1 sent and the revision email of Act 2b
  check(/^2 of 1[45] threads$/.test(await summary()), `16 List view, Unmatched: ${await summary()}`);
  await clickInRow('Door frames waiting', 'Link to record');
  check(await dialog(), '16 Link to record modal');
  await page.evaluate(() => document.querySelector('[role="dialog"] input[role="combobox"]').focus());
  await page.keyboard.type('sub');
  await sleep(300);
  await page.keyboard.press('Enter');
  await sleep(300);
  await click('Link');
  await sleep(800);
  check(/^1 of 1[45] threads$/.test(await summary()), `16 Ray's row leaves Unmatched (${await summary()})`);
  await click('All');
  check(await has('[RMC-04] SUB-088 — Door frames waiting'), '16 the subject gained the record prefix');
  await page.screenshot({ path: `${out}/demo-email-16-linked.png` });
  // 17: Overdue › THR-1031: Delivery failed → Update contact and resend
  await click('Overdue');
  check(/^1 of 1[45] threads$/.test(await summary()), `17 Overdue: ${await summary()}`);
  await clickInRow('Card-reader door hardware voltage mismatch', 'Open');
  await sleep(600);
  check(page.url().includes('THR-1031') && await has('Confidential') && await has('Delivery failed') && (await buttons()).includes('Update contact and resend'), '17 THR-1031: Confidential, Delivery failed, the notice with its action');
  await click('Update contact and resend');
  const prefilled = await page.evaluate(() => { const i = [...document.querySelectorAll('[role="dialog"] input')].find((i) => i.value.includes('@')); return i ? i.value : ''; });
  check(prefilled === 'vchen@riversidehealth.org', `17 corrected address pre-filled (${prefilled})`);
  await click('Update and resend');
  await sleep(1000);
  check(await has('Contact updated and message resent') && !(await buttons()).includes('Update contact and resend') && await has('Resent'), '17 resent, notice gone');
  await click('Delivery');
  check(await has('Contact updated') && await has('Sent'), '17 Delivery: Contact updated, Sent');

  // ===== The hybrid moment
  await simulateInbound({ from: 'Alex Morgan · Vanguard', to: 'Reply to THR-1042', text: 'Dave, RFI-143 is with Thornton; hold fabrication until Elena answers.' });
  check(await has('Received on THR-1042') && await openLink(), '18 received on THR-1042, with Open');
  await click('Open', 'a');
  await sleep(800);
  check(page.url().includes('THR-1042') && await has('hold fabrication until Elena answers') && await has('Waiting on them'), "18 Alex's reply on the thread; Waiting on them");
  await click('Delivery');
  check(await has("from the sender's own mailbox") && await has("Relayed to the thread's guests"), "18 Delivery: Reply received … from the sender's own mailbox; Relayed to the thread's guests");
  await page.screenshot({ path: `${out}/demo-email-18-hybrid.png` });

  // ===== Close: Reset demo data
  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(800);
  await goto('correspondence-list&theme=light');
  check((await viewsPane())[0] === 'All12*', `Reset: back to 12 threads (${(await viewsPane()).join(' | ')})`);
} catch (e) {
  failed = true;
  console.log(`FAIL threw: ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
process.exit(failed ? 1 : 0);

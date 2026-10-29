// Walks the Notifications demo exactly as docs/notifications/overview-and-demo.md §6 writes it (Parts A to E, Reset),
// asserting every "See" the guide promises, and checks the sandbox bar stays usable while a panel is open (the
// compose panel and the drawer start under the bar: --sandbox-offset, F-029). Needs the dev server. Run from the repo
// root:  node scripts/demo-notifications-walkthrough.mjs <port> <out-dir>
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
  await page.goto(`${base}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const clickText = async (text, tags = 'button, [role="option"], [role="menuitem"], li, span, div, label, a') => {
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
  const visibleButtons = async () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim()));
  const bell = async () => page.evaluate(() => { const el = document.querySelector('[aria-label^="Notifications:"]'); return el ? el.getAttribute('aria-label') : ''; });
  const openDrawer = async () => { await page.evaluate(() => document.querySelector('[aria-label^="Notifications:"]').click()); await sleep(700); };
  const drawerOpen = async () => page.evaluate(() => !!document.querySelector('[role="dialog"][aria-labelledby]') && document.body.innerText.includes('All projects'));
  const cards = async () => page.evaluate(() => [...document.querySelectorAll('[role="dialog"] article')].filter((a) => a.offsetParent).map((a) => a.getAttribute('aria-label')));
  const cardText = async (title) => page.evaluate((title) => { const c = [...document.querySelectorAll('[role="dialog"] article')].find((a) => a.offsetParent && (a.getAttribute('aria-label') || '').includes(title)); return c ? c.innerText : ''; }, title);
  const clickIn = async (title, buttonText) => {
    let done = false;
    for (let i = 0; i < 10 && !done; i += 1) { // the drawer's cards load through a LoadRegion: wait for the card
      done = await page.evaluate((title, buttonText) => {
        const card = [...document.querySelectorAll('[role="dialog"] article')].find((a) => a.offsetParent && (a.getAttribute('aria-label') || '').includes(title));
        const b = card && [...card.querySelectorAll('button')].find((x) => x.textContent.trim() === buttonText);
        if (!b) return false;
        b.click();
        return true;
      }, title, buttonText);
      if (!done) await sleep(300);
    }
    if (!done) {
      await page.screenshot({ path: `${out}/demo-fail.png` });
      throw new Error(`no "${buttonText}" in the card "${title}" (drawer open: ${await drawerOpen()}; cards: ${(await cards()).join(' | ')}; page: ${(await body()).replace(/\s+/g, ' ').slice(0, 500)})`);
    }
    await sleep(400);
  };
  const setRole = async (label) => {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Viewing as'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText(label);
    await sleep(900);
  };
  /** Esc closes an open menu first and the drawer next (the panel leaves Esc to a dropdown inside it), so press until closed. */
  const closeDrawer = async () => { for (let i = 0; i < 3 && (await drawerOpen()); i += 1) { await page.keyboard.press('Escape'); await sleep(450); } };
  /** Open a SelectV2 by its input's placeholder and pick an option by text; the input is read-only when search is off,
      so the trigger around it is clicked on retries (as interact-notifications-prefs.mjs does). */
  const pickOption = async (placeholder, option) => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.evaluate((p, attempt) => {
        let el = [...document.querySelectorAll('input')].find((i) => i.placeholder === p);
        for (let i = 0; i < attempt; i += 1) el = el.parentElement;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.click();
      }, placeholder, attempt);
      await sleep(400);
      const found = await page.evaluate((text) => {
        const els = [...document.querySelectorAll('[role="option"], li, span, div')].filter((e) => e.offsetParent !== null && e.textContent.trim() === text && e.children.length === 0);
        const el = els[els.length - 1];
        if (!el) return false;
        el.click();
        return true;
      }, option);
      if (found) { await sleep(300); return; }
    }
    throw new Error(`could not pick "${option}" in "${placeholder}"`);
  };
  /** Is the element whose text is `text` the thing the pointer would hit at its centre (not covered by an overlay)? */
  const hittable = async (text) => page.evaluate((text) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.trim() === text);
    if (!b) return 'missing';
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit && (hit === b || b.contains(hit)) ? 'yes' : `covered by ${hit ? hit.tagName + '.' + hit.className.toString().slice(0, 40) : 'nothing'}`;
  }, text);
  /** Sandbox › Simulate event: open the modal, pick the event whose label starts with `label` (the first event when
      omitted), Fire. The modal's SelectV2 input is read-only, so the trigger around it is clicked on retries. */
  const fireEvent = async (label) => {
    await clickText('Simulate event', 'button');
    await sleep(500);
    if (label) {
      let picked = false;
      for (let attempt = 0; attempt < 4 && !picked; attempt += 1) {
        await page.evaluate((attempt) => {
          const inputs = [...document.querySelectorAll('input')].filter((i) => i.offsetParent && !['Viewing as', 'Choose a prototype', 'Choose a record'].includes(i.placeholder));
          let el = inputs[inputs.length - 1];
          for (let i = 0; i < attempt; i += 1) el = el.parentElement;
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          el.click();
        }, attempt);
        await sleep(400);
        picked = await page.evaluate((label) => { const o = [...document.querySelectorAll('[role="option"], li, span, div')].filter((e) => e.offsetParent && e.children.length === 0 && e.textContent.trim().startsWith(label)); const el = o[o.length - 1]; if (!el) return false; el.click(); return true; }, label);
      }
      if (!picked) throw new Error(`event "${label}" not in the list`);
      await sleep(300);
    }
    await clickText('Fire', 'button');
    await sleep(800);
  };

  // --- Before you start: Reset, Viewing as Alex.
  await setRole('GC project engineer');

  // --- Part A, 1: the bell.
  check((await bell()).startsWith('Notifications: 2 need action, 1 critical, 1 not acknowledged'), `A1 bell: ${await bell()}`);

  // 2: the drawer.
  await openDrawer();
  const header = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? d.innerText.split('\n').slice(0, 8).join(' | ') : ''; });
  check(await drawerOpen() && await has('1 critical') && await has('All projects') && await has('RMC-04') && await has('1 critical, not acknowledged'), `A2 drawer: title badge, scope switch All projects / RMC-04, critical line (${header})`);
  check(await has('Needs action') && await has('Waiting') && await has('Updates') && await has('All'), 'A2 tabs');
  check((await hittable('Simulate event')) === 'yes', `A2 the sandbox bar stays usable under the drawer: ${await hittable('Simulate event')}`);
  await page.screenshot({ path: `${out}/demo-a2-drawer.png` });

  // 3: the Critical card, read aloud.
  const crit = await cardText('Respond RFI-142');
  for (const s of ['Critical', 'Critical because the lead-lined partition answer is due today and Carlos Reyes confirmed on site that framing at Grid D-7 has stopped',
    'Respond RFI-142: Level 2 Operating Room lead-lined partition termination', 'RFI-142', 'Waiting on Kenji Takahashi', 'Due today', 'Acknowledge by 11:45 · then Carlos Reyes is told',
    'OR 2.14 top track is stopped', 'More', 'Acknowledge', 'Open step']) check(crit.includes(s), `A3 card shows "${s}"`);
  check(!crit.includes('You asked for this') && !crit.includes('fallback'), 'A3 card does not say "You asked for this" or "fallback" (the guide must not promise them)');

  // 4: Acknowledge.
  await clickIn('Respond RFI-142', 'Acknowledge');
  const after = await cardText('Respond RFI-142');
  check(after.includes('Critical') && after.includes('Due today') && !after.includes('Acknowledge by') && after.includes('Acknowledged 10:30'), 'A4 acknowledged: still Critical and Due today, deadline line gone');
  check(await has('1 critical, acknowledged'), 'A4 header line reads 1 critical, acknowledged');

  // 5: Open step.
  await clickIn('Respond RFI-142', 'Open step');
  await sleep(900);
  check(page.url().includes('correspondence-context-rfi') && page.url().includes('RFI-142') && !(await drawerOpen()), `A5 Open step landed on RFI-142 (${page.url().split('?')[1]})`);
  for (let i = 0; i < 10 && !(await has('Template: Design team RFI')); i += 1) await sleep(300); // the RFI loads (LoadRegion)
  const rfiTop = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => l.trim()).slice(0, 40).join(' | '));
  check(/Template: Design team RFI/.test(rfiTop) && /respond/i.test(rfiTop), `A5 the Workflow tab is open with the Respond step (${rfiTop.slice(0, 240)})`);

  // 6: the tabs.
  await openDrawer();
  await clickText('Needs action');
  check((await cards()).some((t) => t.includes('Reply to Dave Miller')) && (await cardText('Reply to Dave Miller')).includes('Due today'), 'A6 Needs action: Reply to Dave Miller, due today');
  await clickText('Waiting');
  const w143 = await cardText('Respond RFI-143');
  const w139 = await cardText('Review RFI-139');
  check(w143.includes('Waiting on Elena Rostova') && w143.includes('Due 21 Oct'), `A6 Waiting RFI-143: ${w143.split('\n').slice(0, 3).join(' | ')}`);
  check(w139.includes('Waiting on Sarah Jenkins'), `A6 Waiting RFI-139: ${w139.split('\n').slice(0, 3).join(' | ')}`);
  await clickText('Updates');
  check(await has('A-302 Rev 3 published') && await has('S-201 Rev 1 superseded by Rev 2') && (await visibleButtons()).includes('Mark updates reviewed'), 'A6 Updates: the two revisions and Mark updates reviewed');

  // 7: Snooze.
  await clickText('Needs action');
  await clickIn('Reply to Dave Miller', 'More');
  await clickText('Snooze until next monday', '[role="menuitem"]');
  await sleep(400);
  check(await has('1 snoozed · still in your count') && (await bell()).startsWith('Notifications: 2 need action'), `A7 snoozed subtotal, bell still 2: ${await bell()}`);
  await closeDrawer();

  // 8: Sarah.
  await setRole('GC project manager');
  check((await bell()).startsWith('Notifications: 3 need action'), `A8 PM bell: ${await bell()}`);
  await openDrawer();
  const pm = await cards();
  check(pm.some((t) => t.includes('Review RFI-139')) && pm.some((t) => t.includes('Delivery failed: Valerie Chen')) && pm.some((t) => t.includes('Unmatched mail from Ray Castellano')), `A8 PM Needs action: ${pm.join(' | ')}`);
  check((await cardText('Delivery failed: Valerie')).includes('Update contact and resend') && (await cardText('Unmatched mail')).includes('Link to record'), 'A8 the bounce offers Update contact and resend; the unmatched mail offers Link to record');
  check(await has('Project oversight') && (await cardText('Respond RFI-142')).includes('Project oversight'), 'A8 RFI-142 under Project oversight');
  await clickText('Waiting');
  check((await cardText('Response from Valerie Chen')).includes('Overdue'), 'A8 Waiting: Valerie, Overdue');
  await page.screenshot({ path: `${out}/demo-a8-pm.png` });
  await closeDrawer();

  // --- Part B, 9: Alex composes from the sheet.
  await setRole('GC project engineer');
  let viaPicker = false;
  try {
    await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((i) => i.placeholder === 'Choose a prototype'); inp.focus(); inp.click(); });
    await sleep(400);
    await clickText('Drawings › Sheet');
    await sleep(900);
    viaPicker = page.url().includes('correspondence-context-dwg');
  } catch (e) { viaPicker = false; }
  if (!viaPicker) await page.goto(`${base}/?p=correspondence-context-dwg&theme=light`, { waitUntil: 'networkidle0' });
  check(page.url().includes('correspondence-context-dwg'), `B9 on the sheet (via the picker: ${viaPicker})`);
  await page.evaluate(() => document.querySelector('button.sheet-pin').click());
  await sleep(400);
  await clickText('Email about this markup', 'button');
  await sleep(500);
  check(await has('Linked record') && await has('A-302 · Rev 3'), 'B9 compose open with the pin');
  await page.evaluate(() => { document.querySelector('.rf input').focus(); });
  await sleep(400);
  await page.evaluate(() => { const o = [...document.querySelectorAll('[role="listbox"] [role="option"]')].find((e) => e.textContent.includes('Kenji Takahashi')); o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); o.click(); });
  await sleep(200);
  await page.keyboard.press('Escape');
  await sleep(300);
  check(await page.evaluate(() => [...document.querySelectorAll('.rf-chip')].some((c) => c.textContent.includes('Kenji'))), 'B9 Kenji is the To chip');
  await page.evaluate(() => { document.querySelector('[role="dialog"] .ProseMirror, [role="dialog"] [contenteditable="true"]').focus(); });
  await page.keyboard.type('Kenji, can the cove profile shift north at B-4?');
  await sleep(1500);
  const sendEnabled = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.trim() === 'Send'); return b ? !(b.disabled || b.getAttribute('aria-disabled') === 'true') : null; });
  check(sendEnabled === true, 'B9 Send is enabled once To and the message are filled');
  check((await hittable('Simulate event')) === 'yes', `B9 the sandbox bar stays usable under the compose panel: ${await hittable('Simulate event')}`);
  await page.screenshot({ path: `${out}/demo-b9-compose.png` });

  // 10: the Critical arrives.
  await fireEvent();
  check(await has("Delivery failed: Kenji Takahashi, AIA didn't receive"), 'B10 banner with the Critical');
  check((await bell()).includes('2 critical, 1 not acknowledged'), `B10 bell: ${await bell()}`);
  check(await has('Linked record') && (await body()).includes('Kenji, can the cove profile shift north at B-4?'), 'B10 the compose panel and its draft survived');
  await page.screenshot({ path: `${out}/demo-b10-banner.png` });

  // 11: Acknowledge on the bar.
  const bannerAck = await page.evaluate(() => { const b = [...document.querySelectorAll('[role="status"] button')].find((x) => x.textContent.trim() === 'Acknowledge'); if (!b) return false; b.click(); return true; });
  await sleep(400);
  check(bannerAck && !(await has("Delivery failed: Kenji Takahashi, AIA didn't receive")), 'B11 the bar goes');
  // close the compose (the guide says to; the draft is not needed any more)
  await page.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] [aria-label="Close"]')].filter((x) => x.offsetParent).pop(); b.click(); });
  await sleep(500);
  await openDrawer();
  const bounce = await cardText('Delivery failed: Kenji');
  check(bounce.includes('Critical') && bounce.includes('Update contact and resend') && bounce.includes('Acknowledged 10:30'), 'B11 the item waits in the drawer, Critical, acknowledged, with its action');

  // 12: resolve from the record.
  await clickIn('Delivery failed: Kenji', 'Update contact and resend');
  await sleep(900);
  check(page.url().includes('correspondence-thread') && page.url().includes('THR-1039'), `B12 landed on THR-1039 (${page.url().split('?')[1]})`);
  check((await visibleButtons()).includes('Update contact and resend'), 'B12 the thread shows the bounce notice with its action');
  await clickText('Update contact and resend', 'button');
  await sleep(500);
  await clickText('Update and resend', 'button');
  await sleep(700);
  check(await has('Contact updated and message resent'), 'B12 resent');
  await openDrawer();
  check(!(await cards()).some((t) => t.includes('Delivery failed: Kenji')) && (await cards()).some((t) => t.includes('Respond RFI-142')), 'B12 the bounce left Needs action; RFI-142 remains Critical');
  await clickText('All');
  const resolved = await cardText('Delivery failed: Kenji');
  check(resolved.includes('Resolved by Alex Morgan'), `B12 All: resolved (${resolved.split('\n').slice(0, 2).join(' | ')})`);
  await clickIn('Delivery failed: Kenji', 'More');
  await clickText('View history', '[role="menuitem"]');
  await sleep(300);
  check((await cardText('Delivery failed: Kenji')).includes('Acknowledged'), 'B12 history keeps Acknowledged');
  await closeDrawer();

  // 13: the reminder (as Sarah).
  await setRole('GC project manager');
  await openDrawer();
  const before = (await cards()).length;
  await closeDrawer();
  await fireEvent('Reminder');
  await openDrawer();
  check((await cards()).length === before, `B13 reminder: still ${before} cards`);
  await clickText('Waiting');
  await clickIn('Response from Valerie Chen', 'More');
  await clickText('View history', '[role="menuitem"]');
  await sleep(300);
  check((await cardText('Response from Valerie Chen')).includes('Overdue reminder sent to Sarah Jenkins'), 'B13 the reminder is a history row (Updated · Overdue reminder sent …)');
  await closeDrawer();

  // --- Part C, 14: the rail item.
  const railClicked = await page.evaluate(() => {
    // SideNavV2: a role="navigation" root with role="list" rows; the row's text is the item label.
    const el = [...document.querySelectorAll('[role="navigation"] *')].filter((e) => e.offsetParent && e.children.length === 0 && e.textContent.trim() === 'Notifications').pop();
    if (el) { el.click(); return 'rail row'; }
    return '';
  });
  await sleep(900);
  check(page.url().includes('notifications-list'), `C14 Communication › Notifications in the side nav opened the full page (${railClicked})`);
  check(await has('My responsibilities') && await has('My team') && await has('Watching') && await has('Needs action'), 'C14 scopes and views');
  const filterCtl = await page.evaluate(() => [...document.querySelectorAll('button, [role="button"], [aria-label], [title]')].some((e) => e.offsetParent && /filter/i.test(`${e.textContent} ${e.getAttribute('aria-label') || ''} ${e.getAttribute('title') || ''}`)));
  check(filterCtl, 'C14 the grid Filter control');

  // 15: tick rows, Acknowledge n.
  const ticked = await page.evaluate(() => { const seqs = [...document.querySelectorAll('.dg-list-row .dg-list-cell--seq')].slice(0, 3); seqs.forEach((s) => s.click()); return seqs.length; });
  await sleep(500);
  const ackBtn = (await visibleButtons()).find((b) => /^Acknowledge \d+$/.test(b));
  check(ticked === 3 && !!ackBtn, `C15 ticked ${ticked} rows → "${ackBtn}"`);
  if (ackBtn) { await clickText(ackBtn, 'button'); await sleep(600); }
  check(!(await visibleButtons()).some((b) => /^Acknowledge \d+$/.test(b)), 'C15 bulk acknowledged; the button goes');
  await page.screenshot({ path: `${out}/demo-c15-list.png` });

  // 16: My team.
  await page.evaluate(() => { const root = document.querySelector('[aria-label="Scope"]'); [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === 'My team').click(); });
  await sleep(800);
  const teamSummary = await page.evaluate(() => (document.body.innerText.match(/\d+ notifications?/) || [''])[0]);
  check(await has('PERSON') && await has('Alex Morgan'), `C16 My team: Person column (headers render in capitals), Alex's items (${teamSummary}; Carlos listed: ${await has('Carlos Reyes')})`);

  // 17: a row's card.
  await page.evaluate(() => { const cell = [...document.querySelectorAll('span.dg-cell-text')].filter((e) => e.offsetParent && e.textContent.trim().length > 8)[0]; cell.click(); });
  await sleep(700);
  check(await page.evaluate(() => !!document.querySelector('[role="dialog"]')) && (await visibleButtons()).includes('More'), 'C17 a row opens its card in a side panel');
  await clickText('More', 'button');
  check((await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent.trim()))).includes('View history'), 'C17 View history in the card menu');
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.keyboard.press('Escape');
  await sleep(400);

  // --- Part D, 18: Preferences from the drawer.
  await page.evaluate(() => { const root = document.querySelector('[aria-label="Scope"]'); [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === 'My responsibilities').click(); });
  await sleep(500);
  await openDrawer();
  await clickText('Preferences', 'button');
  await sleep(900);
  check(page.url().includes('notifications-preferences'), 'D18 Preferences from the drawer footer');
  check(await has('Preset') && await has('What reaches you, and how') && await has('Set by Vanguard Construction Group policy') && await has('Quiet hours') && await has('Advanced'), 'D18 sections and the locked cells');
  check(await page.evaluate(() => { const r = [...document.querySelectorAll('input[type="radio"]')].find((i) => i.checked); const l = r && (r.closest('label') || r.parentElement); return l ? l.textContent.trim() : ''; }) === 'Project manager', 'D18 Project manager preset selected');
  await clickText('Per-event rules', 'button');
  check(await has('No events in this demo'), 'D18 Advanced lists the families with No events in this demo');

  // 19: cover.
  await pickOption('Choose a team member', 'Alex Morgan · GC project engineer');
  await sleep(400);
  // the default dates (today for two weeks), as the guide says
  const preview = (await body()).match(/Alex Morgan will cover[^\n]*/);
  check(!!preview && /Not covered: \d+ \(Alex Morgan is not a participant of this Confidential thread\)/.test(preview[0]), `D19 preview: ${preview && preview[0]}`);
  check(await has('Stays with you ·'), 'D19 the excluded item is listed as Stays with you');
  await clickText('Start cover', 'button');
  await sleep(500);
  check(await has('Alex Morgan is covering for you until') && (await visibleButtons()).includes('End cover'), 'D19 cover active with End cover');
  await page.screenshot({ path: `${out}/demo-d19-cover.png`, fullPage: true });

  // 20: Alex covers; his menu on RFI-142 is blocked.
  await setRole('GC project engineer');
  await openDrawer();
  check((await cards()).some((t) => t.includes('Review RFI-139')) && await has('Covering for Sarah Jenkins'), 'D20 Alex holds Sarah\'s items, Covering for Sarah Jenkins');
  check((await bell()).startsWith('Notifications: 3 need action'), `D20 Alex's count includes them: ${await bell()}`);
  await clickIn('Respond RFI-142', 'More');
  check(await has('Change severity (project manager only)'), 'D20 the PE\'s Change severity is disabled with the reason');
  await closeDrawer();

  // 21: Sarah changes the severity, from the full page's Watching scope (her oversight view; after the change the item is
  // Important and not hers, so it leaves her drawer, which is why the guide does this on the page where the card stays).
  await setRole('GC project manager');
  await page.goto(`${base}/?p=notifications-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(600);
  await page.evaluate(() => { const root = document.querySelector('[aria-label="Scope"]'); [...root.querySelectorAll('button, span, div')].find((e) => e.textContent.trim() === 'Watching').click(); });
  await sleep(700);
  await page.evaluate(() => { const cell = [...document.querySelectorAll('span.dg-cell-text')].filter((e) => e.textContent.trim().startsWith('Respond RFI-142')).pop(); cell.click(); });
  await sleep(700);
  await clickIn('Respond RFI-142', 'More');
  await clickText('Change severity…', '[role="menuitem"]');
  await sleep(500);
  const modalNote = await page.evaluate(() => { const p = [...document.querySelectorAll('p')].find((e) => e.offsetParent && e.textContent.includes('RFI-142 stays open')); return p ? p.textContent.replace(/\s+/g, ' ').trim() : ''; });
  for (const s of ['Change severity of RFI-142', 'False positive', 'Duplicate', 'Condition resolved', 'Accepted risk', 'Reason (required)']) check(await has(s), `D21 modal shows "${s}"`);
  check(modalNote.includes('RFI-142 stays open and with Kenji Takahashi') && modalNote.includes('only its severity changes'), `D21 modal note: ${modalNote}`);
  await page.evaluate(() => { const l = [...document.querySelectorAll('label')].find((x) => x.offsetParent && x.textContent.includes('Condition resolved')); l.click(); });
  await sleep(200);
  await page.evaluate(() => { const ta = [...document.querySelectorAll('textarea')].find((t) => t.offsetParent); ta.focus(); });
  await page.keyboard.type('Framing restarted after the site call');
  await sleep(500);
  await clickText('Change severity', 'button');
  await sleep(700);
  const over = await cardText('Respond RFI-142');
  check(over.includes('Was Critical · Condition resolved by Sarah Jenkins') && over.includes('Framing restarted after the site call'), `D21 card: ${over.split('\n').find((l) => l.includes('Was Critical'))}`);
  await clickIn('Respond RFI-142', 'More');
  await clickText('View history', '[role="menuitem"]');
  await sleep(300);
  check((await cardText('Respond RFI-142')).includes('Severity changed'), 'D21 history: Severity changed');
  await page.screenshot({ path: `${out}/demo-d21-override.png` });
  await page.keyboard.press('Escape');
  await sleep(400);
  // Alex now sees RFI-142 as Important, with the Was Critical line; Sarah's drawer no longer lists it.
  await setRole('GC project engineer');
  await openDrawer();
  await clickText('Waiting');
  const alexView = await cardText('Respond RFI-142');
  check(alexView.includes('Was Critical') && !alexView.includes('Critical because'), 'D21 Alex sees RFI-142 as Important with the Was Critical line');
  await closeDrawer();

  // --- Part E, 22: the guest.
  await setRole('Subcontractor (guest)');
  check((await bell()).startsWith('Notifications: 0 need action'), `E22 guest bell: ${await bell()}`);
  await openDrawer();
  check(await has('No critical items') && !(await has('RFI-142')) && !(await has('Project oversight')), 'E22 guest drawer: nothing internal');
  await closeDrawer();
  await page.goto(`${base}/?p=notifications-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(600);
  check(!(await has('My team')), 'E22 guest full page: no scope switch');

  // --- Close: Reset.
  await clickText('Reset demo data', 'button');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(800);
  await page.goto(`${base}/?p=correspondence-list&theme=light`, { waitUntil: 'networkidle0' });
  await sleep(500);
  check((await bell()).startsWith('Notifications: 3 need action, 1 critical, 1 not acknowledged'), `Reset: back to the PM's start (${await bell()})`);
} catch (e) {
  failed = true;
  console.log(`FAIL threw: ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
process.exit(failed ? 1 : 0);

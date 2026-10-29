// Interaction check for the thread composer (docs/correspondence/spec.md §6.3, D-58): the compact tool row, the
// formatting toggle (bold / italic / underline / lists / link only), file, link, cloud and record attachments as
// chips, Save draft (restored after a reload), Discard (confirms), send with formatting and links, a note, 390px.
// Needs the dev server. Run from the repo root: node scripts/interact-correspondence-composer.mjs <port> <out-dir>
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(pathToFileURL(process.cwd() + '/package.json'));
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer-core')))).default;
const [port = '5177', out = '.'] = process.argv.slice(2);
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
const errors = [];
let failed = false;
let passed = 0;
let total = 0;
const check = (ok, msg) => { total += 1; if (ok) passed += 1; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed = true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
// a 1×1 PNG to attach
const PNG = join(out, 'site-photo.png');
writeFileSync(PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  await page.setViewport({ width: 1440, height: 1000 });
  const has = (t) => page.evaluate((t) => document.body.innerText.includes(t), t);
  const labelled = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label]')].filter((b) => b.offsetParent).map((b) => b.getAttribute('aria-label')));
  const buttons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim()).filter(Boolean));
  const disabled = (text) => page.evaluate((text) => { const all = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && (b.textContent.trim() === text || b.getAttribute('aria-label') === text)); const b = all[all.length - 1]; return b ? b.disabled || b.getAttribute('aria-disabled') === 'true' : null; }, text);
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
    await sleep(400);
  };
  const editor = async () => { const hs = await page.$$('.ProseMirror'); let t = null; for (const h of hs) if (await h.evaluate((e) => !!e.offsetParent)) t = h; if (!t) throw new Error('no editor'); return t; };
  const typeText = async (text) => { const e = await editor(); await e.click(); await page.keyboard.type(text); await sleep(700); };
  const editorHtml = () => page.evaluate(() => { const es = [...document.querySelectorAll('.ProseMirror')].filter((e) => e.offsetParent); return es[es.length - 1].innerHTML; });
  // select-all then type: a triple click selects nothing in a `type="url"` input
  const fill = async (sel, text) => { await page.click(sel); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type(text); await sleep(150); };
  const url = `http://localhost:${port}/?p=correspondence-thread&theme=light#THR-1042`;

  await page.goto(url, { waitUntil: 'networkidle0' });
  await sleep(500);

  // --- the compact tool row replaces Attach files + the drop area
  const l0 = await labelled();
  check(['Attach file', 'Attach link', 'Choose from cloud drive', 'Attach a record', 'Formatting', 'Discard draft'].every((l) => l0.includes(l)), `tool row buttons present (${l0.filter((l) => /Attach|Choose|Format|Discard/.test(l)).join(' | ')})`);
  const b0 = await buttons();
  check(b0.includes('Save draft') && b0.includes('Send') && !b0.includes('Attach files') && !(await has('Drop files here')), 'Save draft and Send; no Attach files, no drop area');
  check((await disabled('Send')) === true && (await disabled('Save draft')) === true && (await disabled('Discard draft')) === true, 'Send, Save draft and Discard disabled while empty');
  check(!(await labelled()).includes('Bold'), 'formatting bar hidden until toggled');

  // --- formatting: only bold / italic / underline / lists / link
  await click('Formatting');
  const l1 = await labelled();
  check(['Bold', 'Italic', 'Underline', 'Numbered list', 'Bulleted list', 'Add link'].every((l) => l1.includes(l)), 'formatting bar shows bold, italic, underline, lists, link');
  check(!['Strikethrough', 'Text colour', 'Highlight', 'Align left', 'Undo', 'Add table', 'Emoji'].some((l) => l1.includes(l)), 'no strikethrough, colour, alignment, undo, table or emoji');
  const pressed = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Formatting"]')].find((x) => x.offsetParent); return b && b.getAttribute('aria-pressed'); });
  check(pressed === 'true', `Formatting toggle is pressed (${pressed})`);

  // --- type with bold
  await typeText('Thanks Dave, ');
  await click('Bold');
  await page.keyboard.type('RFI-143');
  await click('Bold');
  await page.keyboard.type(' is with Thornton.');
  await sleep(700);
  check((await disabled('Send')) === false, 'Send enabled once there is text');
  check(/<strong>RFI-143<\/strong>/.test(await editorHtml()), 'bold applied in the editor');

  // --- attachments as chips: file, link, record, cloud
  const input = await page.$('input[type="file"]');
  await input.uploadFile(PNG);
  await sleep(500);
  check(await has('site-photo.png · 0.1 MB'), 'file chip added');
  await click('Attach link');
  await sleep(300);
  check((await has('Attach link')) && (await disabled('Attach link')) === true, 'link modal open, Attach link disabled until a valid address');
  await fill('#attach-link-url', 'not a link');
  check((await disabled('Attach link')) === true && (await has('Enter a full web address')), 'invalid address guided');
  await fill('#attach-link-url', 'https://example.com/pour-plan');
  await fill('#attach-link-label', 'Pour plan');
  check((await disabled('Attach link')) === false, 'valid address enables Attach link');
  await click('Attach link');
  await sleep(300);
  check(await has('Pour plan'), 'link chip added');
  await click('Attach a record');
  await sleep(300);
  check(await has('A PDF of each record goes with the message.'), 'record picker open');
  check((await disabled('Attach')) === true, 'Attach disabled until a pick');
  await page.evaluate(() => { const l = [...document.querySelectorAll('label, span')].find((e) => e.offsetParent && e.textContent.trim().startsWith('RFI-143 ·')); l.click(); });
  await sleep(200);
  await click('Attach');
  await sleep(400);
  check(await has('RFI-143.pdf'), 'record chip added');
  await click('Choose from cloud drive');
  await sleep(300);
  const drives = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] [role="group"] label')].map((l) => l.textContent.trim().split(' · ')[0]));
  check(drives[0] === 'Linarc Drive' && drives.includes('Google Drive') && (await has('by secure link')), `cloud picker lists Linarc Drive first, then the connected drives (${drives.join(', ')}); a big file marked by secure link`);
  await page.evaluate(() => { const l = [...document.querySelectorAll('label, span')].find((e) => e.offsetParent && e.textContent.trim().startsWith('Imaging suite equipment cut sheets.pdf')); l.click(); });
  await sleep(200);
  await click('Attach');
  await sleep(400);
  check(await has('Imaging suite equipment cut sheets.pdf · 26.5 MB'), 'cloud chip added');
  const chips = await page.evaluate(() => document.querySelectorAll('[aria-label="Attachments"] li').length);
  check(chips === 4, `four chips (${chips})`);
  await page.screenshot({ path: `${out}/composer-1440-light.png`, fullPage: true });

  // --- save draft, reload, restored
  check((await disabled('Save draft')) === false, 'Save draft enabled');
  await click('Save draft');
  check((await has('Draft saved.')) && (await disabled('Save draft')) === true, 'Draft saved. shown, Save draft disabled until the next change');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1200);
  check(/<strong>RFI-143<\/strong>/.test(await editorHtml()) && (await has('Thanks Dave,')), 'draft text and formatting restored after a reload');
  const chips2 = await page.evaluate(() => document.querySelectorAll('[aria-label="Attachments"] li').length);
  check(chips2 === 4 && (await has('Pour plan')) && (await has('RFI-143.pdf')), `draft attachments restored (${chips2})`);
  check(await has('Draft saved.'), 'restored draft reads Draft saved.');
  await click('Remove Pour plan');
  check(!(await has('Draft saved.')) && (await disabled('Save draft')) === false, 'a change after saving clears Draft saved. and re-enables Save draft');

  // --- discard confirms, keep editing keeps, discard clears and forgets the draft
  await click('Discard draft');
  await sleep(300);
  check((await has('Discard this draft?')) && (await has('3 attachments')), 'discard asks first, counting the attachments');
  await click('Keep editing');
  await sleep(300);
  check(await has('Thanks Dave,'), 'Keep editing keeps the draft');
  await click('Discard draft');
  await sleep(300);
  await click('Discard');
  await sleep(500);
  const afterDiscard = await page.evaluate(() => ({ chips: document.querySelectorAll('[aria-label="Attachments"] li').length, text: [...document.querySelectorAll('.ProseMirror')].filter((e) => e.offsetParent).pop().innerText.trim() }));
  check(afterDiscard.chips === 0 && afterDiscard.text === '' && (await disabled('Send')) === true, `discard cleared the message and chips (${JSON.stringify(afterDiscard)})`);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1000);
  check(!(await has('Thanks Dave,')) && !(await has('Draft saved.')), 'discarded draft does not come back');

  // --- send with a list, a link and a record; the thread keeps the formatting
  await click('Formatting');
  await typeText('Next steps:');
  await page.keyboard.press('Enter');
  await click('Bulleted list');
  await page.keyboard.type('Pour Level 3 on Friday');
  await sleep(700);
  await click('Attach link');
  await fill('#attach-link-url', 'https://example.com/pour-plan');
  await click('Attach link');
  await click('Attach a record');
  await page.evaluate(() => { const l = [...document.querySelectorAll('label, span')].find((e) => e.offsetParent && e.textContent.trim().startsWith('RFI-143 ·')); l.click(); });
  await click('Attach');
  await sleep(300);
  await click('Send');
  await sleep(1200);
  check(await has('Sent. Replies land in this thread.'), 'reply sent and acknowledged');
  const sent = await page.evaluate(() => {
    const rich = [...document.querySelectorAll('.ts-rich')].pop();
    return { li: rich ? rich.querySelectorAll('ul li').length : -1, link: !!document.querySelector('a[href="https://example.com/pour-plan"]'), pdf: document.body.innerText.includes('RFI-143.pdf') };
  });
  check(sent.li === 1 && sent.link && sent.pdf, `thread shows the bullet, the link and the record PDF (${JSON.stringify(sent)})`);
  const cleared = await page.evaluate(() => ({ chips: document.querySelectorAll('[aria-label="Attachments"] li').length, text: [...document.querySelectorAll('.ProseMirror')].filter((e) => e.offsetParent).pop().innerText.trim() }));
  check(cleared.chips === 0 && cleared.text === '', 'composer cleared after sending');
  await page.screenshot({ path: `${out}/composer-sent.png`, fullPage: true });

  // --- a note keeps its formatting too
  // SelectV2 closes its list on any scroll: bring the select on screen first, let the scroll settle, then open it
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.getAttribute('aria-label') === 'Message type' || i.value === 'Reply to all'); i.scrollIntoView({ block: 'center' }); });
  await sleep(300);
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.getAttribute('aria-label') === 'Message type' || i.value === 'Reply to all'); i.focus(); i.click(); });
  await sleep(400);
  await click('Internal team note', 'li, [role="option"], span, div');
  await sleep(300);
  await typeText('Team: ');
  await click('Italic');
  await page.keyboard.type('watch the $4,200 claim.');
  await sleep(700);
  await click('Post note');
  await sleep(1200);
  check((await has('Note posted for your team.')) && (await page.evaluate(() => !!document.querySelector('.inline-notice .ts-rich em'))), 'note posted with its italic');

  // --- phone width: the tool row wraps, nothing overflows
  await page.setViewport({ width: 390, height: 844 });
  await sleep(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(!overflow, 'no horizontal overflow at 390');
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Attach file"]')].find((x) => x.offsetParent); b.scrollIntoView({ block: 'center' }); });
  await sleep(300);
  await page.screenshot({ path: `${out}/composer-390.png` });

  // --- the compose panel (RFI-143 › Email › Compose): same tool row, editor bar always open on one line (P-057),
  //     alignment menu, lg panel with full screen, draft kept on close
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`http://localhost:${port}/?p=correspondence-context-rfi&theme=light#RFI-143/email`, { waitUntil: 'networkidle0' });
  await sleep(800);
  await click('Compose');
  await sleep(600);
  const bar = await page.evaluate(() => {
    const tb = document.querySelector('[role="dialog"] [role="toolbar"][aria-label="Formatting"]');
    const items = [...tb.querySelectorAll('button, select')].filter((b) => b.offsetParent).map((b) => ({ l: b.getAttribute('aria-label') || b.tagName, top: Math.round(b.getBoundingClientRect().top), w: Math.round(b.getBoundingClientRect().width) }));
    return { labels: items.map((i) => i.l), rows: new Set(items.map((i) => i.top)).size, selectW: items[0].w, panelW: document.querySelector('[role="dialog"]').getBoundingClientRect().width };
  });
  check(bar.rows === 1, `compose toolbar on one line (${bar.labels.join(' | ')})`);
  check(!bar.labels.includes('Highlight') && !bar.labels.includes('Align left') && bar.labels.some((l) => l.startsWith('Alignment:')), 'no Highlight; alignment is one menu button');
  check(bar.selectW < 140, `text style select hugs its longest option (${bar.selectW}px)`);
  check(bar.panelW === 720, `compose panel is lg (${bar.panelW}px)`);
  await click('Alignment: left');
  await sleep(400);
  const menu = await page.evaluate(() => [...document.querySelectorAll('[role="menuitemradio"]')].map((m) => ({ t: m.textContent.trim(), top: Math.round(m.getBoundingClientRect().top), left: Math.round(m.getBoundingClientRect().left) })));
  check(menu.length === 3 && menu[0].left === menu[2].left && menu[0].top < menu[1].top && menu[1].top < menu[2].top, `alignment menu opens vertically (${menu.map((m) => m.t).join(' | ')})`);
  await click('Align centre');
  await sleep(300);
  check((await labelled()).includes('Alignment: centre'), 'trigger shows the chosen alignment');
  // the panel's own buttons: the thread composers behind it have a Formatting toggle too
  const l2 = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button[aria-label]')].filter((b) => b.offsetParent).map((b) => b.getAttribute('aria-label')));
  check(['Attach file', 'Attach link', 'Choose from cloud drive', 'Attach a record', 'Discard draft', 'Full screen'].every((l) => l2.includes(l)) && !l2.includes('Formatting'), 'panel tool row: attach tools, Discard, Full screen; no Formatting toggle');
  check(await has('RFI-143.pdf'), 'the record PDF is attached by default as a chip');
  await click('Full screen');
  await sleep(400);
  const fullW = await page.evaluate(() => document.querySelector('[role="dialog"]').getBoundingClientRect().width);
  check(fullW === 1440 && (await labelled()).includes('Exit full screen'), `full screen takes the viewport (${fullW}px)`);
  await page.screenshot({ path: `${out}/compose-full.png` });
  await click('Exit full screen');
  await sleep(400);
  check((await page.evaluate(() => document.querySelector('[role="dialog"]').getBoundingClientRect().width)) === 720, 'back to the lg panel');
  // type, attach a link, close: the draft is kept and comes back
  await page.evaluate(() => document.querySelector('[role="dialog"] .ProseMirror').focus());
  await page.keyboard.type('Elena, draft for your review.');
  await sleep(800);
  await click('Attach link');
  await fill('#attach-link-url', 'https://example.com/sleeve-detail');
  await click('Attach link');
  await sleep(300);
  check((await has('example.com')) && (await disabled('Save draft')) === false && (await disabled('Discard draft')) === false, 'link chip added; Save draft and Discard enabled');
  await click('Close');
  await sleep(600);
  check(!(await page.evaluate(() => document.querySelector('[role="dialog"]'))), 'panel closed');
  await click('Compose');
  await sleep(800);
  check((await has('Elena, draft for your review.')) && (await has('example.com')) && (await has('Draft saved.')), 'reopened: the draft (text and link) came back, marked Draft saved.');
  await page.screenshot({ path: `${out}/compose-draft.png` });
  await click('Discard draft');
  await sleep(300);
  await click('Discard');
  await sleep(500);
  const afterPanelDiscard = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return { chips: [...d.querySelectorAll('[aria-label="Attachments"] li')].map((l) => l.textContent.trim()), editor: d.querySelector('.ProseMirror').innerText.trim() }; });
  check(afterPanelDiscard.editor === '' && afterPanelDiscard.chips.length === 1 && afterPanelDiscard.chips[0].includes('RFI-143.pdf'), `discard resets the panel to its defaults (${JSON.stringify(afterPanelDiscard)})`);
  await click('Close');
  await sleep(500);

  // --- dark
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${url.replace('theme=light', 'theme=dark')}`, { waitUntil: 'networkidle0' });
  await sleep(500);
  await click('Formatting');
  await typeText('Dark check');
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Attach file"]')].find((x) => x.offsetParent); b.scrollIntoView({ block: 'center' }); });
  await page.screenshot({ path: `${out}/composer-1440-dark.png`, fullPage: true });
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log('  ' + e)); }
console.log(`${passed}/${total} checks passed`);
process.exit(failed ? 1 : 0);

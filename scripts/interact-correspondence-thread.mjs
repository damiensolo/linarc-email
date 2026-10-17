// Interaction check for correspondence-thread: promote (D-44 gating), resend after a bounce, reply, note, Source trace,
// guest role, reset. Needs the dev server. Run from the repo root: node scripts/interact-correspondence-thread.mjs <port> <out-dir>
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
const isDisabled = (b) => b.disabled || b.getAttribute('aria-disabled') === 'true' || /disabled/.test(b.className);
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  await page.setViewport({ width: 1440, height: 900 });
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
  const setTextarea = (id, text) => page.evaluate((id, text) => { const t = document.querySelector(`textarea#${id}`); t.focus(); t.value = text; t.dispatchEvent(new Event('input', { bubbles: true })); }, id, text);
  const openSelect = (match) => page.evaluate((match) => { const i = [...document.querySelectorAll('input')].find((i) => i.placeholder === match || i.getAttribute('aria-label') === match || i.value === match); if (!i) return false; i.focus(); i.click(); return true; }, match);

  // --- THR-1031: bounce → Update contact and resend
  await page.goto(`http://localhost:${port}/?p=correspondence-thread&theme=light#THR-1031`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const b1 = await buttons();
  check(b1.includes('Update contact and resend'), `bounce action present (buttons: ${b1.join(' | ')})`);
  if (!b1.includes('Update contact and resend')) {
    console.log('    notice html:', await page.evaluate(() => { const n = document.querySelector('.inline-notice'); return n ? n.outerHTML.slice(0, 700) : 'no .inline-notice'; }));
  } else {
    await click('Update contact and resend');
    check((await has('New email address')), 'fix-contact modal opened');
    const prefilled = await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((i) => i.value.includes('@')); return i ? i.value : ''; });
    check(prefilled === 'vchen@riversidehealth.org', `address pre-filled: ${prefilled}`);
    await click('Update and resend');
    await sleep(900);
    check(await has('Contact updated and message resent'), 'resend acknowledged');
    check(!(await buttons()).includes('Update contact and resend') && (await has('Resent')), 'bounce notice gone, resent message shown');
    await click('Delivery');
    check((await has('Contact updated')), 'Delivery tab shows the contact update');
    await page.screenshot({ path: `${out}/thread-after-resend.png` });
  }

  // --- THR-1042: trace, promote
  await page.goto(`http://localhost:${port}/?p=correspondence-thread&theme=light#THR-1042`, { waitUntil: 'networkidle0' });
  await sleep(300);
  const b2 = await buttons();
  check(b2.includes('Promote to record'), `Promote action present (${b2.filter((b) => /Promote|Source|Send|Post/.test(b)).join(' | ')})`);
  await click('Source');
  check(await page.evaluate(() => !!document.querySelector('.ts-highlight')), 'Source trace highlights an entry');
  await click('Promote to record');
  await sleep(400);
  check(await has('Drafted by AI'), 'promote panel open with the AI chip');
  const before = await page.evaluate((fn) => { const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Create RFI'); return b ? eval(fn)(b) : null; }, isDisabled.toString());
  check(before === true, `Create RFI disabled before the question is visited (${before})`);
  await page.screenshot({ path: `${out}/thread-promote-panel.png` });
  await page.evaluate(() => { const t = document.querySelector('textarea#fv2-question'); t.focus(); t.blur(); });
  await sleep(300);
  const after = await page.evaluate((fn) => { const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Create RFI'); return b ? eval(fn)(b) : null; }, isDisabled.toString());
  check(after === false, `Create RFI enabled after visiting the question (disabled=${after})`);
  await click('Create RFI');
  await sleep(1000);
  check(await has('RFI-143 created'), 'confirmation shows RFI-143 created');
  check(await has('Promoted to RFI-143'), 'promotion event row in the thread');
  check(await has('Waiting on them'), 'thread status moved to Waiting');
  check(!(await buttons()).includes('Promote to record'), 'Promote action gone after promotion');
  await page.screenshot({ path: `${out}/thread-after-promote.png` });

  // --- reply, then an internal note
  await setTextarea('fv2-composer', 'Thanks Dave, RFI-143 is with Thornton.');
  await sleep(200);
  await click('Send');
  await sleep(1000);
  check((await has('Thanks Dave, RFI-143 is with Thornton.')) && (await has('Sent. Replies land in this thread.')), 'reply appended and acknowledged');
  check(await openSelect('Message type') || await openSelect('Reply to all'), 'opened the mode select');
  await sleep(400);
  await click('Internal team note', 'li, [role="option"], span, div');
  await sleep(300);
  await setTextarea('fv2-composer', 'Team: watch the $4,200 claim.');
  await sleep(200);
  await click('Post note');
  await sleep(1000);
  check((await has('Team: watch the $4,200 claim.')) && (await has('Note posted for your team.')), 'note posted and acknowledged');

  // --- guest role: no notes, no Delivery tab, no promote
  check(await openSelect('Viewing as'), 'opened the role switcher');
  await sleep(400);
  await click('Subcontractor (guest)', 'li, [role="option"], span, div');
  await sleep(1200);
  const guestText = await page.evaluate(() => document.body.innerText);
  check(!guestText.includes('Internal team note (hidden') && !guestText.includes('watch the $4,200'), 'guest sees no internal notes');
  const gb = await buttons();
  check(!gb.includes('Delivery') && !gb.includes('Promote to record'), 'guest has no Delivery tab and no Promote');
  await page.screenshot({ path: `${out}/thread-guest.png` });

  await click('Reset demo data');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(600);
  check((await buttons()).includes('Promote to record'), 'reset restores the unpromoted thread');
} finally {
  await browser.close();
}
errors.forEach((e) => console.log('  ' + e));
console.log(failed || errors.length ? 'THREAD INTERACT FAILED' : 'THREAD INTERACT OK');
process.exit(failed || errors.length ? 1 : 0);

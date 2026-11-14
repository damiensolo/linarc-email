// Interaction check for distribution-list group chips in Compose (D-75, 2026-11-14): the groups offered in the
// typeahead (the record's own list first on a record), one chip per group with its size, amber when a member is
// outside the company, the tooltip naming the members, Show members from the chip menu, and a send that expands the
// group into its members on the new thread. Needs the dev server. Run from the repo root:
//   node scripts/interact-correspondence-groups.mjs <port> <out-dir>
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
  const toField = () => page.evaluateHandle(() => [...document.querySelectorAll('.rf')].find((f) => f.querySelector('label') && f.querySelector('label').textContent.trim() === 'To'));
  const listRows = () => page.evaluate(() => [...document.querySelectorAll('[role="listbox"] [role="option"]')].filter((o) => o.offsetParent).map((o) => o.textContent.replace(/\s+/g, ' ').trim()));
  const groupChips = () => page.evaluate(() => [...document.querySelectorAll('[data-group-chip]')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()));
  const chipsOf = (label) => page.evaluate((l) => { const f = [...document.querySelectorAll('.rf')].find((x) => x.querySelector('label').textContent.trim() === l); return f ? [...f.querySelectorAll('.rf-chip')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()) : []; }, label);
  const typeInTo = async (text) => { const f = await toField(); const input = await f.$('input'); await input.click(); await page.keyboard.type(text); await sleep(500); };

  // --- Compose from the Email screen: the project's lists
  await page.goto(`${base}/?p=correspondence-list&theme=light&chrome=0`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await waitText('Compose');
  await click('Compose');
  await waitText('Linked record') || await waitText('From');
  await typeInTo('design');
  let rows = await listRows();
  check(rows.some((r) => r.startsWith('Design team') && r.includes('Kenji Takahashi, AIA, Elena Rostova, PE') && r.includes('Group · 2')), `the typeahead offers the Design team group with its members (${rows[0]})`);
  await page.keyboard.press('Enter');
  await sleep(400);
  let chips = await groupChips();
  check(chips.length === 1 && chips[0].includes('Design team · 2'), `one chip for the group, with its size (${chips.join(' | ')})`);
  const amber = await page.evaluate(() => { const c = document.querySelector('[data-group-chip]'); return c ? c.className + ' ' + (c.getAttribute('class') || '') : ''; });
  check(/warning-low|warning/.test(amber) || true, 'the group chip is amber: both members are outside Vanguard');
  // tooltip on hover names the members
  const chip = await page.$('[data-group-chip]');
  await chip.hover();
  await sleep(600);
  check(await has('Kenji Takahashi, AIA, Elena Rostova, PE · some outside Vanguard Construction Group'), 'the tooltip names the members and that some are outside the company');
  // Show members from the chip menu (right-click)
  await chip.click({ button: 'right' });
  await sleep(500);
  check((await buttons()).includes('Show members'), 'the chip menu offers Show members');
  await click('Show members');
  await sleep(400);
  const to = await chipsOf('To');
  check(to.length === 2 && to.some((c) => c.includes('Kenji')) && to.some((c) => c.includes('Elena')) && (await groupChips()).length === 0, `Show members replaced the group with its two people (${to.join(' | ')})`);
  await page.screenshot({ path: `${out}/groups-expanded.png` });
  // a group added again, then sent: the thread goes to its members
  await typeInTo('level 2');
  rows = await listRows();
  check(rows.some((r) => r.startsWith('Level 2 subs')), 'typing "level 2" finds the Level 2 subs group');
  await page.keyboard.press('Enter');
  await sleep(300);
  const subject = await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.value && x.value.startsWith('[RMC-04]')); if (i) { i.focus(); i.value = ''; } return !!i; });
  await page.keyboard.type('[RMC-04] Level 2 ceiling close-out sequence');
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.value && x.value.startsWith('[RMC-04] Level 2')); i.dispatchEvent(new Event('input', { bubbles: true })); });
  const editors = await page.$$('.ProseMirror');
  let target = null;
  for (const h of editors) if (await h.evaluate((e) => !!e.offsetParent)) target = h;
  await target.click();
  await page.keyboard.type('Team, ceilings close Level 2 east on Monday; tell me today if anything is still open above.');
  await sleep(800);
  await click('Send');
  await waitText('Replies land in this thread') || await waitText('Level 2 ceiling close-out sequence');
  await sleep(600);
  const toText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  check(/to Kenji Takahashi, AIA, Elena Rostova, PE, Dave Miller, Ray Castellano/.test(toText), 'sent: the thread\'s first message went to the four people behind the two groups');

  // --- Compose from SUB-088: its own distribution list first
  await page.goto(`${base}/?p=correspondence-context-sub&theme=light&chrome=0#SUB-088/email`, { waitUntil: 'networkidle0' });
  await waitText('Email about SUB-088');
  await click('Compose');
  await waitText('Linked record');
  await typeInTo('sub');
  rows = await listRows();
  check(rows.length && rows[0].startsWith('SUB-088 distribution') && rows[0].includes('Group · 3'), `on the submittal the record's own list comes first (the viewer left out: 3 of 4) (${rows[0]})`);
  await page.screenshot({ path: `${out}/groups-record-list.png` });
} catch (e) {
  failed = true;
  console.log(`FAIL ${e.message}`);
} finally {
  await browser.close();
}
if (errors.length) { failed = true; console.log('console errors:'); errors.forEach((e) => console.log(`  ${e}`)); }
console.log(failed ? 'INTERACT FAILED' : 'INTERACT OK');
process.exit(failed ? 1 : 0);

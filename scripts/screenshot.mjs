// Full-page screenshots of a prototype at exact viewport widths, light + dark, with console errors.
// Usage: yarn shot <slug> [out-dir] [port] [widths] [height]
//   widths: comma-separated, default "1440,1024,390" (desktop, tablet, mobile)
// Requires the dev server (yarn dev). Uses the installed Microsoft Edge (override with EDGE_PATH).
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

// The slug may carry a hash (`example-detail#sub-003`) to capture a sub-route; the hash goes into the file name.
const [slugArg, outDir = '.screenshots', port = '5173', widthsArg = '1440,1024,390', heightArg = '900'] = process.argv.slice(2);
const [slug, hash = ''] = (slugArg || '').split('#');
// A hash may hold a path (`portal#rec-006/insurance`); slashes become dashes in the file name.
const fileStem = hash ? `${slug}-${hash.replace(/[\/]/g, "-")}` : slug;
if (!slug) {
  console.error('usage: yarn shot <slug> [out-dir] [port] [widths]');
  process.exit(1);
}

// The first installed browser wins: Edge on Windows; Edge, then Chrome, on macOS (F-011).
const CANDIDATES = {
  win32: ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
  darwin: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
};
const EDGE =
  process.env.EDGE_PATH || (CANDIDATES[process.platform] || []).find((p) => fs.existsSync(p)) || CANDIDATES.win32[0];
const widths = widthsArg.split(',').map(Number);
fs.mkdirSync(outDir, { recursive: true });

// Headless Chrome hides scrollbars by default (--hide-scrollbars), so captures never showed them (F-051). Keep them.
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
let failed = false;
try {
  for (const width of widths) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        // Failed requests are reported below with their URL; skip the URL-less console duplicate.
        if (m.text().startsWith('Failed to load resource')) return;
        if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(`${m.type()}: ${m.text()}`);
      });
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url().replace(/^https?:\/\/[^/]+/, '')}`);
      });
      await page.setViewport({ width, height: Number(heightArg) });
      await page.goto(`http://localhost:${port}/?p=${slug}&theme=${theme}&chrome=0${hash ? `#${hash}` : ''}`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      const file = path.join(outDir, `${fileStem}-${width}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      console.log(file + (overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''));
      errors.forEach((e) => console.log('  ' + e));
      if (errors.length) failed = true;
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);

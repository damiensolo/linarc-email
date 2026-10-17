// Conventions check: the CLAUDE.md rules that a grep can enforce. Runs on this repo's own source (never the library).
// Usage: yarn check            (also the first half of `yarn verify`)
//        node scripts/check-conventions.mjs [paths…]
// Exit 1 with one line per violation: file:line  rule  the offending text.
// Skip one line with a trailing `conventions-ignore` comment when a rule is wrong for that line (say why).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = process.argv.slice(2).length ? process.argv.slice(2) : ['src'];
const EXT = new Set(['.vue', '.js', '.mjs', '.css', '.scss']);
const SKIP_FILES = new Set(['src/style.css', 'src/shims/clamp.js']);

const PALETTE =
  'gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const SPACING_PREFIX =
  'p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|w|h|min-w|min-h|max-w|max-h|size|inset|top|right|bottom|left|rounded|leading|tracking';

/** [rule, regex, applies-to extensions, message] — class rules look at template/CSS, code rules at scripts. */
const RULES = [
  ['vue2-only', /<script\s[^>]*\bsetup\b/, ['.vue'], 'No <script setup>: Vue 2.7 Options API only'],
  ['no-typescript', /<script\s[^>]*\blang=["']ts["']/, ['.vue'], 'No TypeScript: plain JS, like the library'],
  ['no-hex', /(?<![\w&])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b(?![\w-])/, ['.vue', '.css', '.scss'], 'No hex colours: use a token class or var(--token)'],
  ['no-palette', new RegExp(`(?<![\\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|placeholder)-(?:${PALETTE})(?:-\\d{2,3})?(?![\\w-])`), ['.vue', '.js', '.mjs'], 'No primitive palette classes: use bg-surface-*, text-text-*, border-border-*'],
  ['no-arbitrary', /(?<![\w-])[a-z-]+-\[[^\]\s]+\]/, ['.vue', '.js', '.mjs'], 'No arbitrary values (h-[56px]): use the token scale'],
  // Zero (m-0, min-h-0, p-0) is allowed: a reset, not a size.
  ['no-raw-scale', new RegExp(`(?<![\\w-])-?(?:${SPACING_PREFIX})-(?:0\\.\\d+|[1-9]\\d*(?:\\.\\d+)?)(?![\\w/.])`), ['.vue', '.js', '.mjs'], 'No raw spacing / size / radius (p-6, w-64, rounded-2): use p-space-N, w-space-N, rounded-radius-N'],
  ['no-raw-scale', /(?<![\w-])(?:text-(?:xs|sm|base|lg|xl|\dxl)|rounded(?:-(?:none|sm|md|lg|xl|\dxl|full))?|leading-(?:none|tight|snug|normal|relaxed|loose)|tracking-(?:tighter|tight|normal|wide|wider|widest))(?![\w-])/, ['.vue', '.js', '.mjs'], 'No raw type / radius names (text-sm, rounded-lg): use text-fontsize-N, rounded-radius-N'],
  ['border-token', /(?<![\w-])border-(?:default|subtle|inactive|muted|container|neutral|soft)(?![\w-])/, ['.vue', '.js', '.mjs'], 'Border colours are border-border-*; a bare border-subtle is Tailwind’s preflight grey (F-043)'],
  ['no-reload-nav', /\blocation\.(?:assign|replace)\(|\blocation\.href\s*=/, ['.vue', '.js', '.mjs'], 'Never reload to move between screens: router.go() / href() (D-24, F-057)'],
  ['no-library-named-import', /from\s+['"]@development\/linarc-design-components['"]/, ['.vue', '.js', '.mjs'], 'build.js has only a default export: import the component file (@/components/…)'],
];

// Class rules apply to the markup and class strings only, so a comment that quotes a bad class isn't a violation.
function stripComments(text, ext) {
  let s = text;
  if (ext === '.vue') s = s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (ext !== '.css' && ext !== '.scss') s = s.replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return s;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXT.has(path.extname(entry.name))) yield full;
  }
}

const problems = [];
for (const target of SCAN) {
  const abs = path.resolve(ROOT, target);
  const files = fs.statSync(abs).isDirectory() ? [...walk(abs)] : [abs];
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (SKIP_FILES.has(rel)) continue;
    const ext = path.extname(file);
    const raw = fs.readFileSync(file, 'utf8');
    const lines = stripComments(raw, ext).split(/\r?\n/);
    const rawLines = raw.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/conventions-ignore/.test(rawLines[i])) return;
      for (const [rule, re, exts, message] of RULES) {
        if (!exts.includes(ext)) continue;
        const m = line.match(re);
        if (m) problems.push(`${rel}:${i + 1}  ${rule}  ${m[0]}\n    ${message}`);
      }
    });
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} convention problem${problems.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`Conventions OK (${SCAN.join(', ')}).`);

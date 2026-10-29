// CANDIDATE 2026-10-28: ranking helpers for SmartPicker (docs/components/SmartPicker.md). Pure functions, no DOM.

/** Lower-case, accents stripped. */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Letters and digits only: "RFI-142" → "rfi142", so "rfi142" and "142" both find it. */
export const compact = (text) => normalize(text).replace(/[^a-z0-9]/g, '');

/** The query as search words. */
export function tokens(query) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * How well one item matches every word of the query (0 = a word matched nowhere). Each word takes its best field:
 * the label at a word start counts most, then keywords and the description, then anywhere in the text; a word also
 * matches the compacted text, so "rfi143" and "143" find "RFI-143". Suggested and recent items win ties.
 */
export function scoreItem(item, words) {
  let total = 0;
  for (const w of words) {
    const wc = w.replace(/[^a-z0-9]/g, '');
    let best = 0;
    const check = (text, atStart, anywhere) => {
      const n = normalize(text);
      if (!n) return;
      if (n.startsWith(w)) best = Math.max(best, atStart + 1);
      else if (new RegExp(`(^|[^a-z0-9])${escapeRe(w)}`).test(n)) best = Math.max(best, atStart);
      else if (n.includes(w)) best = Math.max(best, anywhere);
      else if (wc && compact(text).includes(wc)) best = Math.max(best, anywhere);
    };
    check(item.label, 4, 2);
    (item.keywords || []).forEach((k) => check(k, 3, 1));
    check(item.description, 2, 1);
    check(item.meta, 1, 1);
    if (!best) return 0;
    total += best;
  }
  return total + (item.suggested ? 0.5 : 0) + (item.recent ? 0.25 : 0);
}

/** The items that match the query, best first (stable for equal scores). An empty query returns every item in order. */
export function rankItems(items, query) {
  const words = tokens(query);
  if (!words.length) return items.slice();
  return items
    .map((item, i) => ({ item, i, score: scoreItem(item, words) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.item);
}

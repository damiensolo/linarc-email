// CANDIDATE 2026-10-19: helpers for RecipientField (docs/components/RecipientField.md). Pure functions, no module data.

const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;

export const isEmail = (s) => EMAIL.test(String(s || '').trim());

export const domainOf = (email) => String(email || '').split('@')[1]?.toLowerCase() || '';

/**
 * One token typed or pasted → { name, email }. Accepts `jane@x.com`, `Jane Doe <jane@x.com>`, `"Doe, Jane" <jane@x.com>`.
 * A token that isn't an address comes back as { name: '', email: token } and is flagged invalid by `kindOf`.
 */
export function parseToken(token) {
  const t = String(token || '').trim();
  const angle = /^(.*)<([^>]+)>$/.exec(t);
  if (angle) return { name: angle[1].trim().replace(/^"|"$/g, ''), email: angle[2].trim().toLowerCase() };
  return { name: '', email: isEmail(t) ? t.toLowerCase() : t };
}

/**
 * Split pasted text into tokens. Commas and semicolons inside quotes or angle brackets don't split
 * ("Doe, Jane" <jane@x.com>); new lines always do.
 */
export function splitTokens(text) {
  const out = [];
  let buf = '';
  let quote = false;
  let angle = false;
  for (const ch of String(text || '')) {
    if (ch === '"') quote = !quote;
    if (ch === '<') angle = true;
    if (ch === '>') angle = false;
    if ((ch === ',' || ch === ';') && !quote && !angle) {
      out.push(buf);
      buf = '';
    } else if (ch === '\n' || ch === '\r') {
      out.push(buf);
      buf = '';
      quote = false;
      angle = false;
    } else buf += ch;
  }
  out.push(buf);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** internal | external | invalid. External = an address whose domain isn't one of `internalDomains` (empty → never). */
export function kindOf(recipient, internalDomains = []) {
  if (!recipient || recipient.invalid || !isEmail(recipient.email)) return 'invalid';
  if (!internalDomains.length) return 'internal';
  return internalDomains.includes(domainOf(recipient.email)) ? 'internal' : 'external';
}

/** "Name <email>" for the clipboard, or the bare address. */
export const toClipboardText = (r) => (r.name ? `${r.name} <${r.email}>` : r.email);

/** Contacts matching a query on name, email or company: word starts first, then anywhere. */
export function matchContacts(contacts, query, exclude = []) {
  const q = String(query || '').trim().toLowerCase();
  const pool = contacts.filter((c) => !exclude.includes(String(c.email).toLowerCase()));
  if (!q) return pool;
  const hay = (c) => [c.name, c.email, c.company].filter(Boolean).join(' ').toLowerCase();
  const starts = pool.filter((c) => hay(c).split(/[\s@.·,]+/).some((w) => w.startsWith(q)));
  const anywhere = pool.filter((c) => !starts.includes(c) && hay(c).includes(q));
  return [...starts, ...anywhere];
}

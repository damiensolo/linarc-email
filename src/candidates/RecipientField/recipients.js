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

/** A group chip (D-75): a distribution list as one recipient `{ group: true, id, name, members: [recipient], email: 'group:<id>' }`. */
export const isGroup = (r) => !!(r && r.group);

/** A list as a chip value; `email` is synthetic so the field's keys, duplicates and removal work unchanged. */
export const asGroupRecipient = (g) => ({ group: true, id: g.id, name: g.name, members: g.members.map((m) => ({ ...m })), email: `group:${g.id}` });

/** The recipients a message goes to: group chips expanded to their members, duplicates by address dropped. */
export function expandRecipients(list) {
  const out = [];
  const seen = new Set();
  for (const r of list || []) {
    for (const m of isGroup(r) ? r.members : [r]) {
      const key = String(m.email).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

/** Groups whose name matches the query (word starts first), not already in the field. */
export function matchGroups(groups, query, takenIds = []) {
  const q = String(query || '').trim().toLowerCase();
  const pool = (groups || []).filter((g) => !takenIds.includes(g.id));
  if (!q) return pool;
  const starts = pool.filter((g) => g.name.toLowerCase().split(/[\s·,]+/).some((w) => w.startsWith(q)));
  const anywhere = pool.filter((g) => !starts.includes(g) && g.name.toLowerCase().includes(q));
  return [...starts, ...anywhere];
}

/** "Name <email>" for the clipboard, or the bare address. */
export const toClipboardText = (r) => (isGroup(r) ? r.members.map((m) => (m.name ? `${m.name} <${m.email}>` : m.email)).join(', ') : r.name ? `${r.name} <${r.email}>` : r.email);

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

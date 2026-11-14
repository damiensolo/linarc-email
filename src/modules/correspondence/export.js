// The correspondence log as a CSV (D-79, 2026-11-14): what an owner's representative or a claims reviewer asks for,
// built from the Email screen's rows as they are filtered and sorted (the grid's display order). One line per thread:
// number, type, subject, linked records, from, owner, status, response due, delivery, last activity, follow-up.
const COLUMNS = [
  ['Number', (r) => (r.letterText === '—' ? '' : r.letterText.split(' · ')[0])],
  ['Type', (r) => (r.letterText === '—' ? '' : r.letterText.split(' · ')[1] || '')],
  ['Thread', (r) => r.id],
  ['Subject', (r) => r.subject],
  ['Linked records', (r) => (r.linkedText === '—' ? '' : r.linkedText)],
  ['From', (r) => r.fromText],
  ['Owner', (r) => r.ownerText || ''],
  ['Status', (r) => r.triageLabel],
  ['Response due', (r) => (r.dueText === '—' ? '' : r.dueText)],
  ['Delivery', (r) => (r.deliveryLabel === '—' ? '' : r.deliveryLabel)],
  ['Last activity', (r) => r.activityText],
  ['Follow up', (r) => (r.followUpText === '—' ? '' : r.followUpText)],
  ['Files', (r) => (r.filesText === '—' ? '' : r.filesText)],
];

const cell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** The CSV text for the given rows (Email screen rows, in display order). */
export function correspondenceCsv(rows) {
  const lines = [COLUMNS.map(([h]) => cell(h)).join(',')];
  rows.forEach((r) => lines.push(COLUMNS.map(([, fn]) => cell(fn(r))).join(',')));
  return `${lines.join('\r\n')}\r\n`;
}

/** Hand the file to the browser: `<project code>-correspondence-log-<date>.csv`. */
export function downloadCsv(text, name) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// PLACEHOLDER DATA — Correspondence module: letter types, the project's correspondence numbers and the letter
// templates (D-78, 2026-11-14). Formal construction correspondence is numbered and typed: owners and lawyers ask for
// "Letter C-0042", not a thread id; notices have contract deadlines and a fixed form. A thread the GC starts gets the
// next number on send (`nextLetterNumber`); a type names what it is; a template prefills a notice or a transmittal
// with the project letterhead, so nobody writes a delay notice from scratch.
import { session } from '~/modules/session';
import { PROJECT, TODAY } from './project';

/** `correspondenceType` (status.js CORRESPONDENCE_TYPE): what an outbound thread is. */
export const LETTER_TYPES = Object.freeze([
  { id: 'general', label: 'General' },
  { id: 'transmittal', label: 'Transmittal' },
  { id: 'notice', label: 'Notice' },
]);

/** The project's correspondence numbers before the demo: the four live threads and the archive, in sending order. */
export const SEED_LETTER_NUMBERS = Object.freeze({
  'THR-1001': 'C-0021', 'THR-1003': 'C-0023', 'THR-1008': 'C-0027', 'THR-1012': 'C-0029', 'THR-1016': 'C-0031', 'THR-1019': 'C-0033',
  'THR-1022': 'C-0034', 'THR-1025': 'C-0036', 'THR-1028': 'C-0037', 'THR-1031': 'C-0038', 'THR-1042': 'C-0040',
});
const SEED_COUNT = 40;

/** The next number: C-0041 for the first letter sent in the demo, then up. */
export function nextLetterNumber() {
  return `C-${String(SEED_COUNT + 1 + session.newThreads.filter((t) => t.letterNo).length).padStart(4, '0')}`;
}

const longDate = (iso) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * Letter templates: subject and body with the fields a letter needs. `{…}` placeholders are filled by `applyTemplate`
 * from the compose context (the record, the recipients' company, the sender); the body is the editor's HTML.
 */
export const LETTER_TEMPLATES = Object.freeze([
  {
    id: 'transmittal',
    type: 'transmittal',
    name: 'Transmittal',
    subject: 'Transmittal {number} — {topic}',
    body: '<p>{letterhead}</p><p><strong>Transmittal {number}</strong> · {date}</p><p>To: {recipientCompany}<br>Re: {topic}</p><p>We are transmitting the following for your {purpose}:</p><ul><li>{items}</li></ul><p>Please acknowledge receipt by reply. Reply to this email and your answer is filed on the project record.</p><p>{signoff}</p>',
    purpose: 'review and approval',
  },
  {
    id: 'delay-notice',
    type: 'notice',
    name: 'Delay notice',
    subject: 'Notice of delay {number} — {topic}',
    body: '<p>{letterhead}</p><p><strong>Notice of delay {number}</strong> · {date}</p><p>To: {recipientCompany}<br>Re: {topic}</p><p>In accordance with the contract\'s notice provisions, {gc} gives notice that progress on the work described above is delayed by a cause beyond our control: <em>[describe the cause and the date it began]</em>.</p><p>The activities affected and the time impact are: <em>[activities, days]</em>. We will update this notice when the impact is known and reserve our rights under the contract.</p><p>{signoff}</p>',
  },
  {
    id: 'change-notice',
    type: 'notice',
    name: 'Notice of change',
    subject: 'Notice of change {number} — {topic}',
    body: '<p>{letterhead}</p><p><strong>Notice of change {number}</strong> · {date}</p><p>To: {recipientCompany}<br>Re: {topic}</p><p>{gc} has identified a change to the work described above: <em>[describe the change and its source: directive, field condition, design revision]</em>.</p><p>We expect a cost and time impact and will submit a proposed change order within the contract period. Please confirm the direction to proceed.</p><p>{signoff}</p>',
  },
  {
    id: 'nonconformance',
    type: 'notice',
    name: 'Non-conformance notice',
    subject: 'Non-conformance notice {number} — {topic}',
    body: '<p>{letterhead}</p><p><strong>Non-conformance notice {number}</strong> · {date}</p><p>To: {recipientCompany}<br>Re: {topic}</p><p>The work described above does not conform to the contract documents: <em>[what, where, which drawing or specification]</em>.</p><p>Please propose a correction within the response time below. Work that depends on it is on hold until the correction is accepted.</p><p>{signoff}</p>',
  },
]);

export const templatesFor = (type) => LETTER_TEMPLATES.filter((t) => t.type === type);

/**
 * A template with its placeholders filled: `{ subject, body }`. `ctx` = { number, topic, recipientCompany, sender,
 * items: [names] }. Unknown values stay as readable brackets the sender fills in.
 */
export function applyTemplate(template, ctx = {}) {
  const sender = ctx.sender || {};
  const fill = {
    number: ctx.number || nextLetterNumber(),
    date: longDate(TODAY),
    topic: ctx.topic || '[subject]',
    recipientCompany: ctx.recipientCompany || '[recipient]',
    gc: PROJECT.gc,
    letterhead: `${PROJECT.gc} · ${PROJECT.name} (${PROJECT.code})`,
    signoff: `${sender.name || '[name]'}${sender.role ? `, ${sender.role}` : ''}<br>${PROJECT.gc}${sender.email ? `<br>${sender.email}` : ''}`,
    items: (ctx.items && ctx.items.length ? ctx.items : ['[attached files]']).join('</li><li>'),
    purpose: template.purpose || 'review',
  };
  const sub = (s) => String(s).replace(/\{(\w+)\}/g, (m, k) => (fill[k] != null ? fill[k] : m));
  return { subject: sub(template.subject), body: sub(template.body) };
}

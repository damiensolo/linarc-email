// Correspondence: module data → what the candidates render (ThreadStream entries, AiSummary groups). The candidates hold
// no module data (src/candidates/README.md), so names, labels and tones are resolved here, once, for every screen.
import { DELIVERY, AUDIT_EVENT, DRAWING_REVISION, RFI_STATUS } from '~/modules/app/status';
import { getPerson, getFile, getRecord, recordLabel } from './data';

const initials = (name) =>
  (name || '')
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

const personView = (id) => {
  const p = getPerson(id);
  return p ? { id: p.id, name: p.name, company: p.company, initials: initials(p.name), guest: p.guest } : { id, name: 'Unknown sender', company: '', initials: '?', guest: true };
};

const DELIVERY_RANK = ['bounced', 'sending', 'delivered', 'link_viewed', 'downloaded'];

/** ThreadStream entries for a thread the role may see (apply `viewFor` first). */
export function threadEntries(thread) {
  const resolved = (thread.resolvedBounces || []);
  return thread.entries.map((e) => {
    if (e.type === 'note') return { id: e.id, type: 'note', sender: personView(e.senderId), sentAt: e.sentAt, body: e.body };
    if (e.type === 'event') return { id: e.id, type: 'event', sentAt: e.sentAt, text: e.text, recordId: e.recordId };
    const recipients = (e.recipients || []).map((r) => ({ ...r, person: r.personId ? personView(r.personId) : null }));
    const weakest = recipients.map((r) => r.delivery).sort((a, b) => DELIVERY_RANK.indexOf(a) - DELIVERY_RANK.indexOf(b))[0];
    const to = recipients.filter((r) => r.kind === 'to').map((r) => (r.person ? r.person.name : r.email));
    return {
      id: e.id,
      type: 'message',
      direction: e.direction,
      sender: personView(e.senderId),
      sentAt: e.sentAt,
      body: e.body,
      toText: e.direction === 'outbound' ? to.join(', ') : e.toAddress || '',
      // Static messages reference the file table by id; messages composed in the demo carry their files inline.
      attachments: e.attachments || (e.attachmentIds || []).map(getFile).filter(Boolean),
      delivery: weakest ? { key: weakest, label: DELIVERY[weakest].label, tone: DELIVERY[weakest].tone } : null,
      bounce: e.bounce ? { ...e.bounce, resolved: resolved.includes(e.id) } : null,
      resendOf: e.resendOf || null,
      promotion: e.promotion || null,
      recipients,
    };
  });
}

/** AiSummary props from a thread's summary (null when there is none). */
export const summaryView = (thread) => (thread.aiSummary ? { groups: thread.aiSummary.groups, evidence: thread.aiSummary.evidence } : null);

/** Linked items for the right panel: records with their revision or status label and tone. */
export function linkedItems(thread) {
  return thread.linkedRecordIds.map((id) => {
    const r = getRecord(id);
    if (!r) return { id, label: id, title: '', status: null, type: null };
    let status = null;
    if (r.type === 'drawing') status = DRAWING_REVISION[r.revisionStatus];
    if (r.type === 'rfi') status = RFI_STATUS[r.status];
    return { id, type: r.type, label: recordLabel(id), title: r.title, status, supersededBy: r.supersededBy || null };
  });
}

/** Delivery tab rows: event label and tone, actor, time; IP, agent and file in `details` (a row's expand only, Q-09). */
export function deliveryRows(thread) {
  return [...thread.audit].reverse().map((a) => {
    const ev = AUDIT_EVENT[a.event] || { label: a.event, tone: 'neutral' };
    const actor = a.actorId ? personView(a.actorId) : { name: a.actorName || a.actorEmail || 'System', company: '' };
    const details = [];
    if (a.ip) details.push(`IP ${a.ip}${a.agent ? ` · ${a.agent}` : ''}`);
    const file = a.fileId ? getFile(a.fileId) : null;
    if (file) details.push(`${file.name} · SHA-256 ${file.sha256.slice(0, 8)}…${file.sha256.slice(-6)}`);
    return { id: a.id, at: a.at, label: ev.label, tone: ev.tone, actor: actor.name, detail: a.detail, details };
  });
}

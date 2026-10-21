// PLACEHOLDER DATA — Correspondence module: the RFI as the Documentation file's ☉ Create RFI page draws it (Details,
// Q&A, Workflow, Email; docs/correspondence/rfi-integration.md), and what connects it to Email: Add to Q&A from an
// inbound message (D-49), Route / Approve / Revise / Reject / Close with *Notify by email* (§D), and the Activity panel
// that mixes record events with the delivery rows of the RFI's threads (§E). Writes go through the session (D-29).
import { patchRecord, appendThreadEntry, appendThreadAudit, patchThread } from '~/modules/session';
import { TODAY, PROJECT } from './project';
import { getPerson } from './people';
import { getRecord } from './records';
import { getThread, getThreads } from './threads';
import { createThread } from './actions';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** RFI Type select (Details) */
export const RFI_TYPES = Object.freeze({
  design_clarification: 'Design clarification',
  coordination: 'Coordination',
  field_condition: 'Field condition',
  substitution: 'Substitution request',
});

/** Priority select (Details) */
export const PRIORITIES = Object.freeze({ low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' });

/** Workflow step actions, as the Figma steps name them (CREATE, RESPOND, REVIEW, CLOSE) */
export const WORKFLOW_ACTIONS = Object.freeze({ create: 'Create', respond: 'Respond', review: 'Review', close: 'Close' });

/** Q&A step kinds: the chip on each step */
export const QA_KINDS = Object.freeze({ question: 'Question', response: 'Response', comment: 'Comment', review: 'Review' });

/** Company type of a directory company (the workflow step's Company Type column). */
const COMPANY_TYPES = {
  'Vanguard Construction Group': 'General Contractor',
  'Studio West Architecture': 'Architect',
  'Thornton Structural Engineers': 'Structural Engineer',
  'Apex Mechanical Systems': 'Subcontractor',
  'SunState Drywall & Framing': 'Subcontractor',
  'Riverside Health System': 'Owner',
};
export const companyTypeOf = (company) => COMPANY_TYPES[company] || 'Consultant';

/** `days` working days after `iso` (17:00), skipping weekends. */
export function addWorkingDays(iso, days) {
  const d = new Date(iso);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added += 1;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00:00`;
}

const dayOf = (iso) => (iso ? iso.slice(0, 10) : '');

/** A step's shown status: an open step past its due date is Overdue (computed, never stored). */
export function stepStatus(step) {
  const open = step.status === 'in_progress' || step.status === 'returned';
  return open && step.dueDate && dayOf(step.dueDate) < dayOf(TODAY) ? 'overdue' : step.status;
}

/** The step in hand: the first open one (null once the workflow has ended). */
export function currentStep(record) {
  const steps = (record.workflow && record.workflow.steps) || [];
  return steps.find((s) => s.status === 'in_progress' || s.status === 'returned') || null;
}

const nextOf = (record, step) => {
  const steps = record.workflow.steps;
  return steps[steps.indexOf(steps.find((s) => s.id === step.id)) + 1] || null;
};

/** The step after the current one (what Route and Approve move to). */
export const nextStep = (record) => {
  const cur = currentStep(record);
  return cur ? nextOf(record, cur) : null;
};

/** The respond step (what Revise returns to). */
const respondStep = (record) => record.workflow.steps.find((s) => s.action === 'respond') || null;

/** Is anyone on these steps outside the company? (Notify by email is on by default then, §D.) */
export const hasExternal = (partyIds) => partyIds.some((id) => (getPerson(id) || {}).guest);

/**
 * Who Compose suggests first on an RFI (§B): the current step's parties, then the distribution list. To is prefilled
 * with the ball-in-court party (the current step's first party who isn't the viewer).
 */
export function rfiRecipients(record, viewerId) {
  const cur = currentStep(record);
  const parties = cur ? cur.partyIds : [];
  const suggested = [...new Set([...parties, ...(record.distributionIds || []), record.assignedToId].filter(Boolean))].filter((id) => id !== viewerId);
  const toId = parties.find((id) => id !== viewerId) || (record.assignedToId !== viewerId ? record.assignedToId : null);
  return { suggestedIds: suggested, toIds: toId ? [toId] : [], dueOn: cur && cur.dueDate ? cur.dueDate : null };
}

/** Record-level activity the demo adds (routing, Q&A, closing); the static history is derived in `rfiActivity`. */
function logActivity(recordId, row) {
  const r = getRecord(recordId);
  patchRecord(recordId, { activity: [...(r.activity || []), { id: uid('act'), at: TODAY, ...row }] });
}

/** Threads on an RFI: linked or promoted to it, plus the thread it was created from. */
export function rfiThreads(record) {
  return getThreads().filter((t) => t.linkedRecordIds.includes(record.id) || t.promotedRecordId === record.id || t.id === record.threadId);
}

/**
 * Activity panel rows, newest first (§E): record events (created, routed, steps, Q&A, closed) and the email events of
 * the RFI's threads the role may see (sent, delivered, opened, downloaded, failed, reply received). Each email row
 * carries its thread so the panel can open it and its event `label` (AUDIT_EVENT).
 * `{ id, at, actor, text, label?, kind: 'record' | 'email', threadId?, tone }`.
 */
export function rfiActivity(record, threads, { AUDIT_EVENT }) {
  const name = (id) => (getPerson(id) || {}).name || 'Someone';
  // `seq` orders rows written at the same moment (the demo clock stands still): later writes first.
  const rows = [{ id: `${record.id}-created`, at: record.createdAt, seq: 0, actor: name(record.createdById), text: record.threadId ? `Created ${record.code} from email` : `Created ${record.code}`, kind: 'record', tone: 'neutral' }];
  (record.activity || []).forEach((a, i) => rows.push({ id: a.id, at: a.at, seq: 1000 + i, actor: name(a.actorId), text: a.text, kind: a.threadId ? 'email' : 'record', threadId: a.threadId || null, tone: a.tone || 'neutral' }));
  const EMAIL_EVENTS = ['SMTP_DISPATCHED', 'SMTP_BOUNCED', 'INBOUND_REPLY_INGESTED', 'MAGIC_LINK_ACCESSED', 'ATTACHMENT_DOWNLOADED'];
  threads.forEach((t) => (t.audit || []).filter((a) => EMAIL_EVENTS.includes(a.event)).forEach((a, i) => {
    const ev = AUDIT_EVENT[a.event];
    rows.push({ id: `${t.id}-${a.id}`, at: a.at, seq: i, actor: a.actorId ? name(a.actorId) : a.actorName || a.actorEmail || 'System', label: ev.label, text: t.subject.replace(/^\[[^\]]+\]\s*/, ''), kind: 'email', threadId: t.id, tone: ev.tone });
  }));
  return rows.sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq);
}

/**
 * Add to Q&A (D-49): an inbound message becomes a Q&A step with an Email source chip that links back to it. The
 * thread gains the event, the Delivery tab a row; a response from the ball-in-court party resolves the thread's
 * Needs action. Nothing is sent. Returns the new step's number.
 */
export function addToQa(recordId, { threadId, messageId, actorId, authorId, kind, body, attachments = [] }) {
  const record = getRecord(recordId);
  const step = { id: uid('qa'), kind, authorId, at: TODAY, body, attachments, attachmentIds: [], source: 'email', threadId, messageId, addedById: actorId };
  const qa = [...record.qa, step];
  patchRecord(recordId, { qa });
  const n = qa.length;
  const actor = getPerson(actorId);
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'qa', actorId, sentAt: TODAY, recordId, text: `Added to ${record.code} Q&A as Step ${n} by ${actor ? actor.name : 'a team member'}` });
  appendThreadAudit(threadId, { id: uid('aud'), at: TODAY, event: 'QA_ADDED', actorId, detail: `Message added to ${record.code} Q&A as Step ${n} (${QA_KINDS[kind]})` });
  if (getThread(threadId).triage === 'needs_action') patchThread(threadId, { triage: 'resolved', lastActivityAt: TODAY });
  const author = getPerson(authorId);
  logActivity(recordId, { actorId, text: `Added ${author ? `${author.name}'s` : 'an'} email to Q&A as Step ${n} (${QA_KINDS[kind]})`, tone: 'info' });
  return n;
}

/** A Q&A step written in Linarc (the response editor under the steps). */
export function postQaStep(recordId, { authorId, kind, body, attachments = [] }) {
  const record = getRecord(recordId);
  const qa = [...record.qa, { id: uid('qa'), kind, authorId, at: TODAY, body, attachments, attachmentIds: [], source: 'linarc' }];
  patchRecord(recordId, { qa });
  logActivity(recordId, { actorId: authorId, text: `Added Step ${qa.length} to Q&A (${QA_KINDS[kind]})`, tone: 'neutral' });
  return qa.length;
}

/** Email the step's parties about the RFI (Route / Revise with Notify by email, §D): one thread per route. */
function notify(record, { actorId, toIds, dueOn, message, verb }) {
  const thread = createThread({
    senderId: actorId,
    toIds,
    subject: `[${PROJECT.code}] ${record.code} — ${record.title}`,
    body: message || `${verb}: ${record.code}, ${record.title}. Please respond by ${new Date(dueOn).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Reply to this email to answer; your reply is filed on the RFI.`,
    linkedRecordIds: [record.id],
    responseDueAt: dueOn,
    attachRecordPdf: true,
  });
  return thread;
}

/** Apply a workflow move: close `from`, open `to` (dates from process days), update ball in court, status, due. */
function move(record, from, to, { fromStatus = 'completed', toStatus = 'in_progress', recordStatus }) {
  const steps = record.workflow.steps.map((s) => {
    // A completed step gets its out date; a step sent back (Revise) is reset to not started.
    if (from && s.id === from.id) return fromStatus === 'completed' ? { ...s, status: fromStatus, outDate: TODAY } : { ...s, status: fromStatus, inDate: null, dueDate: null, outDate: null };
    if (to && s.id === to.id) return { ...s, status: toStatus, inDate: TODAY, dueDate: addWorkingDays(TODAY, s.processDays), outDate: null };
    return s;
  });
  const opened = to ? steps.find((s) => s.id === to.id) : null;
  const party = opened ? getPerson(opened.partyIds[0]) : null;
  patchRecord(record.id, {
    workflow: { ...record.workflow, steps },
    status: recordStatus || record.status,
    ...(opened ? { dueOn: opened.dueDate, ballInCourt: party ? party.company : record.ballInCourt, assignedToId: opened.partyIds[0] } : {}),
  });
  return opened;
}

/**
 * Route (§D): complete the current step and start the next. From Respond the RFI becomes Answered (a response is in
 * review). With `notify`, the next step's parties get one email with the RFI pinned and its PDF. Returns
 * `{ step, thread }`.
 */
export function routeRfi(recordId, { actorId, notify: send, message }) {
  const record = getRecord(recordId);
  const cur = currentStep(record);
  const next = cur ? nextOf(record, cur) : null;
  if (!next) return null;
  const opened = move(record, cur, next, { recordStatus: cur.action === 'respond' ? 'answered' : record.status });
  const toIds = opened.partyIds.filter((id) => id !== actorId);
  const thread = send && toIds.length ? notify(getRecord(recordId), { actorId, toIds, dueOn: opened.dueDate, message, verb: `For your ${WORKFLOW_ACTIONS[opened.action].toLowerCase()}` }) : null;
  logActivity(recordId, { actorId, text: `Routed to ${WORKFLOW_ACTIONS[opened.action]}${toIds.length ? ` · ${toIds.map((id) => (getPerson(id) || {}).name).join(', ')}` : ''}${thread ? ' · emailed' : ''}`, threadId: thread ? thread.id : null, tone: 'info' });
  return { step: opened, thread };
}

/** Approve (Review step): the response stands; on to Close. */
export function approveRfi(recordId, { actorId }) {
  const record = getRecord(recordId);
  const cur = currentStep(record);
  const opened = move(record, cur, nextOf(record, cur), { recordStatus: 'answered' });
  logActivity(recordId, { actorId, text: 'Approved the response', tone: 'success' });
  return { step: opened, thread: null };
}

/** Revise (Review step): back to Respond, with an optional email to the responder. */
export function reviseRfi(recordId, { actorId, notify: send, message }) {
  const record = getRecord(recordId);
  const cur = currentStep(record);
  const back = respondStep(record);
  const opened = move(record, cur, back, { fromStatus: 'not_started', toStatus: 'returned', recordStatus: 'open' });
  const toIds = opened.partyIds.filter((id) => id !== actorId);
  const thread = send && toIds.length ? notify(getRecord(recordId), { actorId, toIds, dueOn: opened.dueDate, message, verb: 'Revision requested' }) : null;
  logActivity(recordId, { actorId, text: `Returned for revision${thread ? ' · emailed' : ''}`, threadId: thread ? thread.id : null, tone: 'warning' });
  return { step: opened, thread };
}

/** Reject (Review step): the workflow ends; the RFI is rejected and can't send email. */
export function rejectRfi(recordId, { actorId, message }) {
  const record = getRecord(recordId);
  const cur = currentStep(record);
  move(record, cur, null, { recordStatus: 'rejected' });
  patchRecord(recordId, { closed: true });
  logActivity(recordId, { actorId, text: `Rejected${message ? `: ${message}` : ''}`, tone: 'error' });
  return { step: null, thread: null };
}

/** Close (Close step): the RFI is closed; Compose is disabled from then on (today's rule). */
export function closeRfi(recordId, { actorId }) {
  const record = getRecord(recordId);
  move(record, currentStep(record), null, { recordStatus: 'closed' });
  patchRecord(recordId, { closed: true });
  logActivity(recordId, { actorId, text: `Closed ${record.code}`, tone: 'success' });
  return { step: null, thread: null };
}

/** Watchers (right panel): notification-only; not email recipients unless added in Compose. */
export function setWatchers(recordId, watcherIds, { actorId, added }) {
  patchRecord(recordId, { watcherIds });
  if (added) logActivity(recordId, { actorId, text: `Added ${(getPerson(added) || {}).name} as a watcher`, tone: 'neutral' });
}

/**
 * Add to Q&A's text (D-49): the message without quoted history ("> …", "On … wrote:" and what follows) or the sign-off
 * and signature. Returns `{ text, removed }`, so the panel can list what was taken out; nothing disappears silently.
 */
export function stripQuoted(body) {
  const lines = (body || '').split('\n');
  let cut = lines.findIndex((l) => /^\s*>/.test(l) || /^On .+wrote:\s*$/.test(l.trim()) || /^-{2,}\s*$/.test(l.trim()));
  const signOff = lines.findIndex((l) => /^(best( regards)?|regards|thanks|thank you|cheers),?\s*$/i.test(l.trim()));
  if (signOff > 0 && (cut < 0 || signOff < cut)) cut = signOff;
  if (cut < 0) return { text: body.trim(), removed: [] };
  return { text: lines.slice(0, cut).join('\n').trim(), removed: lines.slice(cut).filter((l) => l.trim()) };
}

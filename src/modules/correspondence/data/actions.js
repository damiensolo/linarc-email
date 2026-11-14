// Correspondence module: what a person does in the demo, written through the session (D-29) so every screen sees it.
// Screens call these; they never write to the session directly. Each returns what the screen needs to acknowledge.
import {
  session,
  addGuest as sessionAddGuest,
  addThread,
  appendThreadEntry,
  appendThreadAudit,
  patchThread,
  patchRecord,
  addCreatedRecord,
  revokeLink as sessionRevokeLink,
  markLinkReplied,
  markLinkAcknowledged,
  setSetting,
  setNotificationEntry,
} from '~/modules/session';
import { TODAY, relDate, PROJECT, RESPONSE_DUE_WORKING_DAYS, CONTRACT_TURNAROUND, isWorkingDay, MAIL_SIZE_LIMIT_MB, roleById, replyAddress } from './project';
import { findPersonByEmail, getPeople, getPerson, guessFromEmail } from './people';
import { getRecord, recordLabel, nextRecordCode } from './records';
import { cloudFile } from './cloud';
import { nextLetterNumber } from './templates';
import { getThread, getThreads, nextThreadId, sampleFileUrl, getDeletedThreads, isUnreadFor, ownerOf, canRemind, remindersOf } from './threads';
import { go } from '~/modules/app/router';
import { storeFile } from '~/modules/fileStore';
import { recordPdf, pdfBlob } from '~/modules/mock/pdf';
import { RFI_STATUS } from '~/modules/app/status';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => TODAY; // the demo clock stands still; everything created "now" is at TODAY

/** The viewer's role (sandbox role switcher). */
export const currentRole = () => roleById(session.settings.role);
export const setRole = (id) => setSetting('role', id);

/**
 * Default Response due: the contract's turnaround for the record type (D-76; plain email: three working days, spec §7),
 * counted in the project calendar's working days (weekends and holidays skipped).
 */
export function defaultResponseDue(kind = 'email') {
  const rule = CONTRACT_TURNAROUND[kind] || CONTRACT_TURNAROUND.email;
  let days = 0;
  let added = 0;
  while (added < (rule.days || RESPONSE_DUE_WORKING_DAYS)) {
    days += 1;
    if (isWorkingDay(new Date(relDate(days)))) added += 1;
  }
  return relDate(days);
}

/** What Compose says under Response due (D-76): the rule and the calendar, in one line. */
export function turnaroundNote(kind = 'email') {
  const rule = CONTRACT_TURNAROUND[kind] || CONTRACT_TURNAROUND.email;
  return `${rule.days} working days for ${rule.label}${rule.source ? ` (${rule.source})` : ''}; weekends and the project calendar's holidays are skipped.`;
}

/**
 * A guest user from an address; returns the existing person if known. Data-layer only since 2026-10-28 (D-60): the
 * compose panel no longer adds guests (deferred for customer discovery); inbound mail from an unknown address and a
 * secure-link recipient still need a person record to show.
 */
export function addGuest({ email, name, company, role }) {
  const existing = findPersonByEmail(email);
  if (existing) return existing;
  const guess = guessFromEmail(email);
  const guest = {
    id: uid('usr-guest'),
    name: name || guess.name,
    email: email.trim().toLowerCase(),
    company: company || guess.company,
    role: role || 'External consultant',
    trade: '00 00 00 · External guest',
    guest: true,
  };
  sessionAddGuest(guest);
  return guest;
}

/**
 * A file someone picked to attach (Compose, the thread composer): its description for the session, its bytes in the
 * file store so it can be previewed, opened and downloaded. Over the mail limit it goes by secure link (spec §5).
 */
export function newAttachment(file) {
  const id = uid('att');
  const sizeMb = Math.max(0.1, Math.round((file.size / 1048576) * 10) / 10); // the tiles show tenths of a MB
  storeFile(id, file);
  // D-80: a photo keeps when it was taken (the file's own timestamp; the camera's capture time on a phone), so the
  // tile says "Taken 16 Oct, 10:30" and a site photo is evidence, not just a picture
  const image = /^image\//.test(file.type);
  const takenAt = image && file.lastModified ? new Date(file.lastModified).toISOString() : null;
  return { id, name: file.name, sizeMb, byLink: sizeMb > MAIL_SIZE_LIMIT_MB, stored: true, previewable: image, takenAt };
}

/** The composer's *Attach a record* (spec §7): the record goes with the message as its PDF, like today's checkbox. */
export function recordAttachment(recordId) {
  const record = getRecord(recordId);
  if (!record) return null;
  return { ...recordPdfAttachment(uid('att'), record), kind: 'record', recordId: record.id, name: `${record.code}.pdf` };
}

/** The composer's *Choose from cloud drive*: the drive file is copied in as a real PDF (kept in the file store). */
export function cloudAttachment(cloudId) {
  const item = cloudFile(cloudId);
  if (!item) return null;
  const id = uid('att');
  const pdf = recordPdf({ project: `${PROJECT.name} (${PROJECT.code})`, code: item.name.replace(/\.pdf$/i, ''), title: item.title, fields: [['Source', item.provider], ['Folder', item.folder], ['Modified', item.modified]] });
  const blob = pdfBlob(pdf);
  storeFile(id, blob);
  return { id, kind: 'cloud', provider: item.provider, cloudId: item.id, name: item.name, sizeMb: item.sizeMb, byLink: item.sizeMb > MAIL_SIZE_LIMIT_MB, generated: true, stored: true };
}

/** Today's "Attach a PDF of the record", generated as a real PDF (kept in the file store under `id`). */
function recordPdfAttachment(id, record) {
  const fields = [
    ['Title', record.title],
    ['Spec section', record.spec],
    ['Status', record.type === 'rfi' && RFI_STATUS[record.status] ? RFI_STATUS[record.status].label : record.revision || ''],
    ['Ball in court', record.ballInCourt || ''],
    ['Due', record.dueOn ? record.dueOn.slice(0, 10) : ''],
    ['Cost impact', record.costImpact || (record.amount ? `$${record.amount.toLocaleString('en-US')}` : '')],
    ['Schedule impact', record.scheduleImpact || ''],
    ['Question', record.question || ''],
  ].filter(([, v]) => v);
  const pdf = recordPdf({ project: `${PROJECT.name} (${PROJECT.code})`, code: record.code, title: record.title, fields });
  const blob = pdfBlob(pdf);
  storeFile(id, blob);
  return { id, name: `${record.code}.pdf`, sizeMb: Math.max(0.1, Math.round((blob.size / 1048576) * 10) / 10), byLink: false, generated: true, stored: true };
}

/**
 * Send a message (compose or reply). `recipients` = [{ personId, kind: 'to' | 'cc' }]. Outbound mail from an internal
 * sender puts the thread in Waiting; an inbound one (guest role replying) puts it in Needs action.
 */
export function sendMessage(threadId, { senderId, body, bodyHtml = '', links = [], recipients = [], attachments = [], attachmentIds = [], responseDueAt }) {
  const sender = getPerson(senderId);
  const outbound = sender && !sender.guest;
  // Reply to all (spec §6.3): everyone on the thread but the writer, unless the caller named the recipients
  const thread = getThread(threadId);
  const toAll = outbound && !recipients.length && thread ? thread.participantIds.filter((id) => id !== senderId).map((personId) => ({ personId, kind: 'to' })) : recipients;
  const entry = {
    id: uid('msg'), type: 'message', direction: outbound ? 'outbound' : 'inbound', senderId, sentAt: nowIso(), body,
    // Written in the composer: the formatted body (shown when present) and any links attached (spec §6.3).
    ...(bodyHtml ? { bodyHtml } : {}),
    ...(links.length ? { links } : {}),
    // Files picked in the demo travel inline (they are not in the static file table); static ones by id.
    ...(attachments.length ? { attachments } : { attachmentIds }),
    recipients: outbound ? toAll.map((r) => ({ ...r, delivery: 'delivered' })) : [],
  };
  appendThreadEntry(threadId, entry);
  const patch = { triage: outbound ? 'waiting' : 'needs_action', lastActivityAt: entry.sentAt, unreadBy: unreadAfter(threadId, senderId) };
  if (responseDueAt) patch.responseDueAt = responseDueAt;
  patchThread(threadId, patch);
  appendThreadAudit(threadId, {
    id: uid('aud'), at: entry.sentAt, event: outbound ? 'SMTP_DISPATCHED' : 'INBOUND_REPLY_INGESTED', actorId: senderId,
    detail: outbound ? 'Message sent via the Linarc relay (250 2.0.0 OK)' : `Reply received via reply+${threadId.toLowerCase().replace(/-/g, '_')}@mail.linarc.io`,
  });
  return entry;
}

/**
 * Compose (spec §5): start a thread from a record, a drawing pin or the Email screen. `toIds`, `ccIds`, `bccIds` are
 * people (any guest created inline is already in the session; Bcc, D-47), `cc` is typed addresses (older callers),
 * `attachments` are resolved file objects
 * ({ id, name, sizeMb, byLink }); `attachRecordPdf` adds today's "generate a PDF of the record" as a file.
 */
export function createThread({ senderId, toIds = [], ccIds = [], bccIds = [], cc = '', subject, body, bodyHtml = '', links = [], attachments = [], linkedRecordIds = [], pinId = null, responseDueAt = null, attachRecordPdf = false, remindAtDue = false, letterType = 'general', templateId = null }) {
  const id = nextThreadId();
  const at = nowIso();
  const sender = getPerson(senderId);
  const first = toIds.length ? getPerson(toIds[0]) : null;
  const record = linkedRecordIds.length ? getRecord(linkedRecordIds[0]) : null;
  const files = [...attachments];
  if (attachRecordPdf && record) files.push(recordPdfAttachment(uid('att'), record));
  const ccList = String(cc || '').split(/[,;\s]+/).filter(Boolean); // typed addresses (older callers)
  const thread = {
    id,
    subject,
    triage: 'waiting',
    visibility: 'project_public',
    promotion: 'unpromoted',
    promotedRecordId: null,
    responseDueAt,
    // D-78: the project's correspondence number, assigned on send, and the letter type (General · Transmittal · Notice)
    letterNo: nextLetterNumber(),
    letterType,
    templateId,
    // D-72: the sender owns what they start; a reminder at the due date is the compose panel's choice
    ownerId: senderId,
    remindAtDue: !!(remindAtDue && responseDueAt),
    followUpAt: null,
    lastActivityAt: at,
    participantIds: [senderId, ...toIds, ...ccIds, ...bccIds],
    unreadBy: [...toIds, ...ccIds, ...bccIds], // the recipients have not opened it (D-67)
    primaryCompany: first ? first.company : ccList[0] || '',
    trade: record ? record.spec : '',
    estimatedCostImpact: null,
    linkedRecordIds,
    pinId,
    aiSummary: null,
    entries: [
      {
        id: uid('msg'), type: 'message', direction: 'outbound', senderId, sentAt: at, body, attachments: files,
        ...(bodyHtml ? { bodyHtml } : {}),
        ...(links.length ? { links } : {}),
        recipients: [
          ...toIds.map((personId) => ({ personId, kind: 'to', delivery: 'delivered' })),
          ...ccIds.map((personId) => ({ personId, kind: 'cc', delivery: 'delivered' })),
          ...bccIds.map((personId) => ({ personId, kind: 'bcc', delivery: 'delivered' })),
          ...ccList.map((email) => ({ email, kind: 'cc', delivery: 'delivered' })),
        ],
      },
    ],
    audit: [{ id: uid('aud'), at, event: 'SMTP_DISPATCHED', actorId: senderId, detail: `Message sent via the Linarc relay (250 2.0.0 OK)${files.some((f) => f.byLink) ? ' · large files by secure link' : ''}` }],
    createdInDemo: true,
    senderName: sender ? sender.name : '',
  };
  addThread(thread);
  return thread;
}

/** Internal team note (spec §6.1): never leaves the company, never changes triage. */
export function postNote(threadId, { senderId, body, bodyHtml = '', links = [] }) {
  const entry = { id: uid('note'), type: 'note', senderId, sentAt: nowIso(), body, ...(bodyHtml ? { bodyHtml } : {}), ...(links.length ? { links } : {}) };
  appendThreadEntry(threadId, entry);
  // Only the team sees notes, so only the team's participants have it unread
  patchThread(threadId, { lastActivityAt: entry.sentAt, unreadBy: unreadAfter(threadId, senderId).filter((id) => !(getPerson(id) || {}).guest) });
  // D-72: "@Alex …" in a note hands the thread to Alex (a team member; the first mention wins)
  const mentioned = mentionedTeam(body)[0];
  if (mentioned && mentioned.id !== ownerOf(getThread(threadId))) assignOwner(threadId, mentioned.id, { actorId: senderId, how: 'note' });
  return entry;
}

/** Team members a note mentions as "@First" or "@First Last" (D-72). */
export function mentionedTeam(body) {
  const team = getPeople().filter((p) => !p.guest);
  const mentions = String(body || '').match(/@[A-Za-z]+(?:\s[A-Z][A-Za-z]+)?/g) || [];
  const found = [];
  mentions.forEach((m) => {
    const text = m.slice(1).toLowerCase();
    const p = team.find((t) => t.name.toLowerCase() === text) || team.find((t) => t.name.toLowerCase().split(' ')[0] === text.split(' ')[0]);
    if (p && !found.includes(p)) found.push(p);
  });
  return found;
}

// --- Triage (D-72, 2026-11-14): owner, resolve / reopen, follow-up, reminders. Each writes the thread, an event row
// the ThreadStream shows and a Delivery row; none of them sends mail except the reminder.

/** Hand the thread to a team member (the title bar's Owner select, the list bar, an @mention in a note). */
export function assignOwner(threadId, ownerId, { actorId, how = 'select' }) {
  const owner = getPerson(ownerId);
  if (!owner) return null;
  const at = nowIso();
  const actor = getPerson(actorId);
  patchThread(threadId, { ownerId, lastActivityAt: at });
  // Notifications reads the same assignment (docs/notifications/spec.md: one obligation, one owner)
  setNotificationEntry('ntfAssignments', `thread:${threadId}`, { toId: ownerId, byId: actorId, at });
  const self = ownerId === actorId;
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'owner', actorId, sentAt: at, text: self ? `${owner.name} took this thread` : `Assigned to ${owner.name} by ${actor ? actor.name : 'a team member'}${how === 'note' ? ' (mentioned in a note)' : ''}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'OWNER_ASSIGNED', actorId, detail: `Owner: ${owner.name}${how === 'note' ? ' (from an @mention)' : ''}` });
  return owner;
}

/** Mark resolved by hand: the thread owes nobody a response; Needs action and Overdue let go of it. */
export function resolveThread(threadId, { actorId }) {
  const at = nowIso();
  const actor = getPerson(actorId);
  patchThread(threadId, { triage: 'resolved', resolvedById: actorId, resolvedAt: at, followUpAt: null, lastActivityAt: at });
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'resolved', actorId, sentAt: at, text: `Marked resolved by ${actor ? actor.name : 'a team member'}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'THREAD_RESOLVED', actorId, detail: 'Marked resolved; no response owed' });
}

/** Reopen: triage follows the last message again (inbound → Needs action, ours → Waiting on them). */
export function reopenThread(threadId, { actorId }) {
  const thread = getThread(threadId);
  if (!thread) return;
  const at = nowIso();
  const actor = getPerson(actorId);
  const last = [...thread.entries].reverse().find((e) => e.type === 'message');
  patchThread(threadId, { triage: last && last.direction === 'inbound' ? 'needs_action' : 'waiting', resolvedById: null, resolvedAt: null, lastActivityAt: at });
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'reopened', actorId, sentAt: at, text: `Reopened by ${actor ? actor.name : 'a team member'}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'THREAD_REOPENED', actorId, detail: 'Reopened' });
}

/** A follow-up date for the team's own chasing (null clears it): the thread surfaces in Follow up on that day. */
export function setFollowUp(threadId, followUpAt, { actorId }) {
  const at = nowIso();
  patchThread(threadId, { followUpAt: followUpAt || null });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'FOLLOW_UP_SET', actorId, detail: followUpAt ? `Follow up on ${followUpAt.slice(0, 10)}` : 'Follow-up cleared' });
}

/** The reminder's default wording: what was asked, when it was due, how to answer. */
export function reminderText(thread) {
  const last = [...thread.entries].reverse().find((e) => e.type === 'message' && e.direction === 'outbound' && !e.reminder);
  const due = thread.responseDueAt ? new Date(thread.responseDueAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : null;
  const n = remindersOf(thread).length;
  const first = last ? String(last.body).split('\n').find((l) => l.trim()) || '' : '';
  const topic = thread.subject.replace(/^\[[^\]]+\]\s*/, '');
  return `${n ? 'Second reminder' : 'Reminder'}: we're still waiting on your reply about "${topic}"${due ? `, requested by ${due}` : ''}.\n\n${first ? `${first}\n\n` : ''}Reply to this email and your answer lands in the thread.`;
}

/**
 * Send a reminder (D-72): one outbound message to the recipients of the last message we sent, marked `reminder`, with
 * its own Delivery row that carries the count. The thread stays in Waiting; the due date does not move.
 */
export function sendReminder(threadId, { senderId, body }) {
  const thread = getThread(threadId);
  if (!thread || !canRemind(thread)) return null;
  const last = [...thread.entries].reverse().find((e) => e.type === 'message' && e.direction === 'outbound' && !e.reminder);
  const at = nowIso();
  const entry = {
    id: uid('msg'), type: 'message', direction: 'outbound', senderId, sentAt: at, body, reminder: true, reminderOf: last.id,
    attachmentIds: [], recipients: last.recipients.map((r) => ({ ...r, delivery: 'delivered' })),
  };
  appendThreadEntry(threadId, entry);
  const n = remindersOf(thread).length + 1;
  patchThread(threadId, { triage: 'waiting', lastActivityAt: at, lastReminderAt: at });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'REMINDER_SENT', actorId: senderId, detail: `Reminder ${n} sent via the Linarc relay (250 2.0.0 OK)` });
  return entry;
}

/** Everyone on the thread but the writer has not read what was just written (D-67). */
function unreadAfter(threadId, senderId) {
  const thread = getThread(threadId);
  const team = getPeople().filter((p) => !p.guest).map((p) => p.id);
  return [...new Set([...(thread ? thread.participantIds : []), ...team])].filter((id) => id !== senderId);
}

/** Opening a thread reads it for the viewer (the list's bold rows, D-67). */
export function markRead(threadId, personId) {
  const thread = getThread(threadId) || getDeletedThreads().find((t) => t.id === threadId);
  if (!thread || !isUnreadFor(thread, personId)) return;
  patchThread(threadId, { unreadBy: thread.unreadBy.filter((id) => id !== personId) });
}

/** Mark as unread: the row is bold again for the viewer until it is opened (D-67). */
export function markUnread(threadId, personId) {
  const thread = getThread(threadId) || getDeletedThreads().find((t) => t.id === threadId);
  if (!thread || isUnreadFor(thread, personId)) return;
  patchThread(threadId, { unreadBy: [...thread.unreadBy, personId] });
}

/** Delete (soft, D-67): the thread moves to the Deleted view; nothing is sent, nothing leaves the record. */
export function deleteThreads(ids, { actorId }) {
  const at = nowIso();
  ids.forEach((id) => patchThread(id, { deletedAt: at, deletedById: actorId }));
}

/** Restore from Deleted: back to the inbox as it was. */
export function restoreThreads(ids) {
  ids.forEach((id) => patchThread(id, { deletedAt: null, deletedById: null }));
}

/** Link to record (spec §4): an unmatched thread joins a record; triage follows the direction of its last message. */
export function linkThreadToRecord(threadId, recordId, { actorId }) {
  const record = getRecord(recordId);
  if (!record) return null;
  const thread = getThread(threadId);
  const at = nowIso();
  const entry = { id: uid('evt'), type: 'event', kind: 'linked', actorId, sentAt: at, recordId, text: `Linked to ${recordLabel(recordId)} by ${getPerson(actorId)?.name || 'a team member'}` };
  appendThreadEntry(threadId, entry);
  patchThread(threadId, {
    addLinkedRecordIds: [...((session.threadPatches[threadId] || {}).addLinkedRecordIds || []), recordId],
    subject: thread.subject.startsWith('[') ? thread.subject : `[${PROJECT.code}] ${record.code} — ${thread.subject}`,
    lastActivityAt: at,
  });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'RECORD_LINKED', actorId, detail: `Thread linked to ${record.code}` });
  return entry;
}

/** Link to several records at once (D-77): the Email screen's modal and the thread's Linked items. */
export function linkThreadToRecords(threadId, recordIds, { actorId }) {
  return recordIds.map((id) => linkThreadToRecord(threadId, id, { actorId })).filter(Boolean);
}

/**
 * Promote to record (D-77): the RFI (below), or a field issue / potential change order created in the demo session
 * with the same five fields (title, the drafted description, who has it, due date, what to include). Returns the new
 * record's id for the confirmation. Field issues and PCOs have no screen here; the thread's Linked items name them.
 */
export function promoteToRecord(threadId, messageId, { type = 'rfi', actorId, title, question, assignedToId, dueOn, includeIds = [], amount = null }) {
  if (type === 'rfi') return promoteToRfi(threadId, messageId, { actorId, title, question, assignedToId, dueOn, includeIds });
  const thread = getThread(threadId);
  const assignee = getPerson(assignedToId);
  const at = nowIso();
  const code = nextRecordCode(type);
  const record = {
    type, id: code, code, title, description: question, spec: thread ? thread.trade : '', status: 'open',
    assignedToId, ballInCourt: assignee ? assignee.company : '', dueOn, createdById: actorId, createdAt: at, createdInDemo: true,
    includeIds, sourceMessageId: messageId, threadId,
    ...(type === 'change-order' ? { amount: amount == null ? null : Number(amount), reason: 'From email', scheduleDays: null, revision: 'Draft', status: 'draft', distributionIds: assignedToId ? [assignedToId] : [], closed: false, items: [] } : {}),
  };
  addCreatedRecord(record);
  const promotion = { 'change-order': 'promoted_pco', 'daily-log': 'promoted_daily_log' }[type] || 'promoted_field_issue';
  // A daily log entry records what happened; it does not hand the thread to anyone (D-80), so triage stays as it is
  patchThread(threadId, { promotion, promotedRecordId: code, ...(type === 'daily-log' ? {} : { triage: 'waiting' }), lastActivityAt: at, addLinkedRecordIds: [...((session.threadPatches[threadId] || {}).addLinkedRecordIds || []), code] });
  const noun = { 'change-order': 'PCO', 'daily-log': 'daily log entry' }[type] || 'field issue';
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'promoted', actorId, sentAt: at, recordId: code, text: type === 'daily-log' ? `Added to the daily log as ${code} by ${(getPerson(actorId) || {}).name || 'a team member'}` : `Promoted to ${noun} ${code} and assigned to ${assignee ? `${assignee.name} (${assignee.company})` : 'the reviewer'}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'RECORD_PROMOTED', actorId, detail: `Message promoted to ${code}` });
  return code;
}

/**
 * Promote to RFI (spec §8, D-37). Writes the RFI (RFI-143 is pre-hydrated in records.js and
 * patched here), marks the thread, adds the event and audit rows. Returns the record id for the confirmation.
 */
export function promoteToRfi(threadId, messageId, { actorId, title, question, assignedToId, dueOn, includeIds = [] }) {
  const recordId = 'RFI-143';
  const assignee = getPerson(assignedToId);
  const at = nowIso();
  patchRecord(recordId, {
    title, question, assignedToId, ballInCourt: assignee ? assignee.company : undefined, dueOn, createdAt: at, createdById: actorId,
    createdInDemo: true, includeIds, sourceMessageId: messageId,
  });
  patchThread(threadId, { promotion: 'promoted_rfi', promotedRecordId: recordId, triage: 'waiting', lastActivityAt: at, addLinkedRecordIds: [...((session.threadPatches[threadId] || {}).addLinkedRecordIds || []), recordId] });
  appendThreadEntry(threadId, { id: uid('evt'), type: 'event', kind: 'promoted', actorId, sentAt: at, recordId, text: `Promoted to ${recordId} and assigned to ${assignee ? `${assignee.name} (${assignee.company})` : 'the reviewer'}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'RECORD_PROMOTED', actorId, detail: `Message promoted to ${recordId}` });
  return recordId;
}

/**
 * Update contact and resend (spec §6.1): fixes the bounced recipient's address, re-sends the message, records both.
 * `messageId` is the bounced outbound message; `email` the corrected address.
 */
export function updateContactAndResend(threadId, messageId, { actorId, email }) {
  const thread = getThread(threadId);
  const original = thread.entries.find((e) => e.id === messageId);
  if (!original || !original.bounce) return null;
  const person = getPerson(original.recipients[0].personId);
  const at = nowIso();
  const resend = {
    id: uid('msg'), type: 'message', direction: 'outbound', senderId: original.senderId, sentAt: at, body: original.body, attachmentIds: original.attachmentIds,
    recipients: [{ personId: person ? person.id : null, email, kind: 'to', delivery: 'delivered' }], resendOf: messageId,
  };
  appendThreadEntry(threadId, resend);
  patchThread(threadId, { triage: 'waiting', lastActivityAt: at, resolvedBounces: [...((session.threadPatches[threadId] || {}).resolvedBounces || []), messageId] });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'CONTACT_UPDATED', actorId, detail: `${person ? person.name : email}: address updated to ${email}` });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'SMTP_DISPATCHED', actorId: original.senderId, detail: `Resent to ${email} (250 2.0.0 OK)` });
  return resend;
}

/**
 * The secure link page's quick response (D-73): "Received, I'll answer by <date>". Posts as an inbound reply so the
 * sender sees it in the thread, moves the thread to Waiting on them with the promised date as Response due (the
 * recipient now owns the next step), and keeps the link open for the real answer.
 */
export function acknowledgeFromLink(link, { by }) {
  const person = findPersonByEmail(link.recipient.email) || addGuest({ email: link.recipient.email, name: link.recipient.name, company: link.recipient.company, role: link.recipient.role });
  const when = new Date(by).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const entry = sendMessage(link.threadId, { senderId: person.id, body: `Received, thank you. I'll answer by ${when}.` });
  patchThread(link.threadId, { triage: 'waiting', responseDueAt: by, lastActivityAt: entry.sentAt });
  appendThreadAudit(link.threadId, { id: uid('aud'), at: entry.sentAt, event: 'MAGIC_LINK_ACCESSED', actorId: person.id, detail: `Acknowledged from the secure link page; answer promised by ${by.slice(0, 10)}` });
  markLinkAcknowledged(link.token, { by, at: entry.sentAt });
  return entry;
}

/** Reply from the secure link page (spec §10): threads like a mailed reply and marks the link as replied. */
export function replyFromLink(link, { body }) {
  const person = findPersonByEmail(link.recipient.email) || addGuest({ email: link.recipient.email, name: link.recipient.name, company: link.recipient.company, role: link.recipient.role });
  const entry = sendMessage(link.threadId, { senderId: person.id, body });
  appendThreadAudit(link.threadId, { id: uid('aud'), at: entry.sentAt, event: 'MAGIC_LINK_ACCESSED', actorId: person.id, detail: 'Replied from the secure link page' });
  markLinkReplied(link.token);
  return entry;
}

// Sample files a simulated mail can carry (inline, like files composed in the demo).
const SAMPLE_FILES = {
  photo: { name: 'IMG_5120_Site_Photo.jpg', sizeMb: 3.2, url: sampleFileUrl('IMG_5120_Site_Photo.jpg'), thumbnailUrl: sampleFileUrl('IMG_5120_Site_Photo.jpg') },
  pdf: { name: 'Shop_Drawing_Markup.pdf', sizeMb: 2.4, url: sampleFileUrl('Shop_Drawing_Markup.pdf') },
};

/**
 * Mail arriving from outside Linarc (spec §4), as the sandbox's *Simulate inbound email* sends it. `to` is a thread id
 * (a reply to its reply token) or 'project' (the project address). A reply joins its thread: from a guest it puts the
 * thread in Needs action; from a team member answering in Outlook or Gmail (the hybrid model, D-42) it is relayed to
 * the thread's guests and puts it in Waiting. Mail to the project address becomes a new thread with no linked record
 * (the Unmatched view). An address nobody knows becomes a guest user, so the message has a sender to show.
 * Returns the thread id.
 */
export function receiveMail({ fromId = null, fromEmail = '', to, subject = '', body, file = null }) {
  const sender = (fromId && getPerson(fromId)) || addGuest({ email: fromEmail });
  const at = nowIso();
  const attachments = SAMPLE_FILES[file] ? [{ id: uid('att'), ...SAMPLE_FILES[file], byLink: false }] : [];
  const scanned = attachments.length ? ' · 1 file scanned' : '';

  if (to === 'project') {
    const id = nextThreadId();
    addThread({
      id,
      subject: subject.trim() || '(no subject)',
      triage: 'needs_action',
      visibility: 'project_public',
      promotion: 'unpromoted',
      promotedRecordId: null,
      responseDueAt: null,
      lastActivityAt: at,
      participantIds: [sender.id],
      unreadBy: getPeople().filter((p) => !p.guest).map((p) => p.id), // new mail to the project: the team has not read it (D-67)
      primaryCompany: sender.company,
      trade: sender.guest ? sender.trade : '',
      estimatedCostImpact: null,
      linkedRecordIds: [],
      pinId: null,
      aiSummary: null,
      entries: [{ id: uid('msg'), type: 'message', direction: 'inbound', senderId: sender.id, sentAt: at, toAddress: PROJECT.inboundAddress, body, attachments, recipients: [] }],
      audit: [{ id: uid('aud'), at, event: 'INBOUND_UNMATCHED', actorId: sender.id, detail: `Mail to ${PROJECT.inboundAddress} matched no thread; new thread created${scanned}` }],
      createdInDemo: true,
    });
    return id;
  }

  const thread = getThread(to);
  if (!thread) return null;
  const internal = !sender.guest;
  const relayTo = internal ? thread.participantIds.filter((id) => id !== sender.id && (getPerson(id) || {}).guest) : [];
  appendThreadEntry(to, {
    id: uid('msg'), type: 'message', direction: internal ? 'outbound' : 'inbound', senderId: sender.id, sentAt: at, body, attachments,
    toAddress: replyAddress(to), recipients: relayTo.map((personId) => ({ personId, kind: 'to', delivery: 'delivered' })),
  });
  const patch = { triage: internal ? 'waiting' : 'needs_action', lastActivityAt: at, unreadBy: unreadAfter(to, sender.id) };
  if (!thread.participantIds.includes(sender.id)) patch.participantIds = [...thread.participantIds, sender.id];
  patchThread(to, patch);
  appendThreadAudit(to, { id: uid('aud'), at, event: 'INBOUND_REPLY_INGESTED', actorId: sender.id, detail: `Reply received via ${replyAddress(to)}${internal ? " from the sender's own mailbox" : ''}${scanned}` });
  if (relayTo.length) appendThreadAudit(to, { id: uid('aud'), at, event: 'SMTP_DISPATCHED', actorId: sender.id, detail: "Relayed to the thread's guests via the Linarc relay (250 2.0.0 OK)" });
  return to;
}

/**
 * The sandbox's *Simulate inbound email* (prototype metadata `inbound`, src/prototypes/index.js): who can write, where
 * the mail can go, and what happens on receipt. Sandbox only; never shown inside a screen.
 */
export function inboundSandbox() {
  const people = getPeople();
  const senders = [
    ...people.filter((p) => p.guest).map((p) => ({ value: p.id, label: `${p.name} · ${p.company}` })),
    ...people.filter((p) => !p.guest).map((p) => ({ value: p.id, label: `${p.name} · ${p.company} (team, from their own mailbox)` })),
  ];
  const destinations = [
    { value: 'project', label: `Project address · ${PROJECT.inboundAddress}` },
    ...getThreads().map((t) => ({ value: t.id, label: `Reply to ${t.id} · ${t.subject}` })),
  ];
  return {
    senders,
    destinations,
    files: [
      { value: 'none', label: 'No attachment' },
      { value: 'photo', label: `${SAMPLE_FILES.photo.name} (${SAMPLE_FILES.photo.sizeMb} MB)` },
      { value: 'pdf', label: `${SAMPLE_FILES.pdf.name} (${SAMPLE_FILES.pdf.sizeMb} MB)` },
    ],
    receive(mail) {
      const id = receiveMail(mail);
      return { message: `Received on ${id}${mail.to === 'project' ? ' (Unmatched)' : ''}.`, openLabel: 'Open', open: () => go('thread', id) };
    },
  };
}

/**
 * A recipient opened or downloaded a file from the secure link page: the sender sees it on the thread's Delivery tab
 * (the page says "Opening a file is recorded for the sender").
 */
export function recordFileOpened(threadId, { file, recipient, action = 'open' }) {
  const verb = file.byLink && action === 'open' ? 'Streamed' : action === 'download' ? 'Downloaded' : 'Opened';
  appendThreadAudit(threadId, {
    id: uid('aud'), at: nowIso(), event: 'ATTACHMENT_DOWNLOADED', actorId: null, actorName: recipient.name, actorEmail: recipient.email,
    detail: `${verb} ${file.name} from the secure link`, fileId: file.id,
  });
}

export const revokeLink = (token, { actorId, threadId }) => {
  sessionRevokeLink(token);
  appendThreadAudit(threadId, { id: uid('aud'), at: nowIso(), event: 'LINK_REVOKED', actorId, detail: 'Secure link withdrawn by the sender' });
};

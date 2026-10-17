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
  revokeLink as sessionRevokeLink,
  markLinkReplied,
  setSetting,
} from '~/modules/session';
import { TODAY, relDate, PROJECT, RESPONSE_DUE_WORKING_DAYS, roleById, replyAddress } from './project';
import { findPersonByEmail, getPeople, getPerson, guessFromEmail } from './people';
import { getRecord, recordLabel } from './records';
import { getThread, getThreads, nextThreadId } from './threads';
import { go } from '~/modules/app/router';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => TODAY; // the demo clock stands still; everything created "now" is at TODAY

/** The viewer's role (sandbox role switcher). */
export const currentRole = () => roleById(session.settings.role);
export const setRole = (id) => setSetting('role', id);

/** Default Response due: working days from today (spec §7). */
export function defaultResponseDue() {
  let days = 0;
  let added = 0;
  while (added < RESPONSE_DUE_WORKING_DAYS) {
    days += 1;
    const d = new Date(relDate(days));
    if (d.getDay() !== 0 && d.getDay() !== 6) added += 1;
  }
  return relDate(days);
}

/** Add by email (spec §5, D-36): creates a guest user from an address; returns the existing person if known. */
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
 * Send a message (compose or reply). `recipients` = [{ personId, kind: 'to' | 'cc' }]. Outbound mail from an internal
 * sender puts the thread in Waiting; an inbound one (guest role replying) puts it in Needs action.
 */
export function sendMessage(threadId, { senderId, body, recipients = [], attachmentIds = [], responseDueAt }) {
  const sender = getPerson(senderId);
  const outbound = sender && !sender.guest;
  const entry = {
    id: uid('msg'), type: 'message', direction: outbound ? 'outbound' : 'inbound', senderId, sentAt: nowIso(), body, attachmentIds,
    recipients: outbound ? recipients.map((r) => ({ ...r, delivery: 'delivered' })) : [],
  };
  appendThreadEntry(threadId, entry);
  const patch = { triage: outbound ? 'waiting' : 'needs_action', lastActivityAt: entry.sentAt };
  if (responseDueAt) patch.responseDueAt = responseDueAt;
  patchThread(threadId, patch);
  appendThreadAudit(threadId, {
    id: uid('aud'), at: entry.sentAt, event: outbound ? 'SMTP_DISPATCHED' : 'INBOUND_REPLY_INGESTED', actorId: senderId,
    detail: outbound ? 'Message sent via the Linarc relay (250 2.0.0 OK)' : `Reply received via reply+${threadId.toLowerCase().replace(/-/g, '_')}@mail.linarc.io`,
  });
  return entry;
}

/**
 * Compose (spec §5): start a thread from a record, a drawing pin or the Email screen. `toIds` are guest ids (any guest
 * created inline is already in the session), `cc` is typed addresses, `attachments` are resolved file objects
 * ({ id, name, sizeMb, byLink }); `attachRecordPdf` adds today's "generate a PDF of the record" as a file.
 */
export function createThread({ senderId, toIds = [], cc = '', subject, body, attachments = [], linkedRecordIds = [], pinId = null, responseDueAt = null, attachRecordPdf = false }) {
  const id = nextThreadId();
  const at = nowIso();
  const sender = getPerson(senderId);
  const first = toIds.length ? getPerson(toIds[0]) : null;
  const record = linkedRecordIds.length ? getRecord(linkedRecordIds[0]) : null;
  const files = [...attachments];
  if (attachRecordPdf && record) files.push({ id: `${id}-record-pdf`, name: `${record.code}.pdf`, sizeMb: 0.4, byLink: false, generated: true });
  const ccList = cc.split(/[,;\s]+/).filter(Boolean);
  const thread = {
    id,
    subject,
    triage: 'waiting',
    visibility: 'project_public',
    promotion: 'unpromoted',
    promotedRecordId: null,
    responseDueAt,
    lastActivityAt: at,
    participantIds: [senderId, ...toIds],
    primaryCompany: first ? first.company : ccList[0] || '',
    trade: record ? record.spec : '',
    estimatedCostImpact: null,
    linkedRecordIds,
    pinId,
    aiSummary: null,
    entries: [
      {
        id: uid('msg'), type: 'message', direction: 'outbound', senderId, sentAt: at, body, attachments: files,
        recipients: [...toIds.map((personId) => ({ personId, kind: 'to', delivery: 'delivered' })), ...ccList.map((email) => ({ email, kind: 'cc', delivery: 'delivered' }))],
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
export function postNote(threadId, { senderId, body }) {
  const entry = { id: uid('note'), type: 'note', senderId, sentAt: nowIso(), body };
  appendThreadEntry(threadId, entry);
  patchThread(threadId, { lastActivityAt: entry.sentAt });
  return entry;
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

/**
 * Promote to record (spec §8, D-37): RFI only in the MVP. Writes the RFI (RFI-143 is pre-hydrated in records.js and
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
  photo: { name: 'IMG_5120_Site_Photo.jpg', sizeMb: 3.2 },
  pdf: { name: 'Shop_Drawing_Markup.pdf', sizeMb: 2.4 },
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
  const patch = { triage: internal ? 'waiting' : 'needs_action', lastActivityAt: at };
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

export const revokeLink = (token, { actorId, threadId }) => {
  sessionRevokeLink(token);
  appendThreadAudit(threadId, { id: uid('aud'), at: nowIso(), event: 'LINK_REVOKED', actorId, detail: 'Secure link withdrawn by the sender' });
};

// PLACEHOLDER DATA — Correspondence module: drafts (D-67, 2026-11-06). A draft is a message not yet sent: a compose
// draft (the compose panel, keyed `compose:<record|email>[:<pin>]`, ComposePanel.vue) or a reply draft on a thread
// (the thread composer, keyed by the thread id, Composer.vue). What a person saves in the demo lives in the session
// (`session.drafts`, D-29); the two below are seeded so the Drafts view has something to show at reset. A seeded draft
// that is sent or discarded is marked removed for the session (`session.removedDrafts`).
import { session, setDraft, markDraftRemoved } from '~/modules/session';
import { relDate } from './project';
import { getPerson } from './people';
import { getThread } from './threads';
import { getRecord, recordLabel } from './records';
import { textOf } from '../text';

const asRecipient = (p) => ({ id: p.id, email: p.email, name: p.name, company: p.company, role: p.role, avatarUrl: p.avatarUrl || '' });

/** Seeded drafts; `toIds` are expanded to recipients when read (the compose panel keeps resolved recipients). */
const SEED_DRAFTS = Object.freeze({
  // Composed from the S-201 sheet (its record and pin name the draft); the Email screen's own Compose stays blank
  'compose:S-201-Rev1': {
    toIds: ['usr-elena'],
    values: {
      subject: '[RMC-04] S-201 Rev 1 — Imaging suite ceiling access panel locations',
      dueOn: relDate(3).slice(0, 10),
      body: '<p>Elena — before we close the Level 2 imaging suite ceiling, can you confirm the access panel locations against the S-501 framing? Sketch to follow once Carlos has walked it.</p>',
    },
    attachments: [],
    savedAt: relDate(-1, '16:40:00'),
  },
  'THR-1039': {
    mode: 'reply',
    html: '<p>Kenji — thank you. I am filing this on RFI-142 now and will confirm the gauge with Carlos before Monday.</p>',
    text: 'Kenji — thank you. I am filing this on RFI-142 now and will confirm the gauge with Carlos before Monday.',
    attachments: [],
    savedAt: relDate(0, '09:55:00'),
  },
});

function expand(key, seed) {
  if (!seed) return null;
  if (!key.startsWith('compose:')) return { ...seed };
  return { to: (seed.toIds || []).map(getPerson).filter(Boolean).map(asRecipient), cc: [], bcc: [], showBcc: false, values: { ...seed.values }, attachments: [...seed.attachments], savedAt: seed.savedAt };
}

/** The draft kept under a key: the session's, else the seed unless it was sent or discarded. */
export function draftFor(key) {
  if (!key) return null;
  if (session.drafts[key]) return session.drafts[key];
  if (session.removedDrafts[key]) return null;
  return expand(key, SEED_DRAFTS[key]);
}

/** Forget a draft (sent or discarded): the session's goes, a seeded one is marked removed. */
export function clearDraft(key) {
  if (!key) return;
  setDraft(key, null);
  if (SEED_DRAFTS[key]) markDraftRemoved(key);
}

/** The compose context a draft key names: `{ recordId, pinId }` (both null for the Email screen's Compose). */
export function composeContextOf(key) {
  const [, recordId = 'email', pinId = null] = key.split(':');
  return { recordId: recordId === 'email' ? null : recordId, pinId };
}

/**
 * Every draft the viewer may see as a row of the Email screen's Drafts view: compose drafts, and reply drafts on
 * threads the role can see (a draft on a deleted thread waits with the thread).
 */
export function listDrafts(role) {
  const keys = [...new Set([...Object.keys(SEED_DRAFTS).filter((k) => !session.removedDrafts[k]), ...Object.keys(session.drafts)])];
  return keys
    .map((key) => {
      const d = draftFor(key);
      if (!d) return null;
      if (key.startsWith('compose:')) {
        const { recordId, pinId } = composeContextOf(key);
        const record = recordId ? getRecord(recordId) : null;
        return {
          key,
          kind: 'compose',
          recordId,
          pinId,
          threadId: null,
          subject: (d.values && d.values.subject && d.values.subject.trim()) || '(no subject)',
          toText: (d.to || []).map((r) => r.name || r.email).join(', '),
          text: textOf((d.values && d.values.body) || ''),
          linkedRecordIds: record ? [record.id] : [],
          linkedText: record ? recordLabel(record.id) : '',
          hasAttachments: (d.attachments || []).length > 0,
          savedAt: d.savedAt,
        };
      }
      const thread = getThread(key);
      if (!thread || thread.deletedAt) return null;
      if (!role.internal && !thread.participantIds.includes(role.personId)) return null;
      if (d.mode === 'note' && !role.internal) return null;
      return {
        key,
        kind: 'reply',
        recordId: null,
        pinId: null,
        threadId: key,
        subject: `Re: ${thread.subject}`,
        toText: d.mode === 'note' ? 'Internal team note' : 'Reply to all',
        text: d.text || textOf(d.html || ''),
        linkedRecordIds: [...thread.linkedRecordIds],
        linkedText: thread.linkedRecordIds.map(recordLabel).join(', '),
        hasAttachments: (d.attachments || []).length > 0,
        savedAt: d.savedAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

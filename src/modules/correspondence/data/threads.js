// PLACEHOLDER DATA — Correspondence module: the email threads. Drives the Email screen, the thread, the record Email
// tabs and the secure link page. Static threads below; what a person changes in the demo (replies, notes, links,
// promotions, resends) is merged from the session by `getThread()` (D-29). Statuses are keys into status.js.
import { session } from '~/modules/session';
import { TODAY, relDate, dayOf } from './project';

// Attachment: { id, name, sizeMb, byLink, url, thumbnailUrl?, posterUrl? } — over MAIL_SIZE_LIMIT_MB goes by secure link
// (spec §5). `url` is the file in public/files/ (scripts/make-sample-files.mjs writes the PDFs); files attached in the
// demo carry no url and are read from the file store (src/modules/fileStore.js). `sha256` feeds the Delivery row's
// expand (Q-09), never the row itself.
const sample = (name) => `${import.meta.env.BASE_URL}files/${encodeURIComponent(name)}`;
const FILES = {
  'att-a302-snap': { id: 'att-a302-snap', name: 'A-302_Rev3_Grid_B4_Markup.png', sizeMb: 1.8, byLink: false, url: sample('A-302_Rev3_Grid_B4_Markup.png'), thumbnailUrl: sample('A-302_Rev3_Grid_B4_Markup.png'), sha256: '8f4b2e91c0d7a3f5e2189b6a4c7d8e1f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d' },
  'att-site-video': { id: 'att-site-video', name: 'Site_Walk_Corridor3E_Grid_B4.mp4', sizeMb: 45.2, byLink: true, url: sample('Site_Walk_Corridor3E_Grid_B4.mp4'), thumbnailUrl: sample('Site_Walk_Corridor3E_Grid_B4.poster.jpg'), posterUrl: sample('Site_Walk_Corridor3E_Grid_B4.poster.jpg'), sha256: '3a1f9c8e7d6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a09' },
  'att-beam-sketch': { id: 'att-beam-sketch', name: 'Apex_W24_Beam_Penetration_Sketch_B4.pdf', sizeMb: 3.4, byLink: false, url: sample('Apex_W24_Beam_Penetration_Sketch_B4.pdf'), sha256: 'e7c9d1a2b3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0' },
  'att-sub088-psu': { id: 'att-sub088-psu', name: 'SUB-088_24V_Power_Supply_Rev1.pdf', sizeMb: 2.1, byLink: false, url: sample('SUB-088_24V_Power_Supply_Rev1.pdf'), sha256: '5d2c4b6a8f0e1d3c5b7a9f1e3d5c7b9a1f3e5d7c9b1a3f5e7d9c1b3a5f7e9d1c' },
  // Kenji's shop-drawing markup, attached to his emailed answer on RFI-142 (Documentation screen 09).
  'att-kenji-markup': { id: 'att-kenji-markup', name: 'Shop_Drawing_Markup.pdf', sizeMb: 2.4, byLink: false, url: sample('Shop_Drawing_Markup.pdf'), sha256: '9c2e4a6b8d0f1e3a5c7b9d1f3e5a7c9b1d3f5e7a9c1b3d5f7e9a1c3b5d7f9e1a' },
  'att-ray-photo': { id: 'att-ray-photo', name: 'IMG_4471_Level2_Door_Frame.jpg', sizeMb: 4.6, byLink: false, url: sample('IMG_4471_Level2_Door_Frame.jpg'), thumbnailUrl: sample('IMG_4471_Level2_Door_Frame.jpg'), sha256: '1b3d5f7a9c1e3f5b7d9a1c3e5f7b9d1a3c5e7f9b1d3a5c7e9f1b3d5a7c9e1f3b' },
};
export const getFile = (id) => FILES[id] || null;

/** A sample file's URL in public/files/ (also used by the sandbox's inbound samples). */
export const sampleFileUrl = sample;

export const THREADS = Object.freeze([
  {
    id: 'THR-1042',
    subject: '[RMC-04] A-302 Rev 3 — Grid B-4 HVAC duct and acoustic cove clash',
    triage: 'needs_action',
    visibility: 'project_public',
    promotion: 'unpromoted',
    promotedRecordId: null,
    responseDueAt: relDate(0),
    lastActivityAt: relDate(0, '10:22:00'),
    participantIds: ['usr-alex', 'usr-dave', 'usr-sarah'],
    primaryCompany: 'Apex Mechanical Systems',
    trade: '23 00 00 · HVAC',
    estimatedCostImpact: 4200, // canSeeCost roles only (D-41)
    linkedRecordIds: ['A-302-Rev3'],
    pinId: 'pin-b4',
    aiSummary: {
      generatedAt: relDate(0, '10:15:00'),
      evidence: 'Summarised from 3 messages and 2 files in THR-1042.',
      groups: [
        { label: 'Decisions', items: [{ text: "The acoustic baffle ceiling in Corridor 3E stays at +9'-6\" AFF per the architectural finish schedule.", sourceIds: ['msg-1042-1'] }] },
        { label: 'Open questions', items: [{ text: 'Apex cannot drop the 18" supply trunk below the W24x68 beam; a 10" web penetration needs the structural engineer\'s approval, or the duct is rerouted.', sourceIds: ['msg-1042-2'] }] },
        { label: 'Commitments', items: [{ text: 'Vanguard to get the beam sleeve sketch to Thornton Structural by Oct 16.', sourceIds: ['msg-1042-2', 'msg-1042-note'] }] },
      ],
    },
    entries: [
      {
        id: 'msg-1042-1', type: 'message', direction: 'outbound', senderId: 'usr-alex', sentAt: relDate(-1, '09:12:00'),
        body: "Dave — during this morning's Level 3 overhead rough-in walk at Grid B-4 (Corridor 3E) we flagged a direct elevation conflict between your 18\" main supply trunk and the architectural lighting cove on Drawing A-302 Rev 3.\n\nCan your detailing team flatten this transition to a 28\"x10\" oval duct to clear the cove framing before SunState starts hanging track on Monday?",
        attachmentIds: ['att-a302-snap', 'att-site-video'],
        recipients: [
          { personId: 'usr-dave', kind: 'to', delivery: 'downloaded' },
          { personId: 'usr-sarah', kind: 'cc', delivery: 'delivered' },
        ],
      },
      {
        id: 'msg-1042-2', type: 'message', direction: 'inbound', senderId: 'usr-dave', sentAt: relDate(0, '10:14:00'),
        body: "Alex,\n\nWe ran the static pressure calc on flattening to a 10\" oval and it still won't clear the bottom flange of the W24x68 at Grid B-4 while keeping the +9'-6\" ceiling.\n\nOur only path without dropping the ceiling is a 10\" reinforced circular web opening through the W24 neutral axis (shop sketch attached). We need formal sign-off from the structural engineer of record by RFI before we fabricate the sleeve. Sleeve welding adds about $4,200 and 3 working days if it isn't answered by Wednesday.",
        attachmentIds: ['att-beam-sketch'],
        recipients: [],
        // Pre-fill for Promote to record (spec §8); the question is AI-drafted (D-44).
        promotion: {
          title: 'Grid B-4 W24 beam web penetration for the 18" HVAC trunk duct',
          assignedToId: 'usr-elena',
          dueOn: relDate(5),
          question: 'Per field coordination with Apex Mechanical on Drawing A-302 Rev 3 (Grid B-4), the 18" supply trunk duct conflicts with the W24x68 beam and the acoustic lighting cove. Please confirm whether a 10" reinforced circular web penetration at the beam neutral axis is acceptable per the attached Apex sketch.',
          include: [
            { id: 'A-302-Rev3', label: 'Drawing A-302 · Rev 3 (Grid B-4 markup)', checked: true },
            { id: 'att-beam-sketch', label: 'Apex_W24_Beam_Penetration_Sketch_B4.pdf (3.4 MB)', checked: true },
            { id: 'att-site-video', label: 'Site_Walk_Corridor3E_Grid_B4.mp4 (45.2 MB, by link)', checked: false },
          ],
        },
      },
      {
        id: 'msg-1042-note', type: 'note', senderId: 'usr-sarah', sentAt: relDate(0, '10:22:00'),
        body: "@Alex hold off on replying to Apex about the $4,200 for now. Promote Dave's message and sketch into a formal RFI assigned to Elena at Thornton so the penetration is approved before Monday's framing inspection.",
      },
    ],
    audit: [
      { id: 'aud-1042-1', at: relDate(-1, '09:12:04'), event: 'SMTP_DISPATCHED', actorId: 'usr-alex', detail: 'Message sent via the Linarc relay (250 2.0.0 OK · mx.apex-mech.com)' },
      { id: 'aud-1042-2', at: relDate(-1, '11:04:19'), event: 'MAGIC_LINK_ACCESSED', actorId: 'usr-dave', detail: 'Opened the secure link for Drawing A-302 Rev 3', ip: '198.51.100.42', agent: 'iOS Safari' },
      { id: 'aud-1042-3', at: relDate(-1, '11:06:52'), event: 'ATTACHMENT_DOWNLOADED', actorId: 'usr-dave', detail: 'Streamed Site_Walk_Corridor3E_Grid_B4.mp4', fileId: 'att-site-video' },
      { id: 'aud-1042-4', at: relDate(0, '10:14:11'), event: 'INBOUND_REPLY_INGESTED', actorId: 'usr-dave', detail: 'Reply received via reply+thr_1042@mail.linarc.io · 1 PDF scanned' },
    ],
  },

  {
    id: 'THR-1039',
    subject: '[RMC-04] RFI-142 — Level 2 OR lead-lined drywall termination',
    // Needs action: Kenji's answer came back by email this morning and waits for *Add to Q&A* (D-49). Seed data since
    // 2026-10-28, as the Documentation file's screen 09 draws it, so the flow needs no simulated mail.
    triage: 'needs_action',
    visibility: 'project_public',
    promotion: 'promoted_rfi',
    promotedRecordId: 'RFI-142',
    responseDueAt: relDate(0),
    lastActivityAt: relDate(0, '09:40:00'),
    participantIds: ['usr-alex', 'usr-kenji', 'usr-ray'],
    primaryCompany: 'Studio West Architecture',
    trade: '09 29 00 · Gypsum Board',
    estimatedCostImpact: 0,
    linkedRecordIds: ['RFI-142', 'S-201-Rev1'],
    pinId: null,
    aiSummary: {
      generatedAt: relDate(0, '09:41:00'),
      evidence: 'Summarised from 3 messages and 1 file in THR-1039.',
      groups: [
        { label: 'Decisions', items: [{ text: 'Lead-lined board runs full height to the underside of the deck at all OR 2.14 partitions, with lead-backed sealant at the deck flutes per 13 49 00 §3.2.', sourceIds: ['msg-1039-3'] }] },
        { label: 'Open questions', items: [{ text: "Kenji's answer is on this thread but not yet on RFI-142's Q&A; the Respond step is still with him.", sourceIds: ['msg-1039-3'] }] },
        { label: 'Commitments', items: [{ text: 'Studio West to revise Detail 4 in ASI-07.', sourceIds: ['msg-1039-3'] }] },
      ],
    },
    entries: [
      {
        id: 'msg-1039-1', type: 'message', direction: 'inbound', senderId: 'usr-ray', sentAt: relDate(-5, '07:50:00'),
        body: 'Alex — our crew is framing the Level 2 OR partitions at Grid D-7. Detail 4 shows lead-lined board stopping 6 inches above the ceiling grid, but the physicist spec says full height to deck. Which one are we building?',
        attachmentIds: [], recipients: [],
      },
      { id: 'evt-1039-1', type: 'event', kind: 'promoted', actorId: 'usr-alex', sentAt: relDate(-5, '09:15:00'), recordId: 'RFI-142', text: 'Promoted to RFI-142 and assigned to Kenji Takahashi, AIA (Studio West Architecture)' },
      {
        id: 'msg-1039-2', type: 'message', direction: 'outbound', senderId: 'usr-alex', sentAt: relDate(-5, '09:20:00'),
        body: 'Kenji — please see RFI-142 for the lead-lined partition termination question at Grid D-7. SunState is framing now, so a response by Thursday keeps Level 2 on schedule.',
        attachmentIds: [],
        recipients: [{ personId: 'usr-kenji', kind: 'to', delivery: 'link_viewed' }, { personId: 'usr-ray', kind: 'cc', delivery: 'delivered' }],
      },
      {
        // The answer, from Outlook to the thread's reply address: offered *Add to Q&A* on the RFI's Email tab (D-49).
        id: 'msg-1039-3', type: 'message', direction: 'inbound', senderId: 'usr-kenji', sentAt: relDate(0, '09:40:00'),
        toAddress: 'reply+thr_1039@mail.linarc.io',
        body: 'Alex,\n\nConfirmed: run the lead-lined board full height to the underside of the deck at all OR 2.14 partitions, with lead-backed sealant at the deck flutes per 13 49 00 §3.2. Detail 4 will be revised in ASI-07.\n\nBest regards,\nKenji',
        attachmentIds: ['att-kenji-markup'], recipients: [],
      },
    ],
    audit: [
      { id: 'aud-1039-1', at: relDate(-5, '09:15:00'), event: 'RECORD_PROMOTED', actorId: 'usr-alex', detail: 'Message promoted to RFI-142' },
      { id: 'aud-1039-2', at: relDate(-5, '09:20:03'), event: 'SMTP_DISPATCHED', actorId: 'usr-alex', detail: 'Message sent via the Linarc relay (250 2.0.0 OK)' },
      { id: 'aud-1039-3', at: relDate(-1, '16:20:00'), event: 'MAGIC_LINK_ACCESSED', actorId: 'usr-kenji', detail: 'Opened the RFI-142 package', ip: '203.0.113.88', agent: 'macOS Chrome' },
      { id: 'aud-1039-4', at: relDate(0, '09:40:06'), event: 'INBOUND_REPLY_INGESTED', actorId: 'usr-kenji', detail: 'Reply received via reply+thr_1039@mail.linarc.io · 1 PDF scanned' },
    ],
  },

  {
    id: 'THR-1031',
    subject: '[RMC-04] SUB-088 — Card-reader door hardware voltage mismatch',
    triage: 'needs_action',
    visibility: 'restricted', // Confidential (D-41)
    promotion: 'promoted_pco',
    promotedRecordId: 'PCO-019',
    responseDueAt: relDate(-3),
    lastActivityAt: relDate(-4, '11:00:12'),
    participantIds: ['usr-sarah', 'usr-valerie'],
    primaryCompany: 'Riverside Health System',
    trade: '08 71 00 · Door Hardware',
    estimatedCostImpact: 18450,
    linkedRecordIds: ['SUB-088', 'PCO-019'],
    pinId: null,
    aiSummary: null,
    entries: [
      {
        id: 'msg-1031-1', type: 'message', direction: 'outbound', senderId: 'usr-sarah', sentAt: relDate(-4, '11:00:00'),
        body: 'Valerie — please review the attached 24V power supply revision for Submittal SUB-088 and acknowledge receipt by Tuesday so we can release hardware fabrication.',
        attachmentIds: ['att-sub088-psu'],
        recipients: [{ email: 'vchen-old@riversidehealth.org', personId: 'usr-valerie', kind: 'to', delivery: 'bounced' }],
        // The bounce the guided fix acts on (spec §6.1): the suggested address comes from the directory.
        bounce: { email: 'vchen-old@riversidehealth.org', reason: '550 5.1.1 Recipient address rejected: user mailbox migrated', suggestedEmail: 'vchen@riversidehealth.org' },
      },
    ],
    audit: [
      { id: 'aud-1031-1', at: relDate(-4, '11:00:12'), event: 'SMTP_BOUNCED', actorEmail: 'mailer-daemon@mail.linarc.io', actorName: 'Mail relay', detail: '550 5.1.1 mailbox migrated for vchen-old@riversidehealth.org' },
    ],
  },

  // Mail sent straight to the project address with no thread to join: the Unmatched view (spec §4, Q-06).
  {
    id: 'THR-1050',
    subject: 'Level 2 door frames — card reader rough-in holding us up',
    triage: 'needs_action',
    visibility: 'project_public',
    promotion: 'unpromoted',
    promotedRecordId: null,
    responseDueAt: null,
    lastActivityAt: relDate(0, '07:58:00'),
    participantIds: ['usr-ray'],
    primaryCompany: 'SunState Drywall & Framing',
    trade: '09 22 16 · Non-Structural Metal Framing',
    estimatedCostImpact: null,
    linkedRecordIds: [],
    pinId: null,
    aiSummary: null,
    entries: [
      {
        id: 'msg-1050-1', type: 'message', direction: 'inbound', senderId: 'usr-ray', sentAt: relDate(0, '07:58:00'),
        toAddress: 'rmc-04@mail.linarc.io',
        body: 'Morning — we have 14 patient-room frames on Level 2 waiting on the card-reader rough-in box location. The hardware schedule (SUB-088) still shows the old 12V reader. Can someone confirm the 24V box size so we can set frames today? Photo attached.',
        attachmentIds: ['att-ray-photo'], recipients: [],
      },
    ],
    audit: [
      { id: 'aud-1050-1', at: relDate(0, '07:58:09'), event: 'INBOUND_UNMATCHED', actorId: 'usr-ray', detail: 'Mail to rmc-04@mail.linarc.io matched no thread; new thread created' },
    ],
  },
]);

/** A thread with the session's changes merged: patched fields, appended entries and audit rows. */
/** Static threads plus the ones started in this demo session (compose). */
const allBase = () => [...THREADS, ...session.newThreads];

export function getThread(id) {
  const base = allBase().find((t) => t.id === id);
  if (!base) return null;
  const patch = session.threadPatches[id] || {};
  const entries = [...base.entries, ...(session.threadEntries[id] || [])].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  const audit = [...base.audit, ...(session.threadAudit[id] || [])].sort((a, b) => a.at.localeCompare(b.at));
  const linkedRecordIds = [...base.linkedRecordIds, ...(patch.addLinkedRecordIds || [])];
  return { ...base, ...patch, entries, audit, linkedRecordIds };
}

export const getThreads = () => allBase().map((t) => getThread(t.id));

/** The next thread id for a thread started in the demo. */
export const nextThreadId = () => `THR-${1051 + session.newThreads.length}`;

/** `sla` (status.js SLA) is computed from Response due against TODAY (spec §7), never stored. */
export function slaFor(thread) {
  if (!thread.responseDueAt) return 'none';
  if (thread.triage === 'resolved') return 'none';
  const due = dayOf(thread.responseDueAt);
  const today = dayOf(TODAY);
  if (due < today) return 'overdue';
  if (due === today) return 'due_today';
  return 'on_track';
}

const DELIVERY_RANK = ['bounced', 'sending', 'delivered', 'link_viewed', 'downloaded'];

/** The weakest delivery state of the last outbound message (the list shows one signal per thread). */
export function weakestDelivery(thread) {
  const last = [...thread.entries].reverse().find((e) => e.type === 'message' && e.direction === 'outbound');
  if (!last || !last.recipients.length) return null;
  return last.recipients.map((r) => r.delivery).sort((a, b) => DELIVERY_RANK.indexOf(a) - DELIVERY_RANK.indexOf(b))[0];
}

/** Unmatched: arrived at the project address and linked to nothing yet (spec §4). */
export const isUnmatched = (thread) => thread.linkedRecordIds.length === 0;

/** The records of the most recently active threads, newest first (the pickers' Recent group, D-61). */
export function recentRecordIds(limit = 3) {
  const ids = [];
  getThreads()
    .slice()
    .sort((a, b) => String(b.lastActivityAt).localeCompare(String(a.lastActivityAt)))
    .forEach((t) => t.linkedRecordIds.forEach((id) => { if (!ids.includes(id)) ids.push(id); }));
  return ids.slice(0, limit);
}

/**
 * The thread as one role may see it (D-41): guests see only threads they are on; internal notes, cost and the audit
 * never reach a guest; Confidential threads reach participants and PMs only. Returns null when hidden.
 */
export function viewFor(thread, role) {
  if (!thread) return null;
  const isParticipant = thread.participantIds.includes(role.personId);
  if (!role.internal && !isParticipant) return null;
  if (thread.visibility === 'restricted' && !isParticipant && role.id !== 'gc_pm') return null;
  const view = { ...thread };
  if (!role.internal) {
    view.entries = thread.entries.filter((e) => e.type !== 'note');
    view.audit = thread.audit.filter((a) => a.actorId === role.personId);
    view.aiSummary = null;
  }
  if (!role.canSeeCost) view.estimatedCostImpact = null;
  return view;
}

export const visibleThreads = (role) => getThreads().map((t) => viewFor(t, role)).filter(Boolean);

/** Threads linked to a record, for its Email tab. */
export const threadsForRecord = (recordId, role) => visibleThreads(role).filter((t) => t.linkedRecordIds.includes(recordId) || t.promotedRecordId === recordId);

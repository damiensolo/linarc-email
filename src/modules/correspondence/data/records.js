// PLACEHOLDER DATA — Correspondence module: the host records a thread can pin or be promoted to (drawings, RFIs,
// submittals, change orders). The Drawings and RFIs screens are stand-ins (00-plan.md §2); these are the records they
// show. Changes made in the demo (a promoted RFI) are patched through the session.
import { session } from '~/modules/session';
import { relDate } from './project';

export const DRAWINGS = Object.freeze([
  {
    type: 'drawing',
    id: 'A-302-Rev3',
    code: 'A-302',
    title: 'Level 3 Reflected Ceiling Plan — East Wing',
    discipline: 'Architectural',
    revision: 'Rev 3',
    revisionStatus: 'current', // status.js DRAWING_REVISION
    issuedOn: relDate(-12),
    spec: '09 51 00 · Acoustical Ceilings',
    suggestedRecipientIds: ['usr-kenji', 'usr-dave', 'usr-elena'],
    pins: [
      {
        id: 'pin-b4',
        grid: 'Grid B-4 · Corridor 3E',
        label: '18" HVAC trunk duct clashes with the acoustic cove and the W24 beam',
        authorId: 'usr-alex',
        createdAt: relDate(-1, '08:45:00'),
        box: { x: 18, y: 35, w: 20, h: 17 }, // percent of the sheet: around the B-4 intersection (column B, row 4, corridor edge)
        threadId: 'THR-1042',
      },
    ],
  },
  {
    type: 'drawing',
    id: 'S-201-Rev1',
    code: 'S-201',
    title: 'Level 3 Framing Plan — Transfer Girders',
    discipline: 'Structural',
    revision: 'Rev 1',
    revisionStatus: 'superseded',
    supersededBy: 'Rev 2',
    supersededOn: relDate(-2),
    issuedOn: relDate(-40),
    spec: '05 12 00 · Structural Steel',
    suggestedRecipientIds: ['usr-elena', 'usr-dave'],
    pins: [],
  },
]);

// RFIs follow the Documentation file's ☉ Create RFI page (docs/correspondence/rfi-integration.md §1, §4): Details
// (name, type, sequence, priority, location, due date, impacts, custom details, linked items), Q&A steps, a workflow
// (Create → Respond → Review → Close) with parties and dates, the distribution list and watchers. `costImpact`,
// `scheduleImpact` and `question` stay as text for the record PDF. Q&A step 1 is the question: `body: null` reads the
// record's `question`, so a promotion that edits the question edits the step. What the demo changes (steps added,
// routing, activity) is patched through the session (rfi.js).
export const RFIS = Object.freeze([
  {
    type: 'rfi',
    id: 'RFI-142',
    code: 'RFI-142',
    title: 'Level 2 Operating Room lead-lined partition termination',
    status: 'open', // status.js RFI_STATUS
    rfiType: 'design_clarification', // rfi.js RFI_TYPES
    priority: 'high', // rfi.js PRIORITIES
    sequence: 'Level 2 · Surgery suite',
    location: 'Level 2 · OR 2.14 · Grid D-7',
    reference: 'A-511 Detail 4 · Spec 13 49 00 §3.2',
    spec: '09 29 00 · Gypsum Board',
    assignedToId: 'usr-kenji',
    ballInCourt: 'Studio West Architecture',
    dueOn: relDate(0),
    createdById: 'usr-alex',
    createdAt: relDate(-5, '09:15:00'),
    costImpact: 'None anticipated',
    costAmount: null,
    scheduleImpact: '2 days (Level 2 rough-in)',
    scheduleDays: 2,
    question:
      'Drawing A-511 Detail 4 shows lead-lined gypsum board terminating 6" above the finished ceiling, while the radiation shielding spec (13 49 00) calls for slab-to-slab continuity. Please confirm the required termination height at Grid D-7.',
    proposedSolution:
      'Run the lead-lined board to the underside of the deck at all OR 2.14 partitions, with lead-backed sealant at the deck flutes, as 13 49 00 §3.2 requires. SunState can absorb this in the current framing sequence if it is confirmed by Thursday.',
    customFields: [
      { label: 'Discipline', value: 'Architectural' },
      { label: 'Shielding physicist review', value: 'Required' },
    ],
    answer: null,
    drawingIds: ['A-302-Rev3'],
    threadId: 'THR-1039',
    distributionIds: ['usr-kenji', 'usr-sarah', 'usr-ray'],
    watcherIds: ['usr-sarah', 'usr-carlos'],
    qa: [
      { id: 'qa-142-1', kind: 'question', authorId: 'usr-alex', at: relDate(-5, '09:15:00'), body: null, attachmentIds: [], source: 'email', threadId: 'THR-1039', messageId: 'msg-1039-1' },
      {
        id: 'qa-142-2', kind: 'comment', authorId: 'usr-ray', at: relDate(-4, '07:40:00'), attachmentIds: [], source: 'linarc',
        body: 'Holding the OR 2.14 partitions at top track until this is answered. We can keep framing the corridors through Thursday.',
      },
    ],
    workflow: {
      template: 'Design team RFI',
      steps: [
        { id: 'wf-142-1', action: 'create', partyIds: ['usr-alex'], processDays: 1, inDate: relDate(-5, '09:15:00'), dueDate: relDate(-4), outDate: relDate(-5, '09:20:00'), status: 'completed' },
        { id: 'wf-142-2', action: 'respond', partyIds: ['usr-kenji'], processDays: 3, inDate: relDate(-5, '09:20:00'), dueDate: relDate(0), outDate: null, status: 'in_progress' },
        { id: 'wf-142-3', action: 'review', partyIds: ['usr-sarah'], processDays: 2, inDate: null, dueDate: null, outDate: null, status: 'not_started' },
        { id: 'wf-142-4', action: 'close', partyIds: ['usr-alex'], processDays: 1, inDate: null, dueDate: null, outDate: null, status: 'not_started' },
      ],
    },
    closed: false,
  },
  // RFI-143 is created by promoting THR-1042 (spec §8). It is pre-hydrated so the record picker and the RFI screen
  // work when someone opens it first; the session marks it `createdInDemo` once the promotion has happened.
  {
    type: 'rfi',
    id: 'RFI-143',
    code: 'RFI-143',
    title: 'Grid B-4 W24 beam web penetration for the 18" HVAC trunk duct',
    status: 'open',
    rfiType: 'coordination',
    priority: 'high',
    sequence: 'Level 3 · East Wing',
    location: 'Level 3 · Corridor 3E · Grid B-4',
    reference: 'A-302 Rev 3 · Grid B-4 · S-201',
    spec: '05 12 00 · Structural Steel',
    assignedToId: 'usr-elena',
    ballInCourt: 'Thornton Structural Engineers',
    dueOn: relDate(5),
    createdById: 'usr-alex',
    createdAt: relDate(0, '10:25:00'),
    costImpact: 'TBD ($4,200 sleeve fabrication)',
    costAmount: 4200,
    scheduleImpact: '3 days (Level 3 ceiling grid closure)',
    scheduleDays: 3,
    question:
      'Per field coordination with Apex Mechanical on Drawing A-302 Rev 3 (Grid B-4), the 18" supply trunk duct conflicts with the W24x68 beam and the acoustic lighting cove. Please confirm whether a 10" reinforced circular web penetration at the beam neutral axis is acceptable per the attached Apex sketch.',
    proposedSolution:
      'A 10" circular opening at the W24x68 neutral axis, centred 4\'-0" from Grid B, with a shop-welded 3/8" ring plate per the Apex sketch. Apex fabricates the sleeve; the ceiling stays at +9\'-6".',
    customFields: [
      { label: 'Discipline', value: 'Structural' },
      { label: 'Shop drawing resubmittal', value: 'If approved' },
    ],
    answer: null,
    drawingIds: ['A-302-Rev3'],
    threadId: 'THR-1042',
    distributionIds: ['usr-elena', 'usr-dave', 'usr-sarah'],
    watcherIds: ['usr-sarah'],
    qa: [
      { id: 'qa-143-1', kind: 'question', authorId: 'usr-alex', at: relDate(0, '10:25:00'), body: null, attachmentIds: ['att-beam-sketch'], source: 'email', threadId: 'THR-1042', messageId: 'msg-1042-2' },
    ],
    workflow: {
      template: 'Design team RFI',
      steps: [
        { id: 'wf-143-1', action: 'create', partyIds: ['usr-alex'], processDays: 1, inDate: relDate(0, '10:25:00'), dueDate: relDate(1), outDate: relDate(0, '10:25:00'), status: 'completed' },
        { id: 'wf-143-2', action: 'respond', partyIds: ['usr-elena'], processDays: 5, inDate: relDate(0, '10:25:00'), dueDate: relDate(5), outDate: null, status: 'in_progress' },
        { id: 'wf-143-3', action: 'review', partyIds: ['usr-sarah'], processDays: 2, inDate: null, dueDate: null, outDate: null, status: 'not_started' },
        { id: 'wf-143-4', action: 'close', partyIds: ['usr-alex'], processDays: 1, inDate: null, dueDate: null, outDate: null, status: 'not_started' },
      ],
    },
    closed: false,
    createdInDemo: false,
  },
]);

export const SUBMITTALS = Object.freeze([
  { type: 'submittal', id: 'SUB-088', code: 'SUB-088', title: 'Patient room card-reader door hardware schedule (Rev 1)', spec: '08 71 00 · Door Hardware', revision: 'Rev 1', closed: false },
]);

export const CHANGE_ORDERS = Object.freeze([
  { type: 'change-order', id: 'PCO-019', code: 'PCO-019', title: 'Owner directive — imaging suite chiller pad vibration isolators', spec: '23 05 48 · Vibration and Seismic Controls', amount: 18450, revision: 'Draft', closed: false },
]);

const ALL = [...DRAWINGS, ...RFIS, ...SUBMITTALS, ...CHANGE_ORDERS];

/** A record with the session's patches applied (e.g. RFI-143 after promotion). */
export function getRecord(id) {
  const base = ALL.find((r) => r.id === id);
  if (!base) return null;
  return { ...base, ...(session.patches[id] || {}) };
}

/** What *Link to record* offers (spec §4): every record, newest first, as `{ value, label, type }`. */
export function linkableRecords() {
  return ALL.map((r) => ({ value: r.id, type: r.type, label: `${r.code} · ${r.title}` }));
}

/** Short label for a linked record chip: "A-302 · Rev 3" or "RFI-142". */
export function recordLabel(id) {
  const r = getRecord(id);
  if (!r) return id;
  return r.revision && r.type !== 'rfi' ? `${r.code} · ${r.revision}` : r.code;
}

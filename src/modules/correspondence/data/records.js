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

export const RFIS = Object.freeze([
  {
    type: 'rfi',
    id: 'RFI-142',
    code: 'RFI-142',
    title: 'Level 2 Operating Room lead-lined partition termination',
    status: 'open', // status.js RFI_STATUS
    spec: '09 29 00 · Gypsum Board',
    assignedToId: 'usr-kenji',
    ballInCourt: 'Studio West Architecture',
    dueOn: relDate(0),
    createdById: 'usr-alex',
    createdAt: relDate(-5, '09:15:00'),
    costImpact: 'None anticipated',
    scheduleImpact: '2 days (Level 2 rough-in)',
    question:
      'Drawing A-511 Detail 4 shows lead-lined gypsum board terminating 6" above the finished ceiling, while the radiation shielding spec (13 49 00) calls for slab-to-slab continuity. Please confirm the required termination height at Grid D-7.',
    answer: null,
    drawingIds: ['A-302-Rev3'],
    threadId: 'THR-1039',
    closed: false,
  },
  // RFI-143 is created by promoting THR-1042 (spec §8). It is pre-hydrated so the record picker and the RFI stand-in
  // work when someone opens it first; the session marks it `createdInDemo` once the promotion has happened.
  {
    type: 'rfi',
    id: 'RFI-143',
    code: 'RFI-143',
    title: 'Grid B-4 W24 beam web penetration for the 18" HVAC trunk duct',
    status: 'open',
    spec: '05 12 00 · Structural Steel',
    assignedToId: 'usr-elena',
    ballInCourt: 'Thornton Structural Engineers',
    dueOn: relDate(5),
    createdById: 'usr-alex',
    createdAt: relDate(0, '10:25:00'),
    costImpact: 'TBD ($4,200 sleeve fabrication)',
    scheduleImpact: '3 days (Level 3 ceiling grid closure)',
    question:
      'Per field coordination with Apex Mechanical on Drawing A-302 Rev 3 (Grid B-4), the 18" supply trunk duct conflicts with the W24x68 beam and the acoustic lighting cove. Please confirm whether a 10" reinforced circular web penetration at the beam neutral axis is acceptable per the attached Apex sketch.',
    answer: null,
    drawingIds: ['A-302-Rev3'],
    threadId: 'THR-1042',
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

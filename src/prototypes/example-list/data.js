// PLACEHOLDER DATA — the example module's records: submittals on one project. Shared by example-list and
// example-detail so a row on the list opens the same record on the detail (CLAUDE.md › Mock data). A real module
// keeps its data in src/modules/<module>/data/ once more than one screen reads it.
import { SUBMITTAL } from '~/modules/app/status';
import { session } from '~/modules/session';

/** The mock's "today" (ISO date). Dates in the data are relative to it, so the demo never goes stale. */
export const TODAY = '2026-10-15';

const STATIC = [
  { id: 'sub-001', number: 'SUB-0101', title: 'Structural steel shop drawings', spec: '05 12 00 · Structural Steel Framing', package: 'Structure', status: 'in-review', ballInCourt: 'Harper & Finch Engineers', submittedOn: '2026-10-08', dueOn: '2026-10-22', revision: 1 },
  { id: 'sub-002', number: 'SUB-0102', title: 'Cast-in-place concrete mix design', spec: '03 30 00 · Cast-in-Place Concrete', package: 'Structure', status: 'approved', ballInCourt: 'Granite Ridge Concrete', submittedOn: '2026-09-12', dueOn: '2026-09-26', revision: 0 },
  { id: 'sub-003', number: 'SUB-0107', title: 'Curtain wall system samples', spec: '08 44 13 · Glazed Aluminum Curtain Walls', package: 'Envelope', status: 'revise', ballInCourt: 'Skyline Glazing Co.', submittedOn: '2026-09-29', dueOn: '2026-10-13', revision: 2 },
  { id: 'sub-004', number: 'SUB-0110', title: 'Roofing membrane product data', spec: '07 54 00 · Thermoplastic Membrane Roofing', package: 'Envelope', status: 'submitted', ballInCourt: 'Alex Morgan', submittedOn: '2026-10-14', dueOn: '2026-10-28', revision: 0 },
  { id: 'sub-005', number: 'SUB-0114', title: 'Fire sprinkler hydraulic calculations', spec: '21 13 13 · Wet-Pipe Sprinkler Systems', package: 'MEP', status: 'approved-as-noted', ballInCourt: 'Summit Mechanical LLC', submittedOn: '2026-09-20', dueOn: '2026-10-04', revision: 1 },
  { id: 'sub-006', number: 'SUB-0118', title: 'Electrical switchgear schedule', spec: '26 24 13 · Switchboards', package: 'MEP', status: 'draft', ballInCourt: 'Apex Electrical, Inc.', submittedOn: null, dueOn: '2026-11-05', revision: 0 },
  { id: 'sub-007', number: 'SUB-0121', title: 'Elevator cab finishes', spec: '14 21 00 · Electric Traction Elevators', package: 'Finishes', status: 'rejected', ballInCourt: 'Vertex Elevator Group', submittedOn: '2026-09-15', dueOn: '2026-09-29', revision: 1 },
  { id: 'sub-008', number: 'SUB-0125', title: 'Interior door hardware schedule', spec: '08 71 00 · Door Hardware', package: 'Finishes', status: 'submitted', ballInCourt: 'Alex Morgan', submittedOn: '2026-10-13', dueOn: '2026-10-27', revision: 0 },
];

const ACTIVITY = {
  'sub-001': [
    { at: '2026-10-08T09:12:00', actor: 'Harbor Point Steel', action: 'Submitted revision 1 with the revised connection details' },
    { at: '2026-10-09T14:30:00', actor: 'Alex Morgan', action: 'Forwarded to Harper & Finch Engineers for review' },
    { at: '2026-10-14T16:05:00', actor: 'Harper & Finch Engineers', action: 'Review in progress; comments expected by 22 Oct' },
  ],
  'sub-003': [
    { at: '2026-09-29T11:00:00', actor: 'Skyline Glazing Co.', action: 'Submitted revision 2 with mullion samples' },
    { at: '2026-10-10T10:20:00', actor: 'Harper & Finch Engineers', action: 'Returned: revise and resubmit. Thermal break detail does not match the spec' },
  ],
};

/** All submittals, with the demo session's patches applied and each status resolved to { key, label, tone }. */
export function submittals() {
  return STATIC.map((s) => {
    const patched = { ...s, ...(session.patches[s.id] || {}) };
    return { ...patched, status: SUBMITTAL[patched.status] };
  });
}

export const submittalById = (id) => submittals().find((s) => s.id === id) || null;

export const activityFor = (id) =>
  (ACTIVITY[id] || [{ at: `${TODAY}T08:00:00`, actor: 'Alex Morgan', action: 'Created the submittal' }]).slice().reverse();

/** Options for the sandbox's record picker (prototype.records). */
export const submittalOptions = () => STATIC.map((s) => ({ value: s.id, label: `${s.number} · ${s.title}` }));

// DataGrid rows, columns, views and quick filters for the RFI log (correspondence-rfi-list; docs/correspondence/
// screens.md §1). Conventions (5-ui-patterns.md §2, §8): columns sized to their content; the number frozen left, the
// row action frozen right; one signal per status from status.js; filters in the grid's Filter panel; the segmented
// views are one hidden "View" column the segments and the panel share (D-30, as the Email screen).
import './gridSlots';
import '~/modules/notifications/gridSlots';
import { RFI_STATUS, WORKFLOW_STEP } from '~/modules/app/status';
import { TODAY, dayOf, getPerson, currentStep, stepStatus, rfiThreads, viewFor, RFI_TYPES, PRIORITIES, WORKFLOW_ACTIONS } from './data';

const BLANK = { type: 'text', componentProps: { value: '' } };

/** The log's views: All, then one condition each (status; Overdue is the step's timing). */
export const VIEWS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'open', label: 'Open', test: (r) => r.status === 'open' },
  { id: 'answered', label: 'Answered', test: (r) => r.status === 'answered' },
  { id: 'closed', label: 'Closed', test: (r) => r.status === 'closed' || r.status === 'rejected' },
  { id: 'overdue', label: 'Overdue', test: (r) => r.sla === 'overdue' },
];
export const VIEW_FIELD = 'views';
export const viewOptions = VIEWS.filter((v) => v.id !== 'all').map((v) => ({ label: v.label, value: v.id }));

/** Quick filters at the top of the Filter panel: the views, priority, mine. */
export const rfiQuickFilters = [
  ...viewOptions.map((o) => ({ label: o.label, field: VIEW_FIELD, operator: 'is', value: o.value })),
  { label: 'High priority', field: 'priorityLabel', operator: 'isAnyOf', value: [PRIORITIES.high, PRIORITIES.critical] },
  { label: 'Needs an email answer', field: 'emailText', operator: 'isNot', value: '—' },
];

/** The step's timing against today (status.js SLA keys, so the Email screen's `sla-due` slot renders it). */
function slaOf(record) {
  if (record.closed || !record.dueOn) return 'none';
  const due = dayOf(record.dueOn);
  const today = dayOf(TODAY);
  if (due < today) return 'overdue';
  if (due === today) return 'due_today';
  return 'on_track';
}

/** RFIs one role may see: internal roles all of them; a guest those they are a party to or distributed on (D-41). */
export function visibleRfis(records, role) {
  if (role.internal) return records;
  return records.filter((r) => {
    const parties = (r.workflow ? r.workflow.steps : []).flatMap((s) => s.partyIds);
    return [...parties, ...(r.distributionIds || []), ...(r.watcherIds || []), r.assignedToId].includes(role.personId);
  });
}

/** Grid rows from the RFIs a role may see, with the display fields the grid sorts and filters on. */
export function rfiRows(records, role, moment) {
  return records.map((r) => {
    const step = currentStep(r);
    const stepKey = step ? stepStatus(step) : r.closed ? 'completed' : 'not_started';
    const party = step ? getPerson(step.partyIds[0]) : null;
    const emailNeeds = rfiThreads(r).map((t) => viewFor(t, role)).filter((t) => t && t.triage === 'needs_action').length;
    const row = {
      id: r.id,
      code: r.code,
      title: r.title,
      typeLabel: RFI_TYPES[r.rfiType] || '—',
      priority: r.priority,
      priorityLabel: PRIORITIES[r.priority] || '—',
      status: r.status,
      statusLabel: RFI_STATUS[r.status].label,
      ballInCourt: party ? `${party.name} · ${party.company}` : r.ballInCourt || '—',
      stepKey,
      stepLabel: step ? `${WORKFLOW_ACTIONS[step.action]} · ${WORKFLOW_STEP[stepKey].label}` : WORKFLOW_STEP[stepKey].label,
      sla: slaOf(r),
      dueText: r.dueOn ? moment(r.dueOn).format('D MMM') : '—',
      emailText: emailNeeds ? `${emailNeeds} to answer` : '—',
      locationText: r.location || '—',
      createdText: `${moment(r.createdAt).format('D MMM')} · ${(getPerson(r.createdById) || {}).name || ''}`,
    };
    row[VIEW_FIELD] = VIEWS.filter((v) => v.id !== 'all' && v.test(row)).map((v) => v.id);
    return row;
  });
}

/**
 * @param {(row) => void} onAction  row action handler (Open → the RFI)
 */
export function rfiColumns(onAction) {
  const options = (dim) => Object.values(dim).map((s) => ({ label: s.label, value: s.label }));
  const labels = (map) => Object.values(map).map((l) => ({ label: l, value: l }));
  return [
    { field: 'code', label: 'RFI', type: 'ShortText', width: 90, readonly: true, frozen: true },
    { field: 'title', label: 'TITLE', type: 'ShortText', width: 320, readonly: true },
    { field: 'typeLabel', label: 'TYPE', type: 'ShortText', width: 150, readonly: true, customProps: { treatAsSelectFilter: true, options: labels(RFI_TYPES) } },
    { field: 'priorityLabel', label: 'PRIORITY', type: 'ShortText', width: 100, readonly: true, customProps: { treatAsSelectFilter: true, options: labels(PRIORITIES) } },
    {
      field: 'statusLabel',
      label: 'STATUS',
      type: 'ShortText',
      width: 120,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: options(RFI_STATUS) },
      cell: {
        left: { type: 'signal', componentProps: { label: (r) => r.statusLabel, tone: (r) => RFI_STATUS[r.status].tone, signal: (r) => ({ draft: 'word', open: 'chip', answered: 'chip', closed: 'check', rejected: 'chip' }[r.status]), strong: (r) => r.status === 'rejected' } },
        center: BLANK,
      },
    },
    { field: 'ballInCourt', label: 'BALL IN COURT', type: 'ShortText', width: 230, readonly: true, customProps: { treatAsSelectFilter: true } },
    { field: 'stepLabel', label: 'STEP', type: 'ShortText', width: 160, readonly: true, customProps: { treatAsSelectFilter: true } },
    {
      field: 'dueText',
      label: 'DUE',
      type: 'ShortText',
      width: 150,
      readonly: true,
      cell: { left: { type: 'sla-due', componentProps: { sla: (r) => r.sla, dueText: (r) => r.dueText } }, center: BLANK },
    },
    { field: 'emailText', label: 'EMAIL', type: 'ShortText', width: 110, readonly: true },
    { field: 'locationText', label: 'LOCATION', type: 'ShortText', width: 200, readonly: true },
    { field: 'createdText', label: 'CREATED', type: 'ShortText', width: 170, readonly: true },
    {
      field: 'action',
      label: '',
      type: 'Actions',
      frozen: true,
      width: 90,
      readonly: true,
      cell: { center: BLANK, right: { type: 'button', componentProps: { label: 'Open', variant: 'text', colorScheme: 'primary', size: 'small' }, onClick: onAction } },
    },
    { field: VIEW_FIELD, label: 'View', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: viewOptions } },
  ];
}

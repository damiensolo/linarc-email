// DataGrid rows, columns, views and quick filters for the Notifications page (notifications-list; docs/notifications/
// screens.md §2). Conventions (5-ui-patterns.md §2, §8): columns sized to their content; the title frozen left, the
// row action frozen right; one signal per status from status.js; filters in the grid's Filter panel; the segmented
// views are one hidden "View" column the segments and the panel share (D-30, as the Email screen).
import './gridSlots';
import '~/modules/correspondence/gridSlots';
import { SEVERITY, WORK_STATUS, TIMING, ROUTING, PRESENTATION, ENGAGEMENT } from '~/modules/app/status';
import { TODAY, getPerson } from '~/modules/correspondence/data';
import { EVENT_FAMILIES } from './data';

const BLANK = { type: 'text', componentProps: { value: '' } };

/** The page's views (spec §6): one condition each; All is no condition. */
export const VIEWS = [
  { id: 'needs_action', label: 'Needs action', test: (r) => r.workStatus === 'needs_action' && r.presentation === 'shown' },
  { id: 'waiting', label: 'Waiting', test: (r) => r.workStatus === 'waiting' && r.presentation === 'shown' },
  { id: 'updates', label: 'Updates', test: (r) => r.severity === 'update' && r.presentation === 'shown' },
  { id: 'all', label: 'All', test: () => true },
];
export const VIEW_FIELD = 'views';
export const viewOptions = VIEWS.filter((v) => v.id !== 'all').map((v) => ({ label: v.label, value: v.id }));

const SOURCE = { thread: 'Email', rfi: 'RFIs', drawing: 'Drawings' };
const sourceOf = (key) => SOURCE[key.split(':')[0]] || 'Other';
const sourceOptions = Object.values(SOURCE).map((s) => ({ label: s, value: s }));

/** Quick filters at the top of the Filter panel (spec §6, screens.md §2). */
export const notificationQuickFilters = [
  ...viewOptions.map((o) => ({ label: o.label, field: VIEW_FIELD, operator: 'is', value: o.value })),
  { label: 'Critical', field: 'severityLabel', operator: 'is', value: SEVERITY.critical.label },
  { label: 'Overdue', field: 'timingLabel', operator: 'is', value: TIMING.overdue.label },
  { label: 'Not acknowledged', field: 'ackText', operator: 'is', value: 'Critical, not acknowledged' },
  { label: 'Snoozed', field: 'presentationLabel', operator: 'is', value: PRESENTATION.snoozed.label },
  ...sourceOptions.map((o) => ({ label: o.label, field: 'sourceText', operator: 'is', value: o.value })),
];

const name = (id) => (getPerson(id) || {}).name || '—';
const ago = (iso) => {
  const m = Math.round((new Date(TODAY) - new Date(iso)) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** Grid rows from projected items (itemsFor); `person` is set for the Team scope. */
export function notificationRows(items, moment, { person = null } = {}) {
  return items.map((it) => {
    const row = {
      ...it,
      id: it.key,
      severityLabel: SEVERITY[it.severity].label,
      statusLabel: WORK_STATUS[it.workStatus].label || '—',
      timingLabel: TIMING[it.timing].label || '—',
      dueText: it.dueAt ? moment(it.dueAt).format('D MMM') : '—',
      routingText: ROUTING[it.routing].label + (it.routing === 'covering' ? ` ${name(it.coveringForId)}` : ''),
      responsibleText: it.responsibleId ? name(it.responsibleId) : `Fallback: ${name(it.fallbackId)}`,
      recordText: it.recordLabel || '—',
      ageText: ago(it.lastEventAt),
      sourceText: sourceOf(it.key),
      familyLabel: (EVENT_FAMILIES.find((f) => f.id === it.family) || {}).label || '',
      presentationLabel: PRESENTATION[it.presentation].label || 'Shown',
      ackText: it.severity === 'critical' ? (it.engagement === 'acknowledged' ? 'Critical, acknowledged' : 'Critical, not acknowledged') : '—',
      engagementLabel: ENGAGEMENT[it.engagement].label || 'Seen',
      personText: person ? name(person) : '',
    };
    row[VIEW_FIELD] = VIEWS.filter((v) => v.id !== 'all' && v.test(row)).map((v) => v.id);
    return row;
  });
}

/**
 * @param {(row) => void} onAction  the row's primary action (opens the record)
 * @param {{ team: boolean }} opts   the Team scope adds the Person column
 */
export function notificationColumns(onAction, { team = false } = {}) {
  const options = (dim) => Object.values(dim).filter((s) => s.label).map((s) => ({ label: s.label, value: s.label }));
  return [
    { field: 'title', label: 'NOTIFICATION', type: 'ShortText', width: 360, readonly: true, frozen: true },
    {
      field: 'severityLabel',
      label: 'SEVERITY',
      type: 'ShortText',
      width: 120,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: options(SEVERITY) },
      cell: {
        left: { type: 'signal', componentProps: { label: (r) => r.severityLabel, tone: (r) => SEVERITY[r.severity].tone, signal: (r) => (r.severity === 'critical' ? 'chip' : 'word'), strong: (r) => r.severity === 'critical' } },
        center: BLANK,
      },
    },
    ...(team ? [{ field: 'personText', label: 'PERSON', type: 'ShortText', width: 150, readonly: true, customProps: { treatAsSelectFilter: true } }] : []),
    {
      field: 'statusLabel',
      label: 'STATUS',
      type: 'ShortText',
      width: 140,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: options(WORK_STATUS) },
      cell: {
        left: { type: 'signal', componentProps: { label: (r) => r.statusLabel, tone: (r) => WORK_STATUS[r.workStatus].tone, signal: (r) => ({ needs_action: 'chip', waiting: 'word', resolved: 'check', none: 'none' }[r.workStatus]) } },
        center: BLANK,
      },
    },
    { field: 'recordText', label: 'RECORD', type: 'ShortText', width: 130, readonly: true },
    { field: 'responsibleText', label: 'RESPONSIBLE', type: 'ShortText', width: 170, readonly: true, customProps: { treatAsSelectFilter: true } },
    {
      field: 'dueText',
      label: 'DUE',
      type: 'ShortText',
      width: 150,
      readonly: true,
      cell: { left: { type: 'sla-due', componentProps: { sla: (r) => r.timing, dueText: (r) => r.dueText } }, center: BLANK },
    },
    { field: 'routingText', label: 'WHY YOU', type: 'ShortText', width: 190, readonly: true, customProps: { treatAsSelectFilter: true } },
    { field: 'ageText', label: 'AGE', type: 'ShortText', width: 80, readonly: true },
    {
      field: 'action',
      label: '',
      type: 'Actions',
      frozen: true,
      width: 150,
      readonly: true,
      cell: { center: BLANK, right: { type: 'button', componentProps: { label: (r) => r.action.label, variant: 'text', colorScheme: 'primary', size: 'small' }, onClick: onAction } },
    },
    // Filter-only, hidden: the views, timing, source, snoozed, acknowledgment, family.
    { field: VIEW_FIELD, label: 'View', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: viewOptions } },
    { field: 'timingLabel', label: 'Timing', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: options(TIMING) } },
    { field: 'sourceText', label: 'Source', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: sourceOptions } },
    { field: 'presentationLabel', label: 'Snoozed or archived', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: [{ label: 'Shown', value: 'Shown' }, ...options(PRESENTATION)] } },
    { field: 'ackText', label: 'Critical acknowledgment', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: [{ label: 'Critical, not acknowledged', value: 'Critical, not acknowledged' }, { label: 'Critical, acknowledged', value: 'Critical, acknowledged' }] } },
    { field: 'familyLabel', label: 'Event family', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: EVENT_FAMILIES.map((f) => ({ label: f.label, value: f.label })) } },
  ];
}

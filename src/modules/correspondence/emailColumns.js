// DataGrid rows, columns, views and quick filters for the Email screen (correspondence-list; docs/correspondence/
// screens.md §1). Conventions (5-ui-patterns.md §2, §8): columns sized to their widest real content; subject frozen
// left, the row action frozen right; one signal per status from status.js; filters in the grid's Filter panel; the
// segmented views are one hidden "View" column the segments and the panel share (D-30, as prequal-queue).
import './gridSlots';
import { TRIAGE, DELIVERY, PROMOTION, VISIBILITY, toneToChipStatus } from '~/modules/app/status';
import { getPerson, recordLabel, slaFor, weakestDelivery, isUnmatched } from './data';

// A cell with only a `left` slot keeps the column value for sorting and filtering without rendering it twice.
const BLANK = { type: 'text', componentProps: { value: '' } };

/** The screen's views: All, then one condition each (spec §9; status-model.md › Where each dimension is read). */
export const VIEWS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'needs_action', label: 'Needs action', test: (r) => r.triage === 'needs_action' },
  { id: 'waiting', label: 'Waiting', test: (r) => r.triage === 'waiting' },
  { id: 'overdue', label: 'Overdue', test: (r) => r.sla === 'overdue' },
  { id: 'unmatched', label: 'Unmatched', test: (r) => r.unmatched },
];
export const VIEW_FIELD = 'views';
export const viewOptions = VIEWS.filter((v) => v.id !== 'all').map((v) => ({ label: v.label, value: v.id }));

/** Quick filters at the top of the Filter panel: the views, Has attachments, Confidential (spec §9). */
export const emailQuickFilters = [
  ...viewOptions.map((o) => ({ label: o.label, field: VIEW_FIELD, operator: 'is', value: o.value })),
  { label: 'Has attachments', field: 'attachmentsText', operator: 'is', value: 'Yes' },
  { label: 'Confidential', field: 'visibilityLabel', operator: 'is', value: VISIBILITY.restricted.label },
];

const lastMessage = (t) => [...t.entries].reverse().find((e) => e.type === 'message');

/** Grid rows from the threads a role may see, with the display fields the grid sorts and filters on. */
export function emailRows(threads, moment) {
  return threads.map((t) => {
    const last = lastMessage(t);
    const sender = last ? getPerson(last.senderId) : null;
    const sla = slaFor(t);
    const delivery = weakestDelivery(t);
    const unmatched = isUnmatched(t);
    const row = {
      id: t.id,
      subject: t.subject,
      linkedText: t.linkedRecordIds.length ? t.linkedRecordIds.map(recordLabel).join(', ') : '—',
      fromText: sender ? `${sender.name} · ${sender.company}` : '—',
      triage: t.triage,
      triageLabel: TRIAGE[t.triage].label,
      sla,
      dueText: t.responseDueAt ? moment(t.responseDueAt).format('D MMM') : '—',
      deliveryKey: delivery,
      deliveryLabel: delivery ? DELIVERY[delivery].label : '—',
      activityText: moment(t.lastActivityAt).format('D MMM, HH:mm'),
      promotedText: t.promotedRecordId ? `${PROMOTION[t.promotion].label.replace('Promoted to ', '')} ${t.promotedRecordId}` : '—',
      costText: t.estimatedCostImpact == null ? '—' : t.estimatedCostImpact === 0 ? 'None' : `$${t.estimatedCostImpact.toLocaleString('en-US')}`,
      attachmentsText: t.entries.some((e) => (e.attachmentIds || []).length) ? 'Yes' : 'No',
      visibilityLabel: VISIBILITY[t.visibility].label,
      unmatched,
    };
    row[VIEW_FIELD] = VIEWS.filter((v) => v.id !== 'all' && v.test(row)).map((v) => v.id);
    return row;
  });
}

/** Row action: an unmatched thread's first job is to get a record (spec §4); every other row opens. */
export const actionLabel = (row) => (row.unmatched ? 'Link to record' : 'Open');

/**
 * @param {(row) => void} onAction  row action handler (Open → thread; Link to record → the link dialog)
 * @param {{ canSeeCost: boolean }} role  cost column only for roles that may see cost (D-41)
 */
export function emailColumns(onAction, { canSeeCost }) {
  const triageOptions = Object.values(TRIAGE).map((s) => ({ label: s.label, value: s.label }));
  const deliveryOptions = Object.values(DELIVERY).map((s) => ({ label: s.label, value: s.label }));
  return [
    { field: 'subject', label: 'SUBJECT', type: 'ShortText', width: 300, readonly: true, frozen: true },
    // A promoted record is one of the linked records, so there is no separate Promoted column.
    { field: 'linkedText', label: 'LINKED RECORD', type: 'ShortText', width: 160, readonly: true },
    { field: 'fromText', label: 'FROM', type: 'ShortText', width: 230, readonly: true },
    {
      field: 'triageLabel',
      label: 'STATUS',
      type: 'ShortText',
      width: 140,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: triageOptions },
      cell: {
        left: { type: 'status-chip', componentProps: { label: (r) => r.triageLabel, status: (r) => toneToChipStatus(TRIAGE[r.triage].tone), fillStyle: 'outline', type: 'default' } },
        center: BLANK,
      },
    },
    {
      field: 'dueText',
      label: 'RESPONSE DUE',
      type: 'ShortText',
      width: 160,
      readonly: true,
      cell: { left: { type: 'sla-due', componentProps: { sla: (r) => r.sla, dueText: (r) => r.dueText } }, center: BLANK },
    },
    { field: 'deliveryLabel', label: 'DELIVERY', type: 'ShortText', width: 140, readonly: true, customProps: { treatAsSelectFilter: true, options: deliveryOptions } },
    { field: 'activityText', label: 'LAST ACTIVITY', type: 'ShortText', width: 130, readonly: true },
    ...(canSeeCost ? [{ field: 'costText', label: 'COST IMPACT', type: 'ShortText', width: 110, readonly: true }] : []),
    {
      field: 'action',
      label: '',
      type: 'Actions',
      frozen: true,
      width: 130,
      readonly: true,
      cell: { center: BLANK, right: { type: 'button', componentProps: { label: actionLabel, variant: 'text', colorScheme: 'primary', size: 'small' }, onClick: onAction } },
    },
    // Filter-only, hidden: the views (a row matches a view when it is in the row's list), attachments, confidentiality.
    { field: VIEW_FIELD, label: 'View', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: viewOptions } },
    { field: 'attachmentsText', label: 'Has attachments', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] } },
    { field: 'visibilityLabel', label: 'Visibility', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: Object.values(VISIBILITY).map((s) => ({ label: s.label, value: s.label })) } },
  ];
}

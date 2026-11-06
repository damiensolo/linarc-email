// DataGrid rows, columns, views and quick filters for the Email screen (correspondence-list; docs/correspondence/
// screens.md §1). Conventions (5-ui-patterns.md §2, §8): columns sized to their widest real content; subject frozen
// left, the row action frozen right; one signal per status from status.js; filters in the grid's Filter panel; the
// segmented views are one hidden "View" column the segments and the panel share (D-30, as prequal-queue).
// The Reading view (D-65, 2026-11-04) reads the same rows: its Views pane writes the hidden columns below (object type,
// record, company, last activity) as ordinary conditions, so the Filter badge and the pane always agree.
// Since 2026-11-06 (D-67): Drafts and Deleted are folder views (a different row set, not a filter); a row is unread for
// the viewer (bold Subject and From, as a mail client) until the thread is opened; the hidden Read column filters it.
import './gridSlots';
import { TRIAGE, DELIVERY, PROMOTION, VISIBILITY, toneToChipStatus } from '~/modules/app/status';
import { getPerson, getPeople, recordLabel, slaFor, weakestDelivery, isUnmatched, isUnreadFor, isDeleted, linkableRecords, RECORD_KINDS, TODAY } from './data';
import { costImpactText } from './view';

// A cell with only a `left` slot keeps the column value for sorting and filtering without rendering it twice.
const BLANK = { type: 'text', componentProps: { value: '' } };

/**
 * The screen's views: All, then one condition each (spec §9; status-model.md › Where each dimension is read), then the
 * two folders (D-67): Drafts (messages not sent yet) and Deleted (threads deleted here, until restored). A folder is a
 * different row set, so choosing one swaps the rows instead of adding a condition.
 */
export const VIEWS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'needs_action', label: 'Needs action', test: (r) => r.triage === 'needs_action' },
  { id: 'waiting', label: 'Waiting', test: (r) => r.triage === 'waiting' },
  { id: 'overdue', label: 'Overdue', test: (r) => r.sla === 'overdue', tone: 'error' },
  { id: 'unmatched', label: 'Unmatched', test: (r) => r.unmatched },
  { id: 'drafts', label: 'Drafts', folder: true },
  { id: 'deleted', label: 'Deleted', folder: true },
];
export const VIEW_FIELD = 'views';
export const isFolderView = (id) => VIEWS.some((v) => v.id === id && v.folder);
/** The filterable views (the Filter panel's quick filters and the hidden column's options): not All, not a folder. */
export const viewOptions = VIEWS.filter((v) => v.id !== 'all' && !v.folder).map((v) => ({ label: v.label, value: v.id }));

// Hidden filter columns the Reading view's pane writes (and the Filter panel shows and edits).
export const KIND_FIELD = 'kinds';
export const RECORD_FIELD = 'recordIds';
export const COMPANY_FIELD = 'companyText';
export const ACTIVITY_FIELD = 'activityWithin';
export const READ_FIELD = 'readText';

/** Object types for the pane and the hidden column: the record kinds, then Untagged (no linked record). */
export const KIND_OPTIONS = [...RECORD_KINDS.map((k) => ({ value: k.id, label: k.one })), { value: 'untagged', label: 'Untagged' }];

/** Last-activity buckets, cumulative: a thread active 3 days ago is within 7, 30 and 90 days. */
export const ACTIVITY_OPTIONS = [
  { value: 'today', label: 'Today', days: 0 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
];

/** Quick filters at the top of the Filter panel: the views, Unread, Has attachments, Confidential (spec §9). */
export const emailQuickFilters = [
  ...viewOptions.map((o) => ({ label: o.label, field: VIEW_FIELD, operator: 'is', value: o.value })),
  { label: 'Unread', field: READ_FIELD, operator: 'is', value: 'Unread' },
  { label: 'Has attachments', field: 'attachmentsText', operator: 'is', value: 'Yes' },
  { label: 'Confidential', field: 'visibilityLabel', operator: 'is', value: VISIBILITY.restricted.label },
];

const lastMessage = (t) => [...t.entries].reverse().find((e) => e.type === 'message');

/** The first line of a message for a list row: one line, no markup, 140 characters. */
const snippetOf = (body) =>
  String(body || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

/** The list row's time: the clock today, the day otherwise (as a mail client). */
const timeTextOf = (activity, ageDays) => (ageDays === 0 ? activity.format('HH:mm') : activity.format('D MMM'));

/**
 * Grid rows from the threads a role may see, with the display fields the grid sorts and filters on.
 * @param {object} role  the viewer (D-41): `unread` is theirs
 */
export function emailRows(threads, moment, role) {
  const today = moment(TODAY).startOf('day');
  return threads.map((t) => {
    const last = lastMessage(t);
    const sender = last ? getPerson(last.senderId) : null;
    const sla = slaFor(t);
    const delivery = weakestDelivery(t);
    const unmatched = isUnmatched(t);
    const unread = role ? isUnreadFor(t, role.personId) : false;
    const activity = moment(t.lastActivityAt);
    const ageDays = today.diff(activity.clone().startOf('day'), 'days');
    const kinds = t.linkedRecordIds.map((id) => (RECORD_KINDS.find((k) => recordKind(id) === k.id) || {}).id).filter(Boolean);
    const row = {
      id: t.id,
      subject: t.subject,
      linkedText: t.linkedRecordIds.length ? t.linkedRecordIds.map(recordLabel).join(', ') : '—',
      fromText: sender ? `${sender.name} · ${sender.company}` : '—',
      fromName: sender ? sender.name : 'Unknown sender',
      triage: t.triage,
      triageLabel: TRIAGE[t.triage].label,
      sla,
      dueText: t.responseDueAt ? moment(t.responseDueAt).format('D MMM') : '—',
      deliveryKey: delivery,
      deliveryLabel: delivery ? DELIVERY[delivery].label : '—',
      activityText: activity.format('D MMM, HH:mm'),
      timeText: timeTextOf(activity, ageDays),
      lastActivityAt: t.lastActivityAt,
      snippet: last ? snippetOf(last.body) : '',
      promotedText: t.promotedRecordId ? `${PROMOTION[t.promotion].label.replace('Promoted to ', '')} ${t.promotedRecordId}` : '—',
      costText: costImpactText(t.estimatedCostImpact) || '—',
      hasAttachments: t.entries.some((e) => (e.attachmentIds || []).length || (e.attachments || []).length),
      attachmentsText: t.entries.some((e) => (e.attachmentIds || []).length || (e.attachments || []).length) ? 'Yes' : 'No',
      visibilityLabel: VISIBILITY[t.visibility].label,
      unmatched,
      unread,
      deleted: isDeleted(t),
      draft: null,
      [READ_FIELD]: unread ? 'Unread' : 'Read',
      [KIND_FIELD]: kinds.length ? [...new Set(kinds)] : ['untagged'],
      [RECORD_FIELD]: [...t.linkedRecordIds],
      [COMPANY_FIELD]: t.primaryCompany || (sender ? sender.company : '') || '—',
      [ACTIVITY_FIELD]: ACTIVITY_OPTIONS.filter((o) => ageDays <= o.days).map((o) => o.value),
    };
    row[VIEW_FIELD] = VIEWS.filter((v) => v.id !== 'all' && !v.folder && v.test(row)).map((v) => v.id);
    return row;
  });
}

/** Rows of the Drafts folder (D-67), from `listDrafts(role)`: the same shape, so the columns, search and sort apply. */
export function draftRows(drafts, moment) {
  const today = moment(TODAY).startOf('day');
  return drafts.map((d) => {
    const saved = moment(d.savedAt);
    const ageDays = today.diff(saved.clone().startOf('day'), 'days');
    const kinds = d.linkedRecordIds.map((id) => (RECORD_KINDS.find((k) => recordKind(id) === k.id) || {}).id).filter(Boolean);
    return {
      id: d.key,
      subject: d.subject,
      linkedText: d.linkedText || '—',
      fromText: d.toText ? `Draft · to ${d.toText}` : 'Draft',
      fromName: 'Draft',
      triage: null,
      triageLabel: 'Draft',
      sla: 'none',
      dueText: '—',
      deliveryKey: null,
      deliveryLabel: '—',
      activityText: saved.format('D MMM, HH:mm'),
      timeText: timeTextOf(saved, ageDays),
      lastActivityAt: d.savedAt,
      snippet: snippetOf(d.text),
      promotedText: '—',
      costText: '—',
      hasAttachments: d.hasAttachments,
      attachmentsText: d.hasAttachments ? 'Yes' : 'No',
      visibilityLabel: VISIBILITY.project_public.label,
      unmatched: false,
      unread: false,
      deleted: false,
      draft: { kind: d.kind, key: d.key, recordId: d.recordId, pinId: d.pinId, threadId: d.threadId },
      [READ_FIELD]: 'Read',
      [VIEW_FIELD]: [],
      [KIND_FIELD]: kinds.length ? [...new Set(kinds)] : ['untagged'],
      [RECORD_FIELD]: [...d.linkedRecordIds],
      [COMPANY_FIELD]: '—',
      [ACTIVITY_FIELD]: ACTIVITY_OPTIONS.filter((o) => ageDays <= o.days).map((o) => o.value),
    };
  });
}

const recordKind = (id) => (linkableRecords().find((r) => r.value === id) || {}).type;

/** Row action: a draft is edited, a deleted thread restored, an unmatched thread's first job is a record (spec §4); every other row opens. */
export const actionLabel = (row) => (row.draft ? 'Edit' : row.deleted ? 'Restore' : row.unmatched ? 'Link to record' : 'Open');

/**
 * @param {(row) => void} onAction  row action handler (Open → thread; Link to record → the link dialog; Edit → the draft; Restore)
 * @param {{ canSeeCost: boolean }} role  cost column only for roles that may see cost (D-41)
 */
export function emailColumns(onAction, { canSeeCost }) {
  const triageOptions = [...Object.values(TRIAGE).map((s) => ({ label: s.label, value: s.label })), { label: 'Draft', value: 'Draft' }];
  const deliveryOptions = Object.values(DELIVERY).map((s) => ({ label: s.label, value: s.label }));
  const companyOptions = [...new Set(getPeople().map((p) => p.company))].sort().map((c) => ({ label: c, value: c }));
  const recordOptions = linkableRecords().map((r) => ({ label: r.label, value: r.value }));
  // Unread rows read bold, as a mail client (D-67): the cell renders the value itself so the weight can follow the row.
  const emph = (field) => ({ left: { type: 'emph-text', componentProps: { value: (r) => r[field], bold: (r) => r.unread } }, center: BLANK });
  return [
    { field: 'subject', label: 'SUBJECT', type: 'ShortText', width: 300, readonly: true, frozen: true, cell: emph('subject') },
    // A promoted record is one of the linked records, so there is no separate Promoted column.
    { field: 'linkedText', label: 'LINKED RECORD', type: 'ShortText', width: 160, readonly: true },
    { field: 'fromText', label: 'FROM', type: 'ShortText', width: 230, readonly: true, cell: emph('fromText') },
    {
      field: 'triageLabel',
      label: 'STATUS',
      type: 'ShortText',
      width: 140,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: triageOptions },
      cell: {
        // A draft has no triage: its chip is the neutral word "Draft"
        left: { type: 'status-chip', componentProps: { label: (r) => r.triageLabel, status: (r) => toneToChipStatus(r.triage ? TRIAGE[r.triage].tone : 'neutral'), fillStyle: 'outline', type: 'default' } },
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
    // Filter-only, hidden: the views (a row matches a view when it is in the row's list), read state, attachments, confidentiality.
    { field: VIEW_FIELD, label: 'View', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: viewOptions } },
    { field: READ_FIELD, label: 'Read', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: [{ label: 'Unread', value: 'Unread' }, { label: 'Read', value: 'Read' }] } },
    { field: 'attachmentsText', label: 'Has attachments', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] } },
    { field: 'visibilityLabel', label: 'Visibility', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: Object.values(VISIBILITY).map((s) => ({ label: s.label, value: s.label })) } },
    // The Reading view's pane (D-65): object type, record, company and last activity, each one ordinary condition.
    { field: KIND_FIELD, label: 'Object type', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: KIND_OPTIONS } },
    { field: RECORD_FIELD, label: 'Record', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: recordOptions } },
    { field: COMPANY_FIELD, label: 'Company', type: 'ShortText', invisible: true, readonly: true, customProps: { treatAsSelectFilter: true, options: companyOptions } },
    { field: ACTIVITY_FIELD, label: 'Last activity within', type: 'MultiSelect', invisible: true, readonly: true, customProps: { options: ACTIVITY_OPTIONS.map((o) => ({ label: o.label, value: o.value })) } },
  ];
}

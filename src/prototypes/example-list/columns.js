// DataGrid columns for the example list. Conventions (docs/5-ui-patterns.md §2, §8): size each column to its widest
// real content plus cell padding; the name column is frozen left and the row action frozen right; a status column
// renders the library StatusChip through the grid's `status-chip` cell slot with the label and tone from status.js;
// filters live in the grid's Filter panel (a column with `treatAsSelectFilter` offers its values).
import { toneToChipStatus } from '~/modules/app/status';

// A cell with only a `center` slot is centred by DecoratedCell; pin the slot `left` and blank the centre text so the
// column value stays available for sorting and filtering without rendering twice.
const BLANK = { type: 'text', componentProps: { value: '' } };

/** The pinned row-action column. `label` is a string or a per-row function. */
export const actionColumn = (label, onClick, width = 90) => ({
  field: 'action',
  label: '',
  type: 'Actions',
  frozen: true,
  width,
  readonly: true,
  cell: { center: BLANK, right: { type: 'button', componentProps: { label, variant: 'text', colorScheme: 'primary', size: 'small' }, onClick } },
});

/** Rows with the display fields the grid sorts and filters on. `moment` is the app's $moment. */
export const submittalRows = (list, moment) =>
  list.map((s) => ({
    ...s,
    statusLabel: s.status.label,
    dueText: moment(s.dueOn).format('D MMM YYYY'),
    submittedText: s.submittedOn ? moment(s.submittedOn).format('D MMM YYYY') : '—',
  }));

/** @param {(row) => void} onOpen  row action handler */
export function submittalColumns(onOpen, statusOptions) {
  return [
    { field: 'number', label: 'NUMBER', type: 'ShortText', width: 110, readonly: true, frozen: true },
    { field: 'title', label: 'TITLE', type: 'ShortText', width: 290, readonly: true },
    { field: 'spec', label: 'SPEC SECTION', type: 'ShortText', width: 300, readonly: true },
    {
      field: 'statusLabel',
      label: 'STATUS',
      type: 'ShortText',
      width: 190,
      readonly: true,
      customProps: { treatAsSelectFilter: true, options: statusOptions },
      cell: {
        left: { type: 'status-chip', componentProps: { label: (r) => r.status.label, status: (r) => toneToChipStatus(r.status.tone), fillStyle: 'outline', type: 'default' } },
        center: BLANK,
      },
    },
    { field: 'ballInCourt', label: 'BALL IN COURT', type: 'ShortText', width: 230, readonly: true },
    { field: 'package', label: 'PACKAGE', type: 'ShortText', width: 120, readonly: true, customProps: { treatAsSelectFilter: true } },
    { field: 'dueText', label: 'DUE', type: 'ShortText', width: 120, readonly: true },
    actionColumn('Open', onOpen),
  ];
}

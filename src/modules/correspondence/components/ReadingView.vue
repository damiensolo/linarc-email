<template>
  <!-- The Email screen's Reading view (D-65): a DataGrid view registered through `customViews`, chosen from the grid
       toolbar's view switcher beside List (the Grid view was removed in review, 2026-11-04). Three panes inside the
       grid's frame: the ViewsPane candidate at the left (views with counts, object type, record, company, date: each a
       condition in the grid's Filter panel, D-30; Drafts and Deleted are folders, D-67: a different row set), the
       ThreadList candidate in the middle under the list bar (D-68: at its left the actions for the ticked rows as icon
       buttons with the design system's Tooltip, Delete · Mark as unread · Mark as read, Restore in Deleted, with the
       count; at its right the segmented control that picks the list's layout, Preview: three lines · List: one line,
       kept per demo session), and the ReadingPane at the right behind the SplitPane candidate's divider (width kept
       per demo session). Every row carries a Checkbox (D-68): ticking never selects, so a thread can be read while
       others are ticked. The grid passes its services as props; the screen passes everything else through
       `readingContext` (provide / inject), since the grid forwards no other props to a view. Below 1024px the list is
       the whole view: the pane and the divider hide and a row opens the thread screen. -->
  <div ref="root" class="rv-root flex min-h-0 w-full flex-1 overflow-hidden rounded-radius-6 border border-border-subtle bg-surface-container">
    <ViewsPane v-if="wide" class="rv-views shrink-0 border-r border-border-subtle" :sections="sections" @change="onPaneChange" />
    <SplitPane :value="ctx.paneWidth" :default-value="640" :min="360" :min-start="280" :stacked="!wide" label="Resize the reading pane" class="min-w-0 flex-1" @input="ctx.setPaneWidth($event)">
      <template #start>
        <div class="flex h-full min-h-0 w-full flex-col">
          <div class="rv-listbar flex shrink-0 items-center justify-between gap-space-8 border-b border-border-subtle px-space-12 py-space-4">
            <!-- the ticked rows' actions (D-68): icon-only, each with the Tooltip; nothing until a row is ticked -->
            <div class="flex min-w-0 items-center gap-space-2" role="toolbar" aria-label="Actions for the ticked conversations">
              <template v-if="checked.length">
                <span class="mr-space-8 whitespace-nowrap font-label text-fontsize-12 leading-lineheight-16 text-text-subtle" role="status">{{ checked.length }} selected</span>
                <Tooltip v-for="a in bulkActions" :key="a.key" :label="a.label" placement="bottom">
                  <Button v-bind="toolProps" :aria-label="a.label" @onClick="bulk(a.key)">
                    <template #leftIcon><component :is="a.icon" aria-hidden="true" /></template>
                  </Button>
                </Tooltip>
              </template>
            </div>
            <SegmentedControl :value="ctx.listLayout" :options="layouts" aria-label="Conversation layout" size="md" class="shrink-0" @input="ctx.setListLayout($event)" />
          </div>
          <ThreadList
            :items="items"
            :layout="ctx.listLayout"
            :selected-id="ctx.selectedId"
            selectable
            :checked-ids="checked"
            :loading="loading"
            :loading-row-count="loadingRowCount"
            :empty-text="ctx.emptyText || 'No email matches.'"
            @select="select"
            @open="open"
            @check="onCheck"
            @check-all="onCheckAll"
          >
            <template #status="{ item }">
              <StatusChip v-if="item.signal" :label="item.signal.label" :status="item.signal.status" fill-style="outline" type="default" :removable="false" class="shrink-0" />
            </template>
          </ThreadList>
        </div>
      </template>
      <template #end>
        <ReadingPane
          :thread-id="ctx.selectedId"
          :role="ctx.role"
          :deleted="ctx.folder === 'deleted'"
          :empty-text="ctx.folder === 'drafts' ? 'A draft opens in the compose panel. Pick one from the list.' : 'Select an email to read it here.'"
          class="border-l border-border-subtle"
          @open="ctx.open($event)"
          @changed="ctx.changed($event)"
          @read="ctx.read($event)"
          @unread="ctx.markUnread($event)"
          @delete="ctx.remove($event)"
          @restore="ctx.restore($event)"
        />
      </template>
    </SplitPane>
  </div>
</template>

<script>
import { Mail, MailOpen, Trash2, ArchiveRestore } from '@development/linarc-icons';
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import ViewsPane from '~/candidates/ViewsPane/ViewsPane.vue';
import ThreadList from '~/candidates/ThreadList/ThreadList.vue';
import SplitPane from '~/candidates/SplitPane/SplitPane.vue';
import { TRIAGE, SLA, toneToChipStatus } from '~/modules/app/status';
import { recordLabel, linkableRecords } from '~/modules/correspondence/data';
import { VIEWS, VIEW_FIELD, KIND_FIELD, RECORD_FIELD, COMPANY_FIELD, ACTIVITY_FIELD, KIND_OPTIONS, ACTIVITY_OPTIONS, isFolderView } from '~/modules/correspondence/emailColumns';
import ReadingPane from './ReadingPane.vue';

const WIDE = 1024;
/** A select's neutral option (SelectV2 shows a placeholder for an empty value, so the neutral choice needs a value). */
const ANY = 'any';

/** The one value a field's condition holds in a flat filter config (null when none, or when the config is grouped). */
function conditionValue(config, field) {
  if ((config.groups || []).length) return null;
  const c = (config.conditions || []).find((x) => x.field === field);
  return c ? c.value : null;
}

export default {
  name: 'ReadingView',
  components: { Button, StatusChip, SegmentedControl, Tooltip, ViewsPane, ThreadList, SplitPane, ReadingPane },
  inject: ['readingContext'],
  props: {
    // What DataGrid passes to every view (index.vue activeViewProps); the rest is ignored here.
    dataSource: { type: Object, required: true },
    filterService: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    loadingRowCount: { type: Number, default: 8 },
  },
  data() {
    return {
      ctx: this.readingContext,
      displayIds: [],
      filterConfig: { conditions: [], groups: [] },
      wide: window.innerWidth >= WIDE,
      checked: [],
      layouts: [
        { label: 'Preview', value: 'preview' },
        { label: 'List', value: 'list' },
      ],
      // the icon-only button, as MessageTools draws its tools
      toolProps: { colorScheme: 'secondary', variant: 'minimal', size: 'medium', nativeType: 'button' },
    };
  },
  computed: {
    /** The inbox rows: the counts and the facets are always the inbox's, whichever folder is shown (D-67). */
    inboxRows() {
      return this.ctx.inboxRows || [];
    },
    /** The list's rows in the grid's display order (search, filter and sort applied). */
    items() {
      return this.displayIds.map((id) => this.dataSource.getRowById(id)).filter(Boolean).map((r) => ({
        id: r.id,
        from: r.fromName,
        time: r.timeText,
        subject: r.subject,
        snippet: r.snippet,
        hasAttachments: r.hasAttachments,
        unread: !!r.unread,
        signal: this.signalFor(r),
      }));
    },
    /** What the ticked rows can have done to them, by folder (the same set as the table's selection toolbar, D-67). */
    bulkActions() {
      const unread = { key: 'unread', label: 'Mark as unread', icon: Mail };
      const read = { key: 'read', label: 'Mark as read', icon: MailOpen };
      if (this.ctx.folder === 'deleted') return [unread, read, { key: 'restore', label: 'Restore', icon: ArchiveRestore }];
      if (this.ctx.folder === 'drafts') return [{ key: 'delete', label: 'Discard draft', icon: Trash2 }];
      return [unread, read, { key: 'delete', label: 'Delete', icon: Trash2 }];
    },
    kindsValue() {
      const v = conditionValue(this.filterConfig, KIND_FIELD);
      return Array.isArray(v) ? v : v ? [v] : [];
    },
    sections() {
      const rows = this.inboxRows;
      const counts = this.ctx.counts || {};
      const count = (test) => rows.filter(test).length;
      const kinds = this.kindsValue;
      const kindWord = kinds.length === 1 ? (KIND_OPTIONS.find((k) => k.value === kinds[0]) || {}).label : 'record';
      // Records with email, narrowed to the checked kinds; the first option keeps the whole set.
      const withMail = rows.filter((r) => !kinds.length || r[KIND_FIELD].some((k) => kinds.includes(k)));
      const kindOf = (id) => (linkableRecords().find((r) => r.value === id) || {}).type;
      const recordIds = [...new Set(withMail.flatMap((r) => r[RECORD_FIELD]))].filter((id) => !kinds.length || kinds.includes(kindOf(id)));
      const companies = [...new Set(rows.map((r) => r[COMPANY_FIELD]))].filter((c) => c && c !== '—').sort();
      return [
        {
          id: VIEW_FIELD,
          label: 'Views',
          type: 'list',
          value: this.ctx.folder && this.ctx.folder !== 'inbox' ? this.ctx.folder : this.viewValue(),
          items: VIEWS.map((v) => ({ id: v.id, label: v.label, count: v.folder ? counts[v.id] || 0 : count(v.test), tone: v.tone })),
        },
        {
          id: KIND_FIELD,
          label: 'Tag · Object type',
          type: 'checks',
          value: kinds,
          items: KIND_OPTIONS.map((k) => ({ id: k.value, label: k.label, count: count((r) => r[KIND_FIELD].includes(k.value)) })),
        },
        {
          id: RECORD_FIELD,
          label: 'Object ID',
          type: 'select',
          value: conditionValue(this.filterConfig, RECORD_FIELD) || ANY,
          options: [{ value: ANY, label: `Any ${kindWord} with email (${recordIds.length})` }, ...recordIds.map((id) => ({ value: id, label: recordLabel(id) }))],
          helper: 'Lists only records that have email.',
        },
        {
          id: COMPANY_FIELD,
          label: 'Sender company',
          type: 'select',
          value: conditionValue(this.filterConfig, COMPANY_FIELD) || ANY,
          options: [{ value: ANY, label: 'All companies' }, ...companies.map((c) => ({ value: c, label: c }))],
        },
        {
          id: ACTIVITY_FIELD,
          label: 'Date',
          type: 'select',
          value: conditionValue(this.filterConfig, ACTIVITY_FIELD) || ANY,
          options: [{ value: ANY, label: 'Any time' }, ...ACTIVITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))],
        },
      ];
    },
  },
  watch: {
    /** A row that left the list (filtered, deleted, moved folder) is no longer ticked. */
    items(rows) {
      const ids = new Set(rows.map((r) => r.id));
      if (this.checked.some((id) => !ids.has(id))) this.checked = this.checked.filter((id) => ids.has(id));
    },
    'ctx.folder'() {
      this.checked = [];
    },
  },
  created() {
    this.syncDisplay();
    this.syncFilter();
    this.dataSource.on('display-change', this.syncDisplay);
    this.dataSource.on('rows-reset', this.syncDisplay);
    this.filterService.on('filter-change', this.syncFilter);
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    this.dataSource.off('display-change', this.syncDisplay);
    this.dataSource.off('rows-reset', this.syncDisplay);
    this.filterService.off('filter-change', this.syncFilter);
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    onResize() {
      this.wide = window.innerWidth >= WIDE;
    },
    syncDisplay() {
      this.displayIds = this.dataSource.getDisplayIds().slice();
    },
    syncFilter() {
      this.filterConfig = this.filterService.getFilterConfig();
    },
    /** One signal per row (D-17): Overdue (red) wins, then Needs action; waiting, resolved and draft rows show nothing. */
    signalFor(r) {
      if (r.sla === 'overdue') return { label: SLA.overdue.label, status: toneToChipStatus(SLA.overdue.tone, { strong: true }) };
      if (r.triage === 'needs_action') return { label: TRIAGE.needs_action.label, status: toneToChipStatus(TRIAGE.needs_action.tone) };
      return null;
    },
    /** The view the filter expresses: 'all' when none, the view when one `is` condition, null when more (as the segments). */
    viewValue() {
      const conds = this.filterConfig.conditions || [];
      if ((this.filterConfig.groups || []).length) return null;
      const views = conds.filter((c) => c.field === VIEW_FIELD);
      if (!views.length) return 'all';
      if (views.length > 1) return null;
      const { operator, value } = views[0];
      if (operator === 'is') return value;
      if (operator === 'isAnyOf' && Array.isArray(value) && value.length === 1) return value[0];
      return null;
    },
    /**
     * A pane change becomes one condition on its field (none when cleared), the other conditions kept (D-30). A folder
     * (Drafts, Deleted) is not a condition: the screen swaps the rows and drops the view condition (D-67).
     */
    onPaneChange({ id, value }) {
      if (id === VIEW_FIELD && isFolderView(value)) {
        this.ctx.setFolder(value);
        return;
      }
      if (id === VIEW_FIELD && this.ctx.folder !== 'inbox') this.ctx.setFolder('inbox');
      const config = this.filterConfig;
      const others = (config.conditions || []).filter((c) => c.field !== id);
      let next = others;
      if (id === VIEW_FIELD) {
        if (value !== 'all') next = [...others, { field: id, operator: 'is', value, join: 'and' }];
      } else if (Array.isArray(value)) {
        if (value.length) next = [...others, { field: id, operator: 'isAnyOf', value, join: 'and' }];
      } else if (value && value !== ANY) {
        next = [...others, { field: id, operator: 'is', value, join: 'and' }];
      }
      this.ctx.setFilters((config.groups || []).length ? { conditions: [], groups: config.groups } : next);
    },
    select(id) {
      if (this.wide) this.ctx.select(id);
      else this.ctx.open(id);
    },
    open(id) {
      this.ctx.open(id);
    },
    onCheck({ id, checked }) {
      this.checked = checked ? [...this.checked.filter((x) => x !== id), id] : this.checked.filter((x) => x !== id);
    },
    /** The List layout's header Checkbox (D-71): every shown row, or none. */
    onCheckAll(checked) {
      this.checked = checked ? this.items.map((i) => i.id) : [];
    },
    /** One of the bar's actions on every ticked row; the screen does the work, the ticks clear. */
    bulk(key) {
      const ids = [...this.checked];
      this.checked = [];
      this.ctx.bulk(key, ids);
    },
  },
};
</script>

<style scoped>
/* The pane is as wide as the reference draws it; no width token exists for side panes (needs-token, as SlideOverPanel). */
.rv-views {
  width: 240px;
}
</style>

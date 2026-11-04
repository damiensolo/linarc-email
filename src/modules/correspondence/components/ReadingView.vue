<template>
  <!-- The Email screen's Reading view (D-65): a DataGrid view registered through `customViews`, chosen from the grid
       toolbar's view switcher beside List (the Grid view was removed in review, 2026-11-04). Three panes inside the grid's frame: the ViewsPane candidate at the
       left (views with counts, object type, record, company, date: each a condition in the grid's Filter panel, D-30),
       the ThreadList candidate in the middle (the grid's display order: the toolbar's search, sort and filters apply),
       and the ReadingPane at the right behind the SplitPane candidate's divider (width kept per demo session).
       The grid passes its services as props; the screen passes everything else through `readingContext` (provide /
       inject), since the grid forwards no other props to a view. Below 1024px the list is the whole view: the pane and
       the divider hide and a row opens the thread screen. -->
  <div ref="root" class="rv-root flex min-h-0 w-full flex-1 overflow-hidden rounded-radius-6 border border-border-subtle bg-surface-container">
    <ViewsPane v-if="wide" class="rv-views shrink-0 border-r border-border-subtle" :sections="sections" @change="onPaneChange" />
    <SplitPane :value="ctx.paneWidth" :default-value="640" :min="360" :min-start="280" :stacked="!wide" label="Resize the reading pane" class="min-w-0 flex-1" @input="ctx.setPaneWidth($event)">
      <template #start>
        <ThreadList :items="items" :selected-id="ctx.selectedId" :loading="loading" :loading-row-count="loadingRowCount" empty-text="No email matches." @select="select" @open="ctx.open($event)">
          <template #status="{ item }">
            <StatusChip v-if="item.signal" :label="item.signal.label" :status="item.signal.status" fill-style="outline" type="default" :removable="false" class="shrink-0" />
          </template>
        </ThreadList>
      </template>
      <template #end>
        <ReadingPane :thread-id="ctx.selectedId" :role="ctx.role" class="border-l border-border-subtle" @open="ctx.open($event)" @changed="ctx.changed($event)" />
      </template>
    </SplitPane>
  </div>
</template>

<script>
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import ViewsPane from '~/candidates/ViewsPane/ViewsPane.vue';
import ThreadList from '~/candidates/ThreadList/ThreadList.vue';
import SplitPane from '~/candidates/SplitPane/SplitPane.vue';
import { TRIAGE, SLA, toneToChipStatus } from '~/modules/app/status';
import { recordLabel, linkableRecords } from '~/modules/correspondence/data';
import { VIEWS, VIEW_FIELD, KIND_FIELD, RECORD_FIELD, COMPANY_FIELD, ACTIVITY_FIELD, KIND_OPTIONS, ACTIVITY_OPTIONS } from '~/modules/correspondence/emailColumns';
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
  components: { StatusChip, ViewsPane, ThreadList, SplitPane, ReadingPane },
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
    };
  },
  computed: {
    rows() {
      return this.ctx.rows || [];
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
        signal: this.signalFor(r),
      }));
    },
    kindsValue() {
      const v = conditionValue(this.filterConfig, KIND_FIELD);
      return Array.isArray(v) ? v : v ? [v] : [];
    },
    sections() {
      const rows = this.rows;
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
          value: this.viewValue(),
          items: VIEWS.map((v) => ({ id: v.id, label: v.label, count: count(v.test), tone: v.tone })),
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
    /** One signal per row (D-17): Overdue (red) wins, then Needs action; waiting and resolved rows show nothing. */
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
    /** A pane change becomes one condition on its field (none when cleared), the other conditions kept (D-30). */
    onPaneChange({ id, value }) {
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
  },
};
</script>

<style scoped>
/* The pane is as wide as the reference draws it; no width token exists for side panes (needs-token, as SlideOverPanel). */
.rv-views {
  width: 240px;
}
</style>

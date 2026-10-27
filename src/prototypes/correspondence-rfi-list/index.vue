<template>
  <!-- RFIs › All RFIs: the RFI log, a stand-in for the product's RFI list (docs/correspondence/screens.md §1). List
       pattern (5-ui-patterns.md §1, §8): AppShell with Title Bar / Page, a SegmentedControl of views (All · Open ·
       Answered · Closed · Overdue) cross-linked with the grid's Filter panel (D-30), a meta line with LoadStatus, the
       DataGrid in a LoadRegion (D-24). Role (D-41): internal roles see every RFI; a guest the ones they are on. A row
       (or its Open action) opens the RFI with Email (correspondence-context-rfi); the rail's All RFIs lands here. -->
  <AppShell screen="rfis" title="RFIs">
    <template #content>
      <div class="flex h-full min-h-0 flex-col gap-space-16">
        <div class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8" aria-label="Views">
          <div class="max-w-full overflow-x-auto">
            <SegmentedControl :value="view" :options="viewOptions" aria-label="RFI view" size="md" @input="pickView" />
          </div>
          <LoadStatus :load="load" @retry="fetch">{{ summary }}</LoadStatus>
        </div>

        <LoadRegion v-slot="{ skeleton }" class="min-h-0 w-full min-w-0 flex-1" :load="load" content-loads @retry="fetch">
          <div v-if="load.hasData && !rows.length" class="pt-space-16 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
            No RFIs yet. RFIs created from a drawing, an email or the Create RFI form appear here.
          </div>
          <DataGrid
            v-else
            ref="grid"
            class="min-h-0 w-full min-w-0 flex-1"
            :data="rows"
            :loading="skeleton"
            :header="columns"
            :quick-filters="quickFilters"
            id-field="id"
            :views="['grid', 'list']"
            default-view="list"
            :views-feature-enabled="true"
            :view-tabs="[]"
            :show-print="true"
            :show-save-template="false"
            :application-should-handle-download="true"
            :row-height="40"
            height="100%"
            @filter-change="onFilterChange"
            @row-click="openRow"
          />
        </LoadRegion>
      </div>
    </template>
  </AppShell>
</template>

<script>
import DataGrid from '@/components/DataGrid/index.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { go } from '~/modules/app/router';
import { RFIS, ROLES, currentRole, setRole, getRecord, inboundSandbox } from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';
import { VIEWS, VIEW_FIELD, rfiRows, rfiColumns, rfiQuickFilters, visibleRfis } from '~/modules/correspondence/rfiColumns';

/** The single view a filter config expresses ('all' when it has no view condition), or null when it is more. */
function viewOf(config) {
  if ((config.groups || []).length) return null;
  const conds = config.conditions || [];
  const views = conds.filter((c) => c.field === VIEW_FIELD);
  if (!views.length) return conds.length ? null : 'all';
  if (views.length > 1 || conds.length > 1) return null;
  const { operator, value } = views[0];
  if (operator === 'is') return value;
  if (operator === 'isAnyOf' && Array.isArray(value) && value.length === 1) return value[0];
  return null;
}

export default {
  name: 'CorrespondenceRfiList',
  prototype: {
    title: 'RFIs › All RFIs',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4196-3492',
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { AppShell, DataGrid, SegmentedControl, LoadRegion, LoadStatus },
  data() {
    return {
      role: currentRole(),
      view: 'all',
      viewOptions: VIEWS.map((v) => ({ label: v.label, value: v.id })),
      quickFilters: rfiQuickFilters,
      rows: [],
      shown: 0,
      filtered: false,
      load: createLoad({ label: 'RFIs' }),
    };
  },
  computed: {
    summary() {
      if (!this.load.hasData) return '';
      const n = this.filtered ? this.shown : this.rows.length;
      const noun = this.rows.length === 1 ? 'RFI' : 'RFIs';
      return n === this.rows.length ? `${n} ${noun}` : `${n} of ${this.rows.length} ${noun}`;
    },
    columns() {
      return rfiColumns((row) => this.open(row));
    },
  },
  created() {
    this.fetch();
  },
  beforeDestroy() {
    this.load.destroy();
  },
  methods: {
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => rfiRows(visibleRfis(RFIS.map((r) => getRecord(r.id)), this.role), this.role, this.$moment), { signal }),
        (rows) => {
          this.rows = rows;
          this.$nextTick(() => {
            this.syncCount();
            if (this.view !== 'all') this.pickView(this.view);
          });
        },
      );
    },
    pickView(id) {
      this.view = id;
      const grid = this.$refs.grid;
      if (!grid) return;
      const config = grid.getFilterService().getFilterConfig();
      if (viewOf(config) === id) return;
      const others = (config.conditions || []).filter((c) => c.field !== VIEW_FIELD);
      const next = id === 'all' ? others : [...others, { field: VIEW_FIELD, operator: 'is', value: id, join: 'and' }];
      grid.setFilters((config.groups || []).length ? { conditions: [], groups: config.groups } : next);
    },
    onFilterChange({ filterConfig }) {
      const conds = filterConfig.conditions || [];
      const viewConds = conds.filter((c) => c.field === VIEW_FIELD && c.operator === 'is');
      if (viewConds.length > 1 && !(filterConfig.groups || []).length) {
        const keep = viewConds[viewConds.length - 1];
        this.$refs.grid.setFilters(conds.filter((c) => c.field !== VIEW_FIELD || c === keep));
        return;
      }
      this.view = viewOf(filterConfig);
      this.filtered = conds.length + (filterConfig.groups || []).length > 0;
      this.$nextTick(this.syncCount);
    },
    syncCount() {
      const grid = this.$refs.grid;
      this.shown = grid ? grid.getDisplayRowCount() : this.rows.length;
    },
    open(row) {
      if (row) go('rfi', row.id);
    },
    openRow({ row }) {
      this.open(row);
    },
  },
};
</script>

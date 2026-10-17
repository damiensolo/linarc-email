<template>
  <!-- Example list screen: the "list / dashboard" page pattern (docs/5-ui-patterns.md §1): AppShell with the default
       Title Bar / Page, a primary action, a meta line with LoadStatus, and a DataGrid inside a LoadRegion.
       Loading (§6): rows come from a (mock) request; the shell, title bar and grid header stay put. First load: skeleton
       rows only if the answer takes > 200ms; a refresh keeps the rows with "Updating…". Try the sandbox Latency select.
       Filtering (§8): through the grid's Filter panel; Status and Package offer their values. -->
  <AppShell screen="list" title="Submittals">
    <template #header-actions>
      <Button label="New submittal" color-scheme="primary" variant="solid" size="medium" @onClick="create" />
    </template>

    <template #content>
      <div class="flex h-full min-h-0 flex-col gap-space-16">
        <div class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
          <LoadStatus :load="load" @retry="fetch">{{ summary }}</LoadStatus>
        </div>

        <LoadRegion v-slot="{ skeleton }" class="min-h-0 w-full min-w-0 flex-1" :load="load" content-loads @retry="fetch">
          <DataGrid
            ref="grid"
            class="min-h-0 w-full min-w-0 flex-1"
            :data="rows"
            :loading="skeleton"
            :header="columns"
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
            @filter-change="syncCount"
            @row-click="openRow"
          />
        </LoadRegion>
      </div>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import DataGrid from '@/components/DataGrid/index.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { go } from '~/modules/app/router';
import { SUBMITTAL } from '~/modules/app/status';
import { submittals } from './data';
import { submittalRows, submittalColumns } from './columns';

export default {
  name: 'ExampleList',
  prototype: { title: 'Submittals › List', figma: '' },
  components: { AppShell, Button, DataGrid, LoadRegion, LoadStatus },
  data() {
    return {
      rows: [],
      shown: 0,
      filtered: false,
      load: createLoad({ label: 'submittals' }),
    };
  },
  computed: {
    summary() {
      // Nothing until the first answer: a "0 submittals" before loading would be a false result.
      if (!this.load.hasData) return '';
      const n = this.filtered ? this.shown : this.rows.length;
      return n === this.rows.length ? `${n} submittals` : `${n} of ${this.rows.length} submittals`;
    },
    columns() {
      const statusOptions = Object.values(SUBMITTAL).map((s) => ({ label: s.label, value: s.label }));
      return submittalColumns((row) => this.openRow({ row }), statusOptions);
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
        (signal) => mockRequest(() => submittalRows(submittals(), this.$moment), { signal }),
        (rows) => {
          this.rows = rows;
        },
      );
    },
    syncCount({ filterConfig } = {}) {
      const grid = this.$refs.grid;
      this.filtered = Boolean(filterConfig && ((filterConfig.conditions || []).length || (filterConfig.groups || []).length));
      this.$nextTick(() => {
        this.shown = grid ? grid.getDisplayRowCount() : this.rows.length;
      });
    },
    openRow({ row }) {
      if (row) go('detail', row.id);
    },
    create() {
      // The create screen isn't built in the template; go() to an unbuilt screen does nothing (router.js).
      go('create-submittal');
    },
  },
};
</script>

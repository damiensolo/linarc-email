<template>
  <!-- Notifications › All notifications: the full page for triage at scale (docs/notifications/screens.md §2, spec §6).
       List pattern (5-ui-patterns.md §1): the shell with no rail (the page belongs to no tool, Q-A2, D-52), Title Bar /
       Page, a scope SegmentedControl (My responsibilities · My team · Watching), the views SegmentedControl cross-linked
       with the grid's Filter panel (D-30: a view other than All is one "View is …" condition; the views and Critical,
       Overdue, Not acknowledged, Snoozed and the sources are quick filters), a meta line with LoadStatus, the DataGrid
       in a LoadRegion (D-24). Rows are the viewer's projected items (D-55); the Team scope lists each internal person's
       open obligations with a Person column. Row checkboxes drive one bulk action, Acknowledge, on rows the viewer may
       acknowledge; the grid's own selection toolbar (cut / copy / paste) stays off. A row opens its card in a
       SlideOverPanel (the card's actions and history); the row's action button opens the record. -->
  <AppShell screen="notifications" title="Notifications">
    <template #header-actions>
      <Button v-if="selected.length" :label="`Acknowledge ${selected.length}`" color-scheme="primary" variant="solid" size="medium" @onClick="acknowledgeSelected" />
    </template>

    <template #content>
      <div class="flex h-full min-h-0 flex-col gap-space-16">
        <div class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
          <div v-if="role.internal" class="max-w-full overflow-x-auto">
            <SegmentedControl :value="scope" :options="scopeOptions" aria-label="Scope" size="md" @input="pickScope" />
          </div>
          <div class="max-w-full overflow-x-auto">
            <SegmentedControl :value="view" :options="viewOptions" aria-label="View" size="md" @input="pickView" />
          </div>
          <LoadStatus :load="load" @retry="fetch">{{ summary }}</LoadStatus>
        </div>

        <LoadRegion v-slot="{ skeleton }" class="min-h-0 w-full min-w-0 flex-1" :load="load" content-loads @retry="fetch">
          <div v-if="load.hasData && !rows.length" class="pt-space-16 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
            {{ emptyText }}
          </div>
          <DataGrid
            v-else
            ref="grid"
            :key="scope"
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
            :row-selectable="canSelect"
            :show-selection-toolbar="false"
            :selected-row-ids="selected"
            @selection-change="onSelection"
            @filter-change="onFilterChange"
            @row-click="openRow"
          />
        </LoadRegion>
      </div>

      <!-- One notification: its card with every action and its history (spec §8, "View history"). -->
      <SlideOverPanel :open="!!detail" title="Notification" size="sm" @close="detail = null">
        <ItemCard v-if="detail" :item="detail" @open="detail = null" @changed="onChanged" />
      </SlideOverPanel>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import DataGrid from '@/components/DataGrid/index.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { go } from '~/modules/app/router';
import { ROLES, currentRole, setRole } from '~/modules/correspondence/data';
import { itemsFor, teamItems, sortItems, acknowledge, markSeen, eventsSandbox } from '~/modules/notifications/data';
import { VIEWS, VIEW_FIELD, notificationRows, notificationColumns, notificationQuickFilters } from '~/modules/notifications/listColumns';
import ItemCard from '~/modules/notifications/components/ItemCard.vue';

const MINE = ['assigned', 'fallback', 'covering', 'requester'];
const EMPTY = {
  mine: 'Nothing is assigned to you or waiting on your follow-up.',
  team: 'Nobody on the team has an open obligation.',
  watching: "You're not watching anything.",
};

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
  name: 'NotificationsList',
  prototype: {
    title: 'Notifications › All notifications',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3683',
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    events: eventsSandbox,
  },
  components: { AppShell, Button, DataGrid, SegmentedControl, LoadRegion, LoadStatus, SlideOverPanel, ItemCard },
  data() {
    return {
      role: currentRole(),
      scope: 'mine',
      scopeOptions: [
        { label: 'My responsibilities', value: 'mine' },
        { label: 'My team', value: 'team' },
        { label: 'Watching', value: 'watching' },
      ],
      view: 'needs_action',
      viewOptions: VIEWS.map((v) => ({ label: v.label, value: v.id })),
      quickFilters: notificationQuickFilters,
      rows: [],
      shown: 0,
      filtered: false,
      selected: [],
      detail: null,
      load: createLoad({ label: 'notifications' }),
    };
  },
  computed: {
    summary() {
      if (!this.load.hasData) return '';
      const n = this.filtered ? this.shown : this.rows.length;
      const noun = this.rows.length === 1 ? 'notification' : 'notifications';
      return n === this.rows.length ? `${n} ${noun}` : `${n} of ${this.rows.length} ${noun}`;
    },
    columns() {
      return notificationColumns((row) => this.onAction(row), { team: this.scope === 'team' });
    },
    emptyText() {
      return EMPTY[this.scope];
    },
  },
  created() {
    this.fetch();
  },
  beforeDestroy() {
    this.load.destroy();
  },
  methods: {
    /** The rows of the current scope, as grid rows. */
    produce() {
      if (this.scope === 'team') {
        return teamItems(this.role).flatMap((p) => notificationRows(p.items, this.$moment, { person: p.personId }));
      }
      const mine = itemsFor(this.role).filter((it) => (this.scope === 'mine' ? MINE.includes(it.routing) : ['watching', 'oversight'].includes(it.routing)));
      return notificationRows(sortItems(mine), this.$moment);
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => this.produce(), { signal }),
        (rows) => {
          this.rows = rows;
          this.selected = [];
          this.$nextTick(() => {
            this.syncCount();
            if (this.view !== 'all') this.pickView(this.view);
          });
        },
      );
    },
    /** Only rows the viewer may acknowledge take a checkbox (a stable method, as the grid asks). */
    canSelect(row) {
      return !!row.canAcknowledge;
    },
    onSelection({ selectedRowIds }) {
      this.selected = [...selectedRowIds];
    },
    acknowledgeSelected() {
      this.selected.forEach((key) => acknowledge(key));
      this.fetch();
    },
    pickScope(id) {
      if (id === this.scope) return;
      this.scope = id;
      this.view = 'all';
      this.filtered = false;
      this.fetch();
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
    /** The row's action button: the record (Seen, never acknowledged). */
    onAction(row) {
      if (!row) return;
      markSeen(row.key);
      go(row.action.screen, row.action.id);
    },
    openRow({ row }) {
      if (row) this.detail = this.rows.find((r) => r.key === row.key) || null;
    },
    onChanged() {
      this.fetch();
      if (this.detail) this.detail = this.produce().find((r) => r.key === this.detail.key) || null;
    },
  },
};
</script>

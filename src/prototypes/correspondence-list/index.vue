<template>
  <!-- Communication › Email: the project Email screen, upgraded (docs/correspondence/spec.md §9, screens.md §1; D-40).
       List pattern (5-ui-patterns.md §1): AppShell with Title Bar / Page, a SegmentedControl of views cross-linked with
       the grid's Filter panel (D-30: a view other than All is one "View is …" condition; the views are quick filters;
       editing that condition in the panel moves the segment; a filter that is none of the views selects no segment),
       a meta line with LoadStatus, and the DataGrid in a LoadRegion (D-24). Role (D-41): the viewer from the sandbox
       role switcher decides which threads, notes and cost are visible; the screen remounts on change.
       Row action: Open → the thread; on an Unmatched row, Link to record → a short ModalV2 (spec §4).
       Compose (today's primary action) opens the compose panel with no record pinned; sending opens the new thread. -->
  <AppShell screen="email" title="Email">
    <template #header-actions>
      <Button label="Compose" color-scheme="primary" variant="solid" size="medium" @onClick="composing = true" />
    </template>

    <template #content>
      <div class="flex h-full min-h-0 flex-col gap-space-16">
        <div class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8" aria-label="Views">
          <!-- Five segments overflow a 390px screen: the strip scrolls in its own box (as the stepper, F-070). -->
          <div class="max-w-full overflow-x-auto">
            <SegmentedControl :value="view" :options="viewOptions" aria-label="Email view" size="md" @input="pickView" />
          </div>
          <LoadStatus :load="load" @retry="fetch">{{ summary }}</LoadStatus>
        </div>

        <LoadRegion v-slot="{ skeleton }" class="min-h-0 w-full min-w-0 flex-1" :load="load" content-loads @retry="fetch">
          <!-- Empty (spec §11): plain text, no illustration; the project address is the way mail gets here. -->
          <div v-if="load.hasData && !rows.length" class="font-label text-fontsize-14 leading-lineheight-20 text-text-subtle pt-space-16">
            No email yet. Mail sent from drawings and records, and mail sent to {{ project.inboundAddress }}, appears here.
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

      <!-- Link to record (spec §4): a short single-step task, so a compact modal (5-ui-patterns.md §1), inside #content. -->
      <ModalV2
        :is-visible="!!linking"
        title="Link to record"
        :title-description="linking ? linking.subject : ''"
        primary-label="Link"
        secondary-label="Cancel"
        :primary-disabled="!linkTarget || linkBusy"
        :secondary-disabled="linkBusy"
        :close-on-primary-click="false"
        @onPrimaryClick="confirmLink"
        @closeModal="closeLink"
      >
        <template #modal-body>
          <div class="flex flex-col gap-space-16 font-label">
            <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
              This mail arrived at {{ project.inboundAddress }} and matches no thread. Linking it to a record puts it on that record's Email tab and in its history.
            </p>
            <SelectV2 v-model="linkTarget" label="Record" placeholder="Choose a record" :options="linkOptions" :visible-item-count="8" />
          </div>
        </template>
      </ModalV2>

      <ComposePanel :open="composing" :role="role" @close="composing = false" @sent="onSent" />
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import DataGrid from '@/components/DataGrid/index.vue';
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { go } from '~/modules/app/router';
import { PROJECT, ROLES, currentRole, setRole, visibleThreads, inboundSandbox, linkableRecords, linkThreadToRecord } from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';
import { VIEWS, VIEW_FIELD, emailRows, emailColumns, emailQuickFilters } from '~/modules/correspondence/emailColumns';
import ComposePanel from '~/modules/correspondence/components/ComposePanel.vue';

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
  name: 'CorrespondenceList',
  prototype: {
    title: 'Communication › Email',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4090-93',
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { AppShell, Button, DataGrid, ModalV2, SelectV2, SegmentedControl, LoadRegion, LoadStatus, ComposePanel },
  data() {
    return {
      project: PROJECT,
      role: currentRole(),
      view: 'all',
      viewOptions: VIEWS.map((v) => ({ label: v.label, value: v.id })),
      quickFilters: emailQuickFilters,
      rows: [],
      shown: 0,
      filtered: false,
      load: createLoad({ label: 'email' }),
      linking: null,
      linkTarget: null,
      linkBusy: false,
      linkOptions: linkableRecords(),
      composing: false,
    };
  },
  computed: {
    summary() {
      // Nothing until the first answer: a "0 threads" before loading would be a false result.
      if (!this.load.hasData) return '';
      const n = this.filtered ? this.shown : this.rows.length;
      const noun = this.rows.length === 1 ? 'thread' : 'threads';
      return n === this.rows.length ? `${n} ${noun}` : `${n} of ${this.rows.length} ${noun}`;
    },
    columns() {
      return emailColumns((row) => this.onAction(row), this.role);
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
        (signal) => mockRequest(() => emailRows(visibleThreads(this.role), this.$moment), { signal }),
        (rows) => {
          this.rows = rows;
          this.$nextTick(() => {
            this.syncCount();
            // A view chosen before the answer arrived (or kept across a refresh) is re-applied to the grid.
            if (this.view !== 'all') this.pickView(this.view);
          });
        },
      );
    },
    /** Segment → grid: replace any view condition with this view's (none for All), keep the rest. */
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
    /** Grid → segment: the panel (quick filter, edit, Clear all) moves the segment; a mixed filter selects none. */
    onFilterChange({ filterConfig }) {
      const conds = filterConfig.conditions || [];
      const viewConds = conds.filter((c) => c.field === VIEW_FIELD && c.operator === 'is');
      // Views are one choice, as in the segmented control: a second view quick filter replaces the first.
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
    onAction(row) {
      if (!row) return;
      if (row.unmatched) this.startLink(row);
      else go('thread', row.id);
    },
    openRow({ row }) {
      if (row) go('thread', row.id);
    },
    startLink(row) {
      this.linkTarget = null;
      this.linking = row;
    },
    closeLink() {
      if (this.linkBusy) return;
      this.linking = null;
    },
    confirmLink() {
      if (!this.linking || !this.linkTarget) return;
      this.linkBusy = true;
      const threadId = this.linking.id;
      linkThreadToRecord(threadId, this.linkTarget, { actorId: this.role.personId });
      this.linkBusy = false;
      this.linking = null;
      // The row now has a record: refresh keeps the rows on screen with "Updating…" (D-24), then shows the change.
      this.fetch();
    },
    /** A message sent from here starts a thread; opening it is the acknowledgement. */
    onSent(thread) {
      this.composing = false;
      go('thread', thread.id);
    },
  },
};
</script>

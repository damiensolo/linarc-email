<template>
  <!-- Notifications (the bell): the drawer over the current page (docs/notifications/screens.md §1, spec §2, §6). The page
       and any unsaved work stay underneath. Header: the title, the Critical count as its badge; under it the scope
       switch and the critical state. Tabs Needs action · Waiting · Updates · All with explainable counts; the Critical
       section first in every tab; cards (ItemCard); the snoozed subtotal; footer View all · Preferences. Empty, loading
       and error states per spec §12. Items are derived per viewer (itemsFor), so a change made on a card shows at once. -->
  <SlideOverPanel :open="open" title="Notifications" :badge="counts.critical ? `${counts.critical} critical` : ''" size="md" @close="$emit('close')" @opened="fetch">
    <template #header-meta>
      <div class="flex flex-wrap items-center justify-between gap-space-8">
        <SegmentedControl v-model="scope" :options="scopes" size="md" aria-label="Projects" />
        <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ criticalLine }}</span>
      </div>
    </template>

    <TabNavigation v-model="view" :tabs="tabs" />
    <LoadRegion :load="load" class="pt-space-16" @retry="fetch">
      <template #skeleton>
        <div class="flex flex-col gap-space-16" aria-hidden="true">
          <div v-for="n in 3" :key="n" class="flex gap-space-8">
            <Skeleton shape="circle" class="h-space-28 w-space-28 shrink-0" />
            <div class="flex flex-1 flex-col gap-space-8"><Skeleton size="sm" class="w-space-124" /><Skeleton size="sm" class="w-full" /></div>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-space-16">
        <!-- Critical first, whatever the tab (spec §6): the viewer's own and, for the PM, project oversight -->
        <section v-if="criticals.length && view !== 'updates'" aria-labelledby="ntf-critical">
          <h3 id="ntf-critical" class="m-0 pb-space-8 font-label text-fontsize-12 font-bold uppercase leading-lineheight-16 tracking-letterspacing-4 text-text-subtle">Critical</h3>
          <ol class="m-0 flex list-none flex-col gap-space-8 p-0">
            <li v-for="it in criticals" :key="it.key"><ItemCard :item="it" @open="$emit('close')" @changed="refresh" /></li>
          </ol>
        </section>

        <section :aria-label="currentTab.label">
          <h3 v-if="criticals.length && view !== 'updates' && rows.length" class="m-0 pb-space-8 font-label text-fontsize-12 font-bold uppercase leading-lineheight-16 tracking-letterspacing-4 text-text-subtle">{{ currentTab.label }}</h3>
          <ol v-if="rows.length" class="m-0 flex list-none flex-col gap-space-8 p-0">
            <li v-for="it in rows" :key="it.key"><ItemCard :item="it" @open="$emit('close')" @changed="refresh" /></li>
          </ol>
          <p v-else class="m-0 py-space-16 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
            {{ emptyText }}
            <Button v-if="view === 'needs_action' && counts.waiting" label="Check Waiting" variant="text" color-scheme="primary" size="small" @onClick="view = 'waiting'" />
          </p>
          <p v-if="counts.snoozed && view === 'needs_action'" class="m-0 pt-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
            {{ counts.snoozed }} snoozed · still in your count
            <Button label="Show" variant="text" color-scheme="primary" size="small" @onClick="view = 'all'" />
          </p>
        </section>
      </div>
    </LoadRegion>

    <template #footer>
      <div class="flex items-center gap-space-8">
        <Button v-if="view === 'updates' && counts.updates" label="Mark updates reviewed" color-scheme="secondary" variant="text" size="small" @onClick="reviewed" />
      </div>
      <div class="flex items-center gap-space-8">
        <Button v-if="prefsBuilt" label="Preferences" color-scheme="secondary" variant="text" size="small" @onClick="goTo('notificationsPrefs')" />
        <Button v-if="listBuilt" label="View all" color-scheme="primary" variant="text" size="small" @onClick="goTo('notifications')" />
      </div>
    </template>
  </SlideOverPanel>
</template>

<script>
import TabNavigation from '@/componentsV2/TabNavigation/TabNavigation.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import Button from '@/components/Button/Button.vue';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import { currentRole, PROJECT } from '~/modules/correspondence/data';
import { VIEWS, viewItems, criticalItems, countsFor, markUpdatesReviewed } from '~/modules/notifications/data';
import { go, isBuilt } from '~/modules/app/router';
import ItemCard from './ItemCard.vue';

const EMPTY = {
  needs_action: 'Nothing needs your action.',
  waiting: "You're not waiting on anyone.",
  updates: 'No updates since you last looked.',
  all: 'No notifications yet.',
};

export default {
  name: 'NotificationsDrawer',
  components: { TabNavigation, SegmentedControl, Button, SlideOverPanel, LoadRegion, Skeleton, ItemCard },
  props: {
    open: { type: Boolean, default: false },
  },
  data() {
    return {
      view: 'needs_action',
      scope: 'all',
      load: createLoad({ label: 'notifications' }),
      tick: 0, // bumped after an action so the derived lists re-read the session
    };
  },
  computed: {
    role() {
      return currentRole();
    },
    /** One project in the MVP (Q-A3): both scopes show the same items; the switch is rendered for the review. */
    scopes() {
      return [
        { value: 'all', label: 'All projects' },
        { value: 'current', label: PROJECT.code },
      ];
    },
    ready() {
      return this.load.hasData;
    },
    counts() {
      this.tick; // eslint-disable-line no-unused-expressions
      return countsFor(this.role);
    },
    tabs() {
      const c = this.counts;
      const n = { needs_action: c.needsAction, waiting: c.waiting, updates: c.updates, all: c.all };
      return VIEWS.map((v) => ({ id: v.id, label: v.label, count: n[v.id] || undefined, countStatus: v.id === 'needs_action' && n[v.id] ? 'standby' : undefined }));
    },
    currentTab() {
      return VIEWS.find((v) => v.id === this.view) || VIEWS[0];
    },
    criticals() {
      this.tick; // eslint-disable-line no-unused-expressions
      return this.ready ? criticalItems(this.role) : [];
    },
    /** The tab's rows without the Criticals shown above (Updates and All list everything). */
    rows() {
      this.tick; // eslint-disable-line no-unused-expressions
      if (!this.ready) return [];
      const items = viewItems(this.role, this.view);
      if (this.view === 'updates') return items;
      const shown = new Set(this.criticals.map((it) => it.key));
      return items.filter((it) => !shown.has(it.key));
    },
    emptyText() {
      return EMPTY[this.view];
    },
    criticalLine() {
      const c = this.counts;
      if (!c.critical) return 'No critical items';
      return c.criticalUnacknowledged ? `${c.criticalUnacknowledged} critical, not acknowledged` : `${c.critical} critical, acknowledged`;
    },
    listBuilt: () => isBuilt('notifications'),
    prefsBuilt: () => isBuilt('notificationsPrefs'),
  },
  watch: {
    open(v) {
      if (v && !this.ready) this.fetch();
      if (v) this.tick += 1;
    },
  },
  beforeDestroy() {
    this.load.destroy();
  },
  methods: {
    fetch() {
      this.load.run((signal) => mockRequest(() => true, { signal }), () => {
        this.tick += 1;
      });
    },
    refresh() {
      this.tick += 1;
    },
    reviewed() {
      markUpdatesReviewed();
      this.refresh();
    },
    goTo(screen) {
      this.$emit('close');
      go(screen);
    },
  },
};
</script>

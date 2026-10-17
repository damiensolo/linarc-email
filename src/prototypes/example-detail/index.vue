<template>
  <!-- Example detail screen: the "detail of one record" page pattern (docs/5-ui-patterns.md §1, D-25): Title Bar /
       Workflow Size=Comfortable with a contained back button, the record's name, its ID chip and `Status:` chip;
       the record on the left as hairline rows (one container level, D-17); the activity log in AppLayout's right panel.
       The record id comes from the hash (?p=example-detail#sub-003); the sandbox's record picker lists them (D-27).
       Loading (§6): the title bar holds a skeleton line in place of the name until the record arrives. -->
  <AppShell screen="detail" header-size="comfortable" title="Submittal" :right-panel="isWide" :scrollable-content="true">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back to Submittals" @click="back" />
        <span v-if="load.hasData" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ record.title }}</span>
        <!-- The name depends on the record: a title-sized line holds its place (invisible for the first 200ms). -->
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="record" :label="record.number" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="record" class="hidden items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          Status:
          <StatusChip :label="record.status.label" :status="chipStatus(record.status)" fill-style="outline" type="default" />
        </span>
      </span>
    </template>

    <template #header-actions>
      <Button label="Mark approved" color-scheme="primary" variant="solid" size="medium" :is-disabled="!record || record.status.key === 'approved'" @onClick="approve" />
    </template>

    <template #content>
      <LoadRegion :load="load" class="mx-auto flex w-full max-w-4xl flex-col gap-space-40 pt-space-16" @retry="fetch">
        <template #default>
          <section class="flex flex-col gap-space-12">
            <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Details</h2>
            <dl class="m-0 grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
              <div v-for="f in facts" :key="f.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20">
                <dt class="text-text-subtle">{{ f.label }}</dt>
                <dd class="m-0 text-right text-text-default">{{ f.value }}</dd>
              </div>
            </dl>
          </section>
          <!-- Below 1024px the right panel's content moves inline under the record (§1). -->
          <section v-if="!isWide" class="flex flex-col gap-space-12">
            <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Activity</h2>
            <ActivityList :items="activity" />
          </section>
        </template>
        <template #skeleton>
          <section class="flex flex-col gap-space-12">
            <Skeleton size="md" class="w-space-124" />
            <div class="grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
              <Skeleton v-for="n in 6" :key="n" size="sm" class="my-space-8 w-full" />
            </div>
          </section>
        </template>
      </LoadRegion>
    </template>

    <template #right-panel>
      <div class="flex flex-col gap-space-12 p-space-20">
        <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Activity</h2>
        <LoadRegion secondary :load="load">
          <template #default><ActivityList :items="activity" /></template>
          <template #skeleton><Skeleton v-for="n in 3" :key="n" size="sm" class="my-space-8 w-full" /></template>
        </LoadRegion>
      </div>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import HeaderToolIcon from '@/componentsV2/HeaderToolIcon/HeaderToolIcon.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go } from '~/modules/app/router';
import { toneToChipStatus } from '~/modules/app/status';
import { patchRecord } from '~/modules/session';
import { submittalById, submittalOptions, activityFor } from '../example-list/data';

/** Hairline activity rows (D-17): time, actor, action. Local to this screen; a reusable one would be a candidate. */
const ActivityList = {
  name: 'ActivityList',
  props: { items: { type: Array, required: true } },
  render(h) {
    return h(
      'ol',
      { class: 'm-0 flex list-none flex-col p-0' },
      this.items.map((e) =>
        h('li', { class: 'flex flex-col gap-space-2 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20' }, [
          h('span', { class: 'text-text-default' }, e.action),
          h('span', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, `${e.actor} · ${this.$moment(e.at).format('D MMM, h:mm a')}`),
        ]),
      ),
    );
  },
};

const DEFAULT_RECORD = 'sub-001';

export default {
  name: 'ExampleDetail',
  prototype: { title: 'Submittals › Detail', figma: '', records: submittalOptions },
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, LoadRegion, Skeleton, ActivityList },
  data() {
    const asked = currentRoute().id;
    return {
      id: asked && submittalById(asked) ? asked : DEFAULT_RECORD,
      record: null,
      activity: [],
      isWide: window.innerWidth >= 1024,
      load: createLoad({ label: 'submittal' }),
    };
  },
  computed: {
    facts() {
      const r = this.record;
      if (!r) return [];
      const m = this.$moment;
      return [
        { label: 'Spec section', value: r.spec },
        { label: 'Package', value: r.package },
        { label: 'Ball in court', value: r.ballInCourt },
        { label: 'Revision', value: String(r.revision) },
        { label: 'Submitted', value: r.submittedOn ? m(r.submittedOn).format('D MMM YYYY') : 'Not yet' },
        { label: 'Due', value: m(r.dueOn).format('D MMM YYYY') },
      ];
    },
  },
  created() {
    this.fetch();
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    this.load.destroy();
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    chipStatus: (s) => toneToChipStatus(s.tone),
    onResize() {
      this.isWide = window.innerWidth >= 1024;
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => ({ record: submittalById(this.id), activity: activityFor(this.id) }), { signal }),
        ({ record, activity }) => {
          this.record = record;
          this.activity = activity;
        },
      );
    },
    /** A demo write (D-29): the change is kept in the session, so the list shows it on its next load. */
    approve() {
      patchRecord(this.id, { status: 'approved' });
      this.fetch();
    },
    back() {
      go('list');
    },
  },
};
</script>

<template>
  <!-- A Submittal or Change Order with the upgraded Email built in (D-74, 2026-11-14): the parity the plan claims for
       all three record types (00-plan.md §0, D-40), as a stand-in for those products. Detail pattern (5-ui-patterns.md
       §1, D-25): comfortable title bar with back, the title, the code chip, Status and Due; tabs Details · Email, the
       Email tab the same composition as the RFI's (RecordEmailTab: Compose at the top with the record pinned, one
       ThreadStream + composer per thread; D-48, D-50); the right panel holds Activity (record and email events) and the
       Distribution list (who the record's email suggests first). The host screens (correspondence-context-sub / -co)
       only name the kind. Role (D-41): guests see their own threads only. -->
  <AppShell :screen="screenName" header-size="comfortable" :title="noun[0].toUpperCase() + noun.slice(1)" :right-panel="isWide" :scrollable-content="true">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back to Email" @click="back" />
        <span v-if="load.hasData && record" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ record.title }}</span>
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="record" :label="record.code" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="record" class="hidden shrink-0 items-center gap-space-8 whitespace-nowrap font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          Status:
          <StatusChip v-if="status.tone !== 'neutral'" :label="status.label" :status="chip(status.tone)" fill-style="outline" type="default" :removable="false" />
          <span v-else class="text-text-default">{{ status.label }}</span>
          <template v-if="!record.closed">
            <span aria-hidden="true">·</span>
            <span class="inline-flex items-center gap-space-8">
              Due:
              <StatusChip v-if="due.sla" :label="due.sla.label" :status="chip(due.sla.tone)" fill-style="outline" type="default" :removable="false" />
              <span v-else class="text-text-default">{{ due.text }}</span>
            </span>
          </template>
        </span>
      </span>
    </template>

    <template #content>
      <LoadRegion :load="load" class="mx-auto w-full max-w-4xl pt-space-16" @retry="fetch">
        <template #default>
          <div class="flex flex-col gap-space-24">
            <div class="min-w-0 max-w-full overflow-x-auto">
              <TabNavigation v-model="tab" :tabs="tabs" :aria-label="`${noun} sections`" />
            </div>

            <p v-if="notice" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">
              <span>{{ notice.text }}</span>
              <Button v-if="notice.threadId" label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="go('thread', notice.threadId)" />
            </p>

            <!-- Details: the record's facts on hairlines (D-17), its description, and what it links to -->
            <div v-if="tab === 'details'" class="flex flex-col gap-space-32 font-label">
              <dl class="m-0 grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
                <div v-for="f in facts" :key="f.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
                  <dt class="shrink-0 text-text-subtle">{{ f.label }}</dt>
                  <dd class="m-0 text-right text-text-default">{{ f.value }}</dd>
                </div>
              </dl>
              <section class="flex flex-col gap-space-8">
                <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Description</h2>
                <p class="m-0 whitespace-pre-line text-fontsize-14 leading-lineheight-20 text-text-default">{{ record.description }}</p>
              </section>
              <section v-if="record.items && record.items.length" class="flex flex-col gap-space-8">
                <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ kind === 'submittal' ? 'Items' : 'Scope' }}</h2>
                <ul class="m-0 flex list-none flex-col p-0">
                  <li v-for="it in record.items" :key="it.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
                    <span class="min-w-0 text-text-default">{{ it.label }}</span>
                    <span class="shrink-0 text-right text-text-subtle">{{ it.value }}</span>
                  </li>
                </ul>
              </section>
              <section class="flex flex-col gap-space-8">
                <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Linked items</h2>
                <p v-if="!threads.length" class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">No email on this {{ noun }} yet.</p>
                <ul v-else class="m-0 flex list-none flex-col p-0">
                  <li v-for="t in threads" :key="t.id" class="flex flex-wrap items-center gap-x-space-8 gap-y-space-4 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
                    <Chip label="Email" size="small" fill-style="solid" type="default" :removable="false" />
                    <span class="min-w-0 flex-1 truncate text-text-default">{{ t.subject }}</span>
                    <Button label="Open" variant="text" color-scheme="primary" size="small" @onClick="openEmail(t.id)" />
                  </li>
                </ul>
              </section>
            </div>

            <RecordEmailTab
              v-else
              ref="emailTab"
              :record="record"
              :threads="threads"
              :role="role"
              :noun="noun"
              :busy="write.status === 'loading'"
              @compose="composing = true"
              @send="send"
              @open-thread="(id) => go('thread', id)"
              @open-record="openRecord"
              @open-files="openFiles"
              @download-file="downloadFile"
            />

            <!-- Below 1024px the right panel's content moves under the tab content (§1). -->
            <section v-if="!isWide" class="flex flex-col gap-space-12">
              <TabNavigation v-model="side" :tabs="sideTabs" :aria-label="`${noun} activity`" />
              <RfiActivity v-if="side === 'activity'" :rows="activity" @open-thread="(id) => go('thread', id)" />
              <DistributionList v-else :people="distribution" />
            </section>
          </div>
        </template>
        <template #skeleton>
          <div class="flex flex-col gap-space-24">
            <Skeleton size="md" class="w-space-124" />
            <div class="grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
              <Skeleton v-for="n in 6" :key="n" size="sm" class="my-space-8 w-full" />
            </div>
          </div>
        </template>
      </LoadRegion>

      <ComposePanel v-if="record" :open="composing" :role="role" :record-id="record.id" :busy="write.status === 'loading'" @close="composing = false" @sent="onSent" />
      <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
    </template>

    <template #right-panel>
      <div class="flex flex-col gap-space-12 p-space-20">
        <TabNavigation v-model="side" :tabs="sideTabs" :aria-label="`${noun} activity`" />
        <LoadRegion secondary :load="load">
          <template #default>
            <RfiActivity v-if="side === 'activity'" :rows="activity" @open-thread="(id) => go('thread', id)" />
            <DistributionList v-else :people="distribution" />
          </template>
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
import TabNavigation from '@/componentsV2/TabNavigation/TabNavigation.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go, isBuilt } from '~/modules/app/router';
import { SUBMITTAL, CHANGE_ORDER, SLA, AUDIT_EVENT, toneToChipStatus } from '~/modules/app/status';
import { TODAY, currentRole, getRecord, getPerson, getThread, viewFor, sendMessage, postNote, threadsForRecord, rfiActivity, RECORD_SCREEN } from '../../data';
import ComposePanel from '../ComposePanel.vue';
import RfiActivity from '../rfi/RfiActivity.vue';
import RecordEmailTab from './RecordEmailTab.vue';
import { fileViewing } from '../../fileViewing';

/** The distribution list (right panel): who the record's email suggests first; notification-only otherwise. */
const DistributionList = {
  name: 'DistributionList',
  props: { people: { type: Array, default: () => [] } },
  render(h) {
    return h('div', { class: 'flex flex-col gap-space-12 font-label' }, [
      h('p', { class: 'm-0 text-fontsize-12 leading-lineheight-16 text-text-subtle' }, 'Suggested first in Compose. They get this record\'s email only when added to a message.'),
      h('ul', { class: 'm-0 flex list-none flex-col p-0' }, this.people.map((p) => h('li', { key: p.id, class: 'border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20 text-text-default' }, [p.name, h('span', { class: 'text-text-subtle' }, ` · ${p.company}`)]))),
    ]);
  },
};

const KINDS = {
  submittal: { noun: 'submittal', screen: 'submittal', dimension: SUBMITTAL, defaultId: 'SUB-088' },
  'change-order': { noun: 'change order', screen: 'changeOrder', dimension: CHANGE_ORDER, defaultId: 'PCO-019' },
};

export default {
  name: 'RecordEmailScreen',
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, TabNavigation, LoadRegion, Skeleton, FileViewer, ComposePanel, RfiActivity, RecordEmailTab, DistributionList },
  mixins: [fileViewing],
  props: {
    /** 'submittal' | 'change-order' */
    kind: { type: String, required: true },
  },
  data() {
    const [asked, section] = (currentRoute().id || '').split('/');
    const k = KINDS[this.kind];
    const r = asked && getRecord(asked);
    return {
      role: currentRole(),
      id: r && r.type === this.kind ? asked : k.defaultId,
      record: null,
      threads: [],
      tab: section === 'email' ? 'email' : 'details',
      side: 'activity',
      composing: false,
      notice: null,
      isWide: window.innerWidth >= 1024,
      load: createLoad({ label: k.noun }),
      write: createLoad({ label: 'change', action: { busy: 'Saving', done: 'Saved', error: "Couldn't save." } }),
    };
  },
  computed: {
    noun() {
      return KINDS[this.kind].noun;
    },
    screenName() {
      return KINDS[this.kind].screen;
    },
    status() {
      return KINDS[this.kind].dimension[this.record.status] || { label: this.record.status, tone: 'neutral' };
    },
    due() {
      const day = (this.record.dueOn || '').slice(0, 10);
      const today = TODAY.slice(0, 10);
      const sla = !day ? null : day < today ? SLA.overdue : day === today ? SLA.due_today : null;
      return { sla, text: day ? this.$moment(this.record.dueOn).format('D MMM') : '—' };
    },
    tabs() {
      const needs = this.threads.filter((t) => t.triage === 'needs_action').length;
      return [{ id: 'details', label: 'Details' }, { id: 'email', label: 'Email', count: needs || null }];
    },
    sideTabs() {
      return [{ id: 'activity', label: 'Activity' }, { id: 'distribution', label: 'Distribution', count: this.distribution.length || null }];
    },
    facts() {
      const r = this.record;
      const name = (id) => (getPerson(id) || {}).name || '—';
      const common = [
        ['Spec section', r.spec],
        ['Ball in court', r.ballInCourt || '—'],
        ['Assigned to', name(r.assignedToId)],
        ['Due', r.dueOn ? this.$moment(r.dueOn).format('D MMM YYYY') : '—'],
        ['Created by', `${name(r.createdById)} · ${this.$moment(r.createdAt).format('D MMM')}`],
      ];
      if (this.kind === 'submittal') return [['Revision', r.revision], ['Submitted by', r.submittedBy || '—'], ['Received', r.receivedOn ? this.$moment(r.receivedOn).format('D MMM') : '—'], ['Lead time', r.leadTime || '—'], ...common].map(([label, value]) => ({ label, value }));
      const amount = r.amount != null && this.role.canSeeCost ? `$${r.amount.toLocaleString('en-US')}` : null;
      return [['Reason', r.reason || '—'], ...(amount ? [['Amount', amount]] : []), ['Schedule impact', r.scheduleDays != null ? `${r.scheduleDays} days` : '—'], ...common].map(([label, value]) => ({ label, value }));
    },
    activity() {
      if (!this.record) return [];
      return rfiActivity(this.record, this.role.internal ? this.threads : [], { AUDIT_EVENT });
    },
    distribution() {
      return ((this.record && this.record.distributionIds) || []).map(getPerson).filter(Boolean);
    },
  },
  created() {
    this.fetch();
  },
  mounted() {
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.load.destroy();
    this.write.destroy();
  },
  methods: {
    go,
    chip: (tone) => toneToChipStatus(tone),
    onResize() {
      this.isWide = window.innerWidth >= 1024;
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => {
          const record = getRecord(this.id);
          const threads = record ? threadsForRecord(record.id, this.role).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)) : [];
          return { record, threads };
        }, { signal }),
        ({ record, threads }) => {
          this.record = record;
          this.threads = threads;
        },
      );
    },
    writeThen(fn, after) {
      this.write.run(
        (signal) => mockRequest(() => fn(), { signal }),
        (result) => {
          if (after) after(result);
          this.fetch();
        },
      );
    },
    send(threadId, { mode, body, bodyHtml, attachments, links }) {
      const senderId = this.role.personId;
      this.writeThen(
        () => (mode === 'note' ? postNote(threadId, { senderId, body, bodyHtml, links }) : sendMessage(threadId, { senderId, body, bodyHtml, attachments, links })),
        () => {
          if (this.$refs.emailTab) this.$refs.emailTab.resetComposer(threadId);
          this.notice = { text: mode === 'note' ? 'Note posted for your team.' : 'Sent. Replies land on this tab.' };
        },
      );
    },
    onSent(thread) {
      this.composing = false;
      this.tab = 'email';
      this.notice = { text: `Sent to ${thread.participantIds.length - 1} recipient${thread.participantIds.length === 2 ? '' : 's'} with ${this.record.code} pinned.`, threadId: thread.id };
      this.fetch();
    },
    openEmail(threadId) {
      this.tab = 'email';
      this.$nextTick(() => {
        const el = document.getElementById(`entry-${(getThread(threadId).entries[0] || {}).id}`);
        if (el) el.scrollIntoView({ block: 'start' });
      });
    },
    openRecord(recordId) {
      const r = getRecord(recordId);
      const screen = r && RECORD_SCREEN[r.type];
      if (screen && isBuilt(screen)) go(screen, recordId);
    },
    /** Back to the Email screen: these stand-ins have no log of their own. */
    back() {
      go('email');
    },
  },
};
</script>

<template>
  <!-- Communication › Email thread (docs/correspondence/spec.md §6, §8, §9; screens.md §1). Detail-without-decision
       pattern (5-ui-patterns.md §1, D-25): Title Bar / Workflow Size=Comfortable with the back button, the subject,
       the thread id chip and the Status: chip (Confidential chip when restricted); the thread on the left as the
       AiSummary + ThreadStream candidates + the composer; Linked items and Delivery in the right panel (inline at the
       end below 1024px). Promote to record opens the SlideOverPanel beside the thread with the source message
       highlighted (D-37); a bounce's guided fix is a compact ModalV2 (§3). Role (D-41) from the sandbox role switcher:
       the data layer removes notes, cost and the audit for a guest before anything renders. -->
  <AppShell screen="thread" header-size="comfortable" title="Email thread" :right-panel="isWide" :scrollable-content="true">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back to Email" @click="back" />
        <span v-if="load.hasData && thread" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ thread.subject }}</span>
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="thread" :label="thread.id" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="thread" class="hidden items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          Status:
          <StatusChip :label="triage.label" :status="chip(triage.tone)" fill-style="outline" type="default" :removable="false" />
          <StatusChip v-if="thread.visibility === 'restricted'" :label="VISIBILITY.restricted.label" :status="chip(VISIBILITY.restricted.tone)" fill-style="outline" type="default" :removable="false" />
        </span>
      </span>
    </template>

    <template #content>
      <LoadRegion :load="load" class="mx-auto w-full max-w-4xl pt-space-16" @retry="fetch">
        <template #default>
          <!-- Whitespace separates the sections (§2): one column with a 32px rhythm; no rules or boxes between them. -->
          <div class="flex flex-col gap-space-32">
          <!-- Acknowledgement of a write: plain text with the link (§3: success = plain text). -->
          <p v-if="notice" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">
            <span>{{ notice.text }}</span>
            <Button v-if="notice.recordId" :label="`Open ${notice.recordId}`" variant="text" color-scheme="primary" size="small" @onClick="openRecord(notice.recordId)" />
          </p>

          <!-- Hybrid model (D-42): a reply from any mail client lands here; the project address takes forwarded mail. -->
          <p class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
            <span>Replies to this thread from any mail client are kept here.</span>
            <Button label="Forward mail here" variant="text" color-scheme="secondary" size="small" :tooltip="project.inboundAddress" @onClick="copyAddress" />
            <span v-if="copied">Address copied.</span>
          </p>

          <AiSummary v-if="summary" :groups="summary.groups" :evidence="summary.evidence" :status="summaryStatus" @retry="summaryStatus = 'ready'" @trace="trace" @feedback="feedback" />

          <ThreadStream ref="stream" :entries="entries" :highlight-id="highlightId" @open-attachment="openFiles" @download-attachment="downloadFile" @navigate="openRecord">
            <template #message-actions="{ entry }">
              <Button
                v-if="role.internal && entry.direction === 'inbound' && thread.promotion === 'unpromoted'"
                label="Promote to record"
                color-scheme="secondary"
                variant="outline"
                size="small"
                @onClick="startPromote(entry)"
              />
            </template>
            <template #bounce-actions="{ entry }">
              <Button v-if="role.internal" label="Update contact and resend" color-scheme="secondary" variant="outline" size="small" @onClick="startFix(entry)" />
            </template>
          </ThreadStream>

          <Composer ref="composer" :allow-note="role.internal" :busy="write.status === 'loading'" @send="send" @open-attachment="openFiles" />

          <!-- Below 1024px the right panel's content moves inline at the end (§1). -->
          <section v-if="!isWide" class="flex flex-col gap-space-12">
            <TabNavigation v-model="tab" :tabs="tabs" aria-label="Thread details" />
            <LinkedItems v-if="tab === 'linked'" :items="linked" @open="openRecord" />
            <DeliveryList v-else :rows="delivery" />
          </section>
          </div>
        </template>
        <template #skeleton>
          <Skeleton size="sm" class="w-full" />
          <ThreadStream loading />
        </template>
      </LoadRegion>

      <PromotePanel
        :open="!!promoting"
        :thread-id="id"
        :message="promoting"
        :assignee-options="assigneeOptions"
        :busy="write.status === 'loading'"
        @close="promoting = null"
        @create="createRfi"
      />
      <FixContactModal :open="!!fixing" :recipient-name="fixingName" :bounce="fixing && fixing.bounce" :busy="write.status === 'loading'" @close="fixing = null" @confirm="resend" />
      <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
    </template>

    <template #right-panel>
      <div class="flex flex-col gap-space-12 p-space-20">
        <TabNavigation v-model="tab" :tabs="tabs" aria-label="Thread details" />
        <LoadRegion secondary :load="load">
          <template #default>
            <LinkedItems v-if="tab === 'linked'" :items="linked" @open="openRecord" />
            <DeliveryList v-else :rows="delivery" />
          </template>
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
import TabNavigation from '@/componentsV2/TabNavigation/TabNavigation.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import AiSummary from '~/candidates/AiSummary/AiSummary.vue';
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go, isBuilt } from '~/modules/app/router';
import { TRIAGE, VISIBILITY, toneToChipStatus } from '~/modules/app/status';
import {
  PROJECT, ROLES, THREADS, currentRole, setRole, getThread, getThreads, inboundSandbox, viewFor, getPerson, getGuests, getRecord,
  sendMessage, postNote, promoteToRfi, updateContactAndResend,
} from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';
import { threadEntries, summaryView, linkedItems, deliveryRows } from '~/modules/correspondence/view';
import Composer from '~/modules/correspondence/components/Composer.vue';
import { fileViewing } from '~/modules/correspondence/fileViewing';
import PromotePanel from '~/modules/correspondence/components/PromotePanel.vue';
import FixContactModal from '~/modules/correspondence/components/FixContactModal.vue';

/** Linked items: hairline rows with the record's label, title and one status signal (D-17). Local to this screen. */
const LinkedItems = {
  name: 'LinkedItems',
  components: { Button, StatusChip },
  props: { items: { type: Array, required: true } },
  methods: { chip: (t) => toneToChipStatus(t) },
  render(h) {
    if (!this.items.length) return h('p', { class: 'm-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle' }, 'No linked items');
    return h(
      'ul',
      { class: 'm-0 flex list-none flex-col p-0' },
      this.items.map((it) =>
        h('li', { class: 'flex flex-col gap-space-2 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20' }, [
          h('span', { class: 'flex flex-wrap items-center gap-space-8' }, [
            h(Button, { props: { label: it.label, variant: 'text', colorScheme: 'primary', size: 'small' }, on: { onClick: () => this.$emit('open', it.id) } }),
            it.status && it.status.tone !== 'neutral'
              ? h(StatusChip, { props: { label: it.supersededBy ? `Superseded by ${it.supersededBy}` : it.status.label, status: this.chip(it.status.tone), fillStyle: 'outline', type: 'default', removable: false } })
              : it.status
                ? h('span', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, it.status.label)
                : null,
          ]),
          h('span', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, it.title),
        ]),
      ),
    );
  },
};

/** Delivery rows (Q-09): event, actor, time; IP, agent and file hash only in a row's expand. Local to this screen. */
const DeliveryList = {
  name: 'DeliveryList',
  components: { StatusChip },
  props: { rows: { type: Array, required: true } },
  methods: { chip: (t) => toneToChipStatus(t) },
  render(h) {
    if (!this.rows.length) return h('p', { class: 'm-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle' }, 'No delivery events yet');
    return h(
      'ol',
      { class: 'm-0 flex list-none flex-col p-0' },
      this.rows.map((r) =>
        h('li', { class: 'flex flex-col gap-space-2 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20' }, [
          h('span', { class: 'flex flex-wrap items-center gap-space-8' }, [
            r.tone === 'error'
              ? h(StatusChip, { props: { label: r.label, status: this.chip(r.tone), fillStyle: 'outline', type: 'default', removable: false } })
              : h('span', { class: 'text-text-default' }, r.label),
            h('span', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, `${r.actor} · ${this.$moment(r.at).format('D MMM, HH:mm')}`),
          ]),
          h('span', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, r.detail),
          r.details.length
            ? h('details', { class: 'text-fontsize-12 leading-lineheight-16 text-text-subtle' }, [
                h('summary', { class: 'cursor-pointer' }, 'Details'),
                ...r.details.map((d) => h('div', { class: 'pt-space-2' }, d)),
              ])
            : null,
        ]),
      ),
    );
  },
};

const RECORD_SCREEN = { rfi: 'rfi', drawing: 'sheet' };

export default {
  name: 'CorrespondenceThread',
  prototype: {
    title: 'Communication › Email thread',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4093-741',
    records: () => getThreads().map((t) => ({ value: t.id, label: `${t.id} · ${t.subject}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, TabNavigation, LoadRegion, Skeleton, AiSummary, ThreadStream, FileViewer, Composer, PromotePanel, FixContactModal, LinkedItems, DeliveryList },
  mixins: [fileViewing],
  data() {
    const asked = currentRoute().id;
    return {
      project: PROJECT,
      role: currentRole(),
      id: asked && getThread(asked) ? asked : THREADS[0].id,
      thread: null,
      isWide: window.innerWidth >= 1024,
      tab: 'linked',
      load: createLoad({ label: 'thread' }),
      write: createLoad({ label: 'message', action: { busy: 'Sending', done: 'Sent', error: "Couldn't send." } }),
      summaryStatus: 'ready',
      promoting: null,
      fixing: null,
      highlightId: '',
      notice: null,
      copied: false,
      VISIBILITY,
    };
  },
  computed: {
    triage() {
      return TRIAGE[this.thread.triage];
    },
    entries() {
      return this.thread ? threadEntries(this.thread) : [];
    },
    summary() {
      return this.thread ? summaryView(this.thread) : null;
    },
    linked() {
      return this.thread ? linkedItems(this.thread) : [];
    },
    delivery() {
      return this.thread ? deliveryRows(this.thread) : [];
    },
    tabs() {
      // No count badges: the disabled number badge loses its digit in dark mode (F-008), and the counts add nothing here.
      return [{ id: 'linked', label: 'Linked items' }, ...(this.role.internal ? [{ id: 'delivery', label: 'Delivery' }] : [])];
    },
    assigneeOptions() {
      return getGuests().map((p) => ({ value: p.id, label: `${p.name} · ${p.company}` }));
    },
    fixingName() {
      if (!this.fixing) return '';
      const r = this.fixing.recipients && this.fixing.recipients[0];
      return r && r.person ? r.person.name : (r && r.email) || '';
    },
  },
  created() {
    this.fetch();
    window.addEventListener('resize', this.onResize);
  },
  beforeDestroy() {
    this.load.destroy();
    this.write.destroy();
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    chip: (tone) => toneToChipStatus(tone),
    onResize() {
      this.isWide = window.innerWidth >= 1024;
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => viewFor(getThread(this.id), this.role), { signal }),
        (thread) => {
          this.thread = thread;
        },
      );
    },
    /** A write goes through the session, then the thread re-reads (content kept, "Updating…" if slow; D-24). */
    writeThen(fn, after) {
      this.write.run(
        (signal) => mockRequest(() => fn(), { signal }),
        (result) => {
          if (after) after(result);
          this.fetch();
        },
      );
    },
    send({ mode, body, attachments }) {
      const senderId = this.role.personId;
      this.writeThen(
        () => (mode === 'note' ? postNote(this.id, { senderId, body }) : sendMessage(this.id, { senderId, body, attachments })),
        () => {
          if (this.$refs.composer) this.$refs.composer.reset();
          this.notice = { text: mode === 'note' ? 'Note posted for your team.' : 'Sent. Replies land in this thread.' };
        },
      );
    },
    startPromote(entry) {
      this.highlightId = entry.id;
      this.promoting = entry;
    },
    createRfi(fields) {
      const messageId = this.promoting.id;
      this.writeThen(
        () => promoteToRfi(this.id, messageId, { actorId: this.role.personId, ...fields }),
        (recordId) => {
          this.promoting = null;
          this.highlightId = '';
          this.notice = { text: `${recordId} created.`, recordId };
        },
      );
    },
    startFix(entry) {
      this.fixing = entry;
    },
    resend(email) {
      const messageId = this.fixing.id;
      this.writeThen(
        () => updateContactAndResend(this.id, messageId, { actorId: this.role.personId, email }),
        () => {
          this.fixing = null;
          this.notice = { text: `Contact updated and message resent to ${email}.` };
        },
      );
    },
    /** AiSummary "Source": scroll to and highlight the first source entry (D-44 provenance). */
    trace(ids) {
      const id = ids[0];
      this.highlightId = id;
      const el = document.getElementById(`entry-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    feedback() {
      this.notice = { text: 'Thanks. The summary was flagged for review.' };
    },
    openRecord(recordId) {
      const r = getRecord(recordId);
      const screen = r && RECORD_SCREEN[r.type];
      if (screen && isBuilt(screen)) go(screen, recordId);
      else this.notice = { text: `${recordId} opens in its own tool; that screen is not in this prototype.` };
    },
    copyAddress() {
      const text = this.project.inboundAddress;
      const done = () => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
      else done();
    },
    back() {
      go('email');
    },
  },
};
</script>

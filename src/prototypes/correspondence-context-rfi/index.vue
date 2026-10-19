<template>
  <!-- RFIs › RFI: a STAND-IN for the product's RFI detail (docs/correspondence/00-plan.md §2), here to show the upgraded
       Email tab (spec §1.2, D-40): the same ThreadStream and composer as the Email thread, embedded on the record, and
       Compose with the RFI pinned and "Attach a PDF of RFI-143" (today's parity). Detail pattern (5-ui-patterns.md §1,
       D-25): comfortable title bar with back, the title, the number chip and the Status: chip; TabNavigation for
       Details / Email / Activity. Not the RFIs product: review the Email tab, not the record. -->
  <AppShell screen="rfi" header-size="comfortable" title="RFI" :scrollable-content="true">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back" @click="back" />
        <span v-if="load.hasData && record" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ record.title }}</span>
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="record" :label="record.code" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="record" class="hidden items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          Status:
          <StatusChip :label="status.label" :status="chip(status.tone)" fill-style="outline" type="default" :removable="false" />
        </span>
      </span>
    </template>

    <template #header-actions>
      <!-- Today's rule kept: a closed record can't send email. -->
      <Button label="Compose" color-scheme="primary" variant="solid" size="medium" :is-disabled="!record || record.closed" :tooltip="record && record.closed ? 'Closed RFIs can\'t send email' : ''" @onClick="composing = true" />
    </template>

    <template #content>
      <LoadRegion :load="load" class="mx-auto w-full max-w-4xl pt-space-16" @retry="fetch">
        <template #default>
          <div class="flex flex-col gap-space-24">
            <TabNavigation v-model="tab" :tabs="tabs" aria-label="RFI sections" />

            <!-- Details (stand-in) -->
            <section v-if="tab === 'details'" class="flex flex-col gap-space-32">
              <dl class="m-0 grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
                <div v-for="f in facts" :key="f.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20">
                  <dt class="text-text-subtle">{{ f.label }}</dt>
                  <dd class="m-0 text-right text-text-default">{{ f.value }}</dd>
                </div>
              </dl>
              <div class="flex flex-col gap-space-8">
                <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Question</h2>
                <p class="m-0 whitespace-pre-line font-label text-fontsize-14 leading-lineheight-20 text-text-default">{{ record.question }}</p>
                <p v-if="record.createdInDemo || record.threadId" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
                  <span>Created from an email{{ originSender ? ` by ${originSender}` : '' }}; the message is on the Email tab.</span>
                  <Button label="Open the email" variant="text" color-scheme="primary" size="small" @onClick="tab = 'email'" />
                </p>
              </div>
              <div class="flex flex-col gap-space-8">
                <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Official response</h2>
                <p class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ record.answer || 'No official response yet.' }}</p>
              </div>
            </section>

            <!-- Email: the upgraded Email tab -->
            <section v-else-if="tab === 'email'" class="flex flex-col gap-space-40">
              <p v-if="notice" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">
                <span>{{ notice.text }}</span>
                <Button v-if="notice.threadId" label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="go('thread', notice.threadId)" />
              </p>
              <div v-if="!threads.length" class="flex flex-col gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
                <span>No email on this RFI yet. Compose sends from here with {{ record.code }} pinned; replies from any mail client come back to this tab.</span>
              </div>
              <article v-for="t in threads" :key="t.id" class="flex flex-col gap-space-16">
                <header class="flex flex-wrap items-center justify-between gap-space-8">
                  <div class="flex min-w-0 flex-wrap items-center gap-space-8">
                    <h2 class="m-0 truncate font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ t.subject }}</h2>
                    <StatusChip :label="TRIAGE[t.triage].label" :status="chip(TRIAGE[t.triage].tone)" fill-style="outline" type="default" :removable="false" />
                  </div>
                  <Button label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="go('thread', t.id)" />
                </header>
                <ThreadStream :entries="threadEntries(t)" @navigate="openRecord" @open-attachment="openFiles" @download-attachment="downloadFile" />
                <Composer :ref="`composer-${t.id}`" :allow-note="role.internal" :busy="write.status === 'loading'" @send="(m) => send(t.id, m)" @open-attachment="openFiles" />
              </article>
            </section>

            <!-- Activity (stand-in) -->
            <section v-else class="flex flex-col gap-space-8">
              <ol class="m-0 flex list-none flex-col p-0">
                <li v-for="a in activity" :key="a.id" class="flex flex-col gap-space-2 border-b border-border-subtle py-space-8 font-label text-fontsize-14 leading-lineheight-20">
                  <span class="text-text-default">{{ a.text }}</span>
                  <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ a.actor }} · {{ $moment(a.at).format('D MMM, HH:mm') }}</span>
                </li>
              </ol>
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
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go, isBuilt } from '~/modules/app/router';
import { TRIAGE, RFI_STATUS, toneToChipStatus } from '~/modules/app/status';
import { RFIS, ROLES, currentRole, setRole, getRecord, getPerson, getThread, viewFor, threadsForRecord, sendMessage, postNote, inboundSandbox } from '~/modules/correspondence/data';
import { threadEntries } from '~/modules/correspondence/view';
import Composer from '~/modules/correspondence/components/Composer.vue';
import ComposePanel from '~/modules/correspondence/components/ComposePanel.vue';
import { fileViewing } from '~/modules/correspondence/fileViewing';

const RECORD_SCREEN = { rfi: 'rfi', drawing: 'sheet' };

export default {
  name: 'CorrespondenceContextRfi',
  prototype: {
    title: 'RFIs › RFI',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4100-1012',
    records: () => RFIS.map((r) => ({ value: r.id, label: `${r.code} · ${r.title}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
  },
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, TabNavigation, LoadRegion, Skeleton, ThreadStream, FileViewer, Composer, ComposePanel },
  mixins: [fileViewing],
  data() {
    const asked = currentRoute().id;
    return {
      role: currentRole(),
      // Default to the RFI the demo creates from email (Flow 2), not the first in the list.
      id: asked && getRecord(asked) ? asked : 'RFI-143',
      record: null,
      threads: [],
      tab: 'details',
      composing: false,
      notice: null,
      TRIAGE,
      load: createLoad({ label: 'RFI' }),
      write: createLoad({ label: 'message', action: { busy: 'Sending', done: 'Sent', error: "Couldn't send." } }),
    };
  },
  computed: {
    status() {
      return RFI_STATUS[this.record.status];
    },
    tabs() {
      return [
        { id: 'details', label: 'Details' },
        { id: 'email', label: 'Email' },
        { id: 'activity', label: 'Activity' },
      ];
    },
    facts() {
      const r = this.record;
      if (!r) return [];
      const m = this.$moment;
      const assignee = getPerson(r.assignedToId);
      return [
        { label: 'Spec section', value: r.spec },
        { label: 'Assigned to', value: assignee ? `${assignee.name} · ${assignee.company}` : '—' },
        { label: 'Ball in court', value: r.ballInCourt || '—' },
        { label: 'Due', value: r.dueOn ? m(r.dueOn).format('D MMM YYYY') : '—' },
        ...(this.role.canSeeCost ? [{ label: 'Cost impact', value: r.costImpact || '—' }] : []),
        { label: 'Schedule impact', value: r.scheduleImpact || '—' },
        { label: 'Created', value: `${m(r.createdAt).format('D MMM YYYY')} by ${(getPerson(r.createdById) || {}).name || '—'}` },
      ];
    },
    originSender() {
      const t = this.record && this.record.threadId ? getThread(this.record.threadId) : null;
      const msg = t && t.entries.find((e) => e.type === 'message' && e.direction === 'inbound');
      const p = msg && getPerson(msg.senderId);
      return p ? `${p.name} (${p.company})` : '';
    },
    activity() {
      const r = this.record;
      if (!r) return [];
      const items = [{ id: 'created', at: r.createdAt, actor: (getPerson(r.createdById) || {}).name || '—', text: r.threadId ? `Created from email thread ${r.threadId}` : 'Created' }];
      const assignee = getPerson(r.assignedToId);
      if (assignee) items.push({ id: 'assigned', at: r.createdAt, actor: (getPerson(r.createdById) || {}).name || '—', text: `Assigned to ${assignee.name} (${assignee.company})` });
      this.threads.forEach((t) => t.entries.filter((e) => e.type === 'message').forEach((e) => items.push({ id: e.id, at: e.sentAt, actor: (getPerson(e.senderId) || {}).name || '—', text: e.direction === 'inbound' ? 'Email received' : 'Email sent' })));
      return items.sort((a, b) => b.at.localeCompare(a.at));
    },
  },
  created() {
    this.fetch();
  },
  beforeDestroy() {
    this.load.destroy();
    this.write.destroy();
  },
  methods: {
    go,
    threadEntries,
    chip: (tone) => toneToChipStatus(tone),
    /** The threads on this RFI's Email tab: linked or promoted to it, plus the thread it was created from. */
    threadsFor(record) {
      const list = threadsForRecord(record.id, this.role);
      if (record.threadId && !list.some((t) => t.id === record.threadId)) {
        const origin = viewFor(getThread(record.threadId), this.role);
        if (origin) list.unshift(origin);
      }
      return list.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => {
          const record = getRecord(this.id);
          return { record, threads: record ? this.threadsFor(record) : [] };
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
    send(threadId, { mode, body, attachments }) {
      const senderId = this.role.personId;
      this.writeThen(
        () => (mode === 'note' ? postNote(threadId, { senderId, body }) : sendMessage(threadId, { senderId, body, attachments })),
        () => {
          const ref = this.$refs[`composer-${threadId}`];
          const c = Array.isArray(ref) ? ref[0] : ref;
          if (c) c.reset();
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
    openRecord(recordId) {
      const r = getRecord(recordId);
      const screen = r && RECORD_SCREEN[r.type];
      if (screen && isBuilt(screen)) go(screen, recordId);
    },
    back() {
      if (window.history.length > 1) window.history.back();
      else go('email');
    },
  },
};
</script>

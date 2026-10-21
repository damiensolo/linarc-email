<template>
  <!-- RFIs › RFI: the RFI detail as the Documentation file's ☉ Create RFI page draws it, with the upgraded Email built in
       (docs/correspondence/rfi-integration.md; D-48, D-49). Detail pattern (5-ui-patterns.md §1, D-25): comfortable
       title bar with back, the name, the number chip, Type, Due and Status, and the workflow move as the title bar's
       action (Route; Reject · Revise · Approve; Close: the record's main call to action). Tabs Details · Q&A · Workflow ·
       Email. Email is a tab of conversations (ThreadStream + composer) with its own Compose at the top of the tab, shown
       only there, so nobody mistakes it for composing an RFI (D-50); it opens the slide-over with the RFI pinned. An inbound message can
       be added to Q&A without retyping it; a workflow move can notify the next party by email. The right panel holds
       Activity (record and email events) and Watchers; below 1024px it moves under the tabs' content. -->
  <AppShell screen="rfi" header-size="comfortable" title="RFI" :right-panel="isWide" :scrollable-content="true">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back" @click="back" />
        <span v-if="load.hasData && record" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ record.title }}</span>
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="record" :label="record.code" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="record" class="hidden shrink-0 items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle xl:inline-flex">
          Type: <span class="text-text-default">{{ typeLabel }}</span>
        </span>
        <span v-if="record && !record.closed" class="hidden shrink-0 items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle lg:inline-flex">
          Due:
          <StatusChip v-if="due.sla" :label="due.sla.label" :status="chip(due.sla.tone)" fill-style="outline" type="default" :removable="false" />
          <span v-else class="text-text-default">{{ due.text }}</span>
        </span>
        <span v-if="record" class="hidden shrink-0 items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          Status:
          <StatusChip :label="status.label" :status="chip(status.tone)" fill-style="outline" type="default" :removable="false" />
        </span>
      </span>
    </template>

    <template #header-actions>
      <!-- The workflow move by the step in hand (Figma tab bar 1420:26174, moved to the title bar, D-50): the RFI's main call to action. -->
      <div v-if="moves.length" class="flex flex-wrap items-center gap-space-8">
        <Button v-for="m in moves" :key="m.kind" :label="m.label" :color-scheme="m.scheme" :variant="m.variant" size="medium" :is-disabled="write.status === 'loading'" @onClick="moving = m.kind" />
      </div>
    </template>

    <template #content>
      <LoadRegion :load="load" class="mx-auto w-full max-w-4xl pt-space-16" @retry="fetch">
        <template #default>
          <div class="flex flex-col gap-space-24">
            <div class="min-w-0 max-w-full overflow-x-auto">
              <TabNavigation v-model="tab" :tabs="tabs" aria-label="RFI sections" />
            </div>

            <p v-if="notice" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">
              <span>{{ notice.text }}</span>
              <Button v-if="notice.tab" :label="notice.tabLabel" variant="text" color-scheme="primary" size="small" @onClick="tab = notice.tab" />
              <Button v-if="notice.threadId" label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="go('thread', notice.threadId)" />
            </p>

            <RfiDetails v-if="tab === 'details'" :record="record" :role="role" :threads="threads" @open-email="openEmail" @open-record="openRecord" @open-files="openFiles" @download-file="downloadFile" />

            <RfiQa
              v-else-if="tab === 'qa'"
              ref="qa"
              :record="record"
              :can-email="role.internal && !record.closed"
              :busy="write.status === 'loading'"
              @add="postStep"
              @open-message="openMessage"
              @email-step="emailStep"
              @open-files="openFiles"
              @download-file="downloadFile"
            />

            <RfiWorkflow v-else-if="tab === 'workflow'" :record="record" />

            <!-- Email: the RFI's conversations (D-48) -->
            <section v-else class="flex flex-col gap-space-40">
              <!-- Compose belongs to the Email tab (D-50): it writes an email about this RFI, never the RFI itself.
                   Today's rule kept: a closed RFI can't send email. -->
              <div class="flex flex-wrap items-center justify-between gap-space-8">
                <span class="font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">Email about {{ record.code }}. Replies from any mail client land here.</span>
                <Button label="Compose" color-scheme="secondary" variant="outline" size="medium" :is-disabled="record.closed" :tooltip="record.closed ? `${status.label} RFIs can't send email` : ''" @onClick="compose()" />
              </div>
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
                <ThreadStream :entries="threadEntries(t)" :highlight-id="highlightId" @navigate="openRecord" @open-attachment="openFiles" @download-attachment="downloadFile">
                  <template #message-actions="{ entry }">
                    <template v-if="role.internal && entry.direction === 'inbound'">
                      <Button v-if="qaStepOf(entry.id)" :label="`In Q&A · Step ${qaStepOf(entry.id)}`" variant="text" color-scheme="secondary" size="small" @onClick="tab = 'qa'" />
                      <Button v-else-if="!record.closed" label="Add to Q&A" color-scheme="secondary" variant="outline" size="small" @onClick="startQa(t, entry)" />
                    </template>
                  </template>
                </ThreadStream>
                <Composer v-if="!record.closed" :ref="`composer-${t.id}`" :allow-note="role.internal" :busy="write.status === 'loading'" @send="(m) => send(t.id, m)" @open-attachment="openFiles" />
              </article>
            </section>

            <!-- Below 1024px the right panel's content moves under the tab content (§1). -->
            <section v-if="!isWide" class="flex flex-col gap-space-12">
              <TabNavigation v-model="side" :tabs="sideTabs" aria-label="RFI activity" />
              <RfiActivity v-if="side === 'activity'" :rows="activity" @open-thread="(id) => go('thread', id)" />
              <div v-else class="flex flex-col gap-space-12 font-label">
                <SelectV2 :value="null" class="w-full" placeholder="Add a watcher" :options="watcherOptions" @input="addWatcher" />
                <ul class="m-0 flex list-none flex-col p-0">
                  <li v-for="w in watchers" :key="w.id" class="border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20 text-text-default">{{ w.name }} <span class="text-text-subtle">· {{ w.company }}</span></li>
                </ul>
              </div>
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

      <ComposePanel v-if="record" :open="composing" :role="role" :record-id="record.id" :prefill="composePrefill" :busy="write.status === 'loading'" @close="composing = false" @sent="onSent" />
      <AddToQaPanel
        :open="!!adding"
        :record="record"
        :message="adding && adding.entry"
        :ball-in-court-id="ballInCourtId"
        :busy="write.status === 'loading'"
        @close="stopQa"
        @add="addQa"
      />
      <RouteModal v-if="record" :visible="!!moving" v-bind="moveDialog" :busy="write.status === 'loading'" @close="moving = null" @confirm="confirmMove" />
      <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
    </template>

    <template #right-panel>
      <div class="flex flex-col gap-space-12 p-space-20">
        <TabNavigation v-model="side" :tabs="sideTabs" aria-label="RFI activity" />
        <LoadRegion secondary :load="load">
          <template #default>
            <RfiActivity v-if="side === 'activity'" :rows="activity" @open-thread="(id) => go('thread', id)" />
            <div v-else class="flex flex-col gap-space-12 font-label">
              <SelectV2 :value="null" class="w-full" placeholder="Add a watcher" :options="watcherOptions" @input="addWatcher" />
              <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">Watchers are notified of changes. They get this RFI's email only if you add them in Compose.</p>
              <ul class="m-0 flex list-none flex-col p-0">
                <li v-for="w in watchers" :key="w.id" class="border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20 text-text-default">{{ w.name }} <span class="text-text-subtle">· {{ w.company }}</span></li>
              </ul>
            </div>
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
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go, isBuilt } from '~/modules/app/router';
import { TRIAGE, RFI_STATUS, SLA, AUDIT_EVENT, toneToChipStatus } from '~/modules/app/status';
import {
  RFIS, ROLES, TODAY, currentRole, setRole, getRecord, getPerson, getPeople, getThread, viewFor, sendMessage, postNote, inboundSandbox,
  RFI_TYPES, WORKFLOW_ACTIONS, currentStep, nextStep, hasExternal, addWorkingDays, rfiThreads, rfiActivity,
  addToQa, postQaStep, routeRfi, approveRfi, reviseRfi, rejectRfi, closeRfi, setWatchers,
} from '~/modules/correspondence/data';
import { threadEntries } from '~/modules/correspondence/view';
import Composer from '~/modules/correspondence/components/Composer.vue';
import ComposePanel from '~/modules/correspondence/components/ComposePanel.vue';
import AddToQaPanel from '~/modules/correspondence/components/AddToQaPanel.vue';
import RouteModal from '~/modules/correspondence/components/RouteModal.vue';
import RfiDetails from '~/modules/correspondence/components/rfi/RfiDetails.vue';
import RfiQa from '~/modules/correspondence/components/rfi/RfiQa.vue';
import RfiWorkflow from '~/modules/correspondence/components/rfi/RfiWorkflow.vue';
import RfiActivity from '~/modules/correspondence/components/rfi/RfiActivity.vue';
import { fileViewing } from '~/modules/correspondence/fileViewing';

const RECORD_SCREEN = { rfi: 'rfi', drawing: 'sheet' };
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default {
  name: 'CorrespondenceContextRfi',
  prototype: {
    title: 'RFIs › RFI',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4122-2257',
    records: () => RFIS.map((r) => ({ value: r.id, label: `${r.code} · ${r.title}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
  },
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, TabNavigation, SelectV2, LoadRegion, Skeleton, ThreadStream, FileViewer, Composer, ComposePanel, AddToQaPanel, RouteModal, RfiDetails, RfiQa, RfiWorkflow, RfiActivity },
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
      side: 'activity',
      composing: false,
      composePrefill: null,
      adding: null,
      moving: null,
      highlightId: '',
      notice: null,
      isWide: window.innerWidth >= 1024,
      TRIAGE,
      load: createLoad({ label: 'RFI' }),
      write: createLoad({ label: 'change', action: { busy: 'Saving', done: 'Saved', error: "Couldn't save." } }),
    };
  },
  computed: {
    status() {
      return RFI_STATUS[this.record.status];
    },
    typeLabel() {
      return RFI_TYPES[this.record.rfiType] || '—';
    },
    /** Due: a chip only when due today or overdue (D-17), else the date as a word. */
    due() {
      const day = (this.record.dueOn || '').slice(0, 10);
      const today = TODAY.slice(0, 10);
      const sla = !day ? null : day < today ? SLA.overdue : day === today ? SLA.due_today : null;
      return { sla, text: day ? this.$moment(this.record.dueOn).format('D MMM') : '—' };
    },
    tabs() {
      const needs = this.threads.filter((t) => t.triage === 'needs_action').length;
      return [
        { id: 'details', label: 'Details' },
        { id: 'qa', label: 'Q&A', count: this.record ? this.record.qa.length : null },
        { id: 'workflow', label: 'Workflow' },
        { id: 'email', label: 'Email', count: needs || null },
      ];
    },
    sideTabs() {
      return [
        { id: 'activity', label: 'Activity' },
        { id: 'watchers', label: 'Watchers', count: this.record ? (this.record.watcherIds || []).length : null },
      ];
    },
    current() {
      return this.record ? currentStep(this.record) : null;
    },
    ballInCourtId() {
      return this.current ? this.current.partyIds[0] : null;
    },
    /** The workflow move in the title bar, by the step in hand (Figma 1420:26174; D-50). Internal roles only. */
    moves() {
      const c = this.current;
      if (!c || !this.role.internal || this.record.closed) return [];
      if (c.action === 'respond') return [{ kind: 'route', label: 'Route', scheme: 'primary', variant: 'solid' }];
      if (c.action === 'review') {
        return [
          // Figma draws Reject as red text; the library Button has no destructive scheme (rfi-integration.md §5).
          { kind: 'reject', label: 'Reject', scheme: 'secondary', variant: 'minimal' },
          { kind: 'revise', label: 'Revise', scheme: 'secondary', variant: 'outline' },
          { kind: 'approve', label: 'Approve', scheme: 'primary', variant: 'solid' },
        ];
      }
      if (c.action === 'close') return [{ kind: 'close', label: 'Close', scheme: 'primary', variant: 'solid' }];
      return [];
    },
    /** RouteModal props for the move in hand. */
    moveDialog() {
      const r = this.record;
      if (!r || !this.moving) return {};
      const summary = (step) => {
        const people = step.partyIds.map(getPerson).filter(Boolean).map((p) => `${p.name}, ${p.company}`).join('; ');
        return `${WORKFLOW_ACTIONS[step.action]} · ${people} · due ${this.$moment(addWorkingDays(TODAY, step.processDays)).format('D MMM')}`;
      };
      const others = (step) => step.partyIds.filter((id) => id !== this.role.personId);
      const next = nextStep(r);
      const respond = r.workflow.steps.find((s) => s.action === 'respond');
      switch (this.moving) {
        case 'route':
          return { title: `Route ${r.code} to ${WORKFLOW_ACTIONS[next.action]}`, next: summary(next), primaryLabel: 'Route', notifiable: others(next).length > 0, notifyDefault: hasExternal(others(next)), notifyLabel: 'Notify them by email (RFI pinned, PDF attached)' };
        case 'approve':
          return { title: `Approve the response on ${r.code}`, description: 'The response stands as the answer; the RFI moves to Close.', next: summary(next), primaryLabel: 'Approve' };
        case 'revise':
          return { title: `Return ${r.code} for revision`, next: summary(respond), primaryLabel: 'Revise', notifiable: others(respond).length > 0, notifyDefault: hasExternal(others(respond)), notifyLabel: 'Notify them by email (RFI pinned, PDF attached)' };
        case 'reject':
          return { title: `Reject ${r.code}`, description: "The workflow ends and the RFI can't send email.", primaryLabel: 'Reject', messageLabel: 'Reason', messageRequired: true };
        default:
          return { title: `Close ${r.code}`, description: "Closed RFIs can't send email. The Q&A and the email stay on the record.", primaryLabel: 'Close RFI' };
      }
    },
    activity() {
      if (!this.record) return [];
      // Delivery rows are internal (D-41): an external role sees the record's events only.
      return rfiActivity(this.record, this.role.internal ? this.threads : [], { AUDIT_EVENT });
    },
    watchers() {
      return ((this.record && this.record.watcherIds) || []).map(getPerson).filter(Boolean);
    },
    watcherOptions() {
      const ids = (this.record && this.record.watcherIds) || [];
      return getPeople().filter((p) => !ids.includes(p.id)).map((p) => ({ value: p.id, label: `${p.name} · ${p.company}` }));
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
    threadEntries,
    chip: (tone) => toneToChipStatus(tone),
    onResize() {
      this.isWide = window.innerWidth >= 1024;
    },
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => {
          const record = getRecord(this.id);
          const threads = record ? rfiThreads(record).map((t) => viewFor(getThread(t.id), this.role)).filter(Boolean) : [];
          return { record, threads: threads.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)) };
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
    compose(prefill = null) {
      this.composePrefill = prefill;
      this.composing = true;
    },
    /** The Q&A step number an email message was filed as (D-49; the message an RFI was created from is Step 1), or 0. */
    qaStepOf(messageId) {
      return this.record.qa.findIndex((s) => s.messageId === messageId && s.source === 'email') + 1;
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
    // --- Email → Q&A (D-49)
    startQa(thread, entry) {
      this.adding = { threadId: thread.id, entry };
      this.highlightId = entry.id;
    },
    stopQa() {
      this.adding = null;
      this.highlightId = '';
    },
    addQa({ kind, body, attachments }) {
      const { threadId, entry } = this.adding;
      this.writeThen(
        () => addToQa(this.record.id, { threadId, messageId: entry.id, actorId: this.role.personId, authorId: entry.sender.id, kind, body, attachments }),
        (n) => {
          this.stopQa();
          this.notice = { text: `${entry.sender.name}'s email is Step ${n} of the Q&A.`, tab: 'qa', tabLabel: 'Open Q&A' };
        },
      );
    },
    postStep(step) {
      this.writeThen(
        () => postQaStep(this.record.id, { authorId: this.role.personId, ...step }),
        (n) => {
          if (this.$refs.qa) this.$refs.qa.reset();
          this.notice = { text: `Step ${n} added to the Q&A.` };
        },
      );
    },
    /** *From email · View message* on a Q&A step: the message on the Email tab, highlighted. */
    openMessage({ messageId }) {
      this.tab = 'email';
      this.highlightId = messageId;
      this.$nextTick(() => {
        const el = document.getElementById(`entry-${messageId}`);
        if (el) el.scrollIntoView({ block: 'center' });
      });
    },
    /** *Email this* on a Q&A step: Compose to the step's author and the party in hand, the step quoted. */
    emailStep(s) {
      const toIds = [...new Set([...(this.current ? this.current.partyIds : []), s.authorId])].filter((id) => id !== this.role.personId);
      this.compose({ toIds, body: `<p></p><p>Step ${s.n} of the ${this.record.code} Q&A (${escapeHtml(s.name)}):</p><blockquote><p>${escapeHtml(s.body)}</p></blockquote>` });
    },
    // --- Workflow moves (§D)
    confirmMove({ notify, message }) {
      const args = { actorId: this.role.personId, notify, message };
      const fn = { route: routeRfi, approve: approveRfi, revise: reviseRfi, reject: rejectRfi, close: closeRfi }[this.moving];
      this.writeThen(
        () => fn(this.record.id, args),
        (result) => {
          const kind = this.moving;
          this.moving = null;
          const step = result && result.step;
          const holder = step ? getPerson(step.partyIds[0]) : null;
          const text = {
            route: step && `Routed to ${WORKFLOW_ACTIONS[step.action]}. ${holder ? `${holder.name} has it` : ''}${result.thread ? ' and has been emailed' : ''}.`,
            approve: 'Approved. The RFI is ready to close.',
            revise: `Returned for revision${holder ? ` to ${holder.name}` : ''}${result && result.thread ? ', by email' : ''}.`,
            reject: 'Rejected. The workflow has ended.',
            close: 'Closed.',
          }[kind];
          this.notice = { text, threadId: result && result.thread ? result.thread.id : null };
        },
      );
    },
    addWatcher(id) {
      if (!id) return;
      setWatchers(this.record.id, [...(this.record.watcherIds || []), id], { actorId: this.role.personId, added: id });
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
    back() {
      if (window.history.length > 1) window.history.back();
      else go('email');
    },
  },
};
</script>

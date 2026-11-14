<template>
  <!-- The reading pane of the Email screen's Reading view (D-65): the selected thread, read and answered without
       leaving the list. A composition (no candidate): a fixed header with the subject, the id chip and the Status: chip
       (Confidential when restricted) and the thread's actions at the right as text buttons (D-67: *Mark as unread*,
       *Delete* or *Restore*, *Open thread*); one scrolling body (padding inside it, F-051) with the AiSummary and
       ThreadStream candidates and the thread composer, as the thread screen draws them; the composer's chips and tool
       row stay at the bottom of the pane while the thread scrolls (sticky, D-67), so Send and the attachments are
       always in view. The thread's Linked items and Delivery stay on the full screen (*Open thread*). Opening a thread
       here reads it (`markRead`, D-67). Triage (D-72, 2026-11-14): the header's meta row carries the Owner select (a
       team member; the thread's obligations follow it) and the follow-up date; the actions gain *Send reminder* (while
       the thread waits on someone outside), *Mark resolved* / *Reopen* and *Follow up*, each a compact modal or one click. Loads through LoadRegion (D-24): nothing for 200ms, then skeletons; the
       content is kept while another thread's answer is pending. Nothing selected: plain text. -->
  <section class="flex h-full min-h-0 flex-col bg-surface-container" aria-label="Reading pane">
    <p v-if="!threadId" class="m-0 px-space-20 py-space-24 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ emptyText }}</p>
    <template v-else>
      <header class="flex shrink-0 items-start gap-space-12 border-b border-border-subtle px-space-20 py-space-12">
        <div class="flex min-w-0 flex-1 flex-col gap-space-4">
          <h2 v-if="thread" class="m-0 font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ thread.subject }}</h2>
          <Skeleton v-else size="md" class="w-space-124" :class="{ invisible: !load.indicator }" />
          <div v-if="thread" class="flex flex-wrap items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
            <Chip :label="thread.id" size="small" fill-style="solid" type="default" :removable="false" />
            <span v-if="thread.letterNo">{{ thread.letterNo }} · {{ (CORRESPONDENCE_TYPE[thread.letterType] || CORRESPONDENCE_TYPE.general).label }}</span>
            <span class="inline-flex items-center gap-space-8">
              Status:
              <StatusChip :label="triage.label" :status="chip(triage.tone)" fill-style="outline" type="default" :removable="false" />
              <StatusChip v-if="thread.visibility === 'restricted'" :label="VISIBILITY.restricted.label" :status="chip(VISIBILITY.restricted.tone)" fill-style="outline" type="default" :removable="false" />
            </span>
            <span v-if="linkedText" class="truncate">{{ linkedText }}</span>
            <!-- D-72: who has it (a select sized to a name, D-26 / D-70) and the team's follow-up date -->
            <span v-if="role.internal" class="inline-flex items-center gap-space-4">
              Owner:
              <SelectV2 :value="ownerId" class="owner-select" size="small" :options="teamOptions" :allow-search="false" placeholder="Unassigned" aria-label="Owner" @input="assign" />
            </span>
            <span v-if="followUpText" class="inline-flex items-center gap-space-4" :class="followUp === 'due' ? 'text-text-default' : ''">Follow up · {{ followUpText }}</span>
            <span v-if="thread.remindAtDue && thread.triage === 'waiting'">Reminder at the due date</span>
          </div>
        </div>
        <!-- The thread's actions (D-67 / D-68): icon buttons with the design system's Tooltip (never the browser's),
             as the list bar's; Open thread stays a text button (the one that leaves the pane) -->
        <div v-if="thread" class="flex shrink-0 items-center gap-space-2" role="group" aria-label="Thread actions">
          <!-- D-72: chase, close by hand, flag for a follow-up -->
          <Tooltip v-if="role.internal && canRemindNow" label="Send reminder" placement="bottom">
            <Button v-bind="toolProps" aria-label="Send reminder" @onClick="reminding = true"><template #leftIcon><BellRing aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip v-if="role.internal && !deleted && thread.triage !== 'resolved'" label="Mark resolved" placement="bottom">
            <Button v-bind="toolProps" aria-label="Mark resolved" @onClick="resolve"><template #leftIcon><CircleCheck aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip v-else-if="role.internal && !deleted" label="Reopen" placement="bottom">
            <Button v-bind="toolProps" aria-label="Reopen" @onClick="reopen"><template #leftIcon><RotateCcw aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip v-if="role.internal && !deleted" :label="thread.followUpAt ? 'Change follow-up' : 'Follow up'" placement="bottom">
            <Button v-bind="toolProps" :is-active="!!thread.followUpAt" :aria-label="thread.followUpAt ? 'Change follow-up' : 'Follow up'" @onClick="followingUp = true"><template #leftIcon><CalendarClock aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip label="Mark as unread" placement="bottom">
            <Button v-bind="toolProps" aria-label="Mark as unread" @onClick="$emit('unread', threadId)"><template #leftIcon><Mail aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip v-if="deleted" label="Restore" placement="bottom">
            <Button v-bind="toolProps" aria-label="Restore" @onClick="$emit('restore', threadId)"><template #leftIcon><ArchiveRestore aria-hidden="true" /></template></Button>
          </Tooltip>
          <Tooltip v-else label="Delete" placement="bottom">
            <Button v-bind="toolProps" aria-label="Delete" @onClick="$emit('delete', threadId)"><template #leftIcon><Trash2 aria-hidden="true" /></template></Button>
          </Tooltip>
          <Button label="Open thread" variant="text" color-scheme="primary" size="small" class="ml-space-4" @onClick="$emit('open', threadId)" />
        </div>
      </header>

      <LoadRegion :load="load" class="min-h-0 flex-1 overflow-y-auto p-space-20" @retry="fetch">
        <template #default>
          <div class="flex min-h-full flex-col gap-space-32">
            <p v-if="notice" class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">{{ notice }}</p>
            <AiSummary v-if="summary" :groups="summary.groups" :evidence="summary.evidence" status="ready" @trace="trace" @feedback="notice = 'Thanks. The summary was flagged for review.'" />
            <ThreadStream ref="stream" :entries="entries" :highlight-id="highlightId" @open-attachment="openFiles" @download-attachment="downloadFile" @navigate="$emit('open', threadId)" />
            <!-- A deleted thread takes no reply (D-67): restore it first -->
            <p v-if="deleted" class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">This email is in Deleted. Restore it to reply.</p>
            <Composer
              v-else
              ref="composer"
              :draft-key="threadId"
              :allow-note="role.internal"
              :busy="write.status === 'loading'"
              footer-class="-bottom-space-20 -mx-space-20 px-space-20 pb-space-20"
              @send="send"
              @open-attachment="openFiles"
            />
          </div>
        </template>
        <template #skeleton>
          <ThreadStream loading />
        </template>
      </LoadRegion>
      <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
      <ReminderModal :open="reminding" :thread="thread" :busy="write.status === 'loading'" @close="reminding = false" @confirm="remind" />
      <FollowUpModal :open="followingUp" :thread="thread" :busy="write.status === 'loading'" @close="followingUp = false" @confirm="followUpOn" />
    </template>
  </section>
</template>

<script>
import { Mail, Trash2, ArchiveRestore, BellRing, CircleCheck, RotateCcw, CalendarClock } from '@development/linarc-icons';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import AiSummary from '~/candidates/AiSummary/AiSummary.vue';
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import { TRIAGE, VISIBILITY, CORRESPONDENCE_TYPE, toneToChipStatus } from '~/modules/app/status';
import {
  getThread, getDeletedThreads, viewFor, recordLabel, sendMessage, postNote, markRead, isUnreadFor, getPeople,
  ownerOf, followUpFor, canRemind, assignOwner, resolveThread, reopenThread, setFollowUp, sendReminder,
} from '~/modules/correspondence/data';
import { threadEntries, summaryView } from '~/modules/correspondence/view';
import { fileViewing } from '~/modules/correspondence/fileViewing';
import Composer from './Composer.vue';
import ReminderModal from './ReminderModal.vue';
import FollowUpModal from './FollowUpModal.vue';

export default {
  name: 'ReadingPane',
  components: { Mail, Trash2, ArchiveRestore, BellRing, CircleCheck, RotateCcw, CalendarClock, Button, Chip, StatusChip, Tooltip, SelectV2, LoadRegion, Skeleton, AiSummary, ThreadStream, FileViewer, Composer, ReminderModal, FollowUpModal },
  mixins: [fileViewing],
  props: {
    threadId: { type: String, default: '' },
    /** The viewer (D-41): decides notes, cost and the audit before anything renders. */
    role: { type: Object, required: true },
    /** The thread is in the Deleted folder: Restore instead of Delete, no reply (D-67). */
    deleted: { type: Boolean, default: false },
    emptyText: { type: String, default: 'Select an email to read it here.' },
  },
  // open(threadId) · changed(threadId): a message or note was written, the list may re-read · read(threadId): opened,
  // so no longer unread for the viewer · unread(threadId) · delete(threadId) · restore(threadId)
  data() {
    return {
      thread: null,
      load: createLoad({ label: 'thread' }),
      write: createLoad({ label: 'message', action: { busy: 'Sending', done: 'Sent', error: "Couldn't send." } }),
      highlightId: '',
      notice: '',
      reminding: false,
      followingUp: false,
      VISIBILITY,
      CORRESPONDENCE_TYPE,
      // the icon-only button, as MessageTools draws its tools
      toolProps: { colorScheme: 'secondary', variant: 'minimal', size: 'medium', nativeType: 'button' },
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
    linkedText() {
      return this.thread && this.thread.linkedRecordIds.length ? this.thread.linkedRecordIds.map(recordLabel).join(', ') : '';
    },
    // --- triage (D-72)
    teamOptions() {
      return getPeople().filter((p) => !p.guest).map((p) => ({ value: p.id, label: p.name }));
    },
    ownerId() {
      return ownerOf(this.thread);
    },
    followUp() {
      return followUpFor(this.thread);
    },
    followUpText() {
      return this.followUp === 'none' ? '' : this.$moment(this.thread.followUpAt).format('D MMM');
    },
    canRemindNow() {
      return canRemind(this.thread);
    },
  },
  watch: {
    threadId: {
      immediate: true,
      handler(id) {
        // Another thread is a first load, not a refresh: the pane empties and the skeleton follows after 200ms,
        // rather than keeping the previous thread under the new subject (D-24 keeps content only for the same data).
        this.notice = '';
        this.highlightId = '';
        this.thread = null;
        this.load.destroy();
        this.load = createLoad({ label: 'thread' });
        if (id) this.fetch();
      },
    },
  },
  beforeDestroy() {
    this.load.destroy();
    this.write.destroy();
  },
  methods: {
    chip: (tone) => toneToChipStatus(tone),
    /** A deleted thread is read from the Deleted set (getThread covers the inbox only). */
    source(id) {
      return getThread(id) || getDeletedThreads().find((t) => t.id === id) || null;
    },
    fetch() {
      const id = this.threadId;
      this.load.run(
        (signal) => mockRequest(() => viewFor(this.source(id), this.role), { signal }),
        (thread) => {
          this.thread = thread;
          // Opening reads it (D-67): the list's row loses its bold
          if (thread && isUnreadFor(thread, this.role.personId)) {
            markRead(id, this.role.personId);
            this.$emit('read', id);
          }
        },
      );
    },
    send({ mode, body, bodyHtml, attachments, links }) {
      const id = this.threadId;
      const senderId = this.role.personId;
      this.write.run(
        (signal) => mockRequest(() => (mode === 'note' ? postNote(id, { senderId, body, bodyHtml, links }) : sendMessage(id, { senderId, body, bodyHtml, attachments, links })), { signal }),
        () => {
          if (this.$refs.composer) this.$refs.composer.reset();
          this.notice = mode === 'note' ? 'Note posted for your team.' : 'Sent. Replies land in this thread.';
          this.fetch();
          this.$emit('changed', id);
        },
      );
    },
    // --- triage (D-72): each write re-reads the thread and tells the list (counts, chips, the Owner column)
    writeThen(fn, notice) {
      const id = this.threadId;
      this.write.run(
        (signal) => mockRequest(() => fn(), { signal }),
        () => {
          this.notice = notice || '';
          this.fetch();
          this.$emit('changed', id);
        },
      );
    },
    assign(ownerId) {
      if (!ownerId || ownerId === this.ownerId) return;
      const name = (this.teamOptions.find((o) => o.value === ownerId) || {}).label;
      this.writeThen(() => assignOwner(this.threadId, ownerId, { actorId: this.role.personId }), `Assigned to ${name}.`);
    },
    resolve() {
      this.writeThen(() => resolveThread(this.threadId, { actorId: this.role.personId }), 'Marked resolved. Nothing is owed on this thread.');
    },
    reopen() {
      this.writeThen(() => reopenThread(this.threadId, { actorId: this.role.personId }), 'Reopened.');
    },
    remind(body) {
      this.writeThen(() => sendReminder(this.threadId, { senderId: this.role.personId, body }), 'Reminder sent. It is on the Delivery tab with the count.');
      this.reminding = false;
    },
    followUpOn(date) {
      this.writeThen(() => setFollowUp(this.threadId, date, { actorId: this.role.personId }), date ? `Follow up on ${this.$moment(date).format('D MMM')}.` : 'Follow-up cleared.');
      this.followingUp = false;
    },
    /** AiSummary "Source": scroll to and highlight the first source entry (D-44). */
    trace(ids) {
      const id = ids[0];
      this.highlightId = id;
      const el = document.getElementById(`entry-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  },
};
</script>

<style scoped>
/* The owner select hugs a name (D-70); no width token fits a select sized to a string (needs-token). */
.owner-select {
  width: 160px;
}
</style>

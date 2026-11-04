<template>
  <!-- The reading pane of the Email screen's Reading view (D-65): the selected thread, read and answered without
       leaving the list. A composition (no candidate): a fixed header with the subject, the id chip and the Status: chip
       (Confidential when restricted) and *Open thread* at the right; one scrolling body (padding inside it, F-051) with
       the AiSummary and ThreadStream candidates and the thread composer, as the thread screen draws them; the thread's
       Linked items and Delivery stay on the full screen (*Open thread*). Loads through LoadRegion (D-24): nothing for
       200ms, then skeletons; the content is kept while another thread's answer is pending. Nothing selected: plain text. -->
  <section class="flex h-full min-h-0 flex-col bg-surface-container" aria-label="Reading pane">
    <p v-if="!threadId" class="m-0 px-space-20 py-space-24 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">Select an email to read it here.</p>
    <template v-else>
      <header class="flex shrink-0 items-start gap-space-12 border-b border-border-subtle px-space-20 py-space-12">
        <div class="flex min-w-0 flex-1 flex-col gap-space-4">
          <h2 v-if="thread" class="m-0 font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ thread.subject }}</h2>
          <Skeleton v-else size="md" class="w-space-124" :class="{ invisible: !load.indicator }" />
          <div v-if="thread" class="flex flex-wrap items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
            <Chip :label="thread.id" size="small" fill-style="solid" type="default" :removable="false" />
            <span class="inline-flex items-center gap-space-8">
              Status:
              <StatusChip :label="triage.label" :status="chip(triage.tone)" fill-style="outline" type="default" :removable="false" />
              <StatusChip v-if="thread.visibility === 'restricted'" :label="VISIBILITY.restricted.label" :status="chip(VISIBILITY.restricted.tone)" fill-style="outline" type="default" :removable="false" />
            </span>
            <span v-if="linkedText" class="truncate">{{ linkedText }}</span>
          </div>
        </div>
        <Button label="Open thread" variant="text" color-scheme="primary" size="small" class="shrink-0" @onClick="$emit('open', threadId)" />
      </header>

      <LoadRegion :load="load" class="min-h-0 flex-1 overflow-y-auto p-space-20" @retry="fetch">
        <template #default>
          <div class="flex flex-col gap-space-32">
            <p v-if="notice" class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">{{ notice }}</p>
            <AiSummary v-if="summary" :groups="summary.groups" :evidence="summary.evidence" status="ready" @trace="trace" @feedback="notice = 'Thanks. The summary was flagged for review.'" />
            <ThreadStream ref="stream" :entries="entries" :highlight-id="highlightId" @open-attachment="openFiles" @download-attachment="downloadFile" @navigate="$emit('open', threadId)" />
            <Composer ref="composer" :draft-key="threadId" :allow-note="role.internal" :busy="write.status === 'loading'" @send="send" @open-attachment="openFiles" />
          </div>
        </template>
        <template #skeleton>
          <ThreadStream loading />
        </template>
      </LoadRegion>
      <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
    </template>
  </section>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import AiSummary from '~/candidates/AiSummary/AiSummary.vue';
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import { TRIAGE, VISIBILITY, toneToChipStatus } from '~/modules/app/status';
import { getThread, viewFor, recordLabel, sendMessage, postNote } from '~/modules/correspondence/data';
import { threadEntries, summaryView } from '~/modules/correspondence/view';
import { fileViewing } from '~/modules/correspondence/fileViewing';
import Composer from './Composer.vue';

export default {
  name: 'ReadingPane',
  components: { Button, Chip, StatusChip, LoadRegion, Skeleton, AiSummary, ThreadStream, FileViewer, Composer },
  mixins: [fileViewing],
  props: {
    threadId: { type: String, default: '' },
    /** The viewer (D-41): decides notes, cost and the audit before anything renders. */
    role: { type: Object, required: true },
  },
  // open(threadId) · changed(threadId): a message or note was written, the list may re-read
  data() {
    return {
      thread: null,
      load: createLoad({ label: 'thread' }),
      write: createLoad({ label: 'message', action: { busy: 'Sending', done: 'Sent', error: "Couldn't send." } }),
      highlightId: '',
      notice: '',
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
    linkedText() {
      return this.thread && this.thread.linkedRecordIds.length ? this.thread.linkedRecordIds.map(recordLabel).join(', ') : '';
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
    fetch() {
      const id = this.threadId;
      this.load.run(
        (signal) => mockRequest(() => viewFor(getThread(id), this.role), { signal }),
        (thread) => {
          this.thread = thread;
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

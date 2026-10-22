<template>
  <!-- RFI › Q&A (Figma ☉ Create RFI › Q&A 1703:45222; docs/correspondence/rfi-integration.md §C): the formal record, one
       step per entry: avatar, name, the step's kind, company, time, text and files. A step filed from an email carries
       *From email* back to the message (D-49); *Email this* starts Compose with the step quoted. Under the steps, the
       response editor (kind, text, files) adds the next step in Linarc. -->
  <div class="flex flex-col gap-space-24 font-label">
    <ol class="m-0 flex list-none flex-col p-0">
      <li v-for="s in steps" :id="`qa-${s.id}`" :key="s.id" class="flex gap-space-12 border-b border-border-subtle py-space-16 first:pt-0">
        <Avatar :img="s.avatarUrl || undefined" :full-name-initials="s.initials" color="auto" :color-seed="s.name" :aria-label="s.name" size="sm" shape="circle" class="shrink-0" />
        <div class="flex min-w-0 flex-1 flex-col gap-space-8">
          <div class="flex flex-wrap items-center gap-x-space-8 gap-y-space-2 text-fontsize-12 leading-lineheight-16 text-text-subtle">
            <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Step {{ s.n }} · {{ s.name }}</span>
            <Chip :label="s.kindLabel" size="small" fill-style="solid" type="default" :removable="false" />
            <span>{{ s.company }}</span>
            <span>{{ when(s.at) }}</span>
          </div>
          <p class="m-0 whitespace-pre-line text-fontsize-14 leading-lineheight-20 text-text-default">{{ s.body }}</p>
          <FileTiles v-if="s.files.length" :files="s.files" :label="`Step ${s.n} files`" @open="(f, all, i) => $emit('open-files', f, all, i)" @download="$emit('download-file', $event)" />
          <div class="flex flex-wrap items-center gap-x-space-8 gap-y-space-4">
            <Button v-if="s.fromEmail" label="From email · View message" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-message', s.fromEmail)" />
            <Button v-if="canEmail" label="Email this" variant="text" color-scheme="secondary" size="small" @onClick="$emit('email-step', s)" />
          </div>
        </div>
      </li>
    </ol>

    <section v-if="!record.closed" class="flex flex-col gap-space-12" aria-label="Add a step">
      <div class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
        <SelectV2 v-model="kind" class="w-full sm:w-1/3 lg:w-1/4" size="small" :options="kindOptions" :allow-search="false" aria-label="Step type" />
        <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Adds Step {{ steps.length + 1 }}. Everyone on the RFI sees it; nothing is emailed.</span>
      </div>
      <TextareaField :field="field" :value="body" @input="body = $event" />
      <div v-if="attachOpen" class="flex flex-col gap-space-8">
        <DropArea size="small" label="Drop files here" link-text="browse" :multiple="true" media-types-text="Any file type" :browse-button-icon="null" @on-upload="addFiles" />
        <FileTiles v-if="files.length" :files="files" label="Files to add" :downloadable="false" removable @open="(f, all, i) => $emit('open-files', f, all, i)" @remove="removeFile($event.id)" />
      </div>
      <div class="flex flex-wrap items-center justify-between gap-space-8">
        <Button :label="attachOpen ? 'Hide attachments' : attachments.length ? `Add attachment (${attachments.length})` : 'Add attachment'" color-scheme="secondary" variant="minimal" size="small" @onClick="attachOpen = !attachOpen" />
        <Button :label="`Add Step ${steps.length + 1}`" color-scheme="primary" variant="solid" size="medium" :is-disabled="!body.trim() || busy" @onClick="submit" />
      </div>
    </section>
  </div>
</template>

<script>
import Avatar from '@/components/Avatar/Avatar.vue';
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import DropArea from '@/componentsV2/DropArea/DropArea.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import FileTiles from '../FileTiles.vue';
import { getPerson, getFile, newAttachment, QA_KINDS } from '../../data';
import { fileView } from '../../view';

const initials = (name) => (name || '').replace(/,.*$/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default {
  name: 'RfiQa',
  components: { Avatar, Button, Chip, SelectV2, DropArea, TextareaField, FileTiles },
  props: {
    record: { type: Object, required: true },
    /** Internal roles can email a step */
    canEmail: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  // open-message ({ threadId, messageId }) · email-step (step view) · add ({ kind, body, attachments }) · open-files · download-file
  data() {
    return { kind: 'response', body: '', attachOpen: false, attachments: [] };
  },
  computed: {
    steps() {
      return this.record.qa.map((s, i) => {
        const p = getPerson(s.authorId) || { name: 'Unknown', company: '' };
        return {
          id: s.id,
          n: i + 1,
          name: p.name,
          initials: initials(p.name),
          avatarUrl: p.avatarUrl || '',
          company: p.company,
          authorId: s.authorId,
          kindLabel: QA_KINDS[s.kind],
          at: s.at,
          body: s.body == null ? this.record.question : s.body,
          files: [...(s.attachmentIds || []).map(getFile).filter(Boolean), ...(s.attachments || [])].map(fileView),
          fromEmail: s.source === 'email' && s.threadId ? { threadId: s.threadId, messageId: s.messageId } : null,
        };
      });
    },
    kindOptions() {
      return ['response', 'comment', 'question'].map((k) => ({ value: k, label: QA_KINDS[k] }));
    },
    field() {
      return { id: 'qa-response', placeholder: 'Type your response here…', props: { rows: 4 } };
    },
    files() {
      return this.attachments.map(fileView);
    },
  },
  methods: {
    when(iso) {
      return this.$moment(iso).format('D MMM YYYY, HH:mm');
    },
    addFiles({ files } = {}) {
      [...(files || [])].forEach((f) => this.attachments.push(newAttachment(f)));
    },
    removeFile(id) {
      this.attachments = this.attachments.filter((a) => a.id !== id);
    },
    submit() {
      if (!this.body.trim() || this.busy) return;
      this.$emit('add', { kind: this.kind, body: this.body.trim(), attachments: this.attachments });
    },
    /** The screen calls this once the write is acknowledged. */
    reset() {
      this.body = '';
      this.attachments = [];
      this.attachOpen = false;
    },
  },
};
</script>

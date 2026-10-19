<template>
  <!-- Thread composer (docs/correspondence/spec.md §6.3): a composition of existing components, not a candidate (D-38).
       Mode select (Reply to all / Internal team note; internal roles only), the library's textarea, an attachment
       toggle with DropArea and the picked files as tiles (FileTiles: open, remove), one label-only button
       whose label follows the mode. Note mode tints the composer like the note it will create, so nobody mistakes
       which they are writing. The button disables while sending (§6). -->
  <div class="flex flex-col gap-space-12 pt-space-16" :class="mode === 'note' ? 'rounded-radius-6 bg-surface-warning-low-subtle p-space-12' : ''">
    <div v-if="allowNote" class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
      <SelectV2 v-model="mode" class="w-full sm:w-1/3 lg:w-1/4" size="small" :options="modes" :allow-search="false" aria-label="Message type" />
      <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
        {{ mode === 'note' ? 'Only your team sees notes.' : 'Everyone on the thread gets this; they can answer from their own mail.' }}
      </span>
    </div>
    <TextareaField :field="field" :value="body" @input="body = $event" />
    <div v-if="attachOpen" class="flex flex-col gap-space-8">
      <DropArea size="small" label="Drop files here" link-text="browse" :multiple="true" :media-types-text="dropHint" :browse-button-icon="null" @on-upload="addFiles" />
      <FileTiles v-if="files.length" :files="files" label="Files to send" :downloadable="false" removable @open="(f, all, i) => $emit('open-attachment', f, all, i)" @remove="removeFile($event.id)" />
    </div>
    <div class="flex flex-wrap items-center justify-between gap-space-8">
      <Button :label="attachOpen ? 'Hide attachments' : attachments.length ? `Attach files (${attachments.length})` : 'Attach files'" color-scheme="secondary" variant="minimal" size="small" @onClick="attachOpen = !attachOpen" />
      <Button :label="mode === 'note' ? 'Post note' : 'Send'" color-scheme="primary" variant="solid" size="medium" :is-disabled="!body.trim() || busy" @onClick="submit" />
    </div>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import DropArea from '@/componentsV2/DropArea/DropArea.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import FileTiles from './FileTiles.vue';
import { newAttachment } from '../data/actions';
import { fileView } from '../view';
import { MAIL_SIZE_LIMIT_MB } from '../data/project';

export default {
  name: 'Composer',
  components: { Button, SelectV2, DropArea, TextareaField, FileTiles },
  props: {
    /** Internal roles may post notes; external roles only reply. */
    allowNote: { type: Boolean, default: true },
    busy: { type: Boolean, default: false },
  },
  data() {
    return {
      mode: 'reply',
      modes: [
        { value: 'reply', label: 'Reply to all' },
        { value: 'note', label: 'Internal team note' },
      ],
      body: '',
      attachOpen: false,
      attachments: [],
    };
  },
  computed: {
    dropHint() {
      return `Any file type. Over ${MAIL_SIZE_LIMIT_MB} MB goes by secure link.`;
    },
    /** The picked files as the tiles and the viewer take them (previews come from the file store). */
    files() {
      return this.attachments.map(fileView);
    },
    field() {
      return { id: 'composer', placeholder: this.mode === 'note' ? 'Write a note for your team…' : 'Write a reply…', props: { rows: 3 } };
    },
  },
  methods: {
    addFiles({ files } = {}) {
      [...(files || [])].forEach((f) => this.attachments.push(newAttachment(f)));
    },
    removeFile(id) {
      this.attachments = this.attachments.filter((a) => a.id !== id);
    },
    submit() {
      if (!this.body.trim() || this.busy) return;
      this.$emit('send', { mode: this.mode, body: this.body.trim(), attachments: this.attachments });
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

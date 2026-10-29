<template>
  <!-- The compact tool row under a message (docs/correspondence/spec.md §6.3, §7; D-58), shared by the thread composer
       and the compose panel. Left, icon-only with tooltips: attach a file (device), a link, a cloud-drive file, a
       record, and (when the host passes `formatting`) the Formatting toggle. Right: Discard set apart, confirming when
       there is something to lose; Save draft; the one primary button. The pickers are compact ModalV2s around the
       SmartPicker candidate (search, quick filters, Suggested / Recent; D-61); the chips
       live in AttachmentChips, wherever the host puts them. Attachments are owned by the host (`attachments` in,
       `add` / `remove` out), so a draft can keep them. -->
  <div class="flex w-full flex-wrap items-center gap-x-space-16 gap-y-space-8">
    <div class="flex items-center gap-space-2" role="toolbar" aria-label="Attach and format">
      <Tooltip v-for="t in tools" :key="t.id" :label="t.label" placement="top">
        <Button v-bind="toolProps" :aria-label="t.label" @onClick="t.run">
          <template #leftIcon><component :is="t.icon" aria-hidden="true" /></template>
        </Button>
      </Tooltip>
      <Tooltip v-if="formatting !== null" :label="formatting ? 'Hide formatting' : 'Show formatting'" placement="top">
        <Button v-bind="toolProps" :is-active="formatting" aria-label="Formatting" :aria-pressed="String(formatting)" @onClick="$emit('update:formatting', !formatting)">
          <template #leftIcon><Type aria-hidden="true" /></template>
        </Button>
      </Tooltip>
    </div>
    <div class="ml-auto flex flex-wrap items-center gap-space-8">
      <!-- Discard stands apart from the actions that keep the draft -->
      <Tooltip label="Discard draft" placement="top">
        <Button v-bind="toolProps" :is-disabled="empty || busy" aria-label="Discard draft" @onClick="discardOpen = true">
          <template #leftIcon><Trash2 aria-hidden="true" /></template>
        </Button>
      </Tooltip>
      <span class="mx-space-4 h-space-24 border-l border-border-subtle" aria-hidden="true" />
      <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle" role="status" aria-live="polite">{{ saved ? 'Draft saved.' : '' }}</span>
      <Button label="Save draft" color-scheme="secondary" variant="outline" size="medium" :is-disabled="empty || saved || busy" @onClick="$emit('save')" />
      <Button :label="sendLabel" color-scheme="primary" variant="solid" size="medium" :is-disabled="!canSend || busy" @onClick="$emit('send')" />
    </div>

    <input ref="file" type="file" multiple class="sr-only" tabindex="-1" aria-hidden="true" @change="onFilePick" />
    <AttachLinkModal :visible="linkOpen" @attach="addLink" @close="linkOpen = false" />
    <AttachPickerModal
      :visible="picker === 'cloud'"
      title="Choose from cloud drive"
      description="Files from the project's connected drives. A pick is sent as a copy."
      :items="cloudItems"
      :kinds="cloudKinds"
      noun="files"
      placeholder="Search by file name or folder"
      @pick="addPicks"
      @close="picker = ''"
    />
    <AttachPickerModal
      :visible="picker === 'record'"
      title="Attach a record"
      description="A PDF of each record goes with the message."
      :items="recordItems"
      :kinds="recordKinds"
      noun="records"
      placeholder="Search by code or title"
      @pick="addPicks"
      @close="picker = ''"
    />
    <ModalV2
      :is-visible="discardOpen"
      title="Discard this draft?"
      :content="discardText"
      primary-label="Discard"
      secondary-label="Keep editing"
      @onPrimaryClick="$emit('discard')"
      @closeModal="discardOpen = false"
    />
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import { Paperclip, Link as LinkIcon, Cloud, FileBox, Type, Trash2 } from '@development/linarc-icons';
import AttachLinkModal from './AttachLinkModal.vue';
import AttachPickerModal from './AttachPickerModal.vue';
import { newAttachment, recordAttachment, cloudAttachment } from '../data/actions';
import { CLOUD_KINDS, pickerCloudFiles } from '../data/cloud';
import { RECORD_KINDS, pickerRecords } from '../data/records';
import { recentRecordIds } from '../data/threads';
import { MAIL_SIZE_LIMIT_MB } from '../data/project';

let seq = 0;

export default {
  name: 'MessageTools',
  components: { Button, ModalV2, Tooltip, Type, Trash2, AttachLinkModal, AttachPickerModal },
  props: {
    /** The host's attachments (AttachmentChips shows them); `add` and `remove` ask the host to change them. */
    attachments: { type: Array, default: () => [] },
    /** The primary button's label: Send, Post note, … */
    sendLabel: { type: String, default: 'Send' },
    canSend: { type: Boolean, default: false },
    /** Nothing to discard or save yet */
    empty: { type: Boolean, default: true },
    saved: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    /** The Formatting toggle's state; `null` hides the toggle (an editor whose bar is always open) */
    formatting: { type: Boolean, default: null },
    /** Named in the discard confirmation when a saved draft would go too */
    hasSavedDraft: { type: Boolean, default: false },
    /** Records the host already knows about (the thread's, the pinned one): first in *Attach a record* (D-61) */
    suggestedRecordIds: { type: Array, default: () => [] },
  },
  data() {
    return { linkOpen: false, picker: '', discardOpen: false };
  },
  computed: {
    /** The editor's own tool buttons: 32px, minimal, 18px icon (P-049). */
    toolProps() {
      return { colorScheme: 'secondary', variant: 'minimal', size: 'medium', nativeType: 'button', isDisabled: this.busy };
    },
    tools() {
      return [
        { id: 'file', label: 'Attach file', icon: Paperclip, run: () => this.$refs.file.click() },
        { id: 'link', label: 'Attach link', icon: LinkIcon, run: () => { this.linkOpen = true; } },
        { id: 'cloud', label: 'Choose from cloud drive', icon: Cloud, run: () => { this.picker = 'cloud'; } },
        { id: 'record', label: 'Attach a record', icon: FileBox, run: () => { this.picker = 'record'; } },
      ];
    },
    cloudItems() {
      return pickerCloudFiles(MAIL_SIZE_LIMIT_MB);
    },
    cloudKinds() {
      return CLOUD_KINDS;
    },
    recordItems() {
      return pickerRecords({ suggestedIds: this.suggestedRecordIds, recentIds: recentRecordIds() });
    },
    recordKinds() {
      return RECORD_KINDS;
    },
    discardText() {
      const n = this.attachments.length;
      const files = n ? ` and its ${n === 1 ? 'attachment' : `${n} attachments`}` : '';
      return `The message${files} ${n ? 'are' : 'is'} removed${this.hasSavedDraft ? ', and the saved draft with it' : ''}. This can't be undone.`;
    },
  },
  methods: {
    onFilePick(e) {
      [...(e.target.files || [])].forEach((f) => this.$emit('add', newAttachment(f)));
      e.target.value = '';
    },
    addLink({ url, name }) {
      seq += 1;
      this.$emit('add', { id: `link-${Date.now().toString(36)}-${seq}`, kind: 'link', url, name });
      this.linkOpen = false;
    },
    addPicks(ids) {
      const make = this.picker === 'cloud' ? cloudAttachment : recordAttachment;
      ids.forEach((id) => {
        if (this.attachments.some((a) => a.cloudId === id || a.recordId === id)) return; // already attached
        const a = make(id);
        if (a) this.$emit('add', a);
      });
      this.picker = '';
    },
  },
};
</script>

<template>
  <!-- Thread composer (docs/correspondence/spec.md §6.3): a composition of existing components, not a candidate (D-38).
       Mode select (Reply to all / Internal team note; internal roles only), the library's textarea, an attachment
       toggle with DropArea, one label-only button whose label follows the mode. Note mode tints the composer like the
       note it will create, so nobody mistakes which they are writing. The button disables while sending (§6). -->
  <div class="flex flex-col gap-space-12 pt-space-16" :class="mode === 'note' ? 'rounded-radius-6 bg-surface-warning-low-subtle p-space-12' : ''">
    <div v-if="allowNote" class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
      <SelectV2 v-model="mode" class="w-full sm:w-1/3 lg:w-1/4" size="small" :options="modes" :allow-search="false" aria-label="Message type" />
      <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
        {{ mode === 'note' ? 'Only your team sees notes.' : 'Everyone on the thread gets this; they can answer from their own mail.' }}
      </span>
    </div>
    <TextareaField :field="field" :value="body" @input="body = $event" />
    <div v-if="attachOpen" class="flex flex-col gap-space-8">
      <DropArea size="small" label="Drop files here" link-text="browse" @on-upload="addFiles" />
      <ul v-if="attachments.length" class="m-0 flex list-none flex-col gap-space-4 p-0 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
        <li v-for="a in attachments" :key="a.id">{{ a.name }} · {{ a.sizeMb }} MB{{ a.byLink ? ' · delivered by secure link' : '' }}</li>
      </ul>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-space-8">
      <Button :label="attachOpen ? 'Hide attachments' : 'Attach files'" color-scheme="secondary" variant="minimal" size="small" @onClick="attachOpen = !attachOpen" />
      <Button :label="mode === 'note' ? 'Post note' : 'Send'" color-scheme="primary" variant="solid" size="medium" :is-disabled="!body.trim() || busy" @onClick="submit" />
    </div>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import DropArea from '@/componentsV2/DropArea/DropArea.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import { MAIL_SIZE_LIMIT_MB } from '../data/project';

let seq = 0;

export default {
  name: 'Composer',
  components: { Button, SelectV2, DropArea, TextareaField },
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
    field() {
      return { id: 'composer', placeholder: this.mode === 'note' ? 'Write a note for your team…' : 'Write a reply…', props: { rows: 3 } };
    },
  },
  methods: {
    addFiles({ files } = {}) {
      [...(files || [])].forEach((f) => {
        seq += 1;
        const sizeMb = Math.round((f.size / 1048576) * 10) / 10;
        this.attachments.push({ id: `att-new-${seq}`, name: f.name, sizeMb, byLink: sizeMb > MAIL_SIZE_LIMIT_MB });
      });
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

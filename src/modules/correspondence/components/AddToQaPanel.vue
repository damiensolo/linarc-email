<template>
  <!-- Add to Q&A (docs/correspondence/rfi-integration.md §C, D-49): an inbound email becomes a step in the RFI's Q&A
       without retyping it. A SlideOverPanel beside the thread with the message kept highlighted (as Promote, D-37):
       step type (Response when the sender has the ball, else Comment), who it is from, the text with quoted history
       and the sign-off taken out (and listed, so nothing disappears silently), and the message's files. Nothing is
       sent to anyone; the reviewer still makes a response official on the Review step. -->
  <SlideOverPanel :open="open" title="Add to Q&A" :badge="record ? record.code : ''" size="md" @close="$emit('close')">
    <template #header-meta>
      <p class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
        Files {{ senderName }}'s email as Step {{ stepNumber }} of the RFI's Q&A, linked to the message. Nothing is sent.
      </p>
    </template>

    <div class="flex flex-col gap-space-24 font-label">
      <div class="flex flex-col gap-space-4">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">From</span>
        <span class="text-fontsize-14 leading-lineheight-20 text-text-default">{{ senderName }}<span class="text-text-subtle"> · {{ senderCompany }}</span></span>
      </div>

      <SelectV2 v-model="kind" label="Step type" class="w-full sm:w-1/2" :options="kindOptions" :allow-search="false" />

      <div class="flex flex-col gap-space-4">
        <label for="fv2-qa-text" class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Text</label>
        <TextareaField :field="field" :value="text" @input="text = $event" />
        <span v-if="removed.length" class="text-fontsize-12 leading-lineheight-16 text-text-subtle">
          Left out: {{ removed.join(' · ') }}
        </span>
      </div>

      <div v-if="files.length" class="flex flex-col gap-space-8">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Files from the email</span>
        <Checkbox v-for="f in files" :key="f.id" :value="!!picked[f.id]" :label="`${f.name} · ${f.sizeMb} MB`" size="small" @input="$set(picked, f.id, $event)" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" color-scheme="secondary" variant="minimal" size="medium" :is-disabled="busy" @onClick="$emit('close')" />
      <Button :label="`Add as Step ${stepNumber}`" color-scheme="primary" variant="solid" size="medium" :is-disabled="!text.trim() || busy" @onClick="add" />
    </template>
  </SlideOverPanel>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import { QA_KINDS, stripQuoted } from '../data/rfi';

export default {
  name: 'AddToQaPanel',
  components: { Button, Checkbox, SelectV2, TextareaField, SlideOverPanel },
  props: {
    open: { type: Boolean, default: false },
    /** The RFI */
    record: { type: Object, default: null },
    /** The inbound message (a ThreadStream view entry: sender, body, attachments) */
    message: { type: Object, default: null },
    /** Who has the ball (the current step's party): their email is a Response, anyone else's a Comment */
    ballInCourtId: { type: String, default: null },
    busy: { type: Boolean, default: false },
  },
  data() {
    return { kind: 'comment', text: '', removed: [], picked: {} };
  },
  computed: {
    senderName() {
      return this.message ? this.message.sender.name : '';
    },
    senderCompany() {
      return this.message ? this.message.sender.company : '';
    },
    stepNumber() {
      return this.record ? this.record.qa.length + 1 : 1;
    },
    files() {
      return (this.message && this.message.attachments) || [];
    },
    kindOptions() {
      return ['response', 'comment', 'question'].map((k) => ({ value: k, label: QA_KINDS[k] }));
    },
    field() {
      return { id: 'qa-text', placeholder: 'What goes in the Q&A step', props: { rows: 8 } };
    },
  },
  watch: {
    open(open) {
      if (open) this.reset();
    },
  },
  created() {
    this.reset();
  },
  methods: {
    reset() {
      const m = this.message;
      if (!m) return;
      const { text, removed } = stripQuoted(m.body);
      this.text = text;
      this.removed = removed;
      this.kind = m.sender.id === this.ballInCourtId ? 'response' : 'comment';
      this.picked = Object.fromEntries(this.files.map((f) => [f.id, true]));
    },
    add() {
      if (!this.text.trim() || this.busy) return;
      this.$emit('add', { kind: this.kind, body: this.text.trim(), attachments: this.files.filter((f) => this.picked[f.id]) });
    },
  },
};
</script>

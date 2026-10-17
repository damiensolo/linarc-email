<template>
  <!-- Promote to record (docs/correspondence/spec.md §8, D-37): a SlideOverPanel beside the thread with the source
       message kept highlighted. Five pre-filled fields through FormV2 flat; RFI is the only target in the MVP (Q-10),
       so there is no type select. The Question is AI-drafted (D-44): it carries the AI chip and the §9 disclaimer until
       the person edits it, and Create stays disabled until the Question field has been visited once. -->
  <SlideOverPanel :open="open" title="Promote to record" :badge="threadId" size="md" @close="$emit('close')">
    <template #header-meta>
      <p class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
        Creates a formal RFI from {{ senderName }}'s message. The thread stays as the RFI's email; the message is kept word for word in the RFI's history.
      </p>
    </template>

    <FormV2 ref="form" v-model="values" :schema="schema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false" @blur="onBlur" @change="onChange">
      <template #field:question="{ field, value, change, blur }">
        <!-- FormV2 draws the field's label; this slot adds the AI tag above the control and the note under it (D-44). -->
        <div class="flex flex-col gap-space-4">
          <div class="flex flex-wrap items-center gap-space-8">
            <Tooltip v-if="!questionEdited" :label="AI_NOTE" placement="top">
              <span class="inline-flex rounded-radius-round focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="`Drafted by AI. ${AI_NOTE}`">
                <StatusChip label="Drafted by AI" status="ai" fill-style="outline" type="default" :removable="false" />
              </span>
            </Tooltip>
            <span v-else class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">Edited</span>
          </div>
          <TextareaField :field="field" :value="value" @input="change" @blur="blur" @focus.native="questionVisited = true" />
          <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">Drafted from the message; review and edit before creating. Nothing is sent to anyone by this step.</span>
        </div>
      </template>
      <template #footer><span /></template>
    </FormV2>

    <template #footer>
      <Button label="Cancel" color-scheme="secondary" variant="minimal" size="medium" :is-disabled="busy" @onClick="$emit('close')" />
      <Button label="Create RFI" color-scheme="primary" variant="solid" size="medium" :is-disabled="!canCreate || busy" :tooltip="canCreate ? '' : 'Review the question first'" @onClick="create" />
    </template>
  </SlideOverPanel>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import FormV2 from '@/componentsV2/FormV2/FormV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import { AI_NOTE } from '~/candidates/AiSummary/AiSummary.vue';

export default {
  name: 'PromotePanel',
  components: { Button, StatusChip, Tooltip, FormV2, TextareaField, SlideOverPanel },
  props: {
    open: { type: Boolean, default: false },
    threadId: { type: String, required: true },
    /** The inbound message being promoted (view entry with `promotion` pre-fill) */
    message: { type: Object, default: null },
    /** [{ value: personId, label }] for Assigned to */
    assigneeOptions: { type: Array, default: () => [] },
    busy: { type: Boolean, default: false },
  },
  data() {
    return { AI_NOTE, values: {}, questionVisited: false, questionEdited: false };
  },
  computed: {
    senderName() {
      return this.message && this.message.sender ? this.message.sender.name : 'the sender';
    },
    prefill() {
      return (this.message && this.message.promotion) || {};
    },
    /** The "Include from the email" items, one boolean checkbox field each (`inc:<id>`). */
    includeItems() {
      return this.prefill.include || [];
    },
    schema() {
      return {
        sections: [
          {
            id: 'promote',
            layout: { columns: 2, gap: '24px' },
            fields: [
              { id: 'title', type: 'text', label: 'Title', colSpan: 'full', rules: [{ type: 'required', message: 'Give the RFI a title' }] },
              { id: 'question', type: 'textarea', label: 'Question', colSpan: 'full', props: { rows: 6 }, rules: [{ type: 'required', message: 'The RFI needs a question' }] },
              { id: 'assignedTo', type: 'select', label: 'Assigned to', options: this.assigneeOptions, rules: [{ type: 'required', message: 'Choose who answers' }] },
              { id: 'dueOn', type: 'date', label: 'Due date', props: { width: 'short' } },
              ...this.includeItems.map((i, n) => ({
                id: `inc:${i.id}`,
                type: 'checkbox',
                // The group heading sits on the first item as its field label; the others carry only their own label.
                label: n === 0 ? 'Include from the email' : '',
                colSpan: 'full',
                props: { checkboxLabel: i.label },
              })),
            ],
          },
        ],
      };
    },
    canCreate() {
      return this.questionVisited && !!(this.values.title || '').trim() && !!(this.values.question || '').trim() && !!this.values.assignedTo;
    },
  },
  watch: {
    open(open) {
      if (open) this.resetValues();
    },
  },
  created() {
    this.resetValues();
  },
  methods: {
    resetValues() {
      const p = this.prefill;
      const values = {
        title: p.title || '',
        question: p.question || '',
        assignedTo: p.assignedToId || null,
        dueOn: p.dueOn ? p.dueOn.slice(0, 10) : null,
      };
      (p.include || []).forEach((i) => {
        values[`inc:${i.id}`] = !!i.checked;
      });
      this.values = values;
      this.questionVisited = false;
      this.questionEdited = false;
    },
    onBlur({ fieldId } = {}) {
      if (fieldId === 'question') this.questionVisited = true;
    },
    onChange({ fieldId, value } = {}) {
      if (fieldId === 'question' && value !== this.prefill.question) this.questionEdited = true;
    },
    create() {
      if (!this.canCreate || this.busy) return;
      const v = this.values;
      this.$emit('create', {
        title: v.title.trim(),
        question: v.question.trim(),
        assignedToId: v.assignedTo,
        dueOn: v.dueOn ? `${v.dueOn}T17:00:00` : null,
        includeIds: this.includeItems.filter((i) => v[`inc:${i.id}`]).map((i) => i.id),
        aiEdited: this.questionEdited,
      });
    },
  },
};
</script>

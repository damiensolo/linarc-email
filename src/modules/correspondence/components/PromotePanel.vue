<template>
  <!-- Promote to record (docs/correspondence/spec.md §8, D-37): a SlideOverPanel beside the thread with the source
       message kept highlighted. Five pre-filled fields through FormV2 flat. Since D-77 (2026-11-14) the record type is
       the first field: RFI (the formal question), Field issue (something to fix on site) or Potential change order
       (a cost or time claim; the amount for roles that may see cost). The drafted text is AI-drafted (D-44): it carries
       the AI chip and the §9 disclaimer until the person edits it, and Create stays disabled until it has been visited once. -->
  <SlideOverPanel :open="open" title="Promote to record" :badge="threadId" size="md" @close="$emit('close')">
    <template #header-meta>
      <p class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
        {{ typeNote }} The thread stays as the record's email; the message is kept word for word in its history.
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
      <Button :label="createLabel" color-scheme="primary" variant="solid" size="medium" :is-disabled="!canCreate || busy" :tooltip="canCreate ? '' : `Review the ${questionLabel.toLowerCase()} first`" @onClick="create" />
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
import { defaultResponseDue } from '../data/actions';

export default {
  name: 'PromotePanel',
  components: { Button, StatusChip, Tooltip, FormV2, TextareaField, SlideOverPanel },
  props: {
    open: { type: Boolean, default: false },
    threadId: { type: String, required: true },
    /** The inbound message being promoted (view entry with `promotion` pre-fill; without one the body is the draft) */
    message: { type: Object, default: null },
    /** The thread's subject: the title's fallback when the message carries no pre-fill */
    subject: { type: String, default: '' },
    /** [{ value: personId, label }] for Assigned to */
    assigneeOptions: { type: Array, default: () => [] },
    /** The viewer may see cost (D-41): the PCO's amount field shows */
    canSeeCost: { type: Boolean, default: false },
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
    /** The target (D-77): 'rfi' | 'field-issue' | 'change-order' */
    type() {
      return this.values.type || 'rfi';
    },
    typeOptions() {
      return [
        { value: 'rfi', label: 'RFI' },
        { value: 'field-issue', label: 'Field issue' },
        { value: 'change-order', label: 'Potential change order' },
        { value: 'daily-log', label: 'Daily log entry' },
      ];
    },
    typeNote() {
      return {
        rfi: `Creates a formal RFI from ${this.senderName}'s message.`,
        'field-issue': `Creates a field issue from ${this.senderName}'s message: something to fix on site, with who fixes it and by when.`,
        'change-order': `Creates a potential change order from ${this.senderName}'s message, for the cost or time it claims.`,
        'daily-log': `Adds ${this.senderName}'s message to today's daily log as an entry: what happened on site, with its photos. Nothing is assigned.`,
      }[this.type];
    },
    questionLabel() {
      return this.type === 'rfi' ? 'Question' : 'Description';
    },
    createLabel() {
      return { rfi: 'Create RFI', 'field-issue': 'Create field issue', 'change-order': 'Create PCO', 'daily-log': 'Add to daily log' }[this.type];
    },
    schema() {
      return {
        sections: [
          {
            id: 'promote',
            layout: { columns: 2, gap: '24px' },
            fields: [
              // D-77: the target first; the other fields read the same for every target
              { id: 'type', type: 'select', label: 'Record type', options: this.typeOptions, props: { width: 'short' } },
              { id: 'title', type: 'text', label: 'Title', colSpan: 'full', rules: [{ type: 'required', message: 'Give the record a title' }] },
              { id: 'question', type: 'textarea', label: this.questionLabel, colSpan: 'full', props: { rows: 6 }, rules: [{ type: 'required', message: `The record needs a ${this.questionLabel.toLowerCase()}` }] },
              ...(this.type === 'daily-log' ? [] : [
                { id: 'assignedTo', type: 'select', label: 'Assigned to', options: this.assigneeOptions, rules: [{ type: 'required', message: 'Choose who answers' }] },
                { id: 'dueOn', type: 'date', label: 'Due date', props: { width: 'short' } },
              ]),
              ...(this.type === 'change-order' && this.canSeeCost ? [{ id: 'amount', type: 'text', label: 'Estimated amount ($)', props: { width: 'short' } }] : []),
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
      // a daily log entry has no assignee (D-80)
      return this.questionVisited && !!(this.values.title || '').trim() && !!(this.values.question || '').trim() && (this.type === 'daily-log' || !!this.values.assignedTo);
    },
  },
  watch: {
    open(open) {
      if (open) this.resetValues();
    },
    /** A new target takes its own contractual due date (D-76) unless the person already changed the date. */
    'values.type'(type, was) {
      if (!was || !this.values.dueOn || this.values.dueOn !== this.dueFor(was)) return;
      this.values = { ...this.values, dueOn: this.dueFor(type) };
    },
  },
  created() {
    this.resetValues();
  },
  methods: {
    /** The due date a target starts with: the pre-fill's, else the contract's turnaround for it (D-76). */
    dueFor(type) {
      const p = this.prefill;
      if (p.dueOn) return p.dueOn.slice(0, 10);
      return defaultResponseDue({ rfi: 'rfi', 'change-order': 'change-order' }[type] || 'email').slice(0, 10);
    },
    resetValues() {
      const p = this.prefill;
      // Without a pre-fill the draft is the message itself: the subject (its project prefix dropped) and the body
      const values = {
        type: 'rfi',
        title: p.title || this.subject.replace(/^\[[^\]]+\]\s*/, '').replace(/^[A-Z]+-\d+\s*—\s*/, ''),
        question: p.question || (this.message && this.message.body) || '',
        amount: p.amount != null ? String(p.amount) : '',
        assignedTo: p.assignedToId || null,
        dueOn: this.dueFor('rfi'),
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
        type: this.type,
        amount: v.amount ? Number(String(v.amount).replace(/[^0-9.]/g, '')) : null,
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

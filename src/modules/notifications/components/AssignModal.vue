<template>
  <!-- Assign (docs/notifications/spec.md §8): the record's responsible party changes by the record's rules (an RFI step's
       party, a thread's owner). Compact ModalV2; the incoming owner gets the item as New. -->
  <ModalV2
    :is-visible="open"
    :title="`Assign: ${item.recordLabel || item.title}`"
    title-description="The next action moves to this person. Severity and due date don't change."
    primary-label="Assign"
    secondary-label="Cancel"
    :primary-disabled="!toId"
    :close-on-primary-click="false"
    @onPrimaryClick="submit"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <SelectV2 v-model="toId" label="Assign to" size="small" :options="people" :visible-item-count="8" />
        <div class="flex flex-col">
          <label :for="`fv2-${id}-note`" class="pb-space-8 font-medium text-fontsize-14 leading-lineheight-20 text-text-default">Note to the new owner (optional)</label>
          <TextareaField :field="noteField" :value="note" @input="note = $event" />
        </div>
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import { getPeople, currentRole } from '~/modules/correspondence/data';
import { assign } from '~/modules/notifications/data';

export default {
  name: 'AssignModal',
  components: { ModalV2, SelectV2, TextareaField },
  props: {
    open: { type: Boolean, default: false },
    item: { type: Object, required: true },
  },
  data() {
    return { id: `asg-${Math.random().toString(36).slice(2, 7)}`, toId: null, note: '' };
  },
  computed: {
    /** Internal team members first, then guests on the record (an external party can hold an RFI step). */
    people() {
      const me = currentRole().personId;
      return getPeople()
        .filter((p) => p.id !== this.item.responsibleId)
        .sort((a, b) => Number(a.guest) - Number(b.guest))
        .map((p) => ({ value: p.id, label: `${p.name} · ${p.company}${p.id === me ? ' (you)' : ''}` }));
    },
    noteField() {
      return { id: `${this.id}-note`, placeholder: 'What they need to know', props: { rows: 2 } };
    },
  },
  watch: {
    open(v) {
      if (v) Object.assign(this, { toId: null, note: '' });
    },
  },
  methods: {
    submit() {
      if (!this.toId) return;
      assign(this.item.key, this.toId, { note: this.note.trim() });
      this.$emit('done', { key: this.item.key, toId: this.toId });
    },
  },
};
</script>

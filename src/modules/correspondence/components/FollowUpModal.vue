<template>
  <!-- Follow up (D-72, 2026-11-14): a date the team wants the thread back in front of them, whatever the recipient does.
       A short single-step task, so a compact ModalV2 (D-34): one short date input (D-26), defaulting to the next
       working day; *Clear follow-up* when one is set. The thread then shows the date and surfaces in the Follow up view
       on that day; it is not a due date for the other side. -->
  <ModalV2
    :is-visible="open"
    :title="current ? 'Change the follow-up' : 'Follow up on this thread'"
    :title-description="thread ? thread.subject : ''"
    primary-label="Set follow-up"
    secondary-label="Cancel"
    :primary-disabled="!values.on || busy"
    :secondary-disabled="busy"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-12 font-label">
        <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">The thread comes back to the top of Follow up on this day. Only your team sees it; nothing is sent.</p>
        <FormV2 :key="formKey" v-model="values" :schema="schema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false">
          <template #footer><span /></template>
        </FormV2>
        <Button v-if="current" label="Clear follow-up" color-scheme="secondary" variant="text" size="small" class="self-start" :is-disabled="busy" @onClick="$emit('confirm', null)" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import FormV2 from '@/componentsV2/FormV2/FormV2.vue';
import { TODAY, addWorkingDays } from '../data';

export default {
  name: 'FollowUpModal',
  components: { Button, ModalV2, FormV2 },
  props: {
    open: { type: Boolean, default: false },
    thread: { type: Object, default: null },
    busy: { type: Boolean, default: false },
  },
  // confirm(isoDate | null) · close
  data() {
    return { values: { on: '' }, formKey: 0 };
  },
  computed: {
    current() {
      return this.thread && this.thread.followUpAt ? this.thread.followUpAt.slice(0, 10) : '';
    },
    schema() {
      return { sections: [{ id: 'follow', fields: [{ id: 'on', type: 'date', label: 'Follow up on', props: { width: 'short' } }] }] };
    },
  },
  watch: {
    open(open) {
      if (open) {
        this.values = { on: this.current || addWorkingDays(TODAY, 1).slice(0, 10) };
        this.formKey += 1;
      }
    },
  },
  methods: {
    confirm() {
      if (!this.values.on || this.busy) return;
      this.$emit('confirm', `${this.values.on}T09:00:00`);
    },
  },
};
</script>

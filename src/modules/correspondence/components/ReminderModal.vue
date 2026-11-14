<template>
  <!-- Send reminder (D-72, 2026-11-14): one click to chase a party on a thread that waits on them. A short single-step
       task, so a compact ModalV2 (D-34): who gets it (the recipients of the last message we sent), when the answer was
       due, the wording prefilled and editable, and the count so the PM knows what the Delivery tab will say. Nothing
       about the thread changes but the reminder itself: the due date stays, the thread stays in Waiting. -->
  <ModalV2
    :is-visible="open"
    title="Send a reminder"
    :title-description="thread ? thread.subject : ''"
    primary-label="Send reminder"
    secondary-label="Cancel"
    :primary-disabled="!body.trim() || busy"
    :secondary-disabled="busy"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <dl class="m-0 flex flex-col gap-space-4 text-fontsize-14 leading-lineheight-20">
          <div class="flex flex-wrap gap-x-space-8"><dt class="text-text-subtle">To</dt><dd class="m-0 text-text-default">{{ recipientsText }}</dd></div>
          <div v-if="dueText" class="flex flex-wrap gap-x-space-8"><dt class="text-text-subtle">Response due</dt><dd class="m-0 text-text-default">{{ dueText }}</dd></div>
          <div class="flex flex-wrap gap-x-space-8"><dt class="text-text-subtle">Reminders sent</dt><dd class="m-0 text-text-default">{{ count }}{{ count ? ` · this is reminder ${count + 1}` : '' }}</dd></div>
        </dl>
        <div class="flex flex-col gap-space-4">
          <label for="fv2-reminder-body" class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Message</label>
          <TextareaField :field="field" :value="body" @input="body = $event" />
          <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Sent as a reply on the thread, so their answer lands here. The reminder and its count go on the Delivery tab.</span>
        </div>
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import { reminderText, remindersOf, getPerson } from '../data';

export default {
  name: 'ReminderModal',
  components: { ModalV2, TextareaField },
  props: {
    open: { type: Boolean, default: false },
    /** The thread as the viewer sees it (viewFor applied) */
    thread: { type: Object, default: null },
    busy: { type: Boolean, default: false },
  },
  // confirm(body) · close
  data() {
    return { body: '' };
  },
  computed: {
    field() {
      return { id: 'reminder-body', placeholder: '', props: { rows: 6 } };
    },
    lastOutbound() {
      return this.thread ? [...this.thread.entries].reverse().find((e) => e.type === 'message' && e.direction === 'outbound' && !e.reminder) : null;
    },
    recipientsText() {
      const last = this.lastOutbound;
      if (!last) return '';
      return (last.recipients || []).filter((r) => r.kind !== 'bcc').map((r) => ((r.personId && getPerson(r.personId)) || {}).name || r.email).filter(Boolean).join(', ');
    },
    dueText() {
      return this.thread && this.thread.responseDueAt ? this.$moment(this.thread.responseDueAt).format('dddd D MMM') : '';
    },
    count() {
      return this.thread ? remindersOf(this.thread).length : 0;
    },
  },
  watch: {
    open(open) {
      if (open && this.thread) this.body = reminderText(this.thread);
    },
  },
  methods: {
    confirm() {
      if (!this.body.trim() || this.busy) return;
      this.$emit('confirm', this.body.trim());
    },
  },
};
</script>

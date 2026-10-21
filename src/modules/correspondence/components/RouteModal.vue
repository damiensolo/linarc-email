<template>
  <!-- The workflow move's confirmation (docs/correspondence/rfi-integration.md §D): Route, Approve, Revise, Reject or
       Close. A short single-step task, so a compact ModalV2 (D-34). It says where the RFI goes next and who has it; for
       a move that hands the RFI to someone, *Notify by email* sends them one email with the RFI pinned and its PDF (on
       by default when they are outside the company), with an optional message that becomes the email's body. -->
  <ModalV2
    :is-visible="visible"
    :title="title"
    :title-description="description"
    :primary-label="primaryLabel"
    secondary-label="Cancel"
    :primary-disabled="busy || (messageRequired && !message.trim())"
    :secondary-disabled="busy"
    :close-on-primary-click="false"
    @onPrimaryClick="$emit('confirm', { notify: notifiable && notify, message: message.trim() })"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <dl v-if="next" class="m-0 flex flex-col gap-space-4 text-fontsize-14 leading-lineheight-20">
          <dt class="text-text-subtle">Next</dt>
          <dd class="m-0 text-text-default">{{ next }}</dd>
        </dl>
        <Checkbox v-if="notifiable" :value="notify" :label="notifyLabel" size="small" @input="notify = $event" />
        <div v-if="notifiable ? notify : messageLabel" class="flex flex-col gap-space-4">
          <label for="fv2-route-message" class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">{{ messageLabel || 'Message (optional)' }}</label>
          <TextareaField :field="field" :value="message" @input="message = $event" />
          <span v-if="notifiable" class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Left empty, the email asks them to respond by the step's due date. Their reply is filed on the RFI's Email tab.</span>
        </div>
      </div>
    </template>
  </ModalV2>
</template>

<script>
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';

export default {
  name: 'RouteModal',
  components: { Checkbox, ModalV2, TextareaField },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    /** "Review · Sarah Jenkins, Vanguard Construction Group · due 22 Oct" */
    next: { type: String, default: '' },
    primaryLabel: { type: String, default: 'Route' },
    /** Offer Notify by email (a move that hands the RFI to someone) */
    notifiable: { type: Boolean, default: false },
    notifyDefault: { type: Boolean, default: false },
    notifyLabel: { type: String, default: 'Notify by email' },
    /** A message field without Notify (e.g. Reject's reason) */
    messageLabel: { type: String, default: '' },
    messageRequired: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  data() {
    return { notify: this.notifyDefault, message: '' };
  },
  computed: {
    field() {
      return { id: 'route-message', placeholder: '', props: { rows: 3 } };
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.notify = this.notifyDefault;
        this.message = '';
      }
    },
  },
};
</script>

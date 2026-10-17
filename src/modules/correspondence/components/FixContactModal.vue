<template>
  <!-- Update contact and resend (docs/correspondence/spec.md §6.1): the guided fix for a bounce (5-ui-patterns.md §3,
       "a warning guides"). A short single-step task, so a compact ModalV2 inside the screen's #content (§1): the
       recipient, the address that failed, the corrected address pre-filled from the directory, one action. -->
  <ModalV2
    :is-visible="open"
    title="Update contact and resend"
    :title-description="recipientName"
    primary-label="Update and resend"
    secondary-label="Cancel"
    :primary-disabled="!valid || busy"
    :secondary-disabled="busy"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
          Mail to <span class="text-text-default">{{ bounce ? bounce.email : '' }}</span> was rejected: {{ bounce ? bounce.reason : '' }}. The message is sent again to the new address and the contact is updated in the project directory.
        </p>
        <InputV2 v-model="email" label="New email address" type="email" placeholder="name@company.com" :state="email && !valid ? 'error' : 'default'" :error-message="email && !valid ? 'Enter a valid email address' : ''" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import { isValidEmail } from '../data/people';

export default {
  name: 'FixContactModal',
  components: { ModalV2, InputV2 },
  props: {
    open: { type: Boolean, default: false },
    recipientName: { type: String, default: '' },
    /** { email, reason, suggestedEmail } from the bounced message */
    bounce: { type: Object, default: null },
    busy: { type: Boolean, default: false },
  },
  data() {
    return { email: '' };
  },
  computed: {
    valid() {
      return isValidEmail(this.email);
    },
  },
  watch: {
    open(open) {
      if (open) this.email = (this.bounce && this.bounce.suggestedEmail) || '';
    },
  },
  methods: {
    confirm() {
      if (!this.valid || this.busy) return;
      this.$emit('confirm', this.email.trim().toLowerCase());
    },
  },
};
</script>

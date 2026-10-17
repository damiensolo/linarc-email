<template>
  <!-- Sandbox: Simulate inbound email (App.vue's bar). Stands in for mail arriving from Gmail, Outlook or any other
       client, which the static prototype can't receive. The screen supplies who can write, where the mail can go and
       what happens on receipt (prototype metadata `inbound`, src/prototypes/index.js). Not part of any product screen. -->
  <ModalV2
    :is-visible="open"
    title="Simulate inbound email"
    title-description="Mail from outside Linarc: a reply to a thread, or a message to the project address."
    primary-label="Receive"
    secondary-label="Cancel"
    :primary-disabled="!valid"
    :close-on-primary-click="false"
    @onPrimaryClick="receive"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <SelectV2 v-model="from" label="From" size="small" :options="senderOptions" :visible-item-count="8" />
        <InputV2
          v-if="from === NEW"
          v-model="fromEmail"
          label="Sender's address"
          type="email"
          placeholder="name@company.com"
          :state="fromEmail && !emailValid ? 'error' : 'default'"
          :error-message="fromEmail && !emailValid ? 'Enter a valid email address' : ''"
        />
        <SelectV2 v-model="to" label="Sent to" size="small" :options="config.destinations" :visible-item-count="8" />
        <InputV2 v-if="to === 'project'" v-model="subject" label="Subject" placeholder="What the mail is about" />
        <div class="flex flex-col">
          <label for="fv2-simulate-inbound-body" class="pb-space-8 font-medium text-fontsize-14 leading-lineheight-20 text-text-default">Message</label>
          <TextareaField :field="bodyField" :value="body" @input="body = $event" />
        </div>
        <SelectV2 v-model="file" label="Attachment" size="small" :options="config.files" :allow-search="false" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';

const NEW = 'new-sender';
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

export default {
  name: 'SimulateInboundModal',
  components: { ModalV2, InputV2, SelectV2, TextareaField },
  props: {
    open: { type: Boolean, default: false },
    /** The screen's `inbound()` result: { senders, destinations, files, receive(mail) }. */
    config: { type: Object, required: true },
  },
  data() {
    return { NEW, from: null, fromEmail: '', to: 'project', subject: '', body: '', file: 'none' };
  },
  computed: {
    senderOptions() {
      return [...this.config.senders, { value: NEW, label: 'Someone new (type their address)' }];
    },
    emailValid() {
      return isValidEmail(this.fromEmail);
    },
    bodyField() {
      return { id: 'simulate-inbound-body', placeholder: 'The mail as the sender wrote it', props: { rows: 5 } };
    },
    valid() {
      const sender = this.from === NEW ? this.emailValid : !!this.from;
      return sender && !!this.to && !!this.body.trim();
    },
  },
  watch: {
    // Each time it opens: the first sender, the project address, an empty message.
    open: {
      immediate: true,
      handler(open) {
        if (!open) return;
        this.from = (this.config.senders[0] || {}).value || NEW;
        Object.assign(this, { fromEmail: '', to: 'project', subject: '', body: '', file: 'none' });
      },
    },
  },
  methods: {
    receive() {
      if (!this.valid) return;
      const result = this.config.receive({
        fromId: this.from === NEW ? null : this.from,
        fromEmail: this.from === NEW ? this.fromEmail.trim().toLowerCase() : '',
        to: this.to,
        subject: this.subject,
        body: this.body.trim(),
        file: this.file === 'none' ? null : this.file,
      });
      this.$emit('received', result);
    },
  },
};
</script>

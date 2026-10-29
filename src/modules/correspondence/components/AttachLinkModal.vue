<template>
  <!-- The composer's *Attach link* (docs/correspondence/spec.md §7): a short single-step task, so a compact ModalV2
       (D-34). A full web address is required; the label is what the chip and the message show for it. -->
  <ModalV2
    :is-visible="visible"
    title="Attach link"
    title-description="The link goes with the message. Recipients open it in their browser."
    primary-label="Attach link"
    secondary-label="Cancel"
    :primary-disabled="!valid"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-12 font-label">
        <InputV2
          id="attach-link-url"
          v-model="url"
          label="Link"
          type="url"
          placeholder="https://"
          :state="url.trim() && !valid ? 'error' : 'default'"
          :helper-text="url.trim() && !valid ? 'Enter a full web address, starting with https://' : ''"
          @keydown.enter.native.prevent="confirm"
        />
        <InputV2 id="attach-link-label" v-model="name" label="Label (optional)" placeholder="What the link is" @keydown.enter.native.prevent="confirm" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';

const WEB_ADDRESS = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export default {
  name: 'AttachLinkModal',
  components: { ModalV2, InputV2 },
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    return { url: '', name: '' };
  },
  computed: {
    valid() {
      return WEB_ADDRESS.test(this.url.trim());
    },
  },
  watch: {
    visible(open) {
      if (open) {
        this.url = '';
        this.name = '';
      }
    },
  },
  methods: {
    confirm() {
      if (!this.valid) return;
      const url = this.url.trim();
      let host = url;
      try {
        host = new URL(url).hostname.replace(/^www\./, '');
      } catch (e) {
        // the pattern already passed; keep the address as the label
      }
      this.$emit('attach', { url, name: this.name.trim() || host });
    },
  },
};
</script>

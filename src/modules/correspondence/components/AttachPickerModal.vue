<template>
  <!-- The composer's *Choose from cloud drive* and *Attach a record* (docs/correspondence/spec.md §7): pick one or
       more items. A short single-step task, so a compact ModalV2 (D-34; `size="md"`, P-059, so rows and filters
       don't wrap) around the SmartPicker candidate (D-61): search as you type, a checkbox per kind, Suggested and
       Recent first, picks as removable chips. The primary button carries the count (*Attach 2*). -->
  <ModalV2
    :is-visible="visible"
    size="md"
    :title="title"
    :title-description="description"
    :primary-label="count > 1 ? `${primaryLabel} ${count}` : primaryLabel"
    secondary-label="Cancel"
    :primary-disabled="!count"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <SmartPicker v-if="visible" v-model="picked" :items="items" :kinds="kinds" :noun="noun" :placeholder="placeholder" multiple :visible-rows="5" />
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SmartPicker from '~/candidates/SmartPicker/SmartPicker.vue';

export default {
  name: 'AttachPickerModal',
  components: { ModalV2, SmartPicker },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    /** SmartPicker items: `[{ id, label, description?, meta?, kind?, keywords?, chipLabel?, suggested?, recent? }]` */
    items: { type: Array, default: () => [] },
    /** SmartPicker quick filters: `[{ id, label }]` */
    kinds: { type: Array, default: () => [] },
    noun: { type: String, default: 'items' },
    placeholder: { type: String, default: 'Search' },
    primaryLabel: { type: String, default: 'Attach' },
  },
  data() {
    return { picked: [] };
  },
  computed: {
    count() {
      return this.picked.length;
    },
  },
  watch: {
    visible(open) {
      if (open) this.picked = [];
    },
  },
  methods: {
    confirm() {
      if (!this.count) return;
      this.$emit('pick', this.picked.slice());
    },
  },
};
</script>

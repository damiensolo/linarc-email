<template>
  <!-- Sandbox: Simulate event (App.vue's bar). Stands in for what the platform would do on its own (a Critical arriving,
       a reminder, a reassignment, a cover starting), which the static prototype can't receive. The screen supplies the
       catalogue and the trigger (prototype metadata `events`, src/prototypes/index.js). Not part of any product screen. -->
  <ModalV2
    :is-visible="open"
    title="Simulate event"
    title-description="Something the platform would do on its own. It goes into the demo session; Reset demo data clears it."
    primary-label="Fire"
    secondary-label="Cancel"
    :primary-disabled="!event"
    :close-on-primary-click="false"
    @onPrimaryClick="fire"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <SelectV2 v-model="event" label="Event" size="small" :options="config.events" :visible-item-count="8" :allow-search="false" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';

export default {
  name: 'SimulateEventModal',
  components: { ModalV2, SelectV2 },
  props: {
    open: { type: Boolean, default: false },
    /** The screen's `events()` result: { events: [{ value, label }], fire(id) → { key, message, action } }. */
    config: { type: Object, required: true },
  },
  data() {
    return { event: null };
  },
  watch: {
    open: {
      immediate: true,
      handler(open) {
        if (open) this.event = (this.config.events[0] || {}).value || null;
      },
    },
  },
  methods: {
    fire() {
      if (!this.event) return;
      this.$emit('fired', this.config.fire(this.event));
    },
  },
};
</script>

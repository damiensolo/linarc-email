<template>
  <!-- Sandbox overflow (App.vue's bar, far right): the review settings people change least, so the bar stays short.
       Theme, simulated loading speed (src/modules/mock/request.js) and the screen's Figma frame. Not part of any
       prototype. -->
  <div class="flex">
    <Button
      ref="trigger"
      size="small"
      color-scheme="secondary"
      variant="outline"
      tooltip="Display and loading settings"
      aria-label="Display and loading settings"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      @onClick="open = !open"
    >
      <template #leftIcon>
        <MoreHorizontal />
      </template>
    </Button>
    <Popover :open="open" :anchor="anchorEl" placement="bottom-end" variant="card" :z-index="1100" @close="open = false">
      <div class="flex min-w-max flex-col gap-space-16 p-space-16 font-label">
        <div class="flex flex-col gap-space-8">
          <span class="text-fontsize-12 leading-lineheight-16 font-bold text-text-subtle">Theme</span>
          <SegmentedControl :value="isDark ? 'dark' : 'light'" :options="THEMES" aria-label="Theme" @input="$emit('theme', $event === 'dark')" />
        </div>
        <div class="flex flex-col gap-space-8" role="radiogroup" aria-label="Simulated loading speed">
          <span class="text-fontsize-12 leading-lineheight-16 font-bold text-text-subtle" title="How long screens take to load their data">Loading speed</span>
          <Radio
            v-for="option in latencyOptions"
            :key="option.value"
            :model-value="latency"
            :value="option.value"
            :label="option.label"
            name="sandbox-latency"
            size="small"
            @change="$emit('latency', $event)"
          />
        </div>
        <a
          v-if="figma"
          :href="figma"
          target="_blank"
          rel="noopener"
          class="border-t border-border-subtle pt-space-12 text-fontsize-14 leading-lineheight-20 text-text-primary"
        >
          Open in Figma ↗
        </a>
      </div>
    </Popover>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Radio from '@/components/Radio/Radio.vue';
import Popover from '@/componentsV2/Popover/Popover.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import { MoreHorizontal } from '@development/linarc-icons';

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default {
  name: 'SandboxMenu',
  components: { Button, Radio, Popover, SegmentedControl, MoreHorizontal },
  props: {
    isDark: { type: Boolean, default: false },
    latency: { type: String, required: true },
    /** [{ value, label }] from LATENCY_OPTIONS. */
    latencyOptions: { type: Array, required: true },
    /** The screen's Figma frame URL; no link when empty. */
    figma: { type: String, default: '' },
  },
  data() {
    return { THEMES, open: false, anchorEl: null };
  },
  mounted() {
    this.anchorEl = this.$refs.trigger.$el;
  },
};
</script>

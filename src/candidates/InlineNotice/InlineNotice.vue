<template>
  <!-- CANDIDATE 2026-10-09: proposed design-system component, see docs/components/InlineNotice.md.
       An in-place notice under a field or above a form section (not a toast, not a modal): tone + message, optional
       title and actions. Used for declared-vs-document mismatches and submission readiness.
       Visual rule (2026-10-09 restyle): warning and error get a tinted fill and a tone icon, nothing else (no outline).
       Info and success are plain text blocks: a bold title and the message, no box, no icon. -->
  <div
    class="inline-notice flex items-start gap-space-8 font-label text-fontsize-14 leading-lineheight-20"
    :class="boxed ? 'rounded-radius-4 px-space-12 py-space-8 ' + toneClasses.box : ''"
    :role="tone === 'error' || tone === 'warning' ? 'alert' : 'status'"
  >
    <component :is="toneIcon" v-if="boxed" :size="16" :stroke-width="1.75" class="mt-space-2 shrink-0" :class="toneClasses.icon" aria-hidden="true" />
    <!-- Text on the left, the contextual action on the right, parallel to the description (D-57); when the width
         narrows the actions wrap to the bottom-right of the block. -->
    <div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-space-16 gap-y-space-8">
      <div class="flex min-w-0 flex-1 flex-col gap-space-2">
        <span v-if="title" class="font-bold text-text-default">{{ title }}</span>
        <span :class="boxed ? 'text-text-default' : 'text-text-subtle'"><slot>{{ message }}</slot></span>
      </div>
      <div v-if="$slots.actions" class="ml-auto flex basis-full shrink-0 flex-wrap items-center justify-end gap-space-8 sm:basis-auto">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script>
import { TriangleAlert, CircleAlert } from '@development/linarc-icons';

const TONES = {
  warning: { boxed: true, icon: TriangleAlert, box: 'bg-surface-warning-low-subtle', icon_: 'text-icon-warning-low' },
  error: { boxed: true, icon: CircleAlert, box: 'bg-surface-error-subtle', icon_: 'text-icon-error' },
  info: { boxed: false },
  success: { boxed: false },
};

export default {
  name: 'InlineNotice',
  props: {
    tone: { type: String, default: 'warning', validator: (v) => v in TONES },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
  },
  computed: {
    boxed() {
      return TONES[this.tone].boxed;
    },
    toneIcon() {
      return TONES[this.tone].icon || null;
    },
    toneClasses() {
      const t = TONES[this.tone];
      return { box: t.box || '', icon: t.icon_ || '' };
    },
  },
};
</script>

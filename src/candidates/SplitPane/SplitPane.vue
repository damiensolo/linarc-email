<template>
  <!-- CANDIDATE 2026-11-04: proposed design-system component, see docs/components/SplitPane.md. Not a prototype-local widget.
       Two panes side by side with a draggable divider: the start pane takes what is left, the end pane keeps a width
       in px (v-model) between `min` and whatever leaves `minStart` to the start pane. The divider is an 8px hit area
       around a 1px hairline (border/subtle) that turns primary while hovered, focused or dragged. Keyboard: the divider
       is a focusable separator; Left / Right move 16px, Home / End go to the limits, double-click resets to `defaultValue`.
       Pointer capture keeps a drag alive outside the divider. `stacked` (below a breakpoint the host decides) hides the
       divider and shows the start pane only; the end pane's content is then the host's to place elsewhere. -->
  <div ref="root" class="sp-root flex h-full min-h-0 w-full min-w-0" :class="{ 'sp-root--dragging': dragging }">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <slot name="start" />
    </div>
    <template v-if="!stacked">
      <div
        class="sp-divider relative flex w-space-8 shrink-0 cursor-col-resize items-stretch justify-center outline-none"
        role="separator"
        aria-orientation="vertical"
        tabindex="0"
        :aria-label="label"
        :aria-valuenow="width"
        :aria-valuemin="min"
        :aria-valuemax="maxPx"
        :class="{ 'sp-divider--active': dragging }"
        @pointerdown="start"
        @keydown="onKey"
        @dblclick="reset"
      >
        <span class="sp-divider__line bg-border-subtle" aria-hidden="true" />
      </div>
      <div class="flex min-h-0 shrink-0 flex-col" :style="{ width: `${width}px` }">
        <slot name="end" />
      </div>
    </template>
  </div>
</template>

<script>
const STEP = 16;

export default {
  name: 'SplitPane',
  model: { prop: 'value', event: 'input' },
  props: {
    /** Width of the end pane in px (v-model). `null` uses `defaultValue`. */
    value: { type: Number, default: null },
    defaultValue: { type: Number, default: 560 },
    /** The end pane never gets narrower than this. */
    min: { type: Number, default: 320 },
    /** The start pane never gets narrower than this. */
    minStart: { type: Number, default: 320 },
    /** Accessible name of the divider. */
    label: { type: String, default: 'Resize panes' },
    /** Show the start pane only (narrow screens). */
    stacked: { type: Boolean, default: false },
  },
  data() {
    return { dragging: false, rootWidth: 0 };
  },
  computed: {
    maxPx() {
      const available = this.rootWidth - this.minStart - 8;
      return Math.max(this.min, available);
    },
    width() {
      const asked = this.value == null ? this.defaultValue : this.value;
      return this.clamp(asked);
    },
  },
  mounted() {
    this.measure();
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.measure());
      this._ro.observe(this.$refs.root);
    } else {
      window.addEventListener('resize', this.measure);
    }
  },
  beforeDestroy() {
    if (this._ro) this._ro.disconnect();
    window.removeEventListener('resize', this.measure);
    this.stop();
  },
  methods: {
    measure() {
      this.rootWidth = this.$refs.root ? this.$refs.root.clientWidth : 0;
    },
    clamp(px) {
      if (!this.rootWidth) return Math.max(this.min, px);
      return Math.min(this.maxPx, Math.max(this.min, Math.round(px)));
    },
    set(px) {
      const next = this.clamp(px);
      if (next !== this.value) this.$emit('input', next);
    },
    start(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      this.measure();
      this.dragging = true;
      this._startX = e.clientX;
      this._startW = this.width;
      this._target = e.currentTarget;
      if (this._target.setPointerCapture) this._target.setPointerCapture(e.pointerId);
      this._target.addEventListener('pointermove', this.move);
      this._target.addEventListener('pointerup', this.stop);
      this._target.addEventListener('pointercancel', this.stop);
    },
    move(e) {
      if (!this.dragging) return;
      // The end pane is on the right: dragging left makes it wider.
      this.set(this._startW - (e.clientX - this._startX));
    },
    stop() {
      if (!this.dragging) return;
      this.dragging = false;
      if (this._target) {
        this._target.removeEventListener('pointermove', this.move);
        this._target.removeEventListener('pointerup', this.stop);
        this._target.removeEventListener('pointercancel', this.stop);
        this._target = null;
      }
      this.$emit('change', this.width);
    },
    onKey(e) {
      const map = { ArrowLeft: this.width + STEP, ArrowRight: this.width - STEP, Home: this.maxPx, End: this.min };
      if (!(e.key in map)) return;
      e.preventDefault();
      this.set(map[e.key]);
      this.$emit('change', this.clamp(map[e.key]));
    },
    reset() {
      this.set(this.defaultValue);
      this.$emit('change', this.clamp(this.defaultValue));
    },
  },
};
</script>

<style scoped>
.sp-divider__line {
  width: var(--border-1);
  transition: background-color 120ms ease, width 120ms ease;
}
.sp-divider:hover .sp-divider__line,
.sp-divider:focus-visible .sp-divider__line,
.sp-divider--active .sp-divider__line {
  width: var(--border-2);
  background-color: var(--surface-primary-default);
}
/* While dragging, the panes' content must not capture the pointer or select text. */
.sp-root--dragging {
  user-select: none;
}
.sp-root--dragging ::v-deep iframe,
.sp-root--dragging ::v-deep video {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .sp-divider__line {
    transition: none;
  }
}
</style>

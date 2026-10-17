<template>
  <!-- CANDIDATE 2026-10-10: proposed design-system component, see docs/components/LoadingStates.md. Not a prototype-local widget.
       The part of a page whose data is loading. The app shell, title bar and controls stay outside it and stay usable.
       First load: the #skeleton slot (same layout as the content) holds the space from the first frame, invisible,
       and appears only if loading lasts LOAD_TIMING.indicatorDelayMs; content replaces it, fading in once if the
       skeleton was seen. Refresh: content stays; LoadStatus shows the inline indicator. Error or cancel with nothing on
       screen: a notice with Retry. `content-loads`: the content has its own placeholder mode (DataGrid `loading`), so
       it stays mounted, real header and all, and gets `skeleton` (true once the delay passes) through the slot.
       `secondary`: another region of the same load (e.g. a right panel): same skeleton and reveal, but no live region
       and no error notice, so screen readers hear the load once and the failure shows once (in the primary region).
       Put the content in `<template #default>` (or use v-slot): plain slot children are evaluated by the parent at
       once and throw while the data is still null; a v-slot template is only evaluated when LoadRegion renders it.
       Figma: Load Region on _Candidates (40024347:224). Rules: docs/5-ui-patterns.md §6. -->
  <div class="load-region flex min-h-0 flex-col" :aria-busy="load.status === 'loading' ? 'true' : 'false'">
    <span v-if="!secondary" class="sr-only" role="status" aria-live="polite">{{ load.announcement }}</span>

    <div v-if="load.hasData && !contentLoads" class="flex min-h-0 flex-1 flex-col" :class="{ 'load-region__reveal': load.fromSkeleton }">
      <slot />
    </div>

    <template v-else>
      <!-- Failed or stopped with nothing on screen: say so and offer Retry. With content-loads the content (its header,
           its frame) stays below the notice. -->
      <div v-if="failed && !secondary" class="flex flex-col" :class="{ 'pb-space-12': contentLoads }">
        <slot name="error" :error="load.error" :retry="retry">
          <InlineNotice :tone="load.status === 'error' ? 'error' : 'info'" :message="load.status === 'error' ? `Couldn't load the ${load.label}.` : `Loading stopped.`">
            <template #actions>
              <Button label="Retry" color-scheme="secondary" variant="outline" size="small" @onClick="retry" />
            </template>
          </InlineNotice>
        </slot>
      </div>

      <div v-if="contentLoads" class="flex min-h-0 flex-1 flex-col">
        <slot :skeleton="load.indicator && !load.hasData" />
      </div>

      <!-- Rendered from the first frame to reserve the final layout; `invisible` until the delay passes, so a fast load
           never shows it and a slow one doesn't move anything when it appears. -->
      <div v-else-if="!failed" class="flex min-h-0 flex-1 flex-col" :class="{ invisible: !load.indicator }" aria-hidden="true">
        <slot name="skeleton" />
      </div>
    </template>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import InlineNotice from '~/candidates/InlineNotice/InlineNotice.vue';

export default {
  name: 'LoadRegion',
  components: { Button, InlineNotice },
  props: {
    /** Controller from createLoad() (./createLoad.js). */
    load: { type: Object, required: true },
    /** The default slot draws its own placeholders (e.g. DataGrid `:loading="skeleton"`); keep it mounted throughout. */
    contentLoads: { type: Boolean, default: false },
    /** Another region of a load whose primary LoadRegion announces it and shows its errors. */
    secondary: { type: Boolean, default: false },
  },
  computed: {
    failed() {
      return !this.load.hasData && (this.load.status === 'error' || this.load.status === 'cancelled');
    },
  },
  methods: {
    retry() {
      this.$emit('retry');
    },
  },
};
</script>

<style scoped>
/* --load-reveal-ms is the configurable fade (150–200ms). Opacity only: no movement, no layout change. */
.load-region__reveal {
  animation: load-region-reveal var(--load-reveal-ms, 160ms) ease-out;
}

@keyframes load-region-reveal {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .load-region__reveal {
    animation: none;
  }
}
</style>

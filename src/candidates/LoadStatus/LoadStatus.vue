<template>
  <!-- CANDIDATE 2026-10-10: proposed design-system component, see docs/components/LoadingStates.md. Not a prototype-local widget.
       Figma: Load Status on _Candidates (40024347:169).
       The small, non-blocking status line of a load or an action, placed where the page already shows a meta line (a
       result count, "Saved 2 min ago") or next to a form's buttons. Shows the default slot normally. While a request
       runs past the 200ms delay: an indeterminate spinner and "Loading…" / "Updating…" / "Still loading…" (+ Cancel when
       slow) for a load, or the action's own words ("Saving…", "Still saving…", no Cancel) for an action
       (createLoad({ action })). After a failure: "Couldn't update." (a refresh; the content stays) or the action's error
       (input kept), with Retry; `variant="notice"` shows that error as an InlineNotice, for form-level failures. No
       percentages or stages. A load is announced by its LoadRegion; an action by the app-level announcer in createLoad.js
       (it outlives the form, so "Changes saved" is heard even when success closes it).
       2026-10-11: action mode, notice variant, `active`, `size`, no wrap; the 24px line is held only while there is
       something to show, so an empty line takes no space at click time (rollout findings). -->
  <span v-if="active" class="load-status contents">
    <InlineNotice v-if="failed && variant === 'notice'" tone="error" :message="errorText">
      <template #actions>
        <Button label="Retry" color-scheme="secondary" variant="outline" size="small" @onClick="$emit('retry')" />
      </template>
    </InlineNotice>
    <span
      v-else
      class="inline-flex min-w-0 items-center gap-space-8 whitespace-nowrap font-label text-text-subtle"
      :class="[size === 'xs' ? 'text-fontsize-12 leading-lineheight-16' : 'text-fontsize-14 leading-lineheight-20', { 'min-h-space-24': busy || failed || hasSlot() }]"
    >
      <template v-if="busy">
        <StatusIndicator type="spinner" size="sm" decorative />
        <span>{{ busyText }}</span>
        <Button v-if="canCancel" label="Cancel" color-scheme="secondary" variant="minimal" size="small" @onClick="load.cancel()" />
      </template>
      <template v-else-if="failed">
        <span role="alert">{{ errorText }}</span>
        <Button label="Retry" color-scheme="secondary" variant="minimal" size="small" @onClick="$emit('retry')" />
      </template>
      <slot v-else />
    </span>
  </span>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import StatusIndicator from '@/componentsV2/StatusIndicator/StatusIndicator.vue';
import InlineNotice from '~/candidates/InlineNotice/InlineNotice.vue';

export default {
  name: 'LoadStatus',
  components: { Button, StatusIndicator, InlineNotice },
  props: {
    /** Controller from createLoad() (~/candidates/LoadRegion/createLoad.js), shared with the LoadRegion for a load. */
    load: { type: Object, required: true },
    /** Offer Cancel once a load is slow. Never offered for an action. */
    cancellable: { type: Boolean, default: true },
    /** inline: text + Retry on the line; notice: a failure shows as an InlineNotice (form-level errors). */
    variant: { type: String, default: 'inline', validator: (v) => ['inline', 'notice'].includes(v) },
    /** Render at all. One controller can serve several forms; only the one that submitted shows its state. */
    active: { type: Boolean, default: true },
    /** sm = label/sm (14/20); xs = 12/16, for meta lines set in 12px. */
    size: { type: String, default: 'sm', validator: (v) => ['sm', 'xs'].includes(v) },
  },
  computed: {
    isAction() {
      return this.load.kind === 'action';
    },
    busy() {
      return this.load.status === 'loading' && this.load.indicator;
    },
    // A load's failure with nothing on screen is LoadRegion's to show; this line only reports a failed refresh.
    failed() {
      return this.load.status === 'error' && (this.isAction || this.load.hasData);
    },
    canCancel() {
      return !this.isAction && this.cancellable && this.load.slow;
    },
    busyText() {
      if (this.isAction) return this.load.slow ? `Still ${this.load.action.busy.toLowerCase()}…` : `${this.load.action.busy}…`;
      if (this.load.slow) return 'Still loading…';
      return this.load.hasData ? 'Updating…' : 'Loading…';
    },
    errorText() {
      return this.isAction ? this.load.action.error : "Couldn't update.";
    },
  },
  methods: {
    // A method, not a computed: $slots isn't reactive.
    hasSlot() {
      return !!(this.$slots.default && this.$slots.default.some((n) => n.tag || (n.text && n.text.trim())));
    },
  },
};
</script>

<template>
  <!-- CANDIDATE 2026-10-16: proposed design-system component, see docs/components/DrawingPinPreview.md (Q-13: nothing
       to reuse in Figma or the Drawings tool). Which spot on which revision a message is about: a cropped markup
       thumbnail, the sheet code and title, the grid location, the pinned revision (one signal) and a note when a newer
       revision exists. The pin is immutable: it never offers to move to the newer revision. `md` = card (compose
       panel, secure link page); `sm` = row (a Linked items list). -->
  <div class="flex gap-space-12" :class="size === 'sm' ? 'items-center' : 'flex-col'">
    <button
      type="button"
      class="shrink-0 overflow-hidden rounded-radius-4 border border-border-subtle bg-surface-container p-0 text-left"
      :class="size === 'sm' ? 'dpp-thumb--sm' : 'dpp-thumb--md w-full'"
      :aria-label="`Open ${drawing.code} ${drawing.revision} at ${pin ? pin.grid : 'the sheet'}`"
      @click="$emit('open')"
    >
      <slot name="thumbnail">
        <img v-if="src" :src="src" :alt="`${drawing.code} ${drawing.revision}${pin ? `, ${pin.grid}` : ''}`" class="block h-full w-full object-cover" />
      </slot>
    </button>
    <div class="flex min-w-0 flex-col gap-space-2 font-label">
      <div class="flex flex-wrap items-center gap-space-8">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">{{ drawing.code }} · {{ drawing.revision }}</span>
        <!-- One signal (D-17): a chip only when the revision is no longer current. -->
        <StatusChip v-if="superseded" :label="`Superseded by ${drawing.supersededBy}`" :status="chip('warning')" fill-style="outline" type="default" :removable="false" />
        <span v-else class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Current</span>
      </div>
      <span class="truncate text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ drawing.title }}</span>
      <span v-if="pin" class="text-fontsize-12 leading-lineheight-16 text-text-default">{{ pin.grid }}<template v-if="pin.label && size !== 'sm'"> · {{ pin.label }}</template></span>
      <span v-if="superseded && size !== 'sm'" class="text-fontsize-12 leading-lineheight-16 text-text-subtle">This message stays pinned to {{ drawing.revision }}.</span>
    </div>
  </div>
</template>

<script>
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import { toneToChipStatus } from '~/modules/app/status';

export default {
  name: 'DrawingPinPreview',
  components: { StatusChip },
  props: {
    /** { code, title, revision, revisionStatus: 'current' | 'superseded', supersededBy? } */
    drawing: { type: Object, required: true },
    /** { grid, label?, box? } or null for the whole sheet */
    pin: { type: Object, default: null },
    /** Thumbnail image; or use the `thumbnail` slot */
    src: { type: String, default: '' },
    size: { type: String, default: 'md', validator: (v) => ['sm', 'md'].includes(v) },
  },
  computed: {
    superseded() {
      return this.drawing.revisionStatus === 'superseded';
    },
  },
  methods: {
    chip: (tone) => toneToChipStatus(tone),
  },
};
</script>

<style scoped>
/* Thumbnail sizes: 3:2 crop around the markup. No size token for media exists (needs-token, see the proposal). */
.dpp-thumb--sm {
  width: 72px;
  height: 48px;
}
.dpp-thumb--md {
  aspect-ratio: 3 / 2;
  max-height: 200px;
}
</style>

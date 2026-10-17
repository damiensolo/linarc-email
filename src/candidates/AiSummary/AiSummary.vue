<template>
  <!-- CANDIDATE 2026-10-16: proposed design-system component, see docs/components/AiSummary.md (D-38, D-44).
       AI-generated summary content with the mandatory tag and disclaimer (5-ui-patterns.md §9), grouped bullets that
       can be traced to their sources, the evidence line, a feedback link, and honest loading / failed states (D-24).
       No fill or outline of its own (one container level, D-17). -->
  <section class="flex flex-col gap-space-8" :aria-busy="status === 'loading' ? 'true' : null">
    <div class="flex flex-wrap items-center gap-space-8">
      <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ title }}</h2>
      <Tooltip :label="AI_NOTE" placement="top">
        <span class="inline-flex rounded-radius-round focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="`AI generated. ${AI_NOTE}`">
          <StatusChip label="AI" status="ai" fill-style="outline" type="default" :removable="false" />
        </span>
      </Tooltip>
    </div>

    <template v-if="status === 'loading'">
      <Skeleton size="sm" class="w-full" />
      <Skeleton size="sm" class="w-full" />
      <Skeleton size="sm" class="w-space-124" />
    </template>

    <InlineNotice v-else-if="status === 'error'" tone="error" message="Summary unavailable.">
      <template #actions>
        <Button label="Retry" color-scheme="secondary" variant="outline" size="small" @onClick="$emit('retry')" />
      </template>
    </InlineNotice>

    <template v-else>
      <div v-for="g in shownGroups" :key="g.label" class="flex flex-col gap-space-4">
        <h3 class="m-0 font-label text-fontsize-14 font-bold leading-lineheight-20 text-text-default">{{ g.label }}</h3>
        <ul class="m-0 flex list-disc flex-col gap-space-4 pl-space-20">
          <li v-for="(item, i) in g.items" :key="i" class="font-label text-fontsize-14 leading-lineheight-20 text-text-default">
            <span>{{ item.text }}</span>
            <Button v-if="item.sourceIds && item.sourceIds.length" label="Source" variant="text" color-scheme="primary" size="small" class="ml-space-4 align-baseline" @onClick="$emit('trace', item.sourceIds)" />
          </li>
        </ul>
      </div>
      <p class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
        <span>{{ evidence }}</span>
        <Button label="Not accurate" variant="text" color-scheme="secondary" size="small" @onClick="$emit('feedback')" />
      </p>
    </template>
  </section>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import InlineNotice from '~/candidates/InlineNotice/InlineNotice.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';

/** The disclaimer fixed by docs/5-ui-patterns.md §9. */
export const AI_NOTE = 'This content was generated using AI and may contain errors or omissions. Verify important information before relying on it.';

export default {
  name: 'AiSummary',
  components: { Button, StatusChip, Tooltip, InlineNotice, Skeleton },
  props: {
    /** [{ label, items: [{ text, sourceIds? }] }]; empty groups are omitted. */
    groups: { type: Array, default: () => [] },
    /** The evidence line: what was read, never a model name. */
    evidence: { type: String, required: true },
    status: { type: String, default: 'ready', validator: (v) => ['ready', 'loading', 'error'].includes(v) },
    title: { type: String, default: 'Summary' },
  },
  data() {
    return { AI_NOTE };
  },
  computed: {
    shownGroups() {
      return this.groups.filter((g) => g && g.items && g.items.length);
    },
  },
};
</script>

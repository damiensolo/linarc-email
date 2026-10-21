<template>
  <!-- RFI › Activity (the right panel; docs/correspondence/rfi-integration.md §E): record events and the email events of
       the RFI's threads in one list, newest first. Each row: what happened, who and when (D-17); a failed delivery is the
       only chip; an email row opens its thread. -->
  <div class="font-label">
    <p v-if="!rows.length" class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">No activity yet.</p>
    <ol v-else class="m-0 flex list-none flex-col p-0">
      <li v-for="r in rows" :key="r.id" class="flex flex-col gap-space-2 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
        <span class="flex flex-wrap items-center gap-space-8 text-text-default">
          <StatusChip v-if="r.label && r.tone === 'error'" :label="r.label" status="error" fill-style="outline" type="default" :removable="false" />
          <span class="min-w-0">{{ r.label && r.tone !== 'error' ? `${r.label} · ${r.text}` : r.text }}</span>
        </span>
        <span class="flex flex-wrap items-center gap-x-space-8 text-fontsize-12 leading-lineheight-16 text-text-subtle">
          <span>{{ r.actor }} · {{ $moment(r.at).format('D MMM, HH:mm') }}</span>
          <Button v-if="r.threadId" label="Open thread" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-thread', r.threadId)" />
        </span>
      </li>
    </ol>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';

export default {
  name: 'RfiActivity',
  components: { Button, StatusChip },
  props: {
    /** rfiActivity() rows */
    rows: { type: Array, default: () => [] },
  },
};
</script>

<template>
  <!-- A record's Email tab (D-48, D-50; shared since D-74, 2026-11-14): the record's threads as ThreadStream + composer,
       with Compose at the top of the tab (it writes an email about the record, never the record itself) and today's
       rule that a closed record can't send. The RFI keeps its own copy of this tab because it adds *Add to Q&A* (D-49);
       Submittals and Change Orders use this one. The host owns the writes (`send`, `compose`) and the file viewer. -->
  <section class="flex flex-col gap-space-40">
    <div class="flex flex-wrap items-center justify-between gap-space-8">
      <span class="font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">Email about {{ record.code }}. Replies from any mail client land here.</span>
      <Button label="Compose" color-scheme="secondary" variant="outline" size="medium" :is-disabled="record.closed" :tooltip="record.closed ? `Closed ${noun}s can't send email` : ''" @onClick="$emit('compose')" />
    </div>
    <div v-if="!threads.length" class="flex flex-col gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
      <span>No email on this {{ noun }} yet. Compose sends from here with {{ record.code }} pinned; replies from any mail client come back to this tab.</span>
    </div>
    <article v-for="t in threads" :key="t.id" class="flex flex-col gap-space-16">
      <header class="flex flex-wrap items-center justify-between gap-space-8">
        <div class="flex min-w-0 flex-wrap items-center gap-space-8">
          <h2 class="m-0 truncate font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ t.subject }}</h2>
          <StatusChip :label="TRIAGE[t.triage].label" :status="chip(TRIAGE[t.triage].tone)" fill-style="outline" type="default" :removable="false" />
          <StatusChip v-if="t.visibility === 'restricted'" :label="VISIBILITY.restricted.label" :status="chip(VISIBILITY.restricted.tone)" fill-style="outline" type="default" :removable="false" />
        </div>
        <Button label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-thread', t.id)" />
      </header>
      <ThreadStream :entries="threadEntries(t)" @navigate="$emit('open-record', $event)" @open-attachment="(f, all, i) => $emit('open-files', f, all, i)" @download-attachment="$emit('download-file', $event)" />
      <!-- The footer bleeds over the scroller's 20px bottom padding, as on the thread page (F-043); without it the
           entries scroll into view in the strip under the footer. -->
      <Composer v-if="!record.closed" :ref="`composer-${t.id}`" :draft-key="t.id" :allow-note="role.internal" :busy="busy" footer-class="-bottom-space-20 pb-space-20" @send="(m) => $emit('send', t.id, m)" @open-attachment="(f, all, i) => $emit('open-files', f, all, i)" />
    </article>
  </section>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import ThreadStream from '~/candidates/ThreadStream/ThreadStream.vue';
import { TRIAGE, VISIBILITY, toneToChipStatus } from '~/modules/app/status';
import { threadEntries } from '../../view';
import Composer from '../Composer.vue';

export default {
  name: 'RecordEmailTab',
  components: { Button, StatusChip, ThreadStream, Composer },
  props: {
    record: { type: Object, required: true },
    /** The record's threads as the viewer sees them (viewFor applied), newest first */
    threads: { type: Array, default: () => [] },
    role: { type: Object, required: true },
    /** "submittal" / "change order": the empty state's noun */
    noun: { type: String, default: 'record' },
    busy: { type: Boolean, default: false },
  },
  // compose · send(threadId, message) · open-thread(id) · open-record(id) · open-files(file, files, index) · download-file(file)
  data() {
    return { TRIAGE, VISIBILITY };
  },
  methods: {
    threadEntries,
    chip: (tone) => toneToChipStatus(tone),
    /** The host calls this once a send is acknowledged, so the thread's composer clears. */
    resetComposer(threadId) {
      const ref = this.$refs[`composer-${threadId}`];
      const c = Array.isArray(ref) ? ref[0] : ref;
      if (c) c.reset();
    },
  },
};
</script>

<template>
  <!-- RFI › Details (docs/correspondence/rfi-integration.md §4; Figma ☉ Create RFI › Read Only View 1703:44860): the
       record's fields read-only as label/value pairs on hairlines (D-17), then the question, the proposed solution, custom
       details and the linked items (drawing revision, email threads). Cost only for roles that may see it (D-41). -->
  <div class="flex flex-col gap-space-32 font-label">
    <dl class="m-0 grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
      <div v-for="f in facts" :key="f.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
        <dt class="shrink-0 text-text-subtle">{{ f.label }}</dt>
        <dd class="m-0 text-right text-text-default">{{ f.value }}</dd>
      </div>
    </dl>

    <section class="flex flex-col gap-space-8">
      <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Question</h2>
      <p class="m-0 whitespace-pre-line text-fontsize-14 leading-lineheight-20 text-text-default">{{ record.question }}</p>
      <FileTiles v-if="questionFiles.length" :files="questionFiles" label="Question files" @open="(f, all, i) => $emit('open-files', f, all, i)" @download="$emit('download-file', $event)" />
      <p v-if="record.threadId" class="m-0 flex flex-wrap items-center gap-x-space-8 text-fontsize-12 leading-lineheight-16 text-text-subtle">
        <span>Created from an email{{ originSender ? ` from ${originSender}` : '' }}.</span>
        <Button label="Open the email" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-email', record.threadId)" />
      </p>
    </section>

    <section v-if="record.proposedSolution" class="flex flex-col gap-space-8">
      <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Proposed solution</h2>
      <p class="m-0 whitespace-pre-line text-fontsize-14 leading-lineheight-20 text-text-default">{{ record.proposedSolution }}</p>
    </section>

    <section v-if="record.customFields && record.customFields.length" class="flex flex-col gap-space-8">
      <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Custom details</h2>
      <dl class="m-0 grid grid-cols-1 gap-x-space-24 sm:grid-cols-2">
        <div v-for="f in record.customFields" :key="f.label" class="flex justify-between gap-space-16 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
          <dt class="shrink-0 text-text-subtle">{{ f.label }}</dt>
          <dd class="m-0 text-right text-text-default">{{ f.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="flex flex-col gap-space-8">
      <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Linked items</h2>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="d in drawings" :key="d.id" class="flex flex-wrap items-center gap-x-space-8 gap-y-space-4 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
          <Chip :label="d.label" size="small" fill-style="solid" type="default" :removable="false" />
          <span class="min-w-0 flex-1 truncate text-text-default">{{ d.title }}</span>
          <Button label="Open" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-record', d.id)" />
        </li>
        <li v-for="t in threads" :key="t.id" class="flex flex-wrap items-center gap-x-space-8 gap-y-space-4 border-b border-border-subtle py-space-8 text-fontsize-14 leading-lineheight-20">
          <Chip label="Email" size="small" fill-style="solid" type="default" :removable="false" />
          <span class="min-w-0 flex-1 truncate text-text-default">{{ t.subject }}</span>
          <Button label="Open" variant="text" color-scheme="primary" size="small" @onClick="$emit('open-email', t.id)" />
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import FileTiles from '../FileTiles.vue';
import { getPerson, getFile, getThread, recordLabel, getRecord, RFI_TYPES, PRIORITIES } from '../../data';
import { fileView } from '../../view';

export default {
  name: 'RfiDetails',
  components: { Button, Chip, FileTiles },
  props: {
    record: { type: Object, required: true },
    /** The role (canSeeCost gates Cost impact) */
    role: { type: Object, required: true },
    /** The RFI's threads the role may see */
    threads: { type: Array, default: () => [] },
  },
  computed: {
    facts() {
      const r = this.record;
      const m = this.$moment;
      const assignee = getPerson(r.assignedToId);
      const creator = getPerson(r.createdById);
      return [
        { label: 'RFI name', value: r.title },
        { label: 'RFI type', value: RFI_TYPES[r.rfiType] || '—' },
        { label: 'Sequence', value: r.sequence || '—' },
        { label: 'Priority', value: PRIORITIES[r.priority] || '—' },
        { label: 'Location', value: r.location || '—' },
        { label: 'Due date', value: r.dueOn ? m(r.dueOn).format('D MMM YYYY') : '—' },
        { label: 'Spec section', value: r.spec || '—' },
        { label: 'Reference', value: r.reference || '—' },
        { label: 'Schedule impact', value: r.scheduleDays ? `Yes · ${r.scheduleImpact}` : 'No' },
        ...(this.role.canSeeCost ? [{ label: 'Cost impact', value: r.costAmount ? `Yes · $${r.costAmount.toLocaleString('en-US')}` : 'No' }] : []),
        { label: 'Ball in court', value: r.closed ? '—' : assignee ? `${assignee.name} · ${r.ballInCourt}` : r.ballInCourt || '—' },
        { label: 'Created', value: `${m(r.createdAt).format('D MMM YYYY')} by ${creator ? creator.name : '—'}` },
      ];
    },
    questionFiles() {
      const first = this.record.qa[0];
      return first ? (first.attachmentIds || []).map(getFile).filter(Boolean).map(fileView) : [];
    },
    originSender() {
      const t = getThread(this.record.threadId);
      const msg = t && t.entries.find((e) => e.type === 'message' && e.direction === 'inbound');
      const p = msg && getPerson(msg.senderId);
      return p ? `${p.name} (${p.company})` : '';
    },
    drawings() {
      return (this.record.drawingIds || []).map((id) => ({ id, label: recordLabel(id), title: (getRecord(id) || {}).title || '' }));
    },
  },
};
</script>

<template>
  <!-- RFI › Workflow (Figma ☉ Create RFI › Workflow 1703:45546 and the step table 1703:44980): the template, then the
       steps in order (Create → Respond → Review → Close). Each step: number, action, status (WORKFLOW_STEP, one chip),
       its parties with company and company type, process days and the in / due / out dates. The step in hand is
       tinted, as the drawn accordion opens it. Editing a template is out of the prototype. -->
  <div class="flex flex-col gap-space-16 font-label">
    <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
      Template: <span class="text-text-default">{{ record.workflow.template }}</span> · {{ record.workflow.steps.length }} steps
    </p>
    <ol class="m-0 flex list-none flex-col p-0">
      <li
        v-for="(s, i) in steps"
        :key="s.id"
        class="flex gap-space-12 border-b border-border-subtle py-space-16"
        :class="{ '-mx-space-12 rounded-radius-6 bg-surface-primary-muted px-space-12': s.current }"
        :aria-current="s.current ? 'step' : null"
      >
        <span class="flex h-space-24 w-space-24 shrink-0 items-center justify-center rounded-radius-round border border-border-subtle text-fontsize-12 leading-lineheight-16 text-text-default">{{ i + 1 }}</span>
        <div class="flex min-w-0 flex-1 flex-col gap-space-8">
          <div class="flex flex-wrap items-center gap-x-space-8 gap-y-space-4">
            <span class="text-fontsize-14 font-bold uppercase leading-lineheight-20 text-text-default">{{ s.action }}</span>
            <StatusChip :label="s.status.label" :status="chip(s.status.tone)" fill-style="outline" type="default" :removable="false" />
          </div>
          <ul class="m-0 flex list-none flex-col gap-space-2 p-0 text-fontsize-14 leading-lineheight-20">
            <li v-for="p in s.parties" :key="p.id" class="text-text-default">
              {{ p.name }} <span class="text-text-subtle">· {{ p.company }} · {{ p.companyType }}</span>
            </li>
          </ul>
          <p class="m-0 flex flex-wrap gap-x-space-16 gap-y-space-2 text-fontsize-12 leading-lineheight-16 text-text-subtle">
            <span>Process days {{ s.processDays }}</span>
            <span>In {{ s.inDate }}</span>
            <span>Due {{ s.dueDate }}</span>
            <span>Out {{ s.outDate }}</span>
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script>
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import { WORKFLOW_STEP, toneToChipStatus } from '~/modules/app/status';
import { getPerson, companyTypeOf, stepStatus, currentStep, WORKFLOW_ACTIONS } from '../../data';

export default {
  name: 'RfiWorkflow',
  components: { StatusChip },
  props: {
    record: { type: Object, required: true },
  },
  computed: {
    steps() {
      const cur = currentStep(this.record);
      const d = (iso) => (iso ? this.$moment(iso).format('D MMM') : '—');
      return this.record.workflow.steps.map((s) => ({
        id: s.id,
        action: WORKFLOW_ACTIONS[s.action],
        status: WORKFLOW_STEP[stepStatus(s)],
        current: !!cur && cur.id === s.id,
        parties: s.partyIds.map(getPerson).filter(Boolean).map((p) => ({ id: p.id, name: p.name, company: p.company, companyType: companyTypeOf(p.company) })),
        processDays: s.processDays,
        inDate: d(s.inDate),
        dueDate: d(s.dueDate),
        outDate: d(s.outDate),
      }));
    },
  },
  methods: {
    chip: (tone) => toneToChipStatus(tone),
  },
};
</script>

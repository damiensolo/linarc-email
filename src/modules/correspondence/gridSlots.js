// DataGrid cell slots for the Correspondence screens, registered through the grid's public extension point
// (src/components/DataGrid/cellVariants/slotRegistry.js). Import once from a screen that uses these cell types.
//
//   'sla-due'  Response due as one signal (D-17, status-model.md › sla): a chip only when it asks for action
//              (Overdue in red, Due today in yellow), otherwise the date as muted text, "—" when there is none.
import { registerSlotType } from '@/components/DataGrid/cellVariants/slotRegistry';
import { resolveComponentProps } from '@/components/DataGrid/cellVariants/_resolvers';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import { SLA, toneToChipStatus } from '~/modules/app/status';

const SlaDue = {
  name: 'SlaDueSlot',
  props: {
    row: { type: Object, default: () => ({}) },
    value: { type: null, default: null },
    column: { type: Object, default: () => ({}) },
    slotProps: { type: Object, default: () => ({}) },
  },
  computed: {
    cp() {
      // componentProps: { sla: (row) => 'overdue' | 'due_today' | 'on_track' | 'none', dueText: (row) => '21 Oct' }
      return resolveComponentProps(this.slotProps.componentProps, this.row);
    },
  },
  render(h) {
    const sla = SLA[this.cp.sla] || SLA.none;
    if (this.cp.sla === 'overdue' || this.cp.sla === 'due_today') {
      const label = this.cp.sla === 'overdue' ? `${sla.label} · ${this.cp.dueText}` : sla.label;
      return h(StatusChip, { props: { label, status: toneToChipStatus(sla.tone, { strong: this.cp.sla === 'overdue' }), fillStyle: 'outline', type: 'default' } });
    }
    return h('span', { class: 'font-label text-fontsize-14 leading-lineheight-20 text-text-subtle' }, this.cp.sla === 'none' ? '—' : this.cp.dueText);
  },
};

registerSlotType('sla-due', SlaDue);

export const CORRESPONDENCE_SLOT_TYPES = ['sla-due'];

// DataGrid cell slots for the Notifications page, registered through the grid's public extension point
// (src/components/DataGrid/cellVariants/slotRegistry.js). Import once from the screen.
//
//   'signal'  One signal per value (D-17, docs/notifications/status-model.md): a chip (strong or not), a muted word or a
//             check, chosen per value by the column, never colour alone. componentProps:
//             { label: (row) => 'Critical', tone: (row) => 'warning', signal: (row) => 'chip' | 'word' | 'check' | 'none', strong?: (row) => bool }
import { registerSlotType } from '@/components/DataGrid/cellVariants/slotRegistry';
import { resolveComponentProps } from '@/components/DataGrid/cellVariants/_resolvers';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import { Check } from '@development/linarc-icons';
import { toneToChipStatus } from '~/modules/app/status';

const Signal = {
  name: 'SignalSlot',
  props: {
    row: { type: Object, default: () => ({}) },
    value: { type: null, default: null },
    column: { type: Object, default: () => ({}) },
    slotProps: { type: Object, default: () => ({}) },
  },
  computed: {
    cp() {
      return resolveComponentProps(this.slotProps.componentProps, this.row);
    },
  },
  render(h) {
    const { label, tone = 'neutral', signal = 'word', strong = false } = this.cp;
    if (signal === 'none' || !label) return h('span', { class: 'font-label text-fontsize-14 leading-lineheight-20 text-text-subtle' }, '—');
    if (signal === 'chip') return h(StatusChip, { props: { label, status: toneToChipStatus(tone, { strong }), fillStyle: strong ? 'solid' : 'outline', type: 'default', removable: false } });
    if (signal === 'check') {
      return h('span', { class: 'flex items-center gap-space-4 font-label text-fontsize-14 leading-lineheight-20 text-text-default' }, [h(Check, { props: { size: 16, strokeWidth: 2 }, class: 'text-icon-success' }), label]);
    }
    return h('span', { class: `font-label text-fontsize-14 leading-lineheight-20 ${tone === 'warning' ? 'text-text-default' : 'text-text-subtle'}` }, label);
  },
};

registerSlotType('signal', Signal);

export const NOTIFICATIONS_SLOT_TYPES = ['signal'];

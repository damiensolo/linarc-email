<template>
  <!-- CANDIDATE 2026-11-04: proposed design-system component, see docs/components/ThreadList.md. Not a prototype-local widget.
       A compact list of conversations for a reading pane (the Email screen's Reading view): one row per thread with
       who wrote last, when, the subject, the first line of the last message, a paperclip when files are attached, and a
       `status` slot for one signal (a chip or a muted word; the host decides, status.js). Two layouts (D-67,
       2026-11-06): `preview` (three lines, the snippet under the subject) and `list` (one line: sender, subject, signal,
       time; the dense view, as a mail client's). An `unread` item reads bold (sender and subject), as a mail client.
       `selectable` (D-68) puts a Checkbox at the left of every row: ticking emits `check({ id, checked })` and never
       selects the row, so a thread can be read while others are ticked for a bulk action the host offers.
       Rows are hairline-divided (D-17); the selected row carries surface/datatable/row-active (the grid's active row)
       and aria-selected; hover is surface/datatable/row-hover, as a grid row.
       Keyboard: a listbox; Up / Down move the selection, Home / End jump, Enter opens (`open`). Loading shows Skeleton
       rows in the final layout; empty shows `emptyText` as plain text (§3). Entries arrive resolved: no module data. -->
  <div class="tl-root flex min-h-0 w-full flex-col overflow-y-auto" :aria-busy="loading ? 'true' : null">
    <div v-if="loading" aria-hidden="true" class="flex flex-col">
      <template v-if="layout === 'list'">
        <div v-for="n in loadingRowCount" :key="n" class="flex h-space-40 items-center gap-space-12 border-b border-border-subtle px-space-16">
          <Skeleton size="sm" class="w-space-124" /><Skeleton size="sm" class="flex-1" /><Skeleton size="sm" class="w-space-40" />
        </div>
      </template>
      <template v-else>
        <div v-for="n in loadingRowCount" :key="n" class="flex flex-col gap-space-4 border-b border-border-subtle px-space-16 py-space-12">
          <div class="flex items-center justify-between gap-space-8"><Skeleton size="sm" class="w-space-124" /><Skeleton size="sm" class="w-space-40" /></div>
          <Skeleton size="sm" class="w-full" />
          <Skeleton size="sm" class="w-space-124" />
        </div>
      </template>
    </div>
    <p v-else-if="!items.length" class="m-0 px-space-16 py-space-16 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ emptyText }}</p>
    <div v-else ref="list" role="listbox" :aria-label="label" :aria-multiselectable="selectable ? 'true' : null" :aria-activedescendant="selectedId ? rowId(selectedId) : null" tabindex="0" class="flex flex-col outline-none" @keydown="onKey">
      <div
        v-for="item in items"
        :id="rowId(item.id)"
        :key="item.id"
        role="option"
        :aria-selected="item.id === selectedId ? 'true' : 'false'"
        :aria-checked="selectable ? (isChecked(item.id) ? 'true' : 'false') : null"
        :data-unread="item.unread ? 'true' : null"
        :data-checked="isChecked(item.id) ? 'true' : null"
        class="tl-row flex cursor-pointer border-b border-border-subtle px-space-16 font-label"
        :class="[
          item.id === selectedId ? 'bg-surface-datatable-row-active' : isChecked(item.id) ? 'bg-surface-datatable-row-hover' : 'hover:bg-surface-datatable-row-hover',
          layout === 'list' ? 'tl-row--list h-space-40 items-center gap-space-12' : 'tl-row--preview gap-space-12 py-space-10',
        ]"
        @click="$emit('select', item.id)"
        @dblclick="$emit('open', item.id)"
      >
        <!-- the checkbox (D-68): its click ticks, never selects; preview rows keep it on the first line -->
        <span v-if="selectable" class="tl-check flex shrink-0 items-center" :class="layout === 'list' ? '' : 'h-space-20'" @click.stop @dblclick.stop>
          <Checkbox :value="isChecked(item.id)" size="small" :aria-label="`Select ${item.subject}`" @input="$emit('check', { id: item.id, checked: $event })" />
        </span>
        <!-- list: one line -->
        <template v-if="layout === 'list'">
          <span class="w-1/3 shrink-0 truncate text-fontsize-14 leading-lineheight-20 text-text-default" :class="item.unread ? 'font-bold' : 'font-medium'">{{ item.from }}</span>
          <span class="min-w-0 flex-1 truncate text-fontsize-14 leading-lineheight-20 text-text-default" :class="item.unread ? 'font-bold' : ''">{{ item.subject }}</span>
          <slot name="status" :item="item" />
          <Paperclip v-if="item.hasAttachments" :size="14" :stroke-width="2" class="shrink-0 text-icon-inactive" aria-label="Has attachments" />
          <span class="w-space-48 shrink-0 text-right text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ item.time }}</span>
        </template>
        <!-- preview: sender and time, subject, snippet with the signal -->
        <div v-else class="flex min-w-0 flex-1 flex-col gap-space-2">
          <div class="flex items-baseline gap-space-8">
            <span class="min-w-0 flex-1 truncate text-fontsize-14 leading-lineheight-20 text-text-default" :class="item.unread ? 'font-bold' : 'font-medium'">{{ item.from }}</span>
            <span class="shrink-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ item.time }}</span>
          </div>
          <span class="truncate text-fontsize-14 leading-lineheight-20 text-text-default" :class="item.unread ? 'font-bold' : ''">{{ item.subject }}</span>
          <div class="flex items-center gap-space-8">
            <span class="min-w-0 flex-1 truncate text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ item.snippet }}</span>
            <Paperclip v-if="item.hasAttachments" :size="14" :stroke-width="2" class="shrink-0 text-icon-inactive" aria-label="Has attachments" />
            <slot name="status" :item="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Paperclip } from '@development/linarc-icons';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';

let seq = 0;

export default {
  name: 'ThreadList',
  components: { Paperclip, Checkbox, Skeleton },
  props: {
    /** [{ id, from, time, subject, snippet, hasAttachments, unread? }] in display order. */
    items: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    /** `preview` (three lines) or `list` (one line). */
    layout: { type: String, default: 'preview', validator: (v) => ['preview', 'list'].includes(v) },
    /** A Checkbox per row; `checkedIds` says which are ticked (D-68). */
    selectable: { type: Boolean, default: false },
    checkedIds: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    loadingRowCount: { type: Number, default: 8 },
    emptyText: { type: String, default: 'No email matches.' },
    label: { type: String, default: 'Conversations' },
  },
  // select(id) · open(id) · check({ id, checked })
  data() {
    seq += 1;
    return { uid: `tl-${seq}` };
  },
  watch: {
    selectedId(id) {
      this.$nextTick(() => this.reveal(id));
    },
  },
  methods: {
    rowId(id) {
      return `${this.uid}-${id}`;
    },
    isChecked(id) {
      return this.checkedIds.includes(id);
    },
    reveal(id) {
      const el = id && document.getElementById(this.rowId(id));
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    },
    onKey(e) {
      const ids = this.items.map((i) => i.id);
      if (!ids.length) return;
      const i = ids.indexOf(this.selectedId);
      let next = null;
      if (e.key === 'ArrowDown') next = ids[Math.min(ids.length - 1, i + 1)];
      else if (e.key === 'ArrowUp') next = ids[Math.max(0, i - 1)];
      else if (e.key === 'Home') next = ids[0];
      else if (e.key === 'End') next = ids[ids.length - 1];
      else if (e.key === ' ' && this.selectable && this.selectedId) {
        e.preventDefault();
        this.$emit('check', { id: this.selectedId, checked: !this.isChecked(this.selectedId) });
        return;
      } else if (e.key === 'Enter' && this.selectedId) {
        e.preventDefault();
        this.$emit('open', this.selectedId);
        return;
      }
      if (next == null) return;
      e.preventDefault();
      if (next !== this.selectedId) this.$emit('select', next);
    },
  },
};
</script>

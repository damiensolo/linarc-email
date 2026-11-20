<template>
  <!-- CANDIDATE 2026-11-04: proposed design-system component, see docs/components/ViewsPane.md. Not a prototype-local widget.
       The narrow pane at the left of a list that says which slice of it is shown: sections with a small uppercase
       heading, each one of three kinds. `list` = one choice among rows with a count (the views; the chosen row carries
       surface/datatable/row-active, the grid's active-row tint, and the primary text colour), `checks` = any number of Checkbox rows with a count,
       `select` = a compact SelectV2 with an optional helper line under it. The pane holds no filtering logic: every
       change is emitted as `change({ id, value })` and the host writes it to the grid's Filter panel (D-30), so the
       Filter badge and the pane always agree. Counts are the host's (over every row, not the filtered ones).
       Padding sits inside the scrolling element (F-051).
       Sections collapse (D-81, 2026-11-19): the heading is a button; a small caret in the pane's left padding shows on
       hover or keyboard focus and stays while the section is closed, so the labels never move. A closed section keeps
       a one-word summary of its value after the heading. Which sections are closed is the host's (`collapsed` +
       `toggle`); without the prop the pane remembers it for its own lifetime. -->
  <nav class="vp-root flex min-h-0 w-full flex-col overflow-y-auto px-space-16 py-space-16" :aria-label="label">
    <div class="flex flex-col gap-space-24">
      <section v-for="s in sections" :key="s.id" class="vp-section flex flex-col gap-space-8" :data-section="s.id" :data-collapsed="isCollapsed(s.id) ? 'true' : null">
        <h3 class="relative m-0 font-label text-fontsize-12 font-bold uppercase leading-lineheight-16 tracking-letterspacing-1 text-text-subtle">
          <button
            type="button"
            class="vp-toggle flex w-full items-center gap-space-4 rounded-radius-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-primary-focused"
            :aria-expanded="isCollapsed(s.id) ? 'false' : 'true'"
            :aria-controls="`vp-body-${s.id}`"
            @click="toggleSection(s.id)"
          >
            <span class="vp-caret absolute -left-space-16 top-0 flex h-space-16 w-space-16 items-center justify-center text-icon-inactive" aria-hidden="true">
              <ChevronRight v-if="isCollapsed(s.id)" :size="12" />
              <ChevronDown v-else :size="12" />
            </span>
            <span class="shrink-0">{{ s.label }}</span>
            <span v-if="isCollapsed(s.id) && summary(s)" class="min-w-0 truncate font-normal normal-case tracking-letterspacing-0">· {{ summary(s) }}</span>
          </button>
        </h3>

        <div v-show="!isCollapsed(s.id)" :id="`vp-body-${s.id}`" class="flex flex-col">
        <ul v-if="s.type === 'list'" class="-mx-space-12 m-0 flex list-none flex-col p-0" role="listbox" :aria-label="s.label">
          <li v-for="it in s.items" :key="it.id" role="option" :aria-selected="it.id === s.value ? 'true' : 'false'">
            <button
              type="button"
              class="flex h-space-32 w-full items-center gap-space-8 rounded-radius-6 px-space-12 text-left font-label text-fontsize-14 leading-lineheight-20 outline-none focus-visible:ring-2 focus-visible:ring-border-primary-focused"
              :class="it.id === s.value ? 'bg-surface-datatable-row-active font-bold text-text-primary-default' : 'text-text-default hover:bg-surface-datatable-row-hover'"
              @click="$emit('change', { id: s.id, value: it.id })"
            >
              <span class="min-w-0 flex-1 truncate" :class="it.muted && it.id !== s.value ? 'text-text-subtle' : ''">{{ it.label }}</span>
              <span
                v-if="it.count != null"
                class="shrink-0 text-fontsize-12 leading-lineheight-16"
                :class="countClass(it, it.id === s.value)"
              >{{ it.count }}</span>
            </button>
          </li>
        </ul>

        <ul v-else-if="s.type === 'checks'" class="m-0 flex list-none flex-col p-0">
          <li v-for="it in s.items" :key="it.id" class="flex h-space-32 items-center gap-space-8">
            <Checkbox :value="(s.value || []).includes(it.id)" :label="it.label" size="small" class="min-w-0 flex-1" @input="toggle(s, it.id, $event)" />
            <span v-if="it.count != null" class="shrink-0 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ it.count }}</span>
          </li>
        </ul>

        <div v-else-if="s.type === 'select'" class="flex flex-col gap-space-4">
          <SelectV2 :value="s.value" :options="s.options" size="small" :placeholder="s.placeholder || ''" :show-scrollbar="true" @input="$emit('change', { id: s.id, value: $event })" />
          <p v-if="s.helper" class="m-0 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ s.helper }}</p>
        </div>
        </div>
      </section>
    </div>
  </nav>
</template>

<script>
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import { ChevronDown, ChevronRight } from '@development/linarc-icons';

export default {
  name: 'ViewsPane',
  components: { Checkbox, SelectV2, ChevronDown, ChevronRight },
  props: {
    /**
     * [{ id, label, type: 'list' | 'checks' | 'select', value, items?: [{ id, label, count?, tone?, muted? }],
     *    options?: [{ value, label }], helper?, placeholder? }]
     * list: value = the chosen item id · checks: value = [ids] · select: value = the option value
     */
    sections: { type: Array, default: () => [] },
    label: { type: String, default: 'Views and filters' },
    /** Ids of the closed sections (D-81). Controlled when given (the host keeps it; see `toggle`); otherwise the pane keeps its own. */
    collapsed: { type: Array, default: null },
  },
  data() {
    return { ownCollapsed: [] };
  },
  // change({ id, value }) · toggle({ id, collapsed })
  methods: {
    isCollapsed(id) {
      return (this.collapsed || this.ownCollapsed).includes(id);
    },
    toggleSection(id) {
      const closed = !this.isCollapsed(id);
      if (!this.collapsed) this.ownCollapsed = closed ? [...this.ownCollapsed, id] : this.ownCollapsed.filter((x) => x !== id);
      this.$emit('toggle', { id, collapsed: closed });
    },
    /** What a closed section is set to: the chosen view, how many boxes are ticked, the chosen option (none when it is the first). */
    summary(s) {
      if (s.type === 'list') {
        const it = (s.items || []).find((i) => i.id === s.value);
        return it ? `${it.label}${it.count != null ? ` ${it.count}` : ''}` : '';
      }
      if (s.type === 'checks') {
        const n = (s.value || []).length;
        return n ? `${n} ticked` : '';
      }
      const opts = s.options || [];
      const i = opts.findIndex((o) => o.value === s.value);
      return i > 0 ? opts[i].label : '';
    },
    toggle(section, id, on) {
      const current = section.value || [];
      const value = on ? [...current.filter((v) => v !== id), id] : current.filter((v) => v !== id);
      this.$emit('change', { id: section.id, value });
    },
    /** The count is muted text; an `error` tone with a count (Overdue) gets the error tint, as status.js reads it. */
    countClass(it, selected) {
      if (it.tone === 'error' && it.count > 0) return 'rounded-radius-round bg-surface-error-subtle px-space-8 font-bold text-text-error-default';
      return selected ? 'font-bold text-text-primary-default' : 'text-text-subtle';
    },
  },
};
</script>

<style scoped>
/* The caret is out of the way until the section is hovered or its heading focused; a closed section keeps it (D-81). */
.vp-caret {
  opacity: 0;
  transition: opacity 120ms ease;
}
.vp-section:hover .vp-caret,
.vp-toggle:focus-visible .vp-caret,
.vp-section[data-collapsed] .vp-caret {
  opacity: 1;
}
</style>

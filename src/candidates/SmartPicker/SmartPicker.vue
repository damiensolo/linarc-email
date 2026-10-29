<template>
  <!-- CANDIDATE 2026-10-28: proposed design-system component, see docs/components/SmartPicker.md. Not a prototype-local widget.
       A search-first picker for records and files (D-61): a search box (Input Field Type=Search Bar) that ranks
       matches as you type (label, code, keywords, description), one Checkbox per kind of item (all on by default;
       untick to hide a kind; the label carries how many match the query), the list as Dropdown Rows (SelectV2ListItem
       detailed, with a checkbox when `multiple`) grouped Suggested, Recent and then by kind while nothing is typed,
       picks as removable chips on a line that is always there, and an empty state that says how to widen the search.
       The list has a fixed height, so the host modal never changes size while filtering or picking. Single pick
       (`value` = id) or multiple (`value` = ids). Keyboard: ↑ ↓ move, Enter picks or toggles, Esc clears the query
       first. The host (a compact ModalV2 `size="md"`, D-34) owns the primary button.
       Composes library parts: InputV2 (+ `inputAttrs`, P-058), Checkbox, Chip, SelectV2ListItem (P-050), Button. -->
  <div class="sp flex min-h-0 flex-col gap-space-16 font-label" @keydown="onKeydown">
    <InputV2
      :id="inputId"
      v-model="query"
      size="small"
      :placeholder="placeholder"
      :need-prefix-icon="true"
      :need-suffix-icon="!!query"
      :on-suffix-icon-click="clear"
      autocomplete="off"
      :input-attrs="inputAttrs"
    >
      <template #prefixIcon><Search :size="16" :stroke-width="1.5" class="text-icon-default" aria-hidden="true" /></template>
      <!-- Clear (Input Field Search Bar's Icon R): back to browsing without reaching for Esc -->
      <template #suffixIcon><X :size="16" :stroke-width="1.5" class="text-icon-default" role="img" aria-label="Clear search" /></template>
    </InputV2>

    <!-- Kinds: one checkbox each, all on by default; the label carries how many match the current query -->
    <div v-if="kinds.length" role="group" :aria-label="kindsLabel" class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
      <Checkbox
        v-for="k in kindRows"
        :key="k.id"
        :value="k.on"
        :label="k.text"
        size="small"
        @input="toggleKind(k.id, $event)"
      />
    </div>

    <!-- What is picked so far (multiple): a line that is always there, so a pick never changes the modal's height -->
    <div v-if="multiple" class="flex min-h-space-24 flex-wrap items-center gap-space-8" :aria-label="selectedLabel">
      <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ selectedItems.length ? `${selectedItems.length} selected` : 'Nothing selected yet.' }}</span>
      <Chip
        v-for="it in selectedItems"
        :key="it.id"
        :label="it.chipLabel || it.label"
        size="small"
        fill-style="outline"
        removable
        :remove-aria-label="`Remove ${it.chipLabel || it.label}`"
        @remove="toggle(it)"
      />
    </div>

    <div
      :id="listId"
      role="listbox"
      :aria-label="listLabel"
      :aria-multiselectable="multiple ? 'true' : undefined"
      class="sp-list min-h-0 overflow-y-auto rounded-radius-6 border border-border-subtle bg-surface-container py-space-4"
      :style="{ height: `${visibleRows * 56 + 8}px` }"
      @mousedown.prevent
    >
      <template v-for="sec in sections">
        <div v-if="sec.label" :key="`h-${sec.id}`" role="presentation" class="px-space-12 pb-space-4 pt-space-8 text-fontsize-12 leading-lineheight-16 font-semibold text-text-muted">
          {{ sec.label }}
        </div>
        <SelectV2ListItem
          v-for="row in sec.rows"
          :id="optionId(row.index)"
          :key="row.item.id"
          :option="row.option"
          type="detailed"
          :is-multiselect="multiple"
          :selected="isSelected(row.item)"
          :highlighted="row.index === active"
          @select="choose(row.item)"
          @mouseenter.native="active = row.index"
        />
      </template>
      <!-- Empty: what was searched and how to widen it (a warning that guides) -->
      <div v-if="!flat.length" class="flex flex-col items-start gap-space-8 px-space-12 py-space-16 text-fontsize-14 leading-lineheight-20 text-text-subtle">
        <p class="m-0">{{ emptyLine }}</p>
        <Button v-if="hiddenKinds.length" label="Show all types" color-scheme="secondary" variant="minimal" size="small" @onClick="showAllKinds" />
      </div>
    </div>
    <span class="sr-only" role="status" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<script>
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import Chip from '@/components/Chip/Chip.vue';
import Button from '@/components/Button/Button.vue';
import SelectV2ListItem from '@/componentsV2/SelectV2/SelectV2ListItem.vue';
import { Search, X } from '@development/linarc-icons';
import { rankItems } from './smartPicker';

let seq = 0;

export default {
  name: 'SmartPicker',
  components: { InputV2, Checkbox, Chip, Button, SelectV2ListItem, Search, X },
  props: {
    /** v-model: the picked id (single) or the picked ids in pick order (multiple). */
    value: { type: [String, Number, Array], default: null },
    /**
     * `[{ id, label, description?, meta?, kind?, keywords?, chipLabel?, suggested?, recent? }]`. `label` is the row
     * title (searched first), `description` the second line, `meta` the right-hand text; `kind` matches a `kinds` id;
     * `keywords` are extra searchable words (a code without its dash, a discipline); `chipLabel` is the short form
     * for the picked chips; `suggested` and `recent` rows lead the list while nothing is typed.
     */
    items: { type: Array, default: () => [] },
    /** `[{ id, label }]` in the order of the kind checkboxes; empty hides them. All kinds start on. */
    kinds: { type: Array, default: () => [] },
    multiple: { type: Boolean, default: false },
    placeholder: { type: String, default: 'Search' },
    /** What the items are, for the accessible names and the empty state: "records", "files". */
    noun: { type: String, default: 'items' },
    suggestedLabel: { type: String, default: 'Suggested' },
    recentLabel: { type: String, default: 'Recent' },
    /** Rows the list shows (a row is 56px); the list keeps this height whatever it holds. */
    visibleRows: { type: Number, default: 6 },
    /** Most rows shown for a query; the rest stay reachable by typing more. */
    maxResults: { type: Number, default: 50 },
    autofocus: { type: Boolean, default: true },
  },
  data() {
    seq += 1;
    return { uid: `sp-${seq}`, query: '', hiddenKinds: [], active: -1, announcement: '' };
  },
  computed: {
    inputId() {
      return `${this.uid}-input`;
    },
    listId() {
      return `${this.uid}-list`;
    },
    kindsLabel() {
      return `Show ${this.noun} of type`;
    },
    listLabel() {
      return this.query.trim() ? `${this.noun} matching ${this.query.trim()}` : this.noun;
    },
    selectedLabel() {
      return `Selected ${this.noun}`;
    },
    inputAttrs() {
      return {
        role: 'combobox',
        'aria-label': `Search ${this.noun}`,
        'aria-expanded': 'true',
        'aria-controls': this.listId,
        'aria-activedescendant': this.active >= 0 ? this.optionId(this.active) : undefined,
        'aria-autocomplete': 'list',
        spellcheck: 'false',
      };
    },
    ids() {
      if (this.multiple) return Array.isArray(this.value) ? this.value : [];
      return this.value == null || this.value === '' ? [] : [this.value];
    },
    selectedItems() {
      return this.ids.map((id) => this.items.find((it) => it.id === id)).filter(Boolean);
    },
    /** Every item that matches the query, best first; the kind filter is applied after so the counts stay honest. */
    ranked() {
      return rankItems(this.items, this.query);
    },
    kindRows() {
      return this.kinds.map((k) => ({ id: k.id, on: !this.hiddenKinds.includes(k.id), text: `${k.label} · ${this.ranked.filter((it) => it.kind === k.id).length}` }));
    },
    filtered() {
      return this.ranked.filter((it) => !it.kind || !this.hiddenKinds.includes(it.kind)).slice(0, this.maxResults);
    },
    /**
     * Rows in order with their index. While typing: one ranked list. Otherwise: Suggested, Recent, then the kinds in
     * order (each headed), then anything without a kind.
     */
    sections() {
      const typing = !!this.query.trim();
      const option = (it) => ({ value: it.id, label: it.label, leftDescription: it.description || '', rightDescription: it.meta || '' });
      let index = 0;
      const section = (id, label, list) => ({ id, label: list.length ? label : '', rows: list.map((it) => ({ item: it, option: option(it), index: index++ })) });
      if (typing) return [section('results', '', this.filtered)];
      const rest = this.filtered.slice();
      const take = (pred) => {
        const out = rest.filter(pred);
        out.forEach((it) => rest.splice(rest.indexOf(it), 1));
        return out;
      };
      const out = [section('suggested', this.suggestedLabel, take((it) => it.suggested)), section('recent', this.recentLabel, take((it) => it.recent))];
      this.kinds.forEach((k) => out.push(section(k.id, k.label, take((it) => it.kind === k.id))));
      out.push(section('other', '', rest));
      return out.filter((s) => s.rows.length);
    },
    flat() {
      return this.sections.reduce((all, s) => all.concat(s.rows.map((r) => r.item)), []);
    },
    emptyLine() {
      const q = this.query.trim();
      if (!this.items.length) return `No ${this.noun} to choose from.`;
      const shown = this.kinds.filter((k) => !this.hiddenKinds.includes(k.id));
      const what = this.hiddenKinds.length && shown.length ? shown.map((k) => k.label.toLowerCase()).join(' or ') : this.noun;
      if (!shown.length && this.kinds.length) return `Every type is hidden. Tick a type to see ${this.noun}.`;
      if (q) return `No ${what} match “${q}”. Try a code or a word from the title.`;
      return `No ${what} here.`;
    },
  },
  mounted() {
    // The search box takes focus once the host (a modal with a transition) has shown it.
    if (this.autofocus) this.$nextTick(() => setTimeout(() => this.focus(), 60));
  },
  watch: {
    query(q) {
      // The best match is ready for Enter as soon as something is typed; nothing is pre-selected while browsing.
      this.active = q.trim() && this.flat.length ? 0 : -1;
      this.say(this.flat.length ? `${this.flat.length} ${this.flat.length === 1 ? 'result' : 'results'}` : 'No results');
    },
    flat(list) {
      if (this.active >= list.length) this.active = list.length - 1;
    },
  },
  methods: {
    optionId(i) {
      return `${this.uid}-opt-${i}`;
    },
    isSelected(item) {
      return this.ids.includes(item.id);
    },
    toggleKind(id, on) {
      this.hiddenKinds = on ? this.hiddenKinds.filter((k) => k !== id) : [...this.hiddenKinds, id];
      this.active = -1;
      const k = this.kinds.find((x) => x.id === id) || {};
      this.say(`${k.label} ${on ? 'shown' : 'hidden'}, ${this.filtered.length} ${this.filtered.length === 1 ? 'result' : 'results'}`);
    },
    showAllKinds() {
      this.hiddenKinds = [];
      this.say(`All types shown, ${this.filtered.length} results`);
      this.focus();
    },
    choose(item) {
      if (this.multiple) {
        this.toggle(item);
        return;
      }
      this.$emit('input', item.id);
      this.$emit('pick', item);
      this.say(`${item.label} selected`);
    },
    toggle(item) {
      const on = this.ids.includes(item.id);
      const next = on ? this.ids.filter((id) => id !== item.id) : [...this.ids, item.id];
      this.$emit('input', next);
      this.say(`${item.chipLabel || item.label} ${on ? 'removed' : 'added'}, ${next.length} selected`);
      if (on) this.focus();
    },
    move(delta) {
      const n = this.flat.length;
      if (!n) return;
      this.active = this.active < 0 ? (delta > 0 ? 0 : n - 1) : (this.active + delta + n) % n;
      this.$nextTick(() => {
        const el = document.getElementById(this.optionId(this.active));
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      });
    },
    onKeydown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.move(-1);
      } else if (e.key === 'Home' && this.flat.length && e.target.id === this.inputId && !this.query) {
        e.preventDefault();
        this.active = 0;
      } else if (e.key === 'End' && this.flat.length && e.target.id === this.inputId && !this.query) {
        e.preventDefault();
        this.active = this.flat.length - 1;
      } else if (e.key === 'Enter') {
        if (this.active >= 0 && this.flat[this.active] && e.target.id === this.inputId) {
          e.preventDefault();
          this.choose(this.flat[this.active]);
        }
      } else if (e.key === 'Escape' && this.query) {
        // Clear the search before the host (a modal) closes on Esc.
        e.preventDefault();
        e.stopPropagation();
        this.clear();
      }
    },
    focus() {
      const el = document.getElementById(this.inputId);
      if (el) el.focus();
    },
    clear() {
      this.query = '';
      this.active = -1;
      this.focus();
    },
    say(text) {
      this.announcement = '';
      this.$nextTick(() => (this.announcement = text));
    },
  },
};
</script>

<style scoped>
/* The list keeps room for its scrollbar so rows don't shift when a filter shortens it. */
.sp-list {
  scrollbar-gutter: stable;
}
</style>

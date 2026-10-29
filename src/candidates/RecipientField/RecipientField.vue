<template>
  <!-- CANDIDATE 2026-10-19: proposed design-system component, see docs/components/RecipientField.md. Not a prototype-local widget.
       An address field with input chips: a leading label ("To", "Cc"), committed recipients as chips (internal neutral,
       external amber, invalid red; avatar, name, ✕), raw text while typing with a typeahead list of directory contacts,
       commit on pick / Enter / Tab / comma / paste / blur, Backspace cascade, double-click to edit, drag between fields
       of the same `group`, and a right-click menu (View contact, Copy email address, Show email address, Move to…,
       Edit, Remove), a Tooltip per chip (external: "Outside <organization>"), avatars optional (`showAvatar`).
       Composes library parts: StatusChip Type=Avatar (+ Avatar xs, P-050), SelectV2ListItem detailed rows with an avatar
       (P-050), Tooltip, Popover, MemberCardV2. -->
  <div class="rf font-label">
    <div
      ref="box"
      class="rf-box flex flex-wrap items-center gap-space-4 rounded-radius-4 border border-border-input bg-surface-input py-space-4 pl-space-12 pr-space-8"
      :class="{ 'rf-box--focus': focused, 'rf-box--drop': dropActive, 'rf-box--error': error, 'rf-box--disabled': disabled }"
      @mousedown="onBoxMouseDown"
      @dragover="onDragOver"
      @dragleave="dropActive = false"
      @drop="onDrop"
    >
      <label :for="inputId" class="shrink-0 pr-space-4 text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ label }}</label>

      <span
        v-for="(r, i) in value"
        :key="`${r.email}-${i}`"
        :ref="`chip-${i}`"
        class="rf-chip inline-flex max-w-full rounded-radius-round"
        :class="{ 'rf-chip--selected': selected === i }"
        :draggable="!disabled"
        @mousedown.stop="onChipMouseDown(i, $event)"
        @dblclick.prevent="edit(i)"
        @contextmenu.prevent="openMenu(i)"
        @dragstart="onDragStart(i, $event)"
        @dragend="onDragEnd(i)"
      >
        <!-- The library Tooltip says who the chip is and, for external chips, that they're outside the organization;
             it also opens when the chip's ✕ gets keyboard focus. -->
        <Tooltip :label="chipTooltip(r)" placement="top" :delay="300">
          <StatusChip
            type="avatar"
            :status="chipStatus(r)"
            fill-style="outline"
            :label="chipLabel(r)"
            :left-item="showAvatar ? r.avatarUrl || undefined : undefined"
            :avatar-initials="showAvatar ? r.name || r.email : ''"
            :avatar-alt="r.name || r.email"
            :removable="!disabled"
            :remove-aria-label="`Remove ${r.name || r.email}`"
            :disabled="disabled"
            @remove="remove(i)"
          />
        </Tooltip>
      </span>

      <input
        :id="inputId"
        ref="input"
        v-model="buffer"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        :aria-expanded="listOpen ? 'true' : 'false'"
        :aria-controls="listId"
        :aria-activedescendant="listOpen && active >= 0 ? optionId(active) : undefined"
        aria-autocomplete="list"
        :aria-describedby="hintId"
        :placeholder="value.length ? '' : placeholder"
        :disabled="disabled"
        class="rf-input h-space-32 min-w-space-124 flex-1 border-0 bg-transparent p-space-0 text-fontsize-14 leading-lineheight-20 text-text-default outline-none placeholder:text-text-input-default"
        @focus="onFocus"
        @blur="onBlur"
        @input="onInput"
        @keydown="onKeydown"
        @paste="onPaste"
      />

      <span v-if="$slots.trailing" class="ml-auto flex shrink-0 items-center gap-space-4" @mousedown.stop>
        <slot name="trailing" />
      </span>
    </div>
    <span :id="hintId" class="sr-only">Type a name or an email address. Enter, Tab or comma adds it. Backspace selects the last recipient, again removes it. Double-click a recipient to edit it.</span>
    <span class="sr-only" role="status" aria-live="polite">{{ announcement }}</span>

    <!-- Typeahead: directory contacts as the library's list rows (SelectV2ListItem, detailed + avatar) -->
    <Popover
      :open="listOpen"
      :anchor="$refs.box"
      placement="bottom-start"
      variant="card"
      :offset="4"
      :trap-focus="false"
      :restore-focus="false"
      :light-dismiss="false"
    >
      <div :id="listId" role="listbox" :aria-label="`${label} suggestions`" class="rf-list overflow-y-auto py-space-4" :style="{ width: `${boxWidth}px` }" @mousedown.prevent>
        <SelectV2ListItem
          v-for="(c, i) in suggestions"
          :id="optionId(i)"
          :key="c.email"
          :option="{ value: c.email, label: c.name || c.email, leftDescription: c.name ? c.email : '', rightDescription: c.company || '', avatarInitials: showAvatar ? c.name || c.email : '', avatarUrl: showAvatar ? c.avatarUrl : '' }"
          type="detailed"
          :highlighted="i === active"
          @select="pick(c)"
          @mouseenter.native="active = i"
        />
        <div
          v-if="unknownOption && unknownActionLabel"
          :id="optionId(suggestions.length)"
          role="option"
          :aria-selected="active === suggestions.length ? 'true' : 'false'"
          class="flex cursor-pointer items-center gap-space-12 border-l-2 border-l-transparent px-space-12 py-space-8 text-fontsize-14 leading-lineheight-20 text-text-default"
          :class="{ 'bg-surface-soft': active === suggestions.length }"
          @mouseenter="active = suggestions.length"
          @click="commitUnknown(unknownOption)"
        >
          <UserPlus :size="20" :stroke-width="1.5" class="shrink-0 text-icon-default" aria-hidden="true" />
          <span class="min-w-0 truncate">{{ unknownActionLabel.replace('{email}', unknownOption.email) }}</span>
        </div>
        <!-- No action for an unknown address: the message says where people are added (a warning that guides) -->
        <p v-else-if="unknownOption" class="m-0 px-space-12 py-space-8 text-fontsize-14 leading-lineheight-20 text-text-subtle">
          {{ unknownMessage.replace('{email}', unknownOption.email) }}
        </p>
        <p v-if="!suggestions.length && !unknownOption" class="m-0 px-space-12 py-space-8 text-fontsize-14 leading-lineheight-20 text-text-subtle">
          {{ buffer.trim() ? 'No one in the directory matches. Enter a full email address.' : 'Type a name or an email address.' }}
        </p>
      </div>
    </Popover>

    <!-- Right-click menu on a chip -->
    <Popover :open="menu.open" :anchor="menu.anchor" placement="bottom-start" variant="card" :offset="4" @close="closeMenu">
      <div role="menu" :aria-label="menuRecipient ? `Actions for ${menuRecipient.name || menuRecipient.email}` : 'Recipient actions'" class="flex min-w-space-124 flex-col py-space-4" @keydown="onMenuKeydown">
        <button
          v-for="item in menuItems"
          :key="item.id"
          type="button"
          role="menuitem"
          class="rf-menu-item flex items-center gap-space-8 border-0 bg-transparent px-space-12 py-space-8 text-left text-fontsize-14 leading-lineheight-20 text-text-default disabled:cursor-not-allowed disabled:text-text-inactive"
          :disabled="item.disabled"
          @click="runMenu(item)"
        >
          <component :is="item.icon" :size="16" :stroke-width="1.5" class="shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Popover>

    <!-- Contact card (View contact) -->
    <Popover :open="card.open" :anchor="card.anchor" placement="bottom-start" variant="plain" :offset="4" @close="card.open = false">
      <!-- index ≠ selectedMemberIndex: the card's unselected state (both undefined compare equal and paint it selected) -->
      <MemberCardV2 v-if="card.recipient" :member-data="cardData" :index="0" :selected-member-index="-1" class="rf-card" />
    </Popover>
  </div>
</template>

<script>
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import MemberCardV2 from '@/components/MemberCardV2/index.vue';
import SelectV2ListItem from '@/componentsV2/SelectV2/SelectV2ListItem.vue';
import Popover from '@/componentsV2/Popover/Popover.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import { UserPlus, IdCard, ClipboardCopy, Mail, User, Pencil, Trash2, ArrowRightLeft } from '@development/linarc-icons';
import { isEmail, parseToken, splitTokens, kindOf, toClipboardText, matchContacts } from './recipients';

let seq = 0;
// One drag at a time across every field on the page: who started it and where it was dropped.
const drag = { sourceUid: null, group: null, targetUid: null };

export default {
  name: 'RecipientField',
  components: { StatusChip, MemberCardV2, SelectV2ListItem, Popover, Tooltip, UserPlus },
  model: { prop: 'value', event: 'input' },
  props: {
    /** Committed recipients, in order: [{ email, name?, company?, role?, avatarUrl?, id?, invalid? }] (v-model). */
    value: { type: Array, default: () => [] },
    /** The leading label inside the field ("To", "Cc", "Bcc"). */
    label: { type: String, default: 'To' },
    /** The directory the typeahead searches: same shape as `value`. Order is kept when the query is empty. */
    contacts: { type: Array, default: () => [] },
    /** Domains of the organization; any other domain gets the external (amber) chip. Empty: no external marking. */
    internalDomains: { type: Array, default: () => [] },
    /** The organization's name for the external chip's tooltip ("Outside Vanguard Construction Group"). */
    organizationName: { type: String, default: '' },
    /** Avatars on chips and list rows (a photo from `avatarUrl`, else the first initial). */
    showAvatar: { type: Boolean, default: true },
    /**
     * A valid address that isn't in `contacts`: committed as a chip (true), or handed to the page through `unknown`
     * (false). The list then offers `unknownActionLabel` for it when the page can add people itself; with no action
     * label it shows `unknownMessage` instead, and the text stays in the field (nothing is created, D-60).
     */
    allowUnknown: { type: Boolean, default: true },
    unknownActionLabel: { type: String, default: '' },
    unknownMessage: { type: String, default: "{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first." },
    /** Fields sharing a group accept each other's chips by drag and drop. */
    group: { type: String, default: 'recipients' },
    /** "Move to…" entries in the chip menu (keyboard and touch alternative to dragging): [{ id, label }]. */
    moveTargets: { type: Array, default: () => [] },
    /** Open the list on focus with the first contacts (suggested recipients) before anything is typed. */
    suggestOnFocus: { type: Boolean, default: true },
    maxSuggestions: { type: Number, default: 8 },
    placeholder: { type: String, default: '' },
    /** Error outline (the page explains it, e.g. an invalid address to fix). */
    error: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  data() {
    seq += 1;
    return {
      uid: `rf-${seq}`,
      buffer: '',
      focused: false,
      listWanted: false,
      active: -1,
      selected: -1,
      masked: {},
      announcement: '',
      dropActive: false,
      boxWidth: 320,
      menu: { open: false, index: -1, anchor: null },
      card: { open: false, anchor: null, recipient: null },
    };
  },
  computed: {
    inputId() {
      return `${this.uid}-input`;
    },
    listId() {
      return `${this.uid}-list`;
    },
    hintId() {
      return `${this.uid}-hint`;
    },
    taken() {
      return this.value.map((r) => String(r.email).toLowerCase());
    },
    suggestions() {
      const q = this.buffer.trim();
      if (!q && !this.suggestOnFocus) return [];
      return matchContacts(this.contacts, q, this.taken).slice(0, this.maxSuggestions);
    },
    /** A complete address typed that nobody in the directory has, when the page adds unknown people itself. */
    unknownOption() {
      if (this.allowUnknown) return null;
      const t = parseToken(this.buffer);
      if (!isEmail(t.email) || this.findContact(t.email) || this.taken.includes(t.email)) return null;
      return t;
    },
    optionCount() {
      return this.suggestions.length + (this.unknownOption && this.unknownActionLabel ? 1 : 0);
    },
    listOpen() {
      return this.focused && this.listWanted && !this.disabled && this.selected < 0 && (this.optionCount > 0 || !!this.buffer.trim());
    },
    menuRecipient() {
      return this.value[this.menu.index] || null;
    },
    menuItems() {
      const r = this.menuRecipient;
      if (!r) return [];
      const known = !!this.findContact(r.email);
      const valid = kindOf(r) !== 'invalid';
      return [
        { id: 'contact', label: 'View contact', icon: IdCard, disabled: !known },
        { id: 'copy', label: 'Copy email address', icon: ClipboardCopy, disabled: !valid },
        { id: 'mask', label: this.masked[r.email] ? 'Show name' : 'Show email address', icon: this.masked[r.email] ? User : Mail, disabled: !r.name },
        ...this.moveTargets.map((t) => ({ id: `move:${t.id}`, label: `Move to ${t.label}`, icon: ArrowRightLeft, target: t })),
        { id: 'edit', label: 'Edit', icon: Pencil },
        { id: 'remove', label: 'Remove', icon: Trash2 },
      ];
    },
    cardData() {
      const r = this.card.recipient || {};
      const [firstName = '', ...rest] = String(r.name || r.email || '').split(' ');
      return { firstName, lastName: rest.join(' '), jobTitle: r.role || '', company: r.company || '', email: r.email };
    },
  },
  watch: {
    suggestions() {
      if (this.active >= this.optionCount) this.active = this.optionCount - 1;
    },
  },
  methods: {
    optionId(i) {
      return `${this.uid}-opt-${i}`;
    },
    findContact(email) {
      const e = String(email || '').toLowerCase();
      return this.contacts.find((c) => String(c.email).toLowerCase() === e) || null;
    },
    kind(r) {
      return kindOf(r, this.internalDomains);
    },
    chipStatus(r) {
      return { internal: 'warning-neutral', external: 'warning-low', invalid: 'error' }[this.kind(r)];
    },
    chipLabel(r) {
      if (this.kind(r) === 'invalid') return r.email;
      return this.masked[r.email] || !r.name ? r.email : r.name;
    },
    /** Tooltip: the address; for external chips also that they're outside the organization; for invalid ones the fix. */
    chipTooltip(r) {
      const k = this.kind(r);
      if (k === 'invalid') return `"${r.email}" isn't a valid email address. Double-click to fix it.`;
      // External: only why it's amber (Tooltip wraps at 250px, so one message reads cleanly; the address is in the
      // chip menu). Internal: the other half of the identity (the address, or the name while masked).
      if (k === 'external') return `Outside ${this.organizationName || 'your organization'}`;
      return this.masked[r.email] && r.name ? r.name : r.email;
    },
    say(text) {
      this.announcement = '';
      this.$nextTick(() => (this.announcement = text));
    },
    emit(list) {
      this.$emit('input', list);
    },

    // --- focus and the list
    focus() {
      if (this.$refs.input) this.$refs.input.focus();
    },
    onBoxMouseDown(e) {
      if (this.disabled) return;
      // The whole box is the click target; keep the caret in the input.
      if (e.target !== this.$refs.input) {
        e.preventDefault();
        this.selected = -1;
        this.focus();
        this.listWanted = true;
      }
    },
    onFocus() {
      this.focused = true;
      this.boxWidth = this.$refs.box ? this.$refs.box.offsetWidth : 320;
      if (this.suggestOnFocus) this.listWanted = true;
      this.$emit('focus');
    },
    onBlur() {
      this.focused = false;
      this.listWanted = false;
      this.active = -1;
      this.selected = -1;
      // A finished address left in the buffer is committed when the field loses focus.
      const t = parseToken(this.buffer);
      if (isEmail(t.email)) this.commitText(this.buffer);
      this.$emit('blur');
    },
    onInput() {
      this.selected = -1;
      this.listWanted = true;
      this.active = this.buffer.trim() && this.optionCount ? 0 : -1;
      this.boxWidth = this.$refs.box ? this.$refs.box.offsetWidth : this.boxWidth;
    },

    // --- committing
    /** Add one typed or pasted token. Returns true when it became a chip. */
    commitText(text, { quiet = false } = {}) {
      const t = parseToken(text);
      if (!t.email) return false;
      this.buffer = '';
      this.active = -1;
      if (this.taken.includes(t.email.toLowerCase())) {
        if (!quiet) this.say(`${t.email} is already in ${this.label}.`);
        return false;
      }
      if (!isEmail(t.email)) {
        this.emit([...this.value, { email: t.email, name: '', invalid: true }]);
        if (!quiet) this.say(`${t.email} isn't a valid email address. Double-click it to fix it.`);
        return true;
      }
      const contact = this.findContact(t.email);
      if (contact) return this.add(contact, quiet);
      if (!this.allowUnknown) {
        this.$emit('unknown', { email: t.email, name: t.name });
        if (!this.unknownActionLabel) {
          // Nothing to add them with: keep the text so it can be fixed, and say why it didn't become a chip.
          this.buffer = text.trim();
          this.listWanted = true;
          if (!quiet) this.say(this.unknownMessage.replace('{email}', t.email));
        }
        return false;
      }
      return this.add({ email: t.email, name: t.name }, quiet);
    },
    add(recipient, quiet) {
      this.emit([...this.value, { ...recipient }]);
      if (!quiet) this.say(`${recipient.name || recipient.email} added to ${this.label}.`);
      return true;
    },
    pick(contact) {
      this.buffer = '';
      this.add(contact);
      this.listWanted = this.suggestOnFocus;
      this.active = -1;
      this.focus();
    },
    commitUnknown(t) {
      this.buffer = '';
      this.active = -1;
      this.$emit('unknown', { email: t.email, name: t.name });
    },
    commitActiveOrBuffer() {
      if (this.listOpen && this.active >= 0) {
        if (this.active < this.suggestions.length) this.pick(this.suggestions[this.active]);
        else if (this.unknownOption) this.commitUnknown(this.unknownOption);
        return true;
      }
      if (this.buffer.trim()) {
        this.commitText(this.buffer);
        return true;
      }
      return false;
    },
    onPaste(e) {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const tokens = splitTokens(text);
      // One plain token without separators is ordinary typing; let the browser paste it.
      if (tokens.length < 2 && !/[,;\n]/.test(text)) return;
      e.preventDefault();
      if (this.buffer.trim()) tokens.unshift(this.buffer);
      this.buffer = '';
      let added = 0;
      // Commit one by one so each sees the previous ones (duplicates inside the paste are skipped).
      const next = () => {
        const token = tokens.shift();
        if (token === undefined) {
          this.say(`${added} ${added === 1 ? 'recipient' : 'recipients'} added to ${this.label}.`);
          return;
        }
        if (this.commitText(token, { quiet: true })) added += 1;
        this.$nextTick(next);
      };
      next();
    },

    // --- keyboard
    onKeydown(e) {
      const k = e.key;
      const empty = !this.buffer;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        if (!this.optionCount) return;
        e.preventDefault();
        this.listWanted = true;
        const d = k === 'ArrowDown' ? 1 : -1;
        this.active = (this.active + d + this.optionCount) % this.optionCount;
        return;
      }
      if (k === 'Enter') {
        if (this.selected >= 0) {
          e.preventDefault();
          return;
        }
        if (this.commitActiveOrBuffer()) e.preventDefault();
        return;
      }
      if (k === 'Tab' && !e.shiftKey) {
        if (this.commitActiveOrBuffer()) e.preventDefault();
        return;
      }
      if (k === ',' || k === ';') {
        e.preventDefault();
        this.commitActiveOrBuffer();
        return;
      }
      if (k === 'Escape') {
        if (this.listOpen || this.selected >= 0) {
          e.preventDefault();
          e.stopPropagation();
          this.listWanted = false;
          this.selected = -1;
        }
        return;
      }
      if (empty && (k === 'Backspace' || k === 'Delete') && this.value.length) {
        e.preventDefault();
        // The cascade: first Backspace selects the last chip, the second removes it.
        if (this.selected >= 0) this.remove(this.selected);
        else if (k === 'Backspace') {
          this.selected = this.value.length - 1;
          const r = this.value[this.selected];
          this.say(`${r.name || r.email} selected. Press Backspace again to remove.`);
        }
        return;
      }
      if (empty && k === 'ArrowLeft' && this.value.length) {
        e.preventDefault();
        this.selected = this.selected < 0 ? this.value.length - 1 : Math.max(0, this.selected - 1);
        return;
      }
      if (empty && k === 'ArrowRight' && this.selected >= 0) {
        e.preventDefault();
        this.selected = this.selected + 1 < this.value.length ? this.selected + 1 : -1;
        return;
      }
      if (this.selected >= 0 && (e.metaKey || e.ctrlKey) && (k === 'c' || k === 'x')) {
        e.preventDefault();
        const r = this.value[this.selected];
        this.copy(toClipboardText(r));
        if (k === 'x') this.remove(this.selected);
        return;
      }
      if (this.selected >= 0 && k.length === 1) this.selected = -1;
    },

    // --- chips
    onChipMouseDown(i, e) {
      if (e.button !== 0 || this.disabled) return;
      e.preventDefault();
      this.selected = i;
      this.listWanted = false;
      this.focus();
    },
    remove(i) {
      const r = this.value[i];
      const list = this.value.filter((_, j) => j !== i);
      this.selected = -1;
      this.emit(list);
      if (r) this.say(`${r.name || r.email} removed from ${this.label}.`);
      this.$nextTick(() => this.focus());
    },
    /** Unpack a chip back into editable text at the caret (double-click or Edit). */
    edit(i) {
      if (this.disabled) return;
      const r = this.value[i];
      if (!r) return;
      if (this.buffer.trim()) this.commitText(this.buffer, { quiet: true });
      this.emit(this.value.filter((_, j) => j !== i));
      this.buffer = r.email;
      this.selected = -1;
      this.listWanted = true;
      this.$nextTick(() => {
        this.focus();
        const el = this.$refs.input;
        if (el) el.setSelectionRange(el.value.length, el.value.length);
      });
    },
    copy(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
      this.say('Copied.');
    },

    // --- context menu
    openMenu(i) {
      if (this.disabled) return;
      const el = this.$refs[`chip-${i}`];
      this.selected = i;
      this.menu = { open: true, index: i, anchor: Array.isArray(el) ? el[0] : el };
      this.$nextTick(() => {
        const first = document.querySelector('[role="menu"] [role="menuitem"]:not([disabled])');
        if (first) first.focus();
      });
    },
    closeMenu() {
      this.menu = { ...this.menu, open: false };
      this.selected = -1;
    },
    onMenuKeydown(e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]:not([disabled])')];
      const at = items.indexOf(document.activeElement);
      const next = items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      if (next) next.focus();
    },
    runMenu(item) {
      const i = this.menu.index;
      const r = this.value[i];
      const anchor = this.menu.anchor;
      this.menu = { ...this.menu, open: false };
      if (!r) return;
      if (item.id === 'contact') this.card = { open: true, anchor, recipient: { ...r, ...(this.findContact(r.email) || {}) } };
      else if (item.id === 'copy') this.copy(r.email);
      else if (item.id === 'mask') this.$set(this.masked, r.email, !this.masked[r.email]);
      else if (item.id === 'edit') this.edit(i);
      else if (item.id === 'remove') this.remove(i);
      else if (item.target) {
        this.emit(this.value.filter((_, j) => j !== i));
        this.$emit('move', { recipient: r, to: item.target.id });
        this.say(`${r.name || r.email} moved to ${item.target.label}.`);
      }
      this.selected = -1;
    },

    // --- drag and drop between fields of the same group
    onDragStart(i, e) {
      const r = this.value[i];
      drag.sourceUid = this.uid;
      drag.group = this.group;
      drag.targetUid = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-recipient', JSON.stringify(r));
      e.dataTransfer.setData('text/plain', toClipboardText(r));
    },
    onDragOver(e) {
      if (this.disabled || drag.group !== this.group || drag.sourceUid === this.uid) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.dropActive = true;
    },
    onDrop(e) {
      this.dropActive = false;
      if (this.disabled || drag.group !== this.group || drag.sourceUid === this.uid) return;
      e.preventDefault();
      let r = null;
      try {
        r = JSON.parse(e.dataTransfer.getData('application/x-recipient'));
      } catch (err) {
        r = null;
      }
      if (!r || !r.email) return;
      drag.targetUid = this.uid;
      if (!this.taken.includes(String(r.email).toLowerCase())) this.add(r);
    },
    onDragEnd(i) {
      // The source removes the chip once another field of the group took it.
      if (drag.sourceUid === this.uid && drag.targetUid && drag.targetUid !== this.uid) {
        this.emit(this.value.filter((_, j) => j !== i));
      }
      drag.sourceUid = null;
      drag.group = null;
      drag.targetUid = null;
    },
  },
};
</script>

<style scoped>
/* Input Field Type=Multi-Select container: min 40px, focus = border/info + a 3px border/input/focus ring (InputV2's
   CONTAINER_FOCUS_CLASSES uses an arbitrary ring class the prototype linter forbids; same tokens, written here). */
.rf-box {
  min-height: var(--space-40);
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
  cursor: text;
}
.rf-box--focus {
  border-color: var(--border-info-default);
  box-shadow: 0 0 0 3px var(--border-input-focus);
}
.rf-box--error {
  border-width: 2px;
  border-color: var(--border-error-default);
}
.rf-box--drop {
  border-style: dashed;
  border-color: var(--border-info-default);
  background-color: var(--surface-info-subtle);
}
.rf-box--disabled {
  background-color: var(--surface-input-disabled);
  cursor: not-allowed;
}
/* A selected chip (Backspace cascade, click, right-click) gets the focus ring of the design system. */
.rf-chip {
  cursor: default;
}
.rf-chip--selected {
  outline: 2px solid var(--border-primary-focused);
  outline-offset: 1px;
}
.rf-list {
  max-height: calc(var(--space-48) * 6);
}
.rf-menu-item {
  cursor: pointer;
}
.rf-menu-item:hover:not(:disabled),
.rf-menu-item:focus-visible {
  background-color: var(--surface-soft);
  outline: none;
}
/* MemberCardV2 brings a 10px outer margin for grids; flush inside the popover. */
.rf-card {
  margin: 0;
}
</style>

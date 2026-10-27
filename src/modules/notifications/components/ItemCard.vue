<template>
  <!-- One card of the Notifications drawer and the full page (docs/notifications/spec.md §4–§8, §12): the library's
       NotificationItem with the item's severity, timing, routing and evidence in its meta slot, and its actions:
       the record's own action, Acknowledge, and a More menu (Snooze, Assign, Take ownership, Mark as critical, Change
       severity, Archive, View history). Everything the card shows is text plus colour, one signal per value (D-17). -->
  <div>
    <NotificationItem :title="item.title" :description="item.detail" :time="ago" :unread="item.engagement === 'unseen'">
      <template #icon>
        <component :is="icon" :size="20" :stroke-width="1.75" />
      </template>
      <template #meta>
        <div class="flex flex-col gap-space-4 pt-space-4 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
          <div class="flex flex-wrap items-center gap-space-8">
            <StatusChip v-if="item.severity === 'critical'" :label="severity.label" :status="chipStatus(severity.tone, true)" fill-style="solid" type="default" :removable="false" />
            <StatusChip v-if="item.timing === 'overdue' || item.timing === 'due_today'" :label="timing.label" :status="chipStatus(timing.tone)" fill-style="outline" type="default" :removable="false" />
            <span v-else-if="item.timing === 'on_track'">Due {{ day(item.dueAt) }}</span>
            <span v-if="item.recordLabel" class="text-text-default">{{ item.recordLabel }}</span>
            <span>{{ routingText }}</span>
            <span v-if="item.engagement === 'acknowledged'">Acknowledged {{ clock(item.acknowledgedAt) }}</span>
            <span v-if="item.presentation === 'snoozed'">Snoozed until {{ day(item.snoozedUntil) }}</span>
            <span v-if="item.workStatus === 'resolved' && item.resolvedAt">Resolved by {{ name(item.resolvedById) }}, {{ day(item.resolvedAt) }}</span>
          </div>
          <p v-if="item.severity === 'critical' && item.reason" class="m-0 text-text-default">Critical because {{ item.reason }}</p>
          <p v-if="item.override" class="m-0">Was Critical · {{ overrideLabel }} by {{ name(item.override.actorId) }}: "{{ item.override.reason }}"</p>
          <p v-if="item.ackDue" class="m-0">
            <template v-if="item.escalated">Not acknowledged by {{ clock(item.ackDueAt) }} · escalated to {{ name(item.fallbackId) }}</template>
            <template v-else>Acknowledge by {{ clock(item.ackDueAt) }} · then {{ name(item.fallbackId) }} is told</template>
          </p>
          <p v-if="item.evidence && item.evidence.quote" class="m-0 italic">{{ name(item.evidence.byId) }}, {{ day(item.evidence.at) }} {{ clock(item.evidence.at) }}: "{{ item.evidence.quote }}"</p>
          <p v-if="item.impact && item.severity !== 'update'" class="m-0">{{ item.impact }}<template v-if="item.costImpact"> · ${{ item.costImpact.toLocaleString('en-US') }} cost impact</template></p>
          <ol v-if="historyOpen" class="m-0 mt-space-4 flex list-none flex-col gap-space-2 border-t border-border-subtle p-0 pt-space-8" aria-label="History">
            <li v-for="h in history" :key="h.id" class="flex flex-wrap gap-x-space-8">
              <span class="text-text-default">{{ h.label }}</span>
              <span>{{ h.detail }}</span>
              <span>{{ day(h.at) }} {{ clock(h.at) }}</span>
            </li>
          </ol>
        </div>
      </template>
      <!-- Actions end bottom-right, where the reader finishes (D-56): secondary text buttons, then the card's own
           action as a primary-colour text button. Solid primary is kept for a page's one primary action (D-17). -->
      <template #actions>
        <span ref="more">
          <Button label="More" color-scheme="secondary" variant="text" size="small" :aria-expanded="menuOpen ? 'true' : 'false'" @onClick="menuOpen = !menuOpen" />
        </span>
        <Button v-if="item.canTakeOwnership" label="Take ownership" color-scheme="secondary" variant="text" size="small" @onClick="take" />
        <Button v-if="item.canAcknowledge" label="Acknowledge" color-scheme="secondary" variant="text" size="small" @onClick="ack" />
        <Button :label="item.action.label" color-scheme="primary" variant="text" size="small" @onClick="open" />
      </template>
    </NotificationItem>

    <!-- More: the rest of the card's actions, each a single click (spec §8) -->
    <Popover :open="menuOpen" :anchor="$refs.more" placement="bottom-end" variant="card" :offset="4" :max-width="280" @close="menuOpen = false">
      <div class="flex min-w-full flex-col py-space-4" role="menu" :aria-label="`Actions for ${item.title}`">
        <template v-if="item.canSnooze">
          <button v-for="o in snoozeOptions" :key="o.value" type="button" role="menuitem" :class="ROW" @click="doSnooze(o.value)">Snooze {{ o.label.toLowerCase() }}</button>
        </template>
        <button v-if="item.presentation === 'snoozed'" type="button" role="menuitem" :class="ROW" @click="run(unsnooze)">Unsnooze</button>
        <button v-if="item.canAssign" type="button" role="menuitem" :class="ROW" @click="openModal('assign')">Assign…</button>
        <button v-if="item.canMarkCritical" type="button" role="menuitem" :class="ROW" @click="openModal('mark')">Mark as critical…</button>
        <button v-if="item.canOverride" type="button" role="menuitem" :class="ROW" @click="openModal('override')">Change severity…</button>
        <span v-else-if="item.overrideBlockedReason" :class="[ROW, 'text-text-inactive']" role="menuitem" aria-disabled="true" :title="item.overrideBlockedReason">Change severity (project manager only)</span>
        <button v-if="item.open && !(item.severity === 'critical')" type="button" role="menuitem" :class="ROW" @click="run(archive)">Archive</button>
        <button type="button" role="menuitem" :class="ROW" @click="toggleHistory">{{ historyOpen ? 'Hide history' : 'View history' }}</button>
      </div>
    </Popover>

    <AssignModal v-if="modal === 'assign'" :open="true" :item="item" @close="modal = ''" @done="done" />
    <SeverityModal v-if="modal === 'mark' || modal === 'override'" :open="true" :item="item" :mode="modal" @close="modal = ''" @done="done" />
  </div>
</template>

<script>
import NotificationItem from '@/componentsV2/NotificationItem/NotificationItem.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import Button from '@/components/Button/Button.vue';
import Popover from '@/componentsV2/Popover/Popover.vue';
import { Mail, FileQuestion, FileText, AlertTriangle } from '@development/linarc-icons';
import { TODAY, getPerson } from '~/modules/correspondence/data';
import { SEVERITY, TIMING, ROUTING, OVERRIDE_OUTCOME, AUDIT_EVENT, toneToChipStatus } from '~/modules/app/status';
import { acknowledge, snooze, unsnooze, archive, takeOwnership, markSeen, snoozeOptions } from '~/modules/notifications/data';
import { go } from '~/modules/app/router';
import AssignModal from './AssignModal.vue';
import SeverityModal from './SeverityModal.vue';

export default {
  name: 'ItemCard',
  components: { NotificationItem, StatusChip, Button, Popover, AssignModal, SeverityModal },
  props: {
    /** A projected item (itemsFor). */
    item: { type: Object, required: true },
  },
  data() {
    return {
      menuOpen: false,
      modal: '',
      historyOpen: false,
      // A menu row (the Menu candidate's rows live inside RecipientField today; extract when a third menu appears).
      ROW: 'w-full border-0 bg-transparent px-space-12 py-space-8 text-left font-label text-fontsize-14 leading-lineheight-20 text-text-default hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none',
    };
  },
  computed: {
    icon() {
      if (this.item.eventType === 'manual_critical') return AlertTriangle;
      if (this.item.key.startsWith('thread:')) return Mail;
      if (this.item.key.startsWith('rfi:')) return FileQuestion;
      return FileText;
    },
    severity() {
      return SEVERITY[this.item.severity];
    },
    timing() {
      return TIMING[this.item.timing];
    },
    overrideLabel() {
      return (OVERRIDE_OUTCOME[this.item.override.outcome] || {}).label || '';
    },
    routingText() {
      const r = ROUTING[this.item.routing] || { label: '' };
      switch (this.item.routing) {
        case 'covering':
          return `Covering for ${this.name(this.item.coveringForId)}`;
        case 'requester':
          return this.item.responsibleId ? `Waiting on ${this.name(this.item.responsibleId)}` : `${r.label} · no eligible owner, with ${this.name(this.item.fallbackId)}`;
        case 'assigned':
          return r.label;
        case 'oversight':
        case 'watching':
          return `${r.label}${this.item.responsibleId ? ` · with ${this.name(this.item.responsibleId)}` : ''}`;
        default:
          return r.label;
      }
    },
    /** Short relative time, as Figma's "2h". */
    ago() {
      const ms = new Date(TODAY) - new Date(this.item.lastEventAt);
      const m = Math.round(ms / 60000);
      if (m < 1) return 'now';
      if (m < 60) return `${m}m`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h`;
      return `${Math.round(h / 24)}d`;
    },
    snoozeOptions() {
      return snoozeOptions(this.item);
    },
    history() {
      return [...this.item.history].reverse().map((h) => ({ ...h, label: (AUDIT_EVENT[h.event] || { label: h.event }).label }));
    },
  },
  methods: {
    name: (id) => (getPerson(id) || {}).name || 'nobody',
    day: (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''),
    clock: (iso) => (iso ? iso.slice(11, 16) : ''),
    chipStatus(tone, strong = false) {
      return toneToChipStatus(tone, { strong });
    },
    open() {
      markSeen(this.item.key);
      this.$emit('open', this.item);
      go(this.item.action.screen, this.item.action.id);
    },
    ack() {
      acknowledge(this.item.key);
      this.$emit('changed', { key: this.item.key, action: 'acknowledged' });
    },
    take() {
      takeOwnership(this.item.key);
      this.$emit('changed', { key: this.item.key, action: 'assigned' });
    },
    run(fn) {
      this.menuOpen = false;
      fn(this.item.key);
      this.$emit('changed', { key: this.item.key, action: fn.name });
    },
    doSnooze(until) {
      this.menuOpen = false;
      snooze(this.item.key, until);
      this.$emit('changed', { key: this.item.key, action: 'snoozed' });
    },
    openModal(which) {
      this.menuOpen = false;
      this.modal = which;
    },
    toggleHistory() {
      this.menuOpen = false;
      this.historyOpen = !this.historyOpen;
    },
    done(result) {
      this.modal = '';
      this.$emit('changed', { key: this.item.key, action: result.mode || 'assigned', ok: result.ok !== false });
    },
  },
};
</script>

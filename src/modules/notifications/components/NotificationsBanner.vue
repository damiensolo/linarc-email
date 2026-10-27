<template>
  <!-- The nonblocking banner (docs/notifications/spec.md §7): shown under the top nav when a Critical item arrives for the
       viewer during this session (created now, not yet seen), never for the Criticals that were already there when the
       page loaded. Acknowledge records awareness; Open goes to the record; the close dismisses the banner for this
       session and changes nothing on the item. Never auto-opens the drawer, never steals focus. -->
  <NotificationBar v-if="item" close-label="Dismiss (the item stays in Notifications)" @close="dismiss">
    <span class="font-bold">Critical</span> · {{ item.title }}<template v-if="item.detail">: {{ item.detail }}</template>
    <template #actions>
      <!-- Both buttons secondary solid: on the bar's primary surface the outline and text variants have no contrast
           (the library Button has no on-primary scheme, F-028). -->
      <Button v-if="item.canAcknowledge" label="Acknowledge" color-scheme="secondary" variant="solid" size="small" @onClick="ack" />
      <Button :label="item.action.label" color-scheme="secondary" variant="solid" size="small" @onClick="open" />
    </template>
  </NotificationBar>
</template>

<script>
import NotificationBar from '@/componentsV2/NotificationBar/NotificationBar.vue';
import Button from '@/components/Button/Button.vue';
import { TODAY, currentRole } from '~/modules/correspondence/data';
import { itemsFor, acknowledge, markSeen } from '~/modules/notifications/data';
import { go } from '~/modules/app/router';
import { ui, dismissBanner } from '../ui';

export default {
  name: 'NotificationsBanner',
  components: { NotificationBar, Button },
  computed: {
    /** The newest unseen Critical that arrived in this session for the viewer (marked "now", the demo clock). */
    item() {
      const role = currentRole();
      const arrived = itemsFor(role).filter(
        (it) => it.open && it.severity === 'critical' && it.engagement === 'unseen' && it.markedAt === TODAY
          && ['assigned', 'fallback', 'covering', 'requester'].includes(it.routing) && !ui.dismissedBanners.includes(it.key),
      );
      return arrived.sort((a, b) => b.lastEventAt.localeCompare(a.lastEventAt))[0] || null;
    },
  },
  methods: {
    ack() {
      acknowledge(this.item.key);
    },
    open() {
      const { key, action } = this.item;
      markSeen(key);
      dismissBanner(key);
      go(action.screen, action.id);
    },
    dismiss() {
      dismissBanner(this.item.key);
    },
  },
};
</script>

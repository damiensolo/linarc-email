<template>
  <!-- Change orders › Change order (stand-in, D-74): the record with the upgraded Email tab; the screen itself is the
       shared RecordEmailScreen (src/modules/correspondence/components/record/). This file only names the kind and the sandbox metadata. -->
  <RecordEmailScreen kind="change-order" />
</template>

<script>
import RecordEmailScreen from '~/modules/correspondence/components/record/RecordEmailScreen.vue';
import { CHANGE_ORDERS, ROLES, currentRole, setRole, inboundSandbox } from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';

export default {
  name: 'CorrespondenceContextCo',
  prototype: {
    title: 'Change orders › Change order',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4084-9896',
    records: () => CHANGE_ORDERS.map((r) => ({ value: r.id, label: `${r.code} · ${r.title}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { RecordEmailScreen },
};
</script>

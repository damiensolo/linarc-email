<template>
  <!-- Submittals › Submittal (stand-in, D-74): the record with the upgraded Email tab; the screen itself is the shared
       RecordEmailScreen (src/modules/correspondence/components/record/). This file only names the kind and the sandbox metadata. -->
  <RecordEmailScreen kind="submittal" />
</template>

<script>
import RecordEmailScreen from '~/modules/correspondence/components/record/RecordEmailScreen.vue';
import { SUBMITTALS, ROLES, currentRole, setRole, inboundSandbox } from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';

export default {
  name: 'CorrespondenceContextSub',
  prototype: {
    title: 'Submittals › Submittal',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4084-9896',
    records: () => SUBMITTALS.map((r) => ({ value: r.id, label: `${r.code} · ${r.title}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { RecordEmailScreen },
};
</script>

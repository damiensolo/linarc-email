<template>
  <!-- Mark as critical / Change severity (docs/notifications/spec.md §5): a compact ModalV2 (short single-step task, D-18).
       Override: the outcome (Radio) and a required reason; the record keeps its state and owner. Mark: the reason and an
       optional evidence line. Writes one history row. -->
  <ModalV2
    :is-visible="open"
    :title="override ? `Change severity of ${item.recordLabel || item.title}` : `Mark as critical: ${item.recordLabel || item.title}`"
    :title-description="override ? 'Critical → Important. The record stays open and with its owner; the change is recorded with your reason.' : 'A person confirms the condition; the acknowledgment clock starts and the fallback is named.'"
    :primary-label="override ? 'Change severity' : 'Mark as critical'"
    secondary-label="Cancel"
    :primary-disabled="!valid"
    :close-on-primary-click="false"
    @onPrimaryClick="submit"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <fieldset v-if="override" class="m-0 flex flex-col gap-space-8 border-0 p-0">
          <legend class="pb-space-4 font-medium text-fontsize-14 leading-lineheight-20 text-text-default">Outcome</legend>
          <Radio v-for="o in outcomes" :key="o.value" v-model="outcome" :value="o.value" :label="o.label" name="override-outcome" />
        </fieldset>
        <InputV2 v-if="override && outcome === 'accepted_risk'" v-model="reviewOn" label="Review on" type="date" />
        <div class="flex flex-col">
          <label :for="`fv2-${id}-reason`" class="pb-space-8 font-medium text-fontsize-14 leading-lineheight-20 text-text-default">Reason (required)</label>
          <TextareaField :field="reasonField" :value="reason" @input="reason = $event" />
        </div>
        <div v-if="!override" class="flex flex-col">
          <label :for="`fv2-${id}-evidence`" class="pb-space-8 font-medium text-fontsize-14 leading-lineheight-20 text-text-default">Evidence (optional)</label>
          <TextareaField :field="evidenceField" :value="evidence" @input="evidence = $event" />
        </div>
        <p v-if="override" class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">
          {{ item.recordLabel || 'The record' }} stays open{{ item.responsibleId ? ` and with ${responsibleName}` : '' }}. The item keeps its history; only its severity changes.
        </p>
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import Radio from '@/components/Radio/Radio.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import { getPerson } from '~/modules/correspondence/data';
import { OVERRIDE_OUTCOMES, overrideSeverity, markCritical } from '~/modules/notifications/data';

export default {
  name: 'SeverityModal',
  components: { ModalV2, InputV2, Radio, TextareaField },
  props: {
    open: { type: Boolean, default: false },
    /** The projected item (itemsFor). */
    item: { type: Object, required: true },
    /** `override` (Critical → Important) or `mark` (Important → Critical). */
    mode: { type: String, default: 'override' },
  },
  data() {
    return { id: `sev-${Math.random().toString(36).slice(2, 7)}`, outcome: 'resolved', reason: '', evidence: '', reviewOn: '', outcomes: OVERRIDE_OUTCOMES };
  },
  computed: {
    override() {
      return this.mode === 'override';
    },
    responsibleName() {
      return (getPerson(this.item.responsibleId) || {}).name || 'its owner';
    },
    reasonField() {
      return { id: `${this.id}-reason`, placeholder: this.override ? 'What changed, and how you know' : 'Why this needs prompt attention', props: { rows: 3 } };
    },
    evidenceField() {
      return { id: `${this.id}-evidence`, placeholder: 'A quote, a photo reference, a site call', props: { rows: 2 } };
    },
    valid() {
      return !!this.reason.trim() && (!this.override || this.outcome !== 'accepted_risk' || !!this.reviewOn);
    },
  },
  watch: {
    open(v) {
      if (v) Object.assign(this, { outcome: 'resolved', reason: '', evidence: '', reviewOn: '' });
    },
  },
  methods: {
    submit() {
      if (!this.valid) return;
      const ok = this.override
        ? overrideSeverity(this.item.key, { outcome: this.outcome, reason: this.reason, reviewOn: this.reviewOn ? `${this.reviewOn}T17:00:00` : null })
        : markCritical(this.item.key, { reason: this.reason, evidence: this.evidence });
      this.$emit('done', { ok, key: this.item.key, mode: this.mode });
    },
  },
};
</script>

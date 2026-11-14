<template>
  <!-- Link to record (docs/correspondence/spec.md §4; multiple records and from the thread since D-77, 2026-11-14): a short
       single-step task, so a compact ModalV2 (5-ui-patterns.md §1) around the SmartPicker candidate (D-61): records the
       subject names come first as Suggested, then Recent, then by kind; several can be picked (one chip each; the
       button carries the count). On an unmatched thread it is the row's first job; on a linked one it adds the other
       records the email is about, so it shows on each record's Email tab. -->
  <ModalV2
    :is-visible="open"
    size="md"
    :title="unmatched ? 'Link to record' : 'Link to another record'"
    :title-description="thread ? thread.subject : ''"
    :primary-label="picked.length > 1 ? `Link ${picked.length}` : 'Link'"
    secondary-label="Cancel"
    :primary-disabled="!picked.length || busy"
    :secondary-disabled="busy"
    :close-on-primary-click="false"
    @onPrimaryClick="confirm"
    @closeModal="$emit('close')"
  >
    <template #modal-body>
      <div class="flex flex-col gap-space-16 font-label">
        <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
          <template v-if="unmatched">This mail arrived at {{ project.inboundAddress }} and matches no thread. Linking it to a record puts it on that record's Email tab and in its history; pick every record it is about.</template>
          <template v-else>Add the other records this email is about. It then shows on each record's Email tab and in its history.</template>
        </p>
        <SmartPicker v-if="open" v-model="picked" :items="items" :kinds="kinds" multiple noun="records" placeholder="Search by code or title" :visible-rows="5" />
      </div>
    </template>
  </ModalV2>
</template>

<script>
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SmartPicker from '~/candidates/SmartPicker/SmartPicker.vue';
import { PROJECT, pickerRecords, suggestRecordIds, recentRecordIds, RECORD_KINDS } from '../data';

export default {
  name: 'LinkRecordModal',
  components: { ModalV2, SmartPicker },
  props: {
    open: { type: Boolean, default: false },
    /** `{ id, subject, linkedRecordIds? }`: the thread (or the Email screen's row) being linked */
    thread: { type: Object, default: null },
    busy: { type: Boolean, default: false },
  },
  // confirm(recordIds) · close
  data() {
    return { project: PROJECT, picked: [], kinds: RECORD_KINDS };
  },
  computed: {
    linked() {
      return (this.thread && this.thread.linkedRecordIds) || [];
    },
    unmatched() {
      return !this.linked.length;
    },
    /** The records the subject names lead (Suggested), the latest threads' records follow (Recent); linked ones are left out. */
    items() {
      if (!this.thread) return [];
      return pickerRecords({ suggestedIds: suggestRecordIds(this.thread.subject), recentIds: recentRecordIds() }).filter((r) => !this.linked.includes(r.id));
    },
  },
  watch: {
    open(open) {
      if (open) this.picked = [];
    },
  },
  methods: {
    confirm() {
      if (!this.picked.length || this.busy) return;
      this.$emit('confirm', [...this.picked]);
    },
  },
};
</script>

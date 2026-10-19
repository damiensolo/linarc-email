<template>
  <!-- Compose (docs/correspondence/spec.md §5): today's Compose with parity (From, To = guest users, CC, Subject prefilled,
       rich text, attachments, Attach record PDF) in a SlideOverPanel over the host screen (D-34), plus what the MVP adds:
       the linked record with its revision pin, Add a guest user by email, inline (D-36, D-46, Q-02), Response due, and
       large files by secure link. Nothing opens over the panel. Send disables while sending (5-ui-patterns.md §6). -->
  <SlideOverPanel :open="open" title="Compose" :badge="record ? recordLabel(record.id) : ''" size="md" @close="$emit('close')">
    <div class="flex flex-col gap-space-24 font-label">
      <!-- 1. Linked record (new): pinned, immutable -->
      <div v-if="record" class="flex flex-col gap-space-4">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Linked record</span>
        <div class="flex flex-wrap items-center gap-space-8">
          <Chip :label="recordLabel(record.id)" size="small" fill-style="solid" type="default" :removable="false" />
          <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ record.title }}</span>
        </div>
        <span v-if="record.type === 'drawing' && record.revisionStatus === 'superseded'" class="text-fontsize-12 leading-lineheight-16 text-text-subtle">
          Superseded by {{ record.supersededBy }}. This message stays pinned to {{ record.revision }}.
        </span>
        <slot name="pin-preview" />
      </div>

      <!-- 2. From (today) -->
      <div class="flex flex-col gap-space-4">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">From</span>
        <span class="text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ sender ? `${sender.name} · ${sender.email}` : '' }}</span>
      </div>

      <!-- 3. To (today, upgraded): anyone already in the project directory (team and guest users), suggested first.
           Someone new is added as a guest user by email, inline (D-36); they then join To. -->
      <div class="flex flex-col gap-space-8">
        <SelectV2 v-model="to" label="To" placeholder="Choose recipients" :options="recipientOptions" :multiple="true" :max-visible-tags="2" :visible-item-count="8" />
        <div class="flex flex-col gap-space-8 pl-space-12">
          <div class="flex flex-col gap-space-2">
            <label :for="guestEmailId" class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Add a guest user</label>
            <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Not in the directory yet? Add them by email.</span>
          </div>
          <!-- Input and button share the 40px row and align at the top, so an error line under the input moves nothing. -->
          <div class="flex items-start gap-space-8">
            <InputV2 :id="guestEmailId" v-model="addEmail" type="email" placeholder="name@company.com" class="min-w-0 flex-1 sm:w-1/2 sm:flex-none" :state="addError ? 'error' : 'default'" :helper-text="addError" @keydown.enter.native.prevent="startAdd" />
            <Button label="Add guest" color-scheme="secondary" variant="outline" size="large" :is-disabled="!addEmail.trim()" @onClick="startAdd" />
          </div>
          <!-- Inline guest form: name and company guessed from the address, role chosen; creates the guest user. -->
          <div v-if="adding" class="flex flex-col gap-space-12 border-l border-border-subtle pl-space-12">
            <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ adding.email }} isn't in the project directory yet. Add them as a guest user and they can be emailed from any record.</span>
            <div class="grid grid-cols-1 gap-space-12 sm:grid-cols-2">
              <InputV2 v-model="adding.name" label="Full name" placeholder="Full name" />
              <InputV2 v-model="adding.company" label="Company" placeholder="Company" />
              <SelectV2 v-model="adding.role" label="Role" :options="GUEST_ROLES" :allow-search="false" />
            </div>
            <div class="flex flex-wrap gap-space-8">
              <Button label="Add guest user" color-scheme="primary" variant="solid" size="small" :is-disabled="!adding.name.trim()" @onClick="confirmAdd" />
              <Button label="Cancel" color-scheme="secondary" variant="minimal" size="small" @onClick="adding = null" />
            </div>
          </div>
        </div>
      </div>

      <!-- 4. CC (today) -->
      <InputV2 v-model="cc" label="CC" placeholder="Addresses, separated by commas" />

      <!-- 5–6. Subject, Response due, Message -->
      <FormV2 v-model="values" :schema="schema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false">
        <template #footer><span /></template>
      </FormV2>

      <!-- 7. Attachments (today, upgraded): over the mail limit goes by secure link instead of being refused -->
      <div class="flex flex-col gap-space-8">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Attachments</span>
        <DropArea size="small" label="Drop files here" link-text="browse" :multiple="true" media-types-text="Any file type" :browse-button-icon="null" @on-upload="addFiles" />
        <!-- Picked files as tiles: preview, remove. They don't open here: nothing opens over the panel (D-34). -->
        <FileTiles v-if="files.length" :files="files" label="Files to send" :openable="false" :downloadable="false" removable @remove="removeFile($event.id)" />
        <Checkbox v-if="record && record.type !== 'drawing'" :value="attachPdf" :label="`Attach a PDF of ${record.code}`" size="small" @input="attachPdf = $event" />
        <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Files over {{ MAIL_SIZE_LIMIT_MB }} MB are delivered by secure link; recipients don't need an account to open them.</span>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" color-scheme="secondary" variant="minimal" size="medium" :is-disabled="busy" @onClick="$emit('close')" />
      <Button label="Send" color-scheme="primary" variant="solid" size="medium" :is-disabled="!canSend || busy" @onClick="send" />
    </template>
  </SlideOverPanel>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import DropArea from '@/componentsV2/DropArea/DropArea.vue';
import FormV2 from '@/componentsV2/FormV2/FormV2.vue';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import { PROJECT, MAIL_SIZE_LIMIT_MB } from '../data/project';
import { getPerson, getPeople, findPersonByEmail, guessFromEmail, isValidEmail } from '../data/people';
import { getRecord, recordLabel } from '../data/records';
import { addGuest, createThread, defaultResponseDue, newAttachment } from '../data/actions';
import { fileView } from '../view';
import FileTiles from './FileTiles.vue';

let seq = 0;
const GUEST_ROLES = ['External consultant', 'Subcontractor', 'Architect or engineer', 'Owner representative', 'Inspector'].map((r) => ({ value: r, label: r }));

export default {
  name: 'ComposePanel',
  components: { Button, Chip, Checkbox, InputV2, SelectV2, DropArea, FormV2, SlideOverPanel, FileTiles },
  props: {
    open: { type: Boolean, default: false },
    /** The viewer (sender): a role from data/project.js ROLES */
    role: { type: Object, required: true },
    /** Host record to pin (RFI, drawing, …); null when composing from the Email screen */
    recordId: { type: String, default: null },
    /** Drawing pin id when composing from a markup */
    pinId: { type: String, default: null },
    busy: { type: Boolean, default: false },
  },
  data() {
    seq += 1;
    return { guestEmailId: `compose-guest-email-${seq}`, GUEST_ROLES, MAIL_SIZE_LIMIT_MB, to: [], cc: '', addEmail: '', addError: '', adding: null, values: {}, attachments: [], attachPdf: false };
  },
  computed: {
    record() {
      return this.recordId ? getRecord(this.recordId) : null;
    },
    files() {
      return this.attachments.map(fileView);
    },
    sender() {
      return getPerson(this.role.personId);
    },
    /** Everyone in the project directory but the sender: suggested first (the record's reviewers or distribution list), then the rest. */
    recipientOptions() {
      const suggested = this.record ? this.record.suggestedRecipientIds || (this.record.assignedToId ? [this.record.assignedToId] : []) : [];
      const people = getPeople().filter((p) => p.id !== this.role.personId);
      const ordered = [...suggested.map((id) => people.find((p) => p.id === id)).filter(Boolean), ...people.filter((p) => !suggested.includes(p.id))];
      return ordered.map((p) => ({ value: p.id, label: `${p.name} · ${p.company}` }));
    },
    schema() {
      return {
        sections: [
          {
            id: 'compose',
            layout: { columns: 2, gap: '24px' },
            fields: [
              { id: 'subject', type: 'text', label: 'Subject', colSpan: 'full', rules: [{ type: 'required', message: 'Give the message a subject' }] },
              { id: 'dueOn', type: 'date', label: 'Response due', props: { width: 'short' } },
              {
                id: 'body', type: 'rich-text', label: 'Message', colSpan: 'full',
                // Figma Rich Text Editor's tools (P-049); files go in the Attachments section below, not the editor
                props: { toolbar: { headingSelection: true, addEmoji: true, showUrlLink: true, table: true, todoList: true, undoRedo: false } },
              },
            ],
          },
        ],
      };
    },
    bodyText() {
      return (this.values.body || '').replace(/<[^>]*>/g, '').trim();
    },
    canSend() {
      return this.to.length > 0 && !!(this.values.subject || '').trim() && this.bodyText.length > 0;
    },
  },
  watch: {
    open(open) {
      if (open) this.reset();
    },
  },
  created() {
    this.reset();
  },
  methods: {
    recordLabel,
    reset() {
      const r = this.record;
      this.to = r && r.type === 'rfi' && r.assignedToId ? [r.assignedToId] : [];
      this.cc = '';
      this.addEmail = '';
      this.addError = '';
      this.adding = null;
      this.attachments = [];
      this.attachPdf = !!(r && r.type !== 'drawing');
      this.values = {
        subject: r ? `[${PROJECT.code}] ${recordLabel(r.id)} — ` : `[${PROJECT.code}] `,
        dueOn: defaultResponseDue().slice(0, 10),
        body: '',
      };
    },
    /** Add a guest user: a known address joins To at once; an unknown one opens the inline guest form (D-36). */
    startAdd() {
      const email = this.addEmail.trim().toLowerCase();
      if (!isValidEmail(email)) {
        this.addError = 'Enter a valid email address';
        return;
      }
      this.addError = '';
      const known = findPersonByEmail(email);
      if (known) {
        if (!this.to.includes(known.id)) this.to = [...this.to, known.id];
        this.addEmail = '';
        return;
      }
      this.adding = { email, ...guessFromEmail(email), role: GUEST_ROLES[0].value };
    },
    confirmAdd() {
      const guest = addGuest(this.adding);
      this.to = [...this.to, guest.id];
      this.adding = null;
      this.addEmail = '';
    },
    addFiles({ files } = {}) {
      [...(files || [])].forEach((f) => this.attachments.push(newAttachment(f)));
    },
    removeFile(id) {
      this.attachments = this.attachments.filter((a) => a.id !== id);
    },
    send() {
      if (!this.canSend || this.busy) return;
      const thread = createThread({
        senderId: this.role.personId,
        toIds: this.to,
        cc: this.cc,
        subject: this.values.subject.trim().replace(/\s*[—-]\s*$/, ''), // a prefix left as-is loses its trailing dash
        body: this.bodyText,
        attachments: this.attachments,
        linkedRecordIds: this.record ? [this.record.id] : [],
        pinId: this.pinId,
        responseDueAt: this.values.dueOn ? `${this.values.dueOn}T17:00:00` : null,
        attachRecordPdf: this.attachPdf,
      });
      this.$emit('sent', thread);
    },
  },
};
</script>

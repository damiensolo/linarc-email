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

      <!-- 3–4. To, Cc, Bcc (today's To and CC, upgraded; D-47): RecipientField rows. Typeahead over the project directory
           (suggested first), chips amber outside the company domain, red when invalid; chips drag between rows or move
           from their menu. An address nobody in the directory has opens the guest form below for that row (D-36, D-46):
           only guest users and team members become chips. -->
      <div class="flex flex-col gap-space-8">
        <RecipientField
          v-model="to"
          label="To"
          :contacts="contacts"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          unknown-action-label="Add {email} as a guest user…"
          group="compose"
          :move-targets="moveTargets('to')"
          placeholder="Name or email address"
          :error="hasInvalid('to')"
          @unknown="startGuest($event, 'to')"
          @move="moveRecipient"
        >
          <template v-if="!showBcc" #trailing>
            <Button label="Bcc" color-scheme="secondary" variant="text" size="small" native-type="button" @onClick="showBcc = true" />
          </template>
        </RecipientField>
        <RecipientField
          v-model="cc"
          label="Cc"
          :contacts="contacts"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          unknown-action-label="Add {email} as a guest user…"
          group="compose"
          :move-targets="moveTargets('cc')"
          :suggest-on-focus="false"
          :error="hasInvalid('cc')"
          @unknown="startGuest($event, 'cc')"
          @move="moveRecipient"
        />
        <RecipientField
          v-if="showBcc"
          v-model="bcc"
          label="Bcc"
          :contacts="contacts"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          unknown-action-label="Add {email} as a guest user…"
          group="compose"
          :move-targets="moveTargets('bcc')"
          :suggest-on-focus="false"
          :error="hasInvalid('bcc')"
          @unknown="startGuest($event, 'bcc')"
          @move="moveRecipient"
        />
        <!-- A warning that guides (5-ui-patterns.md §3): what is wrong, where, and how to fix it. -->
        <p v-if="invalidNote" class="m-0 text-fontsize-12 leading-lineheight-16 text-text-error">{{ invalidNote }}</p>
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
            <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ adding.email }} isn't in the project directory yet. Add them as a guest user and they can be emailed from any record. They'll be added to {{ ROW_LABEL[guestTarget] }}.</span>
            <div class="grid grid-cols-1 gap-space-12 sm:grid-cols-2">
              <InputV2 v-model="adding.name" label="Full name" placeholder="Full name" />
              <InputV2 v-model="adding.company" label="Company" placeholder="Company" />
              <SelectV2 v-model="adding.role" label="Role" :options="GUEST_ROLES" :allow-search="false" />
            </div>
            <div class="flex flex-wrap gap-space-8">
              <Button label="Add guest user" color-scheme="primary" variant="solid" size="small" :is-disabled="!adding.name.trim()" @onClick="confirmAdd" />
              <Button label="Cancel" color-scheme="secondary" variant="minimal" size="small" @onClick="cancelGuest" />
            </div>
          </div>
        </div>
      </div>

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
import RecipientField from '~/candidates/RecipientField/RecipientField.vue';
import { PROJECT, MAIL_SIZE_LIMIT_MB } from '../data/project';
import { getPerson, getPeople, findPersonByEmail, guessFromEmail, isValidEmail } from '../data/people';
import { getRecord, recordLabel } from '../data/records';
import { addGuest, createThread, defaultResponseDue, newAttachment } from '../data/actions';
import { rfiRecipients } from '../data/rfi';
import { fileView } from '../view';
import FileTiles from './FileTiles.vue';

let seq = 0;
const ROW_LABEL = { to: 'To', cc: 'Cc', bcc: 'Bcc' };
/** A directory person as RecipientField takes them. */
const asRecipient = (p) => ({ id: p.id, email: p.email, name: p.name, company: p.company, role: p.role, avatarUrl: p.avatarUrl || '' });
const GUEST_ROLES = ['External consultant', 'Subcontractor', 'Architect or engineer', 'Owner representative', 'Inspector'].map((r) => ({ value: r, label: r }));

export default {
  name: 'ComposePanel',
  components: { Button, Chip, Checkbox, InputV2, SelectV2, DropArea, FormV2, SlideOverPanel, RecipientField, FileTiles },
  props: {
    open: { type: Boolean, default: false },
    /** The viewer (sender): a role from data/project.js ROLES */
    role: { type: Object, required: true },
    /** Host record to pin (RFI, drawing, …); null when composing from the Email screen */
    recordId: { type: String, default: null },
    /** Drawing pin id when composing from a markup */
    pinId: { type: String, default: null },
    /** Prefill for a reply started elsewhere, e.g. *Email this* on an RFI Q&A step: `{ toIds?, body? }` */
    prefill: { type: Object, default: null },
    busy: { type: Boolean, default: false },
  },
  data() {
    seq += 1;
    return { guestEmailId: `compose-guest-email-${seq}`, GUEST_ROLES, ROW_LABEL, MAIL_SIZE_LIMIT_MB, to: [], cc: [], bcc: [], showBcc: false, guestTarget: 'to', addEmail: '', addError: '', adding: null, values: {}, attachments: [], attachPdf: false };
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
    /** On an RFI: the current workflow step's parties, then the distribution list (rfi-integration.md §B). */
    rfi() {
      return this.record && this.record.type === 'rfi' && this.record.workflow ? rfiRecipients(this.record, this.role.personId) : null;
    },
    /** Everyone in the project directory but the sender: suggested first (the record's reviewers, step parties or distribution list), then the rest. */
    contacts() {
      const suggested = this.rfi ? this.rfi.suggestedIds : this.record ? this.record.suggestedRecipientIds || (this.record.assignedToId ? [this.record.assignedToId] : []) : [];
      const people = getPeople().filter((p) => p.id !== this.role.personId);
      const ordered = [...suggested.map((id) => people.find((p) => p.id === id)).filter(Boolean), ...people.filter((p) => !suggested.includes(p.id))];
      return ordered.map(asRecipient);
    },
    /** The sender's company, named in the external chip's tooltip ("Outside Vanguard Construction Group"). */
    organizationName() {
      return PROJECT.gc;
    },
    /** The company's own domains (the team's addresses): anyone else gets the external chip (D-47). */
    internalDomains() {
      return [...new Set(getPeople().filter((p) => !p.guest).map((p) => p.email.split('@')[1].toLowerCase()))];
    },
    /** "“dave@apex” in To isn't a valid email address…" for the first invalid chip, or ''. */
    invalidNote() {
      const row = ['to', 'cc', 'bcc'].find((k) => this.hasInvalid(k));
      if (!row) return '';
      const bad = this[row].find((r) => r.invalid);
      return `“${bad.email}” in ${ROW_LABEL[row]} isn't a valid email address. Double-click it to fix it, or remove it.`;
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
      return this.to.length > 0 && !this.invalidNote && !!(this.values.subject || '').trim() && this.bodyText.length > 0;
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
      // To: the prefill, else on an RFI the ball-in-court party (the current step's), else nobody.
      const assignee = r && r.type === 'rfi' && r.assignedToId ? getPerson(r.assignedToId) : null;
      const toIds = (this.prefill && this.prefill.toIds) || (this.rfi ? this.rfi.toIds : assignee ? [assignee.id] : []);
      this.to = toIds.map(getPerson).filter(Boolean).map(asRecipient);
      this.cc = [];
      this.bcc = [];
      this.showBcc = false;
      this.guestTarget = 'to';
      this.addEmail = '';
      this.addError = '';
      this.adding = null;
      this.attachments = [];
      this.attachPdf = !!(r && r.type !== 'drawing');
      this.values = {
        // An RFI's subject carries its name (rfi-integration.md §B); other records leave the topic to the sender.
        subject: r ? `[${PROJECT.code}] ${recordLabel(r.id)} — ${r.type === 'rfi' ? r.title : ''}` : `[${PROJECT.code}] `,
        // On an RFI the step's due date (§B), else three working days (spec §7)
        dueOn: ((this.rfi && this.rfi.dueOn) || defaultResponseDue()).slice(0, 10),
        body: (this.prefill && this.prefill.body) || '',
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
        this.addTo('to', asRecipient(known));
        this.addEmail = '';
        return;
      }
      this.startGuest({ email }, 'to');
    },
    /** An address nobody in the directory has, from the guest row or a recipient row: the inline guest form, pre-filled. */
    startGuest({ email, name = '' }, row) {
      const guess = guessFromEmail(email);
      this.guestTarget = row;
      this.addEmail = email;
      this.adding = { email, ...guess, name: name || guess.name, role: GUEST_ROLES[0].value };
    },
    cancelGuest() {
      this.adding = null;
      this.addEmail = '';
    },
    confirmAdd() {
      const guest = addGuest(this.adding);
      this.addTo(this.guestTarget, asRecipient(guest));
      this.adding = null;
      this.addEmail = '';
    },
    addTo(row, recipient) {
      if (row === 'bcc') this.showBcc = true;
      if (!this[row].some((r) => r.email === recipient.email)) this[row] = [...this[row], recipient];
    },
    hasInvalid(row) {
      return this[row].some((r) => r.invalid);
    },
    moveTargets(row) {
      return ['to', 'cc', 'bcc'].filter((k) => k !== row).map((k) => ({ id: k, label: ROW_LABEL[k] }));
    },
    /** A chip's "Move to …" (the keyboard and touch alternative to dragging it). */
    moveRecipient({ recipient, to }) {
      this.addTo(to, recipient);
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
        toIds: this.to.map((r) => r.id),
        ccIds: this.cc.map((r) => r.id),
        bccIds: this.bcc.map((r) => r.id),
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

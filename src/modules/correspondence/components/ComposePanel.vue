<template>
  <!-- Compose (docs/correspondence/spec.md §5): today's Compose with parity (From, To = guest users, CC, Subject prefilled,
       rich text, attachments, the record's PDF) in a SlideOverPanel over the host screen (D-34), plus what the MVP adds:
       the linked record with its revision pin, Response due, and large files by secure link. Recipients are people
       already on the project; adding a guest user from here (D-36, D-46) is deferred until customer discovery (D-60,
       2026-10-28), so an unknown address gets a message, not a form. Since 2026-10-28 (D-58) the attachments and actions are the same compact tool row as
       the thread composer (MessageTools in the footer, chips under the message), the editor's bar is always open and
       trimmed to one line (P-057), the panel is `lg` with a full-screen toggle, and a draft is kept per context: Save
       draft, or simply closing the panel, keeps it until it is sent or discarded. Send disables while sending (§6). -->
  <SlideOverPanel :open="open" title="Compose" :badge="record ? recordLabel(record.id) : ''" size="lg" expandable @close="requestClose">
    <!-- The project address where mail is composed (D-42, spec §4): replies thread by themselves; other mail is forwarded
         or Bcc'd. A help icon beside the title with the Tooltip (review 2026-11-06, D-69), not a line of body text. -->
    <template #title-aside>
      <Tooltip :label="REPLY_HELP" placement="bottom">
        <span class="inline-flex rounded-radius-round text-icon-inactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="`About replies. ${REPLY_HELP}`">
          <CircleHelp :size="16" :stroke-width="1.75" aria-hidden="true" />
        </span>
      </Tooltip>
    </template>
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

      <!-- 1b. Letter (D-78): the type, a template for a notice or a transmittal, and the number the letter gets on send -->
      <div class="flex flex-wrap items-end gap-x-space-16 gap-y-space-8" data-letter>
        <SelectV2 v-model="letterType" label="Type" class="letter-select" size="large" :options="letterTypes" :allow-search="false" />
        <SelectV2 v-if="templates.length" :value="templateId" label="Template" class="template-select" size="large" :options="templateOptions" :allow-search="false" placeholder="None" @input="useTemplate" />
        <span class="pb-space-12 text-fontsize-12 leading-lineheight-16 text-text-subtle">Numbered {{ nextNumber }} on send; the number and type go on the project's correspondence log.</span>
      </div>

      <!-- 2. From (today) -->
      <div class="flex flex-col gap-space-4">
        <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">From</span>
        <span class="text-fontsize-14 leading-lineheight-20 text-text-subtle">{{ sender ? `${sender.name} · ${sender.email}` : '' }}</span>
      </div>

      <!-- 3–4. To, Cc, Bcc (today's To and CC, upgraded; D-47): RecipientField rows. Typeahead over the project directory
           (suggested first), chips amber outside the company domain, red when invalid; chips drag between rows or move
           from their menu. Only people in the directory become chips: an address nobody has stays in the field with
           the message that says where they are added (D-60). -->
      <div class="flex flex-col gap-space-8">
        <RecipientField
          v-model="to"
          label="To"
          :contacts="contacts"
          :groups="groups"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          group="compose"
          :move-targets="moveTargets('to')"
          placeholder="Name or email address"
          :error="hasInvalid('to')"
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
          :groups="groups"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          group="compose"
          :move-targets="moveTargets('cc')"
          :suggest-on-focus="false"
          :error="hasInvalid('cc')"
          @move="moveRecipient"
        />
        <RecipientField
          v-if="showBcc"
          v-model="bcc"
          label="Bcc"
          :contacts="contacts"
          :groups="groups"
          :internal-domains="internalDomains"
          :organization-name="organizationName"
          :show-avatar="false"
          :allow-unknown="false"
          group="compose"
          :move-targets="moveTargets('bcc')"
          :suggest-on-focus="false"
          :error="hasInvalid('bcc')"
          @move="moveRecipient"
        />
        <!-- A warning that guides (5-ui-patterns.md §3): what is wrong, where, and how to fix it. -->
        <p v-if="invalidNote" class="m-0 text-fontsize-12 leading-lineheight-16 text-text-error">{{ invalidNote }}</p>
      </div>

      <!-- 5–6. Subject, Response due, Message. Two forms (D-76): the turnaround note belongs under the date, and FormV2
           has no per-field helper line. `key`: FormV2 copies its value once, so a reset (Discard) remounts it with the defaults -->
      <div class="flex flex-col gap-space-8">
        <FormV2 :key="formKey" v-model="values" :schema="schema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false">
          <template #footer><span /></template>
        </FormV2>
        <!-- D-76: where the default came from: the contract's turnaround for this record type and the project calendar -->
        <p v-if="values.dueOn" class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle" data-turnaround>{{ rfi && rfi.dueOn ? "The RFI step's due date." : `Per the contract: ${turnaroundNote}` }}</p>
      </div>
      <FormV2 :key="`body-${formKey}`" v-model="message" :schema="messageSchema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false">
        <template #footer><span /></template>
      </FormV2>
      <!-- D-72: chasing is the default; the reminder goes to the recipients at the due date when nobody has replied -->
      <Checkbox v-if="values.dueOn" :value="remindAtDue" label="Send a reminder at the due date if there's no reply" size="small" @input="remindAtDue = $event" />

      <!-- 7. Attachments and the tool row sit right under the message (D-70, 2026-11-06), as the reading pane's
           composer: anchored to the input while the panel is short, and a sticky footer once the content overflows
           (the sticky offset equals the body's 20px padding, F-043), with room under the row so Send never feels
           cramped. Attachments (today, upgraded; D-58): added from the tool row, shown as chips; the record's PDF is on
           by default (today's checkbox) and can be removed; over the mail limit goes by secure link instead of being
           refused. -->
      <div class="sticky -bottom-space-20 z-10 -mx-space-20 flex flex-col gap-space-12 border-t border-border-subtle bg-surface-container px-space-20 pb-space-32 pt-space-16" data-compose-footer>
      <div class="flex w-full flex-col gap-space-8 font-label">
        <div class="flex items-center gap-space-4">
          <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Attachments</span>
          <!-- The how and the limit live in a tooltip on a help icon (keyboard: focus it), not in a line of body text -->
          <Tooltip :label="ATTACH_HELP" placement="top">
            <span class="inline-flex rounded-radius-round text-icon-inactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="`About attachments. ${ATTACH_HELP}`">
              <CircleHelp :size="16" :stroke-width="1.75" aria-hidden="true" />
            </span>
          </Tooltip>
          <span v-if="!attachments.length" class="ml-space-4 text-fontsize-12 leading-lineheight-16 text-text-subtle">Nothing attached yet.</span>
        </div>
        <AttachmentChips v-if="attachments.length" :attachments="attachments" :disabled="busy" @remove="removeAttachment" />
      </div>
      <MessageTools
        :attachments="attachments"
        send-label="Send"
        :can-send="canSend"
        :empty="!touched"
        :saved="saved"
        :busy="busy"
        :has-saved-draft="hasSavedDraft"
        :suggested-record-ids="recordId ? [recordId] : []"
        @add="addAttachment"
        @save="saveDraft"
        @discard="discard"
        @send="send"
      />
      </div>
    </div>
  </SlideOverPanel>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import Chip from '@/components/Chip/Chip.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import { LETTER_TYPES, templatesFor, applyTemplate, nextLetterNumber } from '../data/templates';
import FormV2 from '@/componentsV2/FormV2/FormV2.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import { CircleHelp } from '@development/linarc-icons';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import RecipientField from '~/candidates/RecipientField/RecipientField.vue';
import { PROJECT, MAIL_SIZE_LIMIT_MB } from '../data/project';
import { getPerson, getPeople } from '../data/people';
import { getRecord, recordLabel } from '../data/records';
import { createThread, defaultResponseDue, turnaroundNote, recordAttachment } from '../data/actions';
import { rfiRecipients } from '../data/rfi';
import { distributionGroups } from '../data/lists';
import { expandRecipients } from '~/candidates/RecipientField/recipients';
import { setDraft } from '~/modules/session';
import { draftFor, clearDraft } from '../data/drafts';
import AttachmentChips from './AttachmentChips.vue';
import MessageTools from './MessageTools.vue';
import { textOf } from '../text';

let seq = 0;
const ROW_LABEL = { to: 'To', cc: 'Cc', bcc: 'Bcc' };
/** A directory person as RecipientField takes them. */
const asRecipient = (p) => ({ id: p.id, email: p.email, name: p.name, company: p.company, role: p.role, avatarUrl: p.avatarUrl || '' });
const ATTACH_HELP = `Add a file, a link, a cloud-drive file or a record with the tools below. Files over ${MAIL_SIZE_LIMIT_MB} MB are delivered by secure link; recipients don't need an account to open them.`;
const REPLY_HELP = `Replies from any mail client come back to this thread. To file other mail in this project, forward or Bcc it to ${PROJECT.inboundAddress}.`;

export default {
  name: 'ComposePanel',
  components: { Button, Checkbox, Chip, FormV2, SelectV2, Tooltip, CircleHelp, SlideOverPanel, RecipientField, AttachmentChips, MessageTools },
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
    return {
      ROW_LABEL, ATTACH_HELP, REPLY_HELP, PROJECT,
      to: [], cc: [], bcc: [], showBcc: false, values: {}, message: { body: '' }, attachments: [], remindAtDue: true,
      letterType: 'general', templateId: null,
      // What the panel opened with and what was last saved, as snapshots (see `snapshot`): touched = differs from
      // the baseline, saved = equals the last save.
      baselineKey: '', savedKey: '', formKey: 0,
    };
  },
  computed: {
    record() {
      return this.recordId ? getRecord(this.recordId) : null;
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
      // D-74: a submittal or change order suggests its assignee, then its distribution list
      const suggested = this.rfi ? this.rfi.suggestedIds : this.record ? this.record.suggestedRecipientIds || [...new Set([this.record.assignedToId, ...(this.record.distributionIds || [])].filter(Boolean))] : [];
      const people = getPeople().filter((p) => p.id !== this.role.personId);
      const ordered = [...suggested.map((id) => people.find((p) => p.id === id)).filter(Boolean), ...people.filter((p) => !suggested.includes(p.id))];
      return ordered.map(asRecipient);
    },
    // --- letters (D-78)
    letterTypes() {
      return LETTER_TYPES.map((t) => ({ value: t.id, label: t.label }));
    },
    templates() {
      return templatesFor(this.letterType);
    },
    templateOptions() {
      return this.templates.map((t) => ({ value: t.id, label: t.name }));
    },
    nextNumber() {
      return nextLetterNumber();
    },
    /** The contract's rule for this record type, under the date (D-76). */
    turnaroundNote() {
      return turnaroundNote(this.record ? this.record.type : 'email');
    },
    /** Distribution lists as one chip each (D-75): the record's own list first, then the project's. */
    groups() {
      return distributionGroups(this.recordId, this.role.personId);
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
            ],
          },
        ],
      };
    },
    messageSchema() {
      return {
        sections: [
          {
            id: 'message',
            fields: [
              {
                id: 'body', type: 'rich-text', label: 'Message', colSpan: 'full',
                // One line of tools (P-057): style, bold / italic / underline / strike, colour, alignment menu, lists,
                // link. Files go in the Attachments section below, not the editor.
                props: { toolbar: { headingSelection: true, showUrlLink: true, addEmoji: false, table: false, todoList: false, undoRedo: false } },
              },
            ],
          },
        ],
      };
    },
    bodyText() {
      return textOf(this.message.body || '');
    },
    canSend() {
      return expandRecipients(this.to).length > 0 && !this.invalidNote && !!(this.values.subject || '').trim() && this.bodyText.length > 0;
    },
    /** Per context: the Email screen, or the record (and pin) composed from. */
    draftKey() {
      return `compose:${this.recordId || 'email'}${this.pinId ? `:${this.pinId}` : ''}`;
    },
    hasSavedDraft() {
      return !!draftFor(this.draftKey);
    },
    /** Everything the draft is made of, as one comparable string. */
    snapshotKey() {
      const ids = (rs) => rs.map((r) => (r.group ? `group:${r.id}` : r.id || r.email)).join(',');
      return JSON.stringify([ids(this.to), ids(this.cc), ids(this.bcc), (this.values.subject || '').trim(), this.values.dueOn || '', this.bodyText, this.attachments.map((a) => a.id), this.remindAtDue, this.letterType, this.templateId]);
    },
    touched() {
      return this.snapshotKey !== this.baselineKey;
    },
    saved() {
      return !!this.savedKey && this.snapshotKey === this.savedKey;
    },
  },
  watch: {
    open(open) {
      if (open && !this.restore()) this.reset();
    },
    /** A type with no templates drops the one chosen (D-78). */
    letterType(type) {
      if (this.templateId && !templatesFor(type).some((t) => t.id === this.templateId)) this.templateId = null;
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
      const assignee = r && r.type !== 'drawing' && r.assignedToId ? getPerson(r.assignedToId) : null; // the ball-in-court party (RFI, submittal, change order; D-74)
      const toIds = (this.prefill && this.prefill.toIds) || (this.rfi ? this.rfi.toIds : assignee ? [assignee.id] : []);
      this.to = toIds.map(getPerson).filter(Boolean).map(asRecipient);
      this.cc = [];
      this.bcc = [];
      this.showBcc = false;
      // Today's "Attach a PDF of the record", on by default, as a removable chip
      this.attachments = r && r.type !== 'drawing' ? [recordAttachment(r.id)].filter(Boolean) : [];
      this.remindAtDue = true;
      this.letterType = 'general';
      this.templateId = null;
      this.values = {
        // An RFI's subject carries its name (rfi-integration.md §B); other records leave the topic to the sender.
        // the record's code and title (D-74); a drawing keeps its code and revision, the topic is the sender's
        subject: r ? (r.type === 'drawing' ? `[${PROJECT.code}] ${recordLabel(r.id)} — ` : `[${PROJECT.code}] ${r.code} — ${r.title}`) : `[${PROJECT.code}] `,
        // On an RFI the step's due date (§B), else the contract's turnaround for the record type (D-76; plain email: three working days, spec §7)
        dueOn: ((this.rfi && this.rfi.dueOn) || defaultResponseDue(r ? r.type : 'email')).slice(0, 10),
      };
      this.message = { body: (this.prefill && this.prefill.body) || '' };
      this.baselineKey = this.snapshotKey;
      this.savedKey = '';
      this.formKey += 1;
    },
    /** The draft kept for this context comes back as it was left; false when there is none. */
    restore() {
      const d = draftFor(this.draftKey);
      if (!d) return false;
      this.reset();
      this.to = d.to || [];
      this.cc = d.cc || [];
      this.bcc = d.bcc || [];
      this.showBcc = !!d.showBcc || this.bcc.length > 0;
      this.attachments = (d.attachments || []).map((a) => ({ ...a }));
      // a draft keeps the body with the other values (data/drafts.js reads `values.body`)
      const { body, ...rest } = d.values || {};
      this.values = { ...this.values, ...rest };
      this.message = { body: body || '' };
      if (typeof d.remindAtDue === 'boolean') this.remindAtDue = d.remindAtDue;
      this.letterType = d.letterType || 'general';
      this.templateId = d.templateId || null;
      this.savedKey = this.snapshotKey;
      return true;
    },
    saveDraft() {
      if (!this.touched && !this.savedKey) return;
      setDraft(this.draftKey, {
        to: this.to, cc: this.cc, bcc: this.bcc, showBcc: this.showBcc, values: { ...this.values, body: this.message.body || '' }, attachments: this.attachments.map((a) => ({ ...a })), remindAtDue: this.remindAtDue, letterType: this.letterType, templateId: this.templateId, savedAt: new Date().toISOString(),
      });
      this.savedKey = this.snapshotKey;
    },
    /** Closing keeps an unsaved draft (nothing typed is lost); Discard is the way to drop it. */
    requestClose() {
      if (this.touched && !this.saved) this.saveDraft();
      this.$emit('close');
    },
    discard() {
      clearDraft(this.draftKey);
      this.reset();
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
    /** A template fills the subject and the message with the letter's form and the project letterhead (D-78). */
    useTemplate(id) {
      this.templateId = id;
      const t = this.templates.find((x) => x.id === id);
      if (!t) return;
      const topic = (this.values.subject || '').replace(/^\[[^\]]+\]\s*/, '').replace(/\s*[—-]\s*$/, '').trim() || (this.record ? `${this.record.code} — ${this.record.title}` : '');
      const first = expandRecipients(this.to)[0];
      const { subject, body } = applyTemplate(t, { topic, recipientCompany: first ? first.company : '', sender: this.sender, items: this.attachments.map((a) => a.name) });
      this.values = { ...this.values, subject: `[${PROJECT.code}] ${subject}` };
      this.message = { body };
      this.formKey += 1; // FormV2 copies its value once: remount with the template's text
    },
    addAttachment(a) {
      this.attachments.push(a);
    },
    removeAttachment(id) {
      this.attachments = this.attachments.filter((a) => a.id !== id);
    },
    send() {
      if (!this.canSend || this.busy) return;
      const thread = createThread({
        senderId: this.role.personId,
        // group chips go out as their members (D-75); someone in two rows is kept in the first
        toIds: expandRecipients(this.to).map((r) => r.id),
        ccIds: expandRecipients(this.cc).map((r) => r.id).filter((id) => !expandRecipients(this.to).some((r) => r.id === id)),
        bccIds: expandRecipients(this.bcc).map((r) => r.id).filter((id) => !expandRecipients([...this.to, ...this.cc]).some((r) => r.id === id)),
        subject: this.values.subject.trim().replace(/\s*[—-]\s*$/, ''), // a prefix left as-is loses its trailing dash
        body: this.bodyText,
        bodyHtml: this.message.body || '',
        links: this.attachments.filter((a) => a.kind === 'link').map(({ url, name }) => ({ url, name })),
        attachments: this.attachments.filter((a) => a.kind !== 'link'),
        linkedRecordIds: this.record ? [this.record.id] : [],
        pinId: this.pinId,
        responseDueAt: this.values.dueOn ? `${this.values.dueOn}T17:00:00` : null,
        remindAtDue: this.remindAtDue,
        letterType: this.letterType,
        templateId: this.templateId,
      });
      clearDraft(this.draftKey);
      this.$emit('sent', thread);
    },
  },
};
</script>

<style scoped>
/* The letter selects hug their longest option (Transmittal · Non-conformance notice), D-70; no width token fits (needs-token). */
.letter-select {
  width: 160px;
}
.template-select {
  width: 240px;
}
</style>

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
           from their menu. Only people in the directory become chips: an address nobody has stays in the field with
           the message that says where they are added (D-60). -->
      <div class="flex flex-col gap-space-8">
        <RecipientField
          v-model="to"
          label="To"
          :contacts="contacts"
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

      <!-- 5–6. Subject, Response due, Message -->
      <!-- `key`: FormV2 copies its value once, so a reset (Discard) remounts it with the defaults -->
      <FormV2 :key="formKey" v-model="values" :schema="schema" :flat="true" mode="manual" label-position="top" :submit-on-enter="false">
        <template #footer><span /></template>
      </FormV2>

      <!-- 7. Attachments (today, upgraded; D-58): added from the tool row below, shown as chips; the record's PDF is on
           by default (today's checkbox) and can be removed; over the mail limit goes by secure link instead of being refused -->
      <div class="flex flex-col gap-space-8">
        <div class="flex items-center gap-space-4">
          <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">Attachments</span>
          <!-- The how and the limit live in a tooltip on a help icon (keyboard: focus it), not in a line of body text -->
          <Tooltip :label="ATTACH_HELP" placement="top">
            <span class="inline-flex rounded-radius-round text-icon-inactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="`About attachments. ${ATTACH_HELP}`">
              <CircleHelp :size="16" :stroke-width="1.75" aria-hidden="true" />
            </span>
          </Tooltip>
        </div>
        <AttachmentChips :attachments="attachments" :disabled="busy" @remove="removeAttachment" />
        <span v-if="!attachments.length" class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Nothing attached yet.</span>
      </div>

      <!-- The project address where mail is composed (D-42, spec §4): replies thread by themselves; other mail is forwarded or Bcc'd. -->
      <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">Replies from any mail client come back to this thread. To file other mail in this project, forward or Bcc it to {{ PROJECT.inboundAddress }}.</p>
    </div>

    <template #footer>
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
    </template>
  </SlideOverPanel>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import FormV2 from '@/componentsV2/FormV2/FormV2.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import { CircleHelp } from '@development/linarc-icons';
import SlideOverPanel from '~/candidates/SlideOverPanel/SlideOverPanel.vue';
import RecipientField from '~/candidates/RecipientField/RecipientField.vue';
import { PROJECT, MAIL_SIZE_LIMIT_MB } from '../data/project';
import { getPerson, getPeople } from '../data/people';
import { getRecord, recordLabel } from '../data/records';
import { createThread, defaultResponseDue, recordAttachment } from '../data/actions';
import { rfiRecipients } from '../data/rfi';
import { session, setDraft } from '~/modules/session';
import AttachmentChips from './AttachmentChips.vue';
import MessageTools from './MessageTools.vue';
import { textOf } from '../text';

let seq = 0;
const ROW_LABEL = { to: 'To', cc: 'Cc', bcc: 'Bcc' };
/** A directory person as RecipientField takes them. */
const asRecipient = (p) => ({ id: p.id, email: p.email, name: p.name, company: p.company, role: p.role, avatarUrl: p.avatarUrl || '' });
const ATTACH_HELP = `Add a file, a link, a cloud-drive file or a record with the tools below. Files over ${MAIL_SIZE_LIMIT_MB} MB are delivered by secure link; recipients don't need an account to open them.`;

export default {
  name: 'ComposePanel',
  components: { Button, Chip, FormV2, Tooltip, CircleHelp, SlideOverPanel, RecipientField, AttachmentChips, MessageTools },
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
      ROW_LABEL, ATTACH_HELP, PROJECT,
      to: [], cc: [], bcc: [], showBcc: false, values: {}, attachments: [],
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
      return textOf(this.values.body || '');
    },
    canSend() {
      return this.to.length > 0 && !this.invalidNote && !!(this.values.subject || '').trim() && this.bodyText.length > 0;
    },
    /** Per context: the Email screen, or the record (and pin) composed from. */
    draftKey() {
      return `compose:${this.recordId || 'email'}${this.pinId ? `:${this.pinId}` : ''}`;
    },
    hasSavedDraft() {
      return !!session.drafts[this.draftKey];
    },
    /** Everything the draft is made of, as one comparable string. */
    snapshotKey() {
      const ids = (rs) => rs.map((r) => r.id || r.email).join(',');
      return JSON.stringify([ids(this.to), ids(this.cc), ids(this.bcc), (this.values.subject || '').trim(), this.values.dueOn || '', this.bodyText, this.attachments.map((a) => a.id)]);
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
      // Today's "Attach a PDF of the record", on by default, as a removable chip
      this.attachments = r && r.type !== 'drawing' ? [recordAttachment(r.id)].filter(Boolean) : [];
      this.values = {
        // An RFI's subject carries its name (rfi-integration.md §B); other records leave the topic to the sender.
        subject: r ? `[${PROJECT.code}] ${recordLabel(r.id)} — ${r.type === 'rfi' ? r.title : ''}` : `[${PROJECT.code}] `,
        // On an RFI the step's due date (§B), else three working days (spec §7)
        dueOn: ((this.rfi && this.rfi.dueOn) || defaultResponseDue()).slice(0, 10),
        body: (this.prefill && this.prefill.body) || '',
      };
      this.baselineKey = this.snapshotKey;
      this.savedKey = '';
      this.formKey += 1;
    },
    /** The draft kept for this context comes back as it was left; false when there is none. */
    restore() {
      const d = session.drafts[this.draftKey];
      if (!d) return false;
      this.reset();
      this.to = d.to || [];
      this.cc = d.cc || [];
      this.bcc = d.bcc || [];
      this.showBcc = !!d.showBcc || this.bcc.length > 0;
      this.attachments = (d.attachments || []).map((a) => ({ ...a }));
      this.values = { ...this.values, ...(d.values || {}) };
      this.savedKey = this.snapshotKey;
      return true;
    },
    saveDraft() {
      if (!this.touched && !this.savedKey) return;
      setDraft(this.draftKey, {
        to: this.to, cc: this.cc, bcc: this.bcc, showBcc: this.showBcc, values: { ...this.values }, attachments: this.attachments.map((a) => ({ ...a })), savedAt: new Date().toISOString(),
      });
      this.savedKey = this.snapshotKey;
    },
    /** Closing keeps an unsaved draft (nothing typed is lost); Discard is the way to drop it. */
    requestClose() {
      if (this.touched && !this.saved) this.saveDraft();
      this.$emit('close');
    },
    discard() {
      setDraft(this.draftKey, null);
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
        toIds: this.to.map((r) => r.id),
        ccIds: this.cc.map((r) => r.id),
        bccIds: this.bcc.map((r) => r.id),
        subject: this.values.subject.trim().replace(/\s*[—-]\s*$/, ''), // a prefix left as-is loses its trailing dash
        body: this.bodyText,
        bodyHtml: this.values.body || '',
        links: this.attachments.filter((a) => a.kind === 'link').map(({ url, name }) => ({ url, name })),
        attachments: this.attachments.filter((a) => a.kind !== 'link'),
        linkedRecordIds: this.record ? [this.record.id] : [],
        pinId: this.pinId,
        responseDueAt: this.values.dueOn ? `${this.values.dueOn}T17:00:00` : null,
      });
      setDraft(this.draftKey, null);
      this.$emit('sent', thread);
    },
  },
};
</script>

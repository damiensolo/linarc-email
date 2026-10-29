<template>
  <!-- Thread composer (docs/correspondence/spec.md §6.3): a composition of existing components, not a candidate (D-38).
       Mode select (Reply to all / Internal team note; internal roles only); the product's TextEditorV2, its formatting
       bar (bold, italic, underline, lists, link; P-056) shown on demand; the attachments as removable chips
       (AttachmentChips); and the compact tool row (MessageTools, D-58): attach a file, a link, a cloud-drive file or a
       record, the Formatting toggle; Discard, Save draft (kept per thread in the demo session, restored on return) and
       the one primary button whose label follows the mode. Note mode tints the composer like the note it will
       create. The buttons disable while sending (§6). -->
  <div class="flex flex-col gap-space-12 pt-space-16" :class="mode === 'note' ? 'rounded-radius-6 bg-surface-warning-low-subtle p-space-12' : ''">
    <div v-if="allowNote" class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8">
      <SelectV2 v-model="mode" class="w-full sm:w-1/3 lg:w-1/4" size="small" :options="modes" :allow-search="false" aria-label="Message type" />
      <span class="font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
        {{ mode === 'note' ? 'Only your team sees notes.' : 'Everyone on the thread gets this; they can answer from their own mail.' }}
      </span>
    </div>

    <!-- The product's editor with only the tools the Formatting toggle promises (P-056); its own Send / Save / Cancel
         are off, the tool row below has them. `keyup` reads the text at once (the editor's own event is debounced). -->
    <TextEditorV2
      ref="editor"
      empty-text="Write your message…"
      :hide-tool-bar="!formatting"
      :text-styling="true"
      :color-tools="false"
      :strikethrough="false"
      :alingment-tool="false"
      :list-tools="true"
      :show-url-link="true"
      :undo-redo="false"
      :table="false"
      :todo-list="false"
      :heading-selection="false"
      :add-emoji="false"
      :show-add-attachment="false"
      :show-send="false"
      :show-save="false"
      :show-cancel="false"
      :minimum-height="72"
      :focus-on-mounted="false"
      :disabled="busy"
      @tiptapData="onEditor"
      @keyup.native="syncNow"
    />

    <AttachmentChips :attachments="attachments" :disabled="busy" @remove="removeAttachment" />

    <MessageTools
      :attachments="attachments"
      :send-label="mode === 'note' ? 'Post note' : 'Send'"
      :can-send="!!text"
      :empty="empty"
      :saved="saved"
      :busy="busy"
      :formatting.sync="formatting"
      :has-saved-draft="!!(draftKey && session.drafts[draftKey])"
      :suggested-record-ids="suggestedRecordIds"
      @add="addAttachment"
      @save="saveDraft"
      @discard="discard"
      @send="submit"
    />
  </div>
</template>

<script>
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import TextEditorV2 from '@/components/TextEditorV2/index.vue';
import AttachmentChips from './AttachmentChips.vue';
import MessageTools from './MessageTools.vue';
import { session, setDraft } from '~/modules/session';
import { getThread } from '../data/threads';
import { textOf } from '../text';

export default {
  name: 'Composer',
  components: { SelectV2, TextEditorV2, AttachmentChips, MessageTools },
  props: {
    /** Internal roles may post notes; external roles only reply. */
    allowNote: { type: Boolean, default: true },
    busy: { type: Boolean, default: false },
    /** Save draft keeps the message under this key (the thread id); empty keeps it for this visit only. */
    draftKey: { type: String, default: '' },
  },
  data() {
    return {
      session,
      mode: 'reply',
      modes: [
        { value: 'reply', label: 'Reply to all' },
        { value: 'note', label: 'Internal team note' },
      ],
      html: '',
      text: '',
      formatting: false,
      attachments: [],
      saved: false,
      restoring: false,
    };
  },
  computed: {
    /** The thread's records lead *Attach a record* (D-61); a composer without a thread suggests nothing. */
    suggestedRecordIds() {
      const thread = this.draftKey ? getThread(this.draftKey) : null;
      return thread ? thread.linkedRecordIds : [];
    },
    empty() {
      return !this.text && !this.attachments.length;
    },
  },
  watch: {
    mode() {
      if (!this.restoring) this.saved = false;
    },
  },
  mounted() {
    this.restore();
  },
  methods: {
    onEditor({ htmlText } = {}) {
      if (this.restoring) {
        // the echo of the restored content
        this.restoring = false;
        this.html = htmlText || this.html;
        return;
      }
      this.applyHtml(htmlText);
    },
    syncNow() {
      const editor = this.$refs.editor && this.$refs.editor.editor;
      if (editor && !this.restoring) this.applyHtml(editor.getHTML());
    },
    applyHtml(html) {
      const next = html || '';
      if (next === this.html) return;
      this.html = next;
      const text = textOf(next);
      if (text !== this.text || this.saved) {
        this.text = text;
        this.saved = false;
      }
    },
    addAttachment(a) {
      this.attachments.push(a);
      this.saved = false;
    },
    removeAttachment(id) {
      this.attachments = this.attachments.filter((a) => a.id !== id);
      this.saved = false;
    },
    saveDraft() {
      if (this.empty) return;
      this.saved = true;
      if (this.draftKey) {
        setDraft(this.draftKey, { mode: this.mode, html: this.html, text: this.text, attachments: this.attachments.map((a) => ({ ...a })), savedAt: new Date().toISOString() });
      }
    },
    /** A draft saved on this thread comes back as it was left. */
    restore() {
      const d = this.draftKey && session.drafts[this.draftKey];
      if (!d) return;
      this.restoring = true;
      this.mode = this.allowNote ? d.mode || 'reply' : 'reply';
      this.attachments = (d.attachments || []).map((a) => ({ ...a }));
      this.html = d.html || '';
      this.text = d.text || '';
      if (this.html && this.$refs.editor) this.$refs.editor.setTextBoxContent(this.html);
      else this.restoring = false;
      this.$nextTick(() => {
        this.saved = true;
      });
    },
    clear() {
      this.html = '';
      this.text = '';
      this.attachments = [];
      this.saved = false;
      // the Formatting toggle is how this person likes to write; it stays as set
      if (this.$refs.editor) this.$refs.editor.setTextBoxContent('');
    },
    discard() {
      this.clear();
      if (this.draftKey) setDraft(this.draftKey, null);
    },
    submit() {
      if (!this.text || this.busy) return;
      const links = this.attachments.filter((a) => a.kind === 'link').map(({ url, name }) => ({ url, name }));
      const attachments = this.attachments.filter((a) => a.kind !== 'link');
      this.$emit('send', { mode: this.mode, body: this.text, bodyHtml: this.html, attachments, links });
    },
    /** The screen calls this once the write is acknowledged. */
    reset() {
      this.clear();
      if (this.draftKey) setDraft(this.draftKey, null);
    },
  },
};
</script>

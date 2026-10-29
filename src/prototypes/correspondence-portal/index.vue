<template>
  <!-- External › Secure link (docs/correspondence/spec.md §10, D-39, D-43): the page a recipient opens from the mail,
       for people without an account and for files over the mail limit. External-user pattern (5-ui-patterns.md §1):
       the Linarc top nav in its reduced Company configuration (logomark, no module switcher, tools or project
       context), no side rail, no shell; the reply in a fixed bottom panel. Mobile first (390), one centred column.
       Shows: who sent it and the project, the message, the pinned markup (DrawingPinPreview), the files (tiles that
       open in the FileViewer; any size, streamed; opening one is recorded on the sender's Delivery tab), Response due, "Open in Linarc" for a recipient with an account. Never notes, cost or other
       recipients' delivery (D-39). States: valid · expired (Send me a new link) · revoked · replied. The token is the
       hash (?p=correspondence-portal#tk-marcus-a302); the sandbox record picker lists the links. -->
  <div class="flex h-full flex-col bg-surface-page">
    <TopNavBar
      :module="{ custom: true }"
      :tools="{ items: [], needBookmarks: false, needCreate: false, isAdmin: false }"
      :context="{ enabled: false }"
      :account="account"
      :overflow="overflow"
      :user-details="link ? { name: link.recipient.name, email: link.recipient.email } : { name: '', email: '' }"
      @account-click="onAccountClick"
    >
      <template #custom_module>
        <span class="flex h-space-72 w-space-84 items-center justify-center" aria-label="Linarc" role="img">
          <LinarcLogoDark :size="48" aria-hidden="true" />
        </span>
      </template>
    </TopNavBar>

    <AppLayout
      class="min-h-0 flex-1"
      :left-panel-enabled="false"
      :right-panel-enabled="false"
      :bottom-panel-enabled="canReply"
      :bottom-panel-visible="canReply"
      :bottom-panel-resizable="false"
      :bottom-panel-default-height="64"
      :bottom-panel-min-height="64"
      :no-bottom-padding="true"
      :scrollable-content="true"
      :persist-preferences="false"
      header-size="comfortable"
    >
      <template #header>
        <span class="flex min-w-0 items-center gap-space-8">
          <span v-if="load.hasData && link" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ thread ? thread.subject : 'Message' }}</span>
          <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
          <Chip v-if="link" :label="project.code" size="small" fill-style="solid" type="default" :removable="false" class="hidden shrink-0 sm:inline-flex" />
        </span>
      </template>
      <template #header-actions>
        <Button v-if="link && link.recipient.hasAccount && link.state === 'valid'" label="Open in Linarc" color-scheme="secondary" variant="outline" size="medium" @onClick="openInLinarc" />
      </template>

      <template #content>
        <LoadRegion :load="load" class="mx-auto w-full max-w-3xl pt-space-16" @retry="fetch">
          <template #default>
            <div class="flex flex-col gap-space-32 font-label">
              <!-- Link state first: an expired or withdrawn link says so and offers the way forward (D-43). -->
              <InlineNotice v-if="link.state === 'expired'" tone="warning" title="This link has expired" message="Secure links stay open for 30 days. Ask for a new one and it is sent to the same address.">
                <template #actions>
                  <Button v-if="!renewed" label="Send me a new link" color-scheme="primary" variant="solid" size="small" @onClick="renew" />
                  <span v-else class="text-fontsize-14 leading-lineheight-20 text-text-default">A new link is on its way to {{ link.recipient.email }}.</span>
                </template>
              </InlineNotice>
              <InlineNotice v-else-if="link.state === 'revoked'" tone="warning" title="This link was withdrawn" :message="`${senderName} withdrew this link. Reply to the original email if you still need to answer.`" />
              <p v-else-if="link.replied || replied" class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle" role="status">
                Reply sent{{ repliedAt ? ` on ${$moment(repliedAt).format('D MMM, HH:mm')}` : '' }}. A copy went to {{ link.recipient.email }}; {{ senderName }} answers in the same thread.
              </p>

              <template v-if="link.state === 'valid'">
                <!-- Who, to whom, when -->
                <section class="flex flex-col gap-space-4">
                  <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ project.name }}</span>
                  <span class="text-fontsize-14 leading-lineheight-20 text-text-default"><span class="font-bold">{{ senderName }}</span> ({{ project.gc }}) sent this to {{ link.recipient.name }} · {{ $moment(link.sentAt).format('D MMM, HH:mm') }}</span>
                  <span v-if="link.responseDueAt" class="text-fontsize-14 leading-lineheight-20" :class="dueTone">Response requested by {{ $moment(link.responseDueAt).format('dddd D MMM') }}</span>
                </section>

                <!-- The message -->
                <p class="m-0 whitespace-pre-line text-fontsize-16 leading-lineheight-24 text-text-default">{{ link.message }}</p>

                <!-- The pinned markup (one signal: Current, or a Superseded chip) -->
                <section v-if="drawing" class="flex flex-col gap-space-8">
                  <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Drawing</h2>
                  <DrawingPinPreview :drawing="drawing" :pin="pin" size="md" @open="viewing = !viewing">
                    <template #thumbnail>
                      <SheetSvg :drawing="drawing" :pins="pin ? [pin] : []" :highlight-pin-id="pin ? pin.id : ''" :crop="pin ? pin.box : null" />
                    </template>
                  </DrawingPinPreview>
                  <div v-if="viewing" class="overflow-hidden rounded-radius-4 border border-border-subtle bg-surface-container">
                    <SheetSvg :drawing="drawing" :pins="pin ? [pin] : []" :highlight-pin-id="pin ? pin.id : ''" />
                  </div>
                  <Button :label="viewing ? 'Hide the full sheet' : 'View the full sheet'" variant="text" color-scheme="primary" size="small" class="self-start" @onClick="viewing = !viewing" />
                </section>

                <!-- Files of any size, streamed from the link (bet 3) -->
                <section v-if="files.length" class="flex flex-col gap-space-8">
                  <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Files</h2>
                  <FileTiles :files="files" @open="openFiles" @download="download" />
                  <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">No account needed. Opening a file is recorded for the sender.</span>
                </section>

                <!-- Reply -->
                <section v-if="!link.replied && !replied" class="flex flex-col gap-space-8">
                  <h2 class="m-0 font-heading text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Reply</h2>
                  <TextareaField :field="replyField" :value="reply" @input="reply = $event" />
                  <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">Your reply goes to {{ senderName }} and the people on the thread, and a copy to {{ link.recipient.email }}. Replying to the email works too.</span>
                </section>

                <!-- The outbound mail footer's project line (D-42, spec §4): where a recipient sends anything new about the project. -->
                <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">Something new about {{ project.name }}? Email {{ project.inboundAddress }} and it's filed in the project.</p>
              </template>
            </div>
          </template>
          <template #skeleton>
            <div class="flex flex-col gap-space-24">
              <Skeleton size="sm" class="w-space-124" />
              <Skeleton size="md" class="w-full" />
              <Skeleton size="md" class="w-full" />
              <Skeleton shape="block" class="h-space-124 w-full" />
            </div>
          </template>
        </LoadRegion>
      </template>

      <template v-if="canReply" #bottom-panel>
        <div class="mx-auto flex h-full w-full max-w-3xl items-center justify-end gap-space-8 px-space-16">
          <LoadStatus :load="write" />
          <Button label="Send" color-scheme="primary" variant="solid" size="medium" :is-disabled="!reply.trim() || write.status === 'loading'" @onClick="send" />
        </div>
      </template>
    </AppLayout>

    <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="download" @view="recordOpened" />
  </div>
</template>

<script>
import TopNavBar from '@/components/TopNavBar/index.vue';
import AppLayout from '@/componentsV2/AppLayout/AppLayout.vue';
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import TextareaField from '@/componentsV2/FormV2/fields/TextareaField.vue';
import { LinarcLogoDark } from '@development/linarc-icons';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import InlineNotice from '~/candidates/InlineNotice/InlineNotice.vue';
import DrawingPinPreview from '~/candidates/DrawingPinPreview/DrawingPinPreview.vue';
import FileViewer from '~/candidates/FileViewer/FileViewer.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import { currentRoute, go } from '~/modules/app/router';
import { accountWithSettings, overflowWithSettings, onAccountClick } from '~/modules/sandbox';
import { PROJECT, LINKS, TODAY, dayOf, getLink, getThread, getRecord, getPerson, getFile, replyFromLink, recordFileOpened, inboundSandbox } from '~/modules/correspondence/data';
import { fileView } from '~/modules/correspondence/view';
import { fileViewing, saveFile } from '~/modules/correspondence/fileViewing';
import SheetSvg from '~/modules/correspondence/components/SheetSvg.vue';
import FileTiles from '~/modules/correspondence/components/FileTiles.vue';

export default {
  name: 'CorrespondencePortal',
  prototype: {
    title: 'External › Secure link',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4102-2174',
    records: () => LINKS.map((l) => ({ value: l.token, label: `${l.recipient.name} · ${l.threadId}${l.token === 'tk-expired' ? ' (expired)' : ''}` })),
    inbound: inboundSandbox,
  },
  components: { TopNavBar, AppLayout, Button, Chip, TextareaField, LinarcLogoDark, FileTiles, LoadRegion, LoadStatus, Skeleton, InlineNotice, DrawingPinPreview, FileViewer, SheetSvg },
  mixins: [fileViewing],
  data() {
    const asked = currentRoute().id;
    return {
      project: PROJECT,
      token: asked && getLink(asked) ? asked : LINKS[0].token,
      link: null,
      thread: null,
      reply: '',
      replied: false,
      repliedAt: null,
      renewed: false,
      viewing: false,
      opened: {}, // fileId → true once its opening is recorded for the sender (once per visit)
      load: createLoad({ label: 'message' }),
      write: createLoad({ label: 'reply', action: { busy: 'Sending', done: 'Sent', error: "Couldn't send." } }),
    };
  },
  computed: {
    account() {
      return accountWithSettings({ announcement: false, message: false, chatSupport: false, help: true, notifications: false, profile: true });
    },
    overflow() {
      return overflowWithSettings();
    },
    senderName() {
      const first = this.thread && this.thread.entries.find((e) => e.type === 'message' && e.direction === 'outbound');
      const p = first ? getPerson(first.senderId) : null;
      return p ? p.name : 'The sender';
    },
    drawing() {
      return this.link && this.link.drawingId ? getRecord(this.link.drawingId) : null;
    },
    pin() {
      return this.drawing && this.link.pinId ? this.drawing.pins.find((p) => p.id === this.link.pinId) || null : null;
    },
    files() {
      return this.link ? this.link.fileIds.map(getFile).filter(Boolean).map(fileView) : [];
    },
    dueTone() {
      if (!this.link || !this.link.responseDueAt) return 'text-text-subtle';
      return dayOf(this.link.responseDueAt) <= dayOf(TODAY) ? 'text-text-warning-low' : 'text-text-subtle';
    },
    canReply() {
      return !!(this.load.hasData && this.link && this.link.state === 'valid' && !this.link.replied && !this.replied);
    },
    replyField() {
      return { id: 'portal-reply', placeholder: 'Write your reply…', props: { rows: 5 } };
    },
  },
  created() {
    this.fetch();
  },
  beforeDestroy() {
    this.load.destroy();
    this.write.destroy();
  },
  methods: {
    onAccountClick,
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => {
          const link = getLink(this.token);
          return { link, thread: link ? getThread(link.threadId) : null };
        }, { signal }),
        ({ link, thread }) => {
          this.link = link;
          this.thread = thread;
        },
      );
    },
    send() {
      if (!this.reply.trim()) return;
      const body = this.reply.trim();
      this.write.run(
        (signal) => mockRequest(() => replyFromLink(this.link, { body }), { signal }),
        (entry) => {
          this.replied = true;
          this.repliedAt = entry.sentAt;
          this.reply = '';
          this.fetch();
        },
      );
    },
    renew() {
      this.renewed = true; // the product emails a fresh link to the same address (D-43); nothing else happens here
    },
    /** Opening a file is recorded for the sender (the page says so): once per file per visit, on the Delivery tab. */
    recordOpened(file, action = 'open') {
      const key = `${file.id}:${action}`;
      if (this.opened[key] || !this.link) return;
      this.$set(this.opened, key, true);
      recordFileOpened(this.link.threadId, { file, recipient: this.link.recipient, action });
    },
    download(file) {
      saveFile(file);
      this.recordOpened(file, 'download');
    },
    openInLinarc() {
      if (this.thread) go('thread', this.thread.id);
    },
  },
};
</script>

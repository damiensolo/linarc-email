<template>
  <!-- CANDIDATE 2026-10-16: proposed design-system component, see docs/components/ThreadStream.md (D-17, D-38).
       The entries of an email thread as one hairline list: messages (sender, company, time, ONE delivery signal, body,
       files as AttachmentThumbnail tiles, an actions slot), internal team notes (InlineNotice warning; internal role only), system events (muted
       row with an in-document link), and a bounce notice under a failed message with an actions slot. No AI summary
       and no composer here (D-38): the screen composes those around it. Entries arrive already resolved (names,
       labels, tones): this component holds no module data. -->
  <div>
    <ol v-if="loading" class="m-0 flex list-none flex-col p-0" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="flex gap-space-12 border-b border-border-subtle py-space-16">
        <Skeleton shape="circle" class="h-space-32 w-space-32 shrink-0" />
        <div class="flex flex-1 flex-col gap-space-8">
          <Skeleton size="sm" class="w-space-124" />
          <Skeleton size="sm" class="w-full" />
          <Skeleton size="sm" class="w-full" />
        </div>
      </li>
    </ol>

    <div v-else-if="!entries.length" class="py-space-16 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
      <slot name="empty">{{ emptyText }}</slot>
    </div>

    <ol v-else class="m-0 flex list-none flex-col p-0" role="list">
      <li
        v-for="entry in entries"
        :id="`entry-${entry.id}`"
        :key="entry.id"
        class="border-b border-border-subtle py-space-16 first:pt-0"
        :class="{ 'ts-highlight -mx-space-12 rounded-radius-6 bg-surface-primary-muted px-space-12': entry.id === highlightId }"
      >
        <!-- Message -->
        <article v-if="entry.type === 'message'" class="flex gap-space-12">
          <Avatar :full-name-initials="entry.sender.initials" size="sm" shape="circle" class="shrink-0" />
          <div class="flex min-w-0 flex-1 flex-col gap-space-8">
            <div class="flex flex-wrap items-baseline gap-x-space-8 gap-y-space-2 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
              <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">{{ entry.sender.name }}</span>
              <span>{{ entry.sender.company }}</span>
              <span>{{ when(entry.sentAt) }}</span>
              <span v-if="entry.toText">to {{ entry.toText }}</span>
              <!-- One delivery signal (D-17): a chip only when it failed, a muted word otherwise. -->
              <StatusChip v-if="entry.delivery && entry.delivery.tone === 'error'" :label="entry.delivery.label" status="error" fill-style="outline" type="default" :removable="false" />
              <span v-else-if="entry.delivery">{{ entry.delivery.label }}</span>
              <span v-if="entry.resendOf">Resent</span>
            </div>
            <p class="m-0 whitespace-pre-line font-label text-fontsize-14 leading-lineheight-20 text-text-default">{{ entry.body }}</p>
            <!-- Files: a tile each (preview or file type), captioned with name and size; open steps through the message's files -->
            <ul v-if="entry.attachments && entry.attachments.length" class="m-0 flex list-none flex-wrap gap-space-12 p-0" :aria-label="`${entry.attachments.length} ${entry.attachments.length === 1 ? 'file' : 'files'}`">
              <li v-for="(a, i) in entry.attachments" :key="a.id" class="flex w-space-88 flex-col gap-space-4 font-label">
                <AttachmentThumbnail :name="a.name" :thumbnail-url="a.thumbnailUrl || ''" @open="$emit('open-attachment', a, entry.attachments, i)" @download="$emit('download-attachment', a)" />
                <span class="flex flex-col text-fontsize-12 leading-lineheight-16">
                  <span class="truncate text-text-default" :title="a.name">{{ a.name }}</span>
                  <span class="text-text-subtle">{{ a.sizeMb }} MB</span>
                  <span v-if="a.byLink" class="text-text-subtle">By secure link</span>
                </span>
              </li>
            </ul>
            <InlineNotice v-if="entry.bounce && !entry.bounce.resolved" tone="error" title="Delivery failed" :message="`${entry.bounce.email}: ${entry.bounce.reason}`">
              <template #actions>
                <slot name="bounce-actions" :entry="entry" />
              </template>
            </InlineNotice>
            <div v-if="$scopedSlots['message-actions']" class="flex flex-wrap gap-space-8">
              <slot name="message-actions" :entry="entry" />
            </div>
          </div>
        </article>

        <!-- Internal team note (never shown to an external role) -->
        <div v-else-if="entry.type === 'note'" class="flex flex-col gap-space-4">
          <InlineNotice tone="warning" title="Internal team note (hidden from external recipients)" :message="entry.body" />
          <span class="pl-space-12 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ entry.sender.name }} · {{ when(entry.sentAt) }}</span>
        </div>

        <!-- System event -->
        <div v-else class="flex flex-wrap items-center gap-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
          <span>{{ entry.text }} · {{ when(entry.sentAt) }}</span>
          <Button v-if="entry.recordId" :label="`Open ${entry.recordId}`" variant="text" color-scheme="primary" size="small" @onClick="$emit('navigate', entry.recordId)" />
        </div>
      </li>
    </ol>
  </div>
</template>

<script>
import Avatar from '@/components/Avatar/Avatar.vue';
import Button from '@/components/Button/Button.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import AttachmentThumbnail from '@/componentsV2/AttachmentThumbnail/AttachmentThumbnail.vue';
import InlineNotice from '~/candidates/InlineNotice/InlineNotice.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';

export default {
  name: 'ThreadStream',
  components: { Avatar, Button, StatusChip, AttachmentThumbnail, InlineNotice, Skeleton },
  props: {
    /**
     * Resolved entries, oldest first (README):
     *  message { id, type: 'message', direction, sender: { name, company, initials }, sentAt, body, toText?,
     *            attachments: [{ id, name, sizeMb, byLink, thumbnailUrl? }], delivery?: { label, tone }, bounce?: { email, reason, resolved }, resendOf? }
     *  note    { id, type: 'note', sender, sentAt, body }
     *  event   { id, type: 'event', sentAt, text, recordId? }
     * The screen applies the role before passing entries (an external role never receives notes).
     */
    entries: { type: Array, default: () => [] },
    /** Entry kept highlighted while a panel acts on it. */
    highlightId: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    emptyText: { type: String, default: 'No messages yet.' },
  },
  // open-attachment (file, theMessageFiles, index) · download-attachment (file) · navigate (recordId)
  methods: {
    when(iso) {
      return this.$moment(iso).format('D MMM, HH:mm');
    },
  },
};
</script>

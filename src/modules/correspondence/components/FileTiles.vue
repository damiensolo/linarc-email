<template>
  <!-- A message's files as AttachmentThumbnail tiles, each captioned with its name and size (the composition the thread
       uses inside ThreadStream; here for the composers and the secure link page). Not a candidate: library parts only. -->
  <ul class="m-0 flex list-none flex-wrap gap-space-12 p-0 font-label" :aria-label="label">
    <li v-for="(f, i) in files" :key="f.id" class="flex w-space-88 flex-col gap-space-4">
      <AttachmentThumbnail
        :name="f.name"
        :thumbnail-url="f.thumbnailUrl || ''"
        :openable="openable"
        :downloadable="downloadable"
        :removable="removable"
        @open="$emit('open', f, files, i)"
        @download="$emit('download', f)"
        @remove="$emit('remove', f)"
      />
      <span class="flex flex-col text-fontsize-12 leading-lineheight-16">
        <span class="truncate text-text-default" :title="f.name">{{ f.name }}</span>
        <span class="text-text-subtle">{{ f.sizeMb }} MB</span>
        <span v-if="f.byLink" class="text-text-subtle">By secure link</span>
      </span>
    </li>
  </ul>
</template>

<script>
import AttachmentThumbnail from '@/componentsV2/AttachmentThumbnail/AttachmentThumbnail.vue';

export default {
  name: 'FileTiles',
  components: { AttachmentThumbnail },
  props: {
    /** fileView() objects (view.js) */
    files: { type: Array, default: () => [] },
    label: { type: String, default: 'Files' },
    openable: { type: Boolean, default: true },
    downloadable: { type: Boolean, default: true },
    removable: { type: Boolean, default: false },
  },
};
</script>

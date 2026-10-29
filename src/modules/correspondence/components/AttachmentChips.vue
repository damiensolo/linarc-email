<template>
  <!-- What goes with a message before it is sent (docs/correspondence/spec.md §7, D-58): one removable chip each for a
       device file, a cloud-drive file, a record's PDF or a link, with the detail (size, provider, URL, the record) in
       a tooltip. Shared by the thread composer and the compose panel. -->
  <ul v-if="attachments.length" class="m-0 flex list-none flex-wrap gap-space-8 p-0" aria-label="Attachments">
    <li v-for="a in attachments" :key="a.id">
      <Tooltip :label="hint(a)" placement="top" :delay="300">
        <Chip :id="`chip-${a.id}`" type="icon" size="small" :label="label(a)" :left-item="icon(a)" :remove-aria-label="`Remove ${a.name}`" :disabled="disabled" @remove="$emit('remove', a.id)" />
      </Tooltip>
    </li>
  </ul>
</template>

<script>
import Chip from '@/components/Chip/Chip.vue';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import { Link as LinkIcon, Cloud, FileBox, File as FileIcon } from '@development/linarc-icons';
import { recordLabel } from '../data/records';
import { MAIL_SIZE_LIMIT_MB } from '../data/project';

export default {
  name: 'AttachmentChips',
  components: { Chip, Tooltip },
  props: {
    /** [{ id, name, kind?: 'file' | 'cloud' | 'record' | 'link', sizeMb?, byLink?, provider?, url?, recordId? }] */
    attachments: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  methods: {
    icon(a) {
      return { link: LinkIcon, cloud: Cloud, record: FileBox }[a.kind] || FileIcon;
    },
    label(a) {
      return a.kind === 'link' || a.kind === 'record' ? a.name : `${a.name} · ${a.sizeMb} MB`;
    },
    hint(a) {
      if (a.kind === 'link') return a.url;
      if (a.kind === 'record') return `PDF of ${recordLabel(a.recordId)}`;
      const link = a.byLink ? ` · over ${MAIL_SIZE_LIMIT_MB} MB, sent by secure link` : '';
      return a.kind === 'cloud' ? `${a.provider} · ${a.sizeMb} MB${link}` : `${a.sizeMb} MB${link}`;
    },
  },
};
</script>

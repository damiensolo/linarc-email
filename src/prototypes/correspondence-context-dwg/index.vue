<template>
  <!-- Drawings › Sheet: a STAND-IN for the product's sheet viewer (docs/correspondence/00-plan.md §2), here to prove
       compose in context (bet 1, spec §5): a markup pin on the sheet opens a popover with the markup's facts and
       "Email about this markup", which opens the compose panel with the drawing pinned at its revision and the
       cropped markup preview (DrawingPinPreview candidate) under the linked record. The sheet is an SVG drawn with
       tokens (SheetSvg), one pin at Grid B-4; S-201 Rev 1 is the superseded case. Not the Drawings product. -->
  <AppShell screen="sheet" header-size="comfortable" title="Sheet">
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back" @click="back" />
        <span v-if="load.hasData && drawing" class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">{{ drawing.code }} · {{ drawing.title }}</span>
        <Skeleton v-else size="md" class="w-space-124 shrink-0" :class="{ invisible: !load.indicator }" />
        <Chip v-if="drawing" :label="drawing.revision" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
        <span v-if="drawing" class="hidden items-center gap-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle md:inline-flex">
          <StatusChip v-if="drawing.revisionStatus === 'superseded'" :label="`Superseded by ${drawing.supersededBy}`" :status="chip(revisionStatus.tone)" fill-style="outline" type="default" :removable="false" />
          <span v-else>{{ revisionStatus.label }} · issued {{ $moment(drawing.issuedOn).format('D MMM YYYY') }}</span>
        </span>
      </span>
    </template>

    <template #header-actions>
      <Button v-if="role.internal" label="Email about this sheet" color-scheme="primary" variant="solid" size="medium" :is-disabled="!drawing" @onClick="compose(null)" />
    </template>

    <template #content>
      <LoadRegion :load="load" class="flex h-full min-h-0 flex-col gap-space-12 pt-space-16" @retry="fetch">
        <template #default>
          <p v-if="notice" class="m-0 flex flex-wrap items-center gap-x-space-8 font-label text-fontsize-14 leading-lineheight-20 text-text-default" role="status">
            <span>{{ notice.text }}</span>
            <Button v-if="notice.threadId" label="Open in Email" variant="text" color-scheme="primary" size="small" @onClick="go('thread', notice.threadId)" />
          </p>
          <p class="m-0 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
            {{ drawing.pins.length ? `${drawing.pins.length} markup${drawing.pins.length === 1 ? '' : 's'} on this sheet. Select one to email about it.` : 'No markups on this sheet.' }}
          </p>
          <!-- The sheet: one container (D-17), the pins as buttons over it -->
          <div class="relative min-h-0 flex-1 overflow-hidden rounded-radius-4 border border-border-subtle bg-surface-container">
            <SheetSvg :drawing="drawing" :pins="drawing.pins" :highlight-pin-id="activePin ? activePin.id : ''" />
            <button
              v-for="p in drawing.pins"
              :key="p.id"
              :ref="`pin-${p.id}`"
              type="button"
              class="sheet-pin absolute rounded-radius-4 border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused"
              :style="pinStyle(p)"
              :aria-label="`Markup at ${p.grid}: ${p.label}`"
              :aria-expanded="activePin && activePin.id === p.id ? 'true' : 'false'"
              @click="togglePin(p)"
            />
          </div>
        </template>
        <template #skeleton>
          <Skeleton size="sm" class="w-space-124" />
          <Skeleton shape="block" class="min-h-0 w-full flex-1" />
        </template>
      </LoadRegion>

      <!-- Markup popover: the markup's facts and the two things to do with it. -->
      <Popover :open="!!activePin" :anchor="anchorEl" placement="right-start" :max-width="360" variant="card" @close="activePin = null">
        <div v-if="activePin" class="flex flex-col gap-space-12 p-space-16 font-label">
          <div class="flex flex-col gap-space-2">
            <span class="text-fontsize-14 font-bold leading-lineheight-20 text-text-default">{{ activePin.grid }}</span>
            <span class="text-fontsize-14 leading-lineheight-20 text-text-default">{{ activePin.label }}</span>
            <span class="text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ (getPerson(activePin.authorId) || {}).name }} · {{ $moment(activePin.createdAt).format('D MMM, HH:mm') }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-space-8">
            <Button v-if="role.internal" label="Email about this markup" color-scheme="primary" variant="solid" size="small" @onClick="compose(activePin)" />
            <Button v-if="pinThread(activePin)" :label="`Open ${pinThread(activePin).id} in Email`" variant="text" color-scheme="primary" size="small" @onClick="go('thread', pinThread(activePin).id)" />
          </div>
        </div>
      </Popover>

      <ComposePanel v-if="drawing" :open="composing" :role="role" :record-id="drawing.id" :pin-id="composePin ? composePin.id : null" :busy="false" @close="composing = false" @sent="onSent">
        <template #pin-preview>
          <DrawingPinPreview v-if="composePin" :drawing="drawing" :pin="composePin" size="md" class="pt-space-8" @open="composing = false">
            <template #thumbnail>
              <SheetSvg :drawing="drawing" :pins="[composePin]" :highlight-pin-id="composePin.id" :crop="composePin.box" />
            </template>
          </DrawingPinPreview>
        </template>
      </ComposePanel>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Chip from '@/components/Chip/Chip.vue';
import StatusChip from '@/components/StatusChip/StatusChip.vue';
import HeaderToolIcon from '@/componentsV2/HeaderToolIcon/HeaderToolIcon.vue';
import Popover from '@/componentsV2/Popover/Popover.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';
import DrawingPinPreview from '~/candidates/DrawingPinPreview/DrawingPinPreview.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go } from '~/modules/app/router';
import { DRAWING_REVISION, toneToChipStatus } from '~/modules/app/status';
import { DRAWINGS, ROLES, currentRole, setRole, getRecord, getPerson, getThread, viewFor, inboundSandbox } from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';
import ComposePanel from '~/modules/correspondence/components/ComposePanel.vue';
import SheetSvg from '~/modules/correspondence/components/SheetSvg.vue';

export default {
  name: 'CorrespondenceContextDwg',
  prototype: {
    title: 'Drawings › Sheet',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4101-1416',
    records: () => DRAWINGS.map((d) => ({ value: d.id, label: `${d.code} · ${d.revision} — ${d.title}` })),
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { AppShell, Button, Chip, StatusChip, HeaderToolIcon, Popover, LoadRegion, Skeleton, DrawingPinPreview, ComposePanel, SheetSvg },
  data() {
    const asked = currentRoute().id;
    return {
      role: currentRole(),
      id: asked && getRecord(asked) ? asked : DRAWINGS[0].id,
      drawing: null,
      activePin: null,
      anchorEl: null,
      composing: false,
      composePin: null,
      notice: null,
      load: createLoad({ label: 'sheet' }),
    };
  },
  computed: {
    revisionStatus() {
      return DRAWING_REVISION[this.drawing.revisionStatus];
    },
  },
  created() {
    this.fetch();
  },
  beforeDestroy() {
    this.load.destroy();
  },
  methods: {
    go,
    getPerson,
    chip: (tone) => toneToChipStatus(tone),
    fetch() {
      this.load.run(
        (signal) => mockRequest(() => getRecord(this.id), { signal }),
        (drawing) => {
          this.drawing = drawing;
        },
      );
    },
    /** The pin button sits over the markup box (percent of the sheet, matching SheetSvg's viewBox). */
    pinStyle(p) {
      return { left: `${p.box.x}%`, top: `${p.box.y}%`, width: `${p.box.w}%`, height: `${p.box.h}%` };
    },
    togglePin(p) {
      if (this.activePin && this.activePin.id === p.id) {
        this.activePin = null;
        return;
      }
      const ref = this.$refs[`pin-${p.id}`];
      this.anchorEl = Array.isArray(ref) ? ref[0] : ref;
      this.activePin = p;
    },
    /** The thread a markup already has, as this role may see it. */
    pinThread(p) {
      const t = p.threadId ? getThread(p.threadId) : null;
      return t ? viewFor(t, this.role) : null;
    },
    compose(pin) {
      this.activePin = null;
      this.composePin = pin;
      this.composing = true;
    },
    onSent(thread) {
      this.composing = false;
      this.notice = { text: `Sent with ${this.drawing.code} · ${this.drawing.revision}${this.composePin ? ` at ${this.composePin.grid}` : ''} pinned.`, threadId: thread.id };
    },
    back() {
      if (window.history.length > 1) window.history.back();
      else go('email');
    },
  },
};
</script>

<style scoped>
/* The pin button is the click target over the cloud; the cloud itself is drawn by SheetSvg. */
.sheet-pin {
  cursor: pointer;
}
.sheet-pin:hover {
  background: var(--surface-primary-muted);
  opacity: 0.6;
}
</style>

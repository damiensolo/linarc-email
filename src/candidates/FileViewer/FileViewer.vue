<template>
  <!-- CANDIDATE 2026-10-18: proposed design-system component, see docs/components/FileViewer.md. Not a prototype-local widget.
       Full-screen viewer for a set of files (a message's attachments): a light header (name, position and meta, zoom
       for images, Download, Close) over a dark stage that shows the file as it is: an image fitted or zoomed, a PDF in
       the browser's viewer, a video with its player, or "No preview" with Download for anything else. Previous / Next
       step through the set. Nothing for 200ms while a file loads, then a skeleton; a file that fails says so with Retry.
       Esc closes, ← → step, + − 0 zoom; focus moves to the name on open and back to the opener on close. -->
  <transition name="fv">
    <div
      v-if="open && file"
      ref="root"
      class="fv-root flex flex-col"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @keydown="onKeydown"
    >
      <header class="flex h-space-64 shrink-0 items-center gap-space-8 border-b border-border-subtle bg-surface-container px-space-12 sm:gap-space-12 sm:px-space-20">
        <div class="flex min-w-0 flex-1 flex-col">
          <h2 :id="titleId" ref="title" tabindex="-1" class="m-0 truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default outline-none" :title="file.name">
            {{ file.name }}
          </h2>
          <span class="truncate font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">{{ metaLine }}</span>
        </div>

        <div v-if="kind === 'image' && status === 'ready'" class="hidden items-center gap-space-4 md:flex">
          <Button color-scheme="secondary" variant="minimal" size="medium" native-type="button" tooltip="Zoom out" aria-label="Zoom out" :is-disabled="zoomIndex === 0" @onClick="zoomBy(-1)">
            <template #leftIcon><ZoomOut aria-hidden="true" /></template>
          </Button>
          <Button :label="zoomLabel" color-scheme="secondary" variant="minimal" size="medium" native-type="button" tooltip="Fit to screen" @onClick="fit" />
          <Button color-scheme="secondary" variant="minimal" size="medium" native-type="button" tooltip="Zoom in" aria-label="Zoom in" :is-disabled="zoomIndex === ZOOMS.length - 1" @onClick="zoomBy(1)">
            <template #leftIcon><ZoomIn aria-hidden="true" /></template>
          </Button>
        </div>

        <Button label="Download" color-scheme="secondary" variant="outline" size="medium" native-type="button" class="hidden shrink-0 sm:inline-flex" @onClick="$emit('download', file)" />
        <Button color-scheme="secondary" variant="outline" size="medium" native-type="button" class="shrink-0 sm:hidden" tooltip="Download" :aria-label="`Download ${file.name}`" @onClick="$emit('download', file)">
          <template #leftIcon><Download aria-hidden="true" /></template>
        </Button>
        <HeaderToolIcon type="tool" aria-label="Close" class="shrink-0" @click="close">
          <X :size="20" :stroke-width="1.75" />
        </HeaderToolIcon>
      </header>

      <div class="fv-stage relative min-h-0 flex-1 bg-surface-container-invert" @click.self="close">
        <!-- Image: fitted, or at a zoom level inside a scroller (padding inside the scroller, F-051) -->
        <div v-if="kind === 'image'" v-show="status !== 'error'" ref="scroller" class="absolute inset-0 overflow-auto p-space-16 sm:px-space-72 sm:py-space-48" :class="{ 'flex items-center justify-center': fitted }" @click.self="close">
          <img
            :key="`${file.id}-${attempt}`"
            :src="file.url"
            :alt="file.name"
            class="fv-image block select-none"
            :class="{ 'fv-image--fit': fitted, 'opacity-0': status !== 'ready' }"
            :style="imageStyle"
            draggable="false"
            @load="onImageLoad"
            @error="onError"
            @dblclick="fitted ? zoomTo(ZOOMS.indexOf(1)) : fit()"
          />
        </div>

        <!-- PDF: the browser's own viewer (pages, search, print) -->
        <iframe v-else-if="kind === 'pdf'" v-show="status !== 'error'" :key="`${file.id}-${attempt}`" :src="file.url" :title="file.name" class="absolute inset-0 h-full w-full border-0 bg-surface-container" :class="{ 'sm:left-space-72 sm:right-space-72 sm:w-auto': files.length > 1 }" @load="onReady" />

        <!-- Video -->
        <div v-else-if="kind === 'video'" v-show="status !== 'error'" class="absolute inset-0 flex items-center justify-center p-space-16 sm:px-space-72 sm:py-space-48">
          <video
            :key="`${file.id}-${attempt}`"
            :src="file.url"
            :poster="file.posterUrl || null"
            controls
            playsinline
            preload="metadata"
            class="fv-video block"
            @loadedmetadata="onReady"
            @error="onError"
          />
        </div>

        <!-- Loading: nothing for 200ms, then a skeleton in the stage -->
        <div v-if="status === 'loading' && showSkeleton && kind !== 'other'" class="pointer-events-none absolute inset-0 flex items-center justify-center p-space-48" aria-hidden="true">
          <Skeleton shape="block" class="fv-skeleton" />
        </div>
        <span class="sr-only" role="status">{{ status === 'loading' && showSkeleton ? `Loading ${file.name}` : '' }}</span>

        <!-- No preview / failed -->
        <div v-if="kind === 'other' || status === 'error'" class="absolute inset-0 flex items-center justify-center p-space-24">
          <div class="flex flex-col items-center gap-space-12 text-center font-label">
            <FileIcon :size="40" :stroke-width="1.25" class="text-icon-on-surface-light" aria-hidden="true" />
            <p class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-on-surface-default-inverse">
              {{ status === 'error' ? "Couldn't open this file." : `No preview for ${extLabel} files.` }}
            </p>
            <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-on-surface-default-inverse">
              {{ status === 'error' ? 'Check your connection and try again, or download it.' : 'Download it to open it in the app you use for these.' }}
            </p>
            <div class="flex flex-wrap justify-center gap-space-8">
              <Button v-if="status === 'error'" label="Retry" color-scheme="secondary" variant="solid" size="medium" native-type="button" @onClick="retry" />
              <Button label="Download" color-scheme="primary" variant="solid" size="medium" native-type="button" @onClick="$emit('download', file)" />
            </div>
          </div>
        </div>

        <!-- Previous / Next -->
        <template v-if="files.length > 1">
          <Button class="fv-nav fv-nav--prev" color-scheme="secondary" variant="solid" size="large" native-type="button" tooltip="Previous file" aria-label="Previous file" :is-disabled="index === 0" @onClick="step(-1)">
            <template #leftIcon><ChevronLeft aria-hidden="true" /></template>
          </Button>
          <Button class="fv-nav fv-nav--next" color-scheme="secondary" variant="solid" size="large" native-type="button" tooltip="Next file" aria-label="Next file" :is-disabled="index === files.length - 1" @onClick="step(1)">
            <template #leftIcon><ChevronRight aria-hidden="true" /></template>
          </Button>
        </template>
      </div>
    </div>
  </transition>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import HeaderToolIcon from '@/componentsV2/HeaderToolIcon/HeaderToolIcon.vue';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, File as FileIcon } from '@development/linarc-icons';
import Skeleton from '~/candidates/Skeleton/Skeleton.vue';

let seq = 0;
const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const FOCUSABLE = 'a[href], button:not([disabled]), iframe, video, [tabindex]:not([tabindex="-1"])';
const EXT_KIND = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'],
  pdf: ['pdf'],
  video: ['mp4', 'webm', 'mov', 'm4v', 'ogv'],
};

/** What the viewer can show for a file: image | pdf | video | other. `kind` wins; else the extension. */
export function fileKind(file) {
  if (!file) return 'other';
  if (file.kind) return file.kind;
  const m = /\.([a-z0-9]+)$/i.exec(file.name || '');
  const ext = m ? m[1].toLowerCase() : '';
  return Object.keys(EXT_KIND).find((k) => EXT_KIND[k].includes(ext)) || 'other';
}

export default {
  name: 'FileViewer',
  components: { Button, HeaderToolIcon, Skeleton, X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileIcon },
  props: {
    open: { type: Boolean, default: false },
    /**
     * The set to step through, in order: [{ id, name, url, kind?, posterUrl?, meta? }]. `kind` (image | pdf | video |
     * other) defaults from the extension; `meta` is the page's line under the name ("3.4 MB · by secure link").
     * A file without `url` shows "No preview" with Download.
     */
    files: { type: Array, default: () => [] },
    /** The file shown (use with `.sync`). */
    index: { type: Number, default: 0 },
  },
  data() {
    seq += 1;
    return { ZOOMS, titleId: `fv-title-${seq}`, status: 'loading', showSkeleton: false, attempt: 0, fitted: true, zoomIndex: ZOOMS.indexOf(1), natural: null, opener: null, prevOverflow: '' };
  },
  computed: {
    file() {
      return this.files[this.index] || null;
    },
    kind() {
      return this.file && this.file.url ? fileKind(this.file) : 'other';
    },
    extLabel() {
      const m = /\.([a-z0-9]+)$/i.exec((this.file && this.file.name) || '');
      return m ? `.${m[1].toLowerCase()}` : 'these';
    },
    metaLine() {
      const parts = [];
      if (this.files.length > 1) parts.push(`${this.index + 1} of ${this.files.length}`);
      if (this.file && this.file.meta) parts.push(this.file.meta);
      return parts.join(' · ');
    },
    zoomLabel() {
      return this.fitted ? 'Fit' : `${Math.round(ZOOMS[this.zoomIndex] * 100)}%`;
    },
    imageStyle() {
      if (this.fitted || !this.natural) return null;
      const z = ZOOMS[this.zoomIndex];
      return { width: `${Math.round(this.natural.w * z)}px`, height: `${Math.round(this.natural.h * z)}px`, maxWidth: 'none', margin: '0 auto' };
    },
  },
  watch: {
    open: {
      immediate: true,
      handler(open) {
        if (open) this.onOpen();
        else this.onClose();
      },
    },
    file(f, old) {
      if (f && (!old || f.id !== old.id)) this.startLoad();
    },
  },
  beforeDestroy() {
    clearTimeout(this.skeletonTimer);
    this.onClose();
  },
  methods: {
    close() {
      this.$emit('close');
    },
    step(delta) {
      const next = this.index + delta;
      if (next < 0 || next >= this.files.length) return;
      this.$emit('update:index', next);
    },
    startLoad() {
      clearTimeout(this.skeletonTimer);
      this.fitted = true;
      this.zoomIndex = ZOOMS.indexOf(1);
      this.natural = null;
      this.showSkeleton = false;
      this.status = this.kind === 'other' ? 'ready' : 'loading';
      if (this.status === 'loading') this.skeletonTimer = setTimeout(() => (this.showSkeleton = true), 200);
      if (this.kind === 'pdf') this.checkPdf(this.file);
      if (this.file) this.$emit('view', this.file);
    },
    onReady() {
      clearTimeout(this.skeletonTimer);
      if (this.status === 'error') return; // a PDF's iframe still fires load after its check failed
      this.status = 'ready';
    },
    onImageLoad(e) {
      this.natural = { w: e.target.naturalWidth, h: e.target.naturalHeight };
      this.onReady();
    },
    /** An iframe reports "loaded" even for a 404, so a PDF is checked first; a failure shows the error state. */
    checkPdf(file) {
      fetch(file.url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
        })
        .catch(() => {
          if (this.file === file) this.onError();
        });
    },
    onError() {
      clearTimeout(this.skeletonTimer);
      this.status = 'error';
    },
    retry() {
      this.attempt += 1;
      this.startLoad();
    },
    fit() {
      this.fitted = true;
    },
    zoomTo(i) {
      this.zoomIndex = Math.max(0, Math.min(ZOOMS.length - 1, i));
      this.fitted = false;
    },
    /** From Fit, zooming starts at the fitted scale's nearest step, so the first click never jumps. */
    zoomBy(delta) {
      if (this.fitted) {
        const img = this.$el && this.$el.querySelector('.fv-image');
        const scale = img && this.natural ? img.clientWidth / this.natural.w : 1;
        const nearest = ZOOMS.reduce((best, z, i) => (Math.abs(z - scale) < Math.abs(ZOOMS[best] - scale) ? i : best), 0);
        this.zoomTo(nearest + delta);
      } else this.zoomTo(this.zoomIndex + delta);
    },
    onKeydown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      } else if (e.key === 'Tab') this.trapTab(e);
      else if (e.target.tagName === 'VIDEO') return; // the player's own arrows seek
      else if (e.key === 'ArrowLeft') this.step(-1);
      else if (e.key === 'ArrowRight') this.step(1);
      else if (this.kind === 'image' && (e.key === '+' || e.key === '=')) this.zoomBy(1);
      else if (this.kind === 'image' && e.key === '-') this.zoomBy(-1);
      else if (this.kind === 'image' && e.key === '0') this.fit();
    },
    onOpen() {
      this.opener = document.activeElement;
      this.prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.startLoad();
      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.focus();
      });
    },
    onClose() {
      clearTimeout(this.skeletonTimer);
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = this.prevOverflow;
      if (this.opener && typeof this.opener.focus === 'function' && document.contains(this.opener)) this.opener.focus();
      this.opener = null;
    },
    /** Keep Tab inside the viewer while it is open. */
    trapTab(e) {
      const root = this.$refs.root;
      if (!root) return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === this.$refs.title)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
  },
};
</script>

<style scoped>
/* Full viewport over everything, including the SlideOverPanel (z 40). */
.fv-root {
  position: fixed;
  inset: 0;
  z-index: 70;
}
.fv-image--fit {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.fv-image {
  transition: opacity 120ms ease;
}
.fv-video {
  max-width: 100%;
  max-height: 100%;
}
/* The skeleton stands in for the file at a typical sheet proportion. */
.fv-skeleton {
  width: min(100%, 960px);
  aspect-ratio: 4 / 3;
  max-height: 100%;
}
.fv-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
.fv-nav--prev {
  left: var(--space-16);
}
.fv-nav--next {
  right: var(--space-16);
}
.fv-enter-active,
.fv-leave-active {
  transition: opacity 160ms ease;
}
.fv-enter,
.fv-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fv-enter-active,
  .fv-leave-active,
  .fv-image {
    transition: none;
  }
}
</style>

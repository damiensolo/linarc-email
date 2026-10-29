<template>
  <!-- CANDIDATE 2026-10-16: proposed design-system component, see docs/components/SlideOverPanel.md (D-34).
       A right-anchored overlay panel for contextual create and on-demand detail over a canvas or thread: backdrop,
       fixed header (title, optional context chip, close), one scrolling body with its padding inside the scroller
       (F-051), fixed footer with a top hairline (it wraps when it holds a tool row). Sizes sm 420 / md 560 / lg 720, full width
       below 640px; `expandable` adds a full-screen toggle next to Close. Focus moves
       to the title on open and back to the opener on close; Esc and the backdrop close; the page behind doesn't scroll.
       Motion 160ms translate + opacity, none under prefers-reduced-motion. Starts under any band the host reserves
       with --sandbox-offset (0 by default). -->
  <!-- `appear`: a panel mounted already open (the Notifications drawer across a screen remount) still animates in and
       emits `opened`, so whatever loads on open loads (F-030). -->
  <transition name="sop" appear @after-enter="$emit('opened')" @after-leave="$emit('closed')">
    <div v-if="open" class="sop-root" @keydown.esc="onEsc" @keydown.tab="trapTab">
      <div class="sop-backdrop bg-surface-overlay" aria-hidden="true" @click="closeOnBackdrop && close()" />
      <section
        ref="panel"
        class="sop-panel flex h-full flex-col bg-surface-container"
        :class="[`sop-panel--${size}`, expanded ? 'sop-panel--full' : '']"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="flex h-space-64 shrink-0 items-center gap-space-12 border-b border-border-subtle px-space-20">
          <h2 :id="titleId" ref="title" tabindex="-1" class="m-0 min-w-0 flex-1 truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default outline-none">
            {{ title }}
          </h2>
          <Chip v-if="badge" :label="badge" size="small" fill-style="solid" type="default" :removable="false" class="shrink-0" />
          <!-- Full screen (2026-10-28): the panel takes the whole viewport, for a long message or a wide toolbar -->
          <HeaderToolIcon v-if="expandable" type="tool" :aria-label="expanded ? 'Exit full screen' : 'Full screen'" :aria-pressed="String(expanded)" :selected="expanded" class="shrink-0" @click="toggleExpanded">
            <Minimize2 v-if="expanded" :size="20" :stroke-width="1.75" />
            <Maximize2 v-else :size="20" :stroke-width="1.75" />
          </HeaderToolIcon>
          <HeaderToolIcon type="tool" aria-label="Close" class="shrink-0" @click="close">
            <X :size="20" :stroke-width="1.75" />
          </HeaderToolIcon>
        </header>
        <div v-if="$slots['header-meta']" class="shrink-0 border-b border-border-subtle px-space-20 py-space-12">
          <slot name="header-meta" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-space-20">
          <slot />
        </div>
        <!-- min-height, not height: a footer that holds a tool row wraps on a phone -->
        <footer v-if="$slots.footer" class="flex min-h-space-64 shrink-0 flex-wrap items-center justify-between gap-space-12 border-t border-border-subtle px-space-20 py-space-8">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </transition>
</template>

<script>
import Chip from '@/components/Chip/Chip.vue';
import HeaderToolIcon from '@/componentsV2/HeaderToolIcon/HeaderToolIcon.vue';
import { X, Maximize2, Minimize2 } from '@development/linarc-icons';

let seq = 0;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default {
  name: 'SlideOverPanel',
  components: { Chip, HeaderToolIcon, X, Maximize2, Minimize2 },
  props: {
    /** Open state (use with `.sync` or `@close`). */
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    /** Optional context chip next to the title (e.g. "A-302 · Rev 3"). */
    badge: { type: String, default: '' },
    /** sm 420px · md 560px · lg 720px; full width below 640px. */
    size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
    closeOnBackdrop: { type: Boolean, default: true },
    /** Offer a full-screen toggle next to Close (the panel takes the whole viewport; emits `expand`). */
    expandable: { type: Boolean, default: false },
  },
  data() {
    seq += 1;
    return { titleId: `sop-title-${seq}`, opener: null, prevOverflow: '', expanded: false };
  },
  watch: {
    open: {
      immediate: true,
      handler(open) {
        if (open) this.onOpen();
        else this.onClose();
      },
    },
  },
  beforeDestroy() {
    this.onClose();
  },
  methods: {
    close() {
      this.$emit('close');
    },
    toggleExpanded() {
      this.expanded = !this.expanded;
      this.$emit('expand', this.expanded);
    },
    /** Esc closes the panel, unless a dropdown inside it is open: that Esc belongs to the dropdown (a select, a menu). */
    onEsc(e) {
      const panel = this.$refs.panel;
      if (e.defaultPrevented || (panel && panel.querySelector('[aria-expanded="true"]'))) return;
      e.stopPropagation();
      e.preventDefault();
      this.close();
    },
    onOpen() {
      this.opener = document.activeElement;
      this.prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.focus();
      });
    },
    onClose() {
      this.expanded = false;
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = this.prevOverflow;
      if (this.opener && typeof this.opener.focus === 'function' && document.contains(this.opener)) this.opener.focus();
      this.opener = null;
    },
    /** Keep Tab inside the panel while it is open. */
    trapTab(e) {
      const panel = this.$refs.panel;
      if (!panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
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
/* Widths are the sizes decided in D-34; no width token exists for panels (needs-token, see the proposal).
   Layer 40: above the page (AppLayout's header is z-10) and below the dialogs a field inside the panel opens, such as
   the rich text editor's emoji, link and table pickers (legacy Modal, z-50, mounted on <body>); at 60 they opened
   behind the panel (F-017). ModalV2 (9999), dropdowns and tooltips (2000+) and the FileViewer (70) stay above. */
/* The host may reserve a band at the top (the prototype sandbox bar sets --sandbox-offset to its height, so the
   panel and its backdrop start under the bar and the bar's controls stay usable); unset, the panel is full height. */
.sop-root {
  position: fixed;
  top: var(--sandbox-offset, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
}
.sop-backdrop {
  position: absolute;
  inset: 0;
}
.sop-panel {
  position: relative;
  width: 560px;
  max-width: 100vw;
}
.sop-panel--sm {
  width: 420px;
}
.sop-panel--lg {
  width: 720px;
}
.sop-panel--full,
.sop-panel--full.sop-panel--sm,
.sop-panel--full.sop-panel--lg {
  width: 100vw;
}
@media (max-width: 639px) {
  .sop-panel,
  .sop-panel--sm,
  .sop-panel--lg {
    width: 100vw;
  }
}
.sop-enter-active .sop-panel,
.sop-leave-active .sop-panel {
  transition: transform 160ms ease, opacity 160ms ease;
}
.sop-enter-active .sop-backdrop,
.sop-leave-active .sop-backdrop {
  transition: opacity 160ms ease;
}
.sop-enter .sop-panel,
.sop-leave-to .sop-panel {
  transform: translateX(16px);
  opacity: 0;
}
.sop-enter .sop-backdrop,
.sop-leave-to .sop-backdrop {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .sop-enter-active .sop-panel,
  .sop-leave-active .sop-panel,
  .sop-enter-active .sop-backdrop,
  .sop-leave-active .sop-backdrop {
    transition: none;
  }
}
</style>

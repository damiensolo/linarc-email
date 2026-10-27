<template>
  <div class="flex flex-col h-screen bg-surface-page">
    <!-- Sandbox chrome: prototype, record and role pickers, simulated mail, reset; theme, loading speed and the Figma
         link in the overflow menu at the far right (~/modules/SandboxMenu.vue). Not part of any prototype. Shown and
         hidden with the settings gear in each screen's top nav (~/modules/sandbox.js); ?chrome=0 starts hidden. -->
    <header
      v-if="showChrome"
      class="flex flex-wrap items-center justify-between gap-space-8 px-space-16 sm:px-space-24 py-space-12 border-b border-border-default bg-surface-container"
    >
      <div class="flex flex-1 basis-full sm:basis-0 flex-wrap items-center gap-space-12 min-w-0">
        <!-- As wide as its longest name (measured in mounted(); capped at the bar's width on a phone). -->
        <SelectV2
          ref="picker"
          v-model="currentSlug"
          class="max-w-full shrink-0"
          :style="pickerWidth ? { width: `${pickerWidth}px` } : null"
          size="small"
          placeholder="Choose a prototype"
          :options="prototypeOptions"
          :visible-item-count="10"
        />
        <!-- Record picker: screens that take a record id in the hash (prototype.records). Sandbox only (D-27). -->
        <SelectV2
          v-if="recordOptions.length"
          v-model="currentRecord"
          class="w-full sm:w-1/3 lg:w-1/4"
          size="small"
          placeholder="Choose a record"
          :options="recordOptions"
          :visible-item-count="10"
        />
        <!-- Role switcher: screens that gate content by role declare `prototype.roles` (spec-to-prototype §3). Sandbox
             only; the choice lives in the demo session and remounts the screen. -->
        <SelectV2
          v-if="roleOptions.length"
          v-model="currentRole"
          class="w-full sm:w-1/4 lg:w-1/5"
          title="Who is looking at the screen"
          size="small"
          placeholder="Viewing as"
          :options="roleOptions"
          :allow-search="false"
        />
      </div>

      <div class="flex flex-wrap items-center gap-space-8">
        <!-- Last simulated mail, with a link to its thread. -->
        <span v-if="received" class="flex items-center gap-space-8 font-label text-fontsize-12 leading-lineheight-16 text-text-subtle">
          {{ received.message }}
          <a v-if="received.openLabel" href="#" class="text-text-primary" @click.prevent="openReceived">{{ received.openLabel }}</a>
        </span>
        <!-- Mail from outside the product (prototype.inbound), which the static prototype can't receive for real. -->
        <Button v-if="inbound" label="Simulate inbound email" color-scheme="secondary" variant="outline" size="small" @onClick="inboundOpen = true" />
        <!-- What the platform would do on its own (prototype.events): a Critical arriving, a reminder, a cover. -->
        <Button v-if="events" label="Simulate event" color-scheme="secondary" variant="outline" size="small" @onClick="eventOpen = true" />
        <!-- The demo session (src/modules/session.js): back to the starting data. Shown once something changed. -->
        <Button v-if="demoChanged" label="Reset demo data" color-scheme="secondary" variant="outline" size="small" @onClick="resetDemo" />
        <!-- Theme, simulated loading speed (remounts the screen) and the Figma frame. -->
        <SandboxMenu
          :is-dark="isDark"
          :latency="latency"
          :latency-options="latencyOptions"
          :figma="current ? current.figma : ''"
          @theme="setTheme"
          @latency="latency = $event"
        />
      </div>
    </header>

    <main ref="main" class="flex-1 min-h-0 overflow-auto">
      <!-- Keyed by slug + record id: a link to another record of the same screen remounts it with that record. -->
      <component :is="current.component" v-if="current" :key="`${currentSlug}${routeHash}|${latency}|${roleKey}|${mailCount}`" />
    </main>

    <SimulateInboundModal v-if="inbound" :open="inboundOpen" :config="inbound" @close="inboundOpen = false" @received="onReceived" />
    <SimulateEventModal v-if="events" :open="eventOpen" :config="events" @close="eventOpen = false" @fired="onFired" />
  </div>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import prototypes from '~/prototypes';
import { NAVIGATE_EVENT, go } from '~/modules/app/router';
import { LATENCY_OPTIONS, latencyScenario } from '~/modules/mock/request';
import { hasChanges, resetSession } from '~/modules/session';
import { sandbox } from '~/modules/sandbox';
import SimulateInboundModal from '~/modules/SimulateInboundModal.vue';
import SimulateEventModal from '~/modules/SimulateEventModal.vue';
import SandboxMenu from '~/modules/SandboxMenu.vue';

const THEME_KEY = 'linarc-prototypes:theme';

function readQuerySlug() {
  return new URLSearchParams(window.location.search).get('p');
}

export default {
  name: 'App',
  components: { Button, SelectV2, SimulateInboundModal, SimulateEventModal, SandboxMenu },
  data() {
    const slug = readQuerySlug();
    const fallback = (prototypes[0] || {}).slug;
    return {
      prototypes,
      currentSlug: prototypes.some((p) => p.slug === slug) ? slug : fallback,
      isDark: false,
      routeHash: window.location.hash,
      latency: latencyScenario(),
      latencyOptions: LATENCY_OPTIONS,
      pickerWidth: 0,
      roleKey: '',
      inboundOpen: false,
      eventOpen: false,
      received: null, // { message, openLabel, open } of the last simulated mail
      mailCount: 0, // bumped on each simulated mail: the screen remounts and loads the new data
    };
  },
  computed: {
    showChrome() {
      return sandbox.controls;
    },
    prototypeOptions() {
      // Hidden prototypes (slug starting with `_`, or `prototype.hidden`) stay reachable by URL (?p=<slug>).
      return this.prototypes.filter((p) => !p.hidden).map((p) => ({ label: p.title, value: p.slug }));
    },
    current() {
      return this.prototypes.find((p) => p.slug === this.currentSlug);
    },
    demoChanged() {
      return hasChanges();
    },
    recordOptions() {
      return this.current && this.current.records ? this.current.records() : [];
    },
    /** `prototype.roles`: () => ({ options: [{ value, label }], value, set(id) }). */
    roles() {
      return this.current && this.current.roles ? this.current.roles() : null;
    },
    /** `prototype.inbound`: the screen accepts simulated mail from outside (Simulate inbound email). */
    inbound() {
      return this.current && this.current.inbound ? this.current.inbound() : null;
    },
    /** `prototype.events`: the screen accepts simulated platform events (Simulate event). */
    events() {
      return this.current && this.current.events ? this.current.events() : null;
    },
    roleOptions() {
      return this.roles ? this.roles.options : [];
    },
    currentRole: {
      get() {
        return this.roles ? this.roles.value : null;
      },
      set(id) {
        if (!this.roles || !id || id === this.roles.value) return;
        this.roles.set(id);
        this.roleKey = id;
      },
    },
    /** The record id in the hash (`#rec-006` or `#rec-006/section`); setting it opens that record (remounts). */
    currentRecord: {
      get() {
        const id = decodeURIComponent(this.routeHash.slice(1)).split('/')[0];
        return this.recordOptions.some((o) => o.value === id) ? id : null;
      },
      set(id) {
        if (!id || id === this.currentRecord) return;
        const url = new URL(window.location.href);
        url.hash = id;
        window.history.pushState(null, '', url);
        this.routeHash = url.hash;
      },
    },
  },
  watch: {
    latency(value) {
      const url = new URL(window.location.href);
      if (value === 'instant') url.searchParams.delete('latency');
      else url.searchParams.set('latency', value);
      window.history.replaceState(null, '', url);
    },
    currentSlug(slug) {
      const url = new URL(window.location.href);
      url.searchParams.set('p', slug);
      // A record id belongs to the screen it was opened on; picking another screen starts without one.
      if (this.received && !this.current.inbound) this.received = null;
      if (slug !== readQuerySlug()) {
        url.hash = '';
        this.routeHash = '';
      }
      window.history.replaceState(null, '', url);
    },
  },
  mounted() {
    this.sizePicker();
  },
  created() {
    // ?theme=dark|light wins (shareable links, headless screenshots); else last choice.
    const queryTheme = new URLSearchParams(window.location.search).get('theme');
    try {
      this.isDark = (queryTheme || window.localStorage.getItem(THEME_KEY)) === 'dark';
    } catch (e) {
      this.isDark = queryTheme === 'dark';
    }
    this.applyTheme();
    // In-document navigation (D-24): screens call router.go(), which pushes the URL and fires NAVIGATE_EVENT; Back and
    // Forward fire popstate. Either way only the prototype swaps; the page never reloads, so the shell never blanks.
    window.addEventListener(NAVIGATE_EVENT, this.syncFromUrl);
    window.addEventListener('popstate', this.syncFromUrl);
  },
  beforeDestroy() {
    window.removeEventListener(NAVIGATE_EVENT, this.syncFromUrl);
    window.removeEventListener('popstate', this.syncFromUrl);
  },
  methods: {
    syncFromUrl() {
      const slug = readQuerySlug();
      if (this.prototypes.some((p) => p.slug === slug)) this.currentSlug = slug;
      this.routeHash = window.location.hash;
      if (this.$refs.main) this.$refs.main.scrollTop = 0;
    },
    /** Picker width = the longest option label in the trigger's own font + the trigger's padding and chevron. */
    sizePicker() {
      // After the web font loads, or the fallback font's widths would be measured.
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      ready.then(() => {
        const root = this.$refs.picker && this.$refs.picker.$el;
        const input = root && root.querySelector('input');
        if (!input || !this.prototypeOptions.length) return;
        const css = getComputedStyle(input);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        const text = Math.max(...this.prototypeOptions.map((o) => ctx.measureText(o.label).width));
        const chrome = root.offsetWidth - input.clientWidth + parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
        this.pickerWidth = Math.ceil(text + chrome + 4);
      });
    },
    onReceived(result) {
      this.inboundOpen = false;
      this.received = result || null;
      this.mailCount += 1;
    },
    /** A simulated event: same bar line as a received mail, with a link to the record when there is one. */
    onFired(result) {
      this.eventOpen = false;
      this.received = result
        ? { message: result.message, openLabel: result.action ? 'Open' : '', open: result.action ? () => go(result.action.screen, result.action.id) : null }
        : null;
      // No remount: the bell, the banner and the drawer derive from the session, and a draft on screen must survive
      // a Critical arriving (docs/notifications/spec.md §7). The screen's own data refreshes on its next navigation.
    },
    openReceived() {
      const { open } = this.received || {};
      this.received = null;
      if (open) open();
    },
    resetDemo() {
      resetSession();
    },
    setTheme(dark) {
      this.isDark = dark;
      // A ?theme= in the URL wins on load, so keep it in step or a reload would undo the choice.
      const url = new URL(window.location.href);
      if (url.searchParams.has('theme')) {
        url.searchParams.set('theme', dark ? 'dark' : 'light');
        window.history.replaceState(null, '', url);
      }
      this.applyTheme();
      try {
        window.localStorage.setItem(THEME_KEY, this.isDark ? 'dark' : 'light');
      } catch (e) {
        // storage unavailable; theme just won't persist
      }
    },
    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDark);
    },
  },
};
</script>

<template>
  <!-- Notifications › Preferences (docs/notifications/screens.md §2, spec §9, §11): a settings form in the shell with no
       rail (D-52), the comfortable title bar with a back button (D-25), a centred column (D-19, D-20) and the fixed
       bottom panel with Save. Sections, separated by white space and hairlines (D-17): the persona preset (delivery
       defaults only), the event family × channel × cadence matrix with the rows company policy locks, quiet hours with
       the mandatory exceptions, delegation (cover) with its preview, and the product's wider catalog as a disclosure.
       Saving is a write through createLoad (LoadStatus: Saving… / Saved). A guest sees preferences without cover. -->
  <AppShell screen="notificationsPrefs" title="Notification preferences" header-size="comfortable" bottom-panel>
    <template #header>
      <span class="flex min-w-0 items-center gap-space-8">
        <HeaderToolIcon type="back" aria-label="Back to Notifications" @click="back" />
        <span class="truncate font-label text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Notification preferences</span>
      </span>
    </template>

    <template #content>
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-space-40 pb-space-24 pt-space-16 font-label">
        <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
          Delivery only: a preset or a cell here changes how and when you are told, never what you own. Company policy comes first, then the project, then your choices.
        </p>

        <!-- 1. Preset -->
        <section class="flex flex-col gap-space-12" aria-labelledby="pref-preset">
          <h2 id="pref-preset" class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Preset</h2>
          <div class="flex flex-wrap gap-x-space-24 gap-y-space-8">
            <Radio v-for="(p, id) in presets" :key="id" v-model="prefs.preset" :value="id" :label="p.label" name="preset" @change="applyPreset(id)" />
          </div>
          <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">A preset sets the matrix below. It grants no access and changes no ownership.</p>
        </section>

        <!-- 2. Matrix -->
        <section class="flex flex-col gap-space-12" aria-labelledby="pref-matrix">
          <h2 id="pref-matrix" class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-default">What reaches you, and how</h2>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-fontsize-14 leading-lineheight-20">
              <thead>
                <tr class="border-b border-border-subtle text-left text-fontsize-12 leading-lineheight-16 text-text-subtle">
                  <th scope="col" class="py-space-8 pr-space-16 font-medium">Event family</th>
                  <th v-for="ch in channels" :key="ch.id" scope="col" class="py-space-8 pr-space-16 font-medium">{{ ch.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in families" :key="f.id" class="border-b border-border-subtle">
                  <th scope="row" class="py-space-8 pr-space-16 text-left font-normal text-text-default">
                    {{ f.label }}
                    <span v-if="!f.demo" class="block text-fontsize-12 leading-lineheight-16 text-text-subtle">No events in this demo</span>
                  </th>
                  <td v-for="ch in channels" :key="ch.id" class="py-space-8 pr-space-16 align-top">
                    <template v-if="lockOf(f.id, ch.id)">
                      <span class="block text-text-default">{{ cadenceLabel(lockOf(f.id, ch.id).cadence) }}</span>
                      <span class="block text-fontsize-12 leading-lineheight-16 text-text-subtle" :title="lockOf(f.id, ch.id).reason">Set by {{ company }} policy</span>
                    </template>
                    <SelectV2 v-else :value="prefs.matrix[f.id][ch.id]" size="small" :options="cadences" :allow-search="false" :aria-label="`${f.label}, ${ch.label}`" @input="setCell(f.id, ch.id, $event)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">Locked cells are a mandatory delivery policy for that event family and channel, not a general rule that every Critical bypasses every setting.</p>
        </section>

        <!-- 3. Quiet hours -->
        <section class="flex flex-col gap-space-12" aria-labelledby="pref-quiet">
          <h2 id="pref-quiet" class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Quiet hours</h2>
          <div class="flex flex-wrap gap-x-space-16 gap-y-space-8" role="group" aria-label="Quiet days">
            <Checkbox v-for="d in days" :key="d.id" :value="prefs.quiet.days.includes(d.id)" :label="d.label" size="small" @input="setDay(d.id, $event)" />
          </div>
          <div class="flex flex-wrap items-end gap-space-16">
            <InputV2 v-model="prefs.quiet.from" label="From" type="time" class="w-space-124" />
            <InputV2 v-model="prefs.quiet.to" label="To" type="time" class="w-space-124" />
            <SelectV2 v-model="prefs.quiet.tz" label="Time zone" size="small" :options="timezones" :allow-search="false" />
          </div>
          <p class="m-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">Optional deliveries pause. Delivery failures and any Critical you own still reach your mailbox ({{ company }} policy).</p>
        </section>

        <!-- 4. Delegation (cover), internal roles only -->
        <section v-if="role.internal" class="flex flex-col gap-space-12" aria-labelledby="pref-cover">
          <h2 id="pref-cover" class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Out of office: cover</h2>
          <template v-if="cover">
            <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-default">
              {{ coverLine }}
            </p>
            <div><Button label="End cover" color-scheme="secondary" variant="outline" size="small" @onClick="stopCover" /></div>
          </template>
          <template v-else>
            <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">Someone takes your open items while you are away. Temporary: it never transfers formal ownership, and what they can't see stays with you and the project fallback.</p>
            <div class="flex flex-wrap items-end gap-space-16">
              <SelectV2 v-model="delegate" label="Delegate" size="small" :options="delegates" :allow-search="false" placeholder="Choose a team member" />
              <InputV2 v-model="coverFrom" label="From" type="date" class="w-space-124" />
              <InputV2 v-model="coverTo" label="To" type="date" class="w-space-124" />
            </div>
            <div v-if="preview" class="flex flex-col gap-space-8 border-t border-border-subtle pt-space-12" aria-live="polite">
              <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-default">
                {{ delegateName }} will cover {{ preview.covered.length }} {{ preview.covered.length === 1 ? 'item' : 'items' }} from {{ day(coverFrom) }} to {{ day(coverTo) }}.
                <template v-if="preview.excluded.length"> Not covered: {{ preview.excluded.length }} ({{ preview.excluded[0].excludedReason }}).</template>
              </p>
              <ul class="m-0 flex list-none flex-col gap-space-4 p-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">
                <li v-for="it in preview.covered" :key="it.key">Covered · {{ it.title }}</li>
                <li v-for="it in preview.excluded" :key="it.key" class="text-text-default">Stays with you · {{ it.title }} ({{ it.excludedReason }})</li>
              </ul>
            </div>
            <div><Button label="Start cover" color-scheme="secondary" variant="outline" size="small" :is-disabled="!preview" @onClick="beginCover" /></div>
          </template>
        </section>

        <!-- 5. Advanced: the product's wider catalog, read-only here -->
        <section class="flex flex-col gap-space-12" aria-labelledby="pref-advanced">
          <h2 id="pref-advanced" class="m-0 text-fontsize-16 font-bold leading-lineheight-24 text-text-default">Advanced</h2>
          <div><Button :label="advancedOpen ? 'Hide per-event rules' : 'Per-event rules'" color-scheme="secondary" variant="text" size="small" :aria-expanded="advancedOpen ? 'true' : 'false'" @onClick="advancedOpen = !advancedOpen" /></div>
          <ul v-if="advancedOpen" class="m-0 flex list-none flex-col gap-space-4 p-0 text-fontsize-12 leading-lineheight-16 text-text-subtle">
            <li v-for="c in catalog" :key="c.event"><span class="text-text-default">{{ c.event }}</span> · {{ c.severity }} · {{ familyLabel(c.family) }} · not in this prototype</li>
          </ul>
        </section>
      </div>
    </template>

    <template #bottom-panel>
      <div class="mx-auto flex h-full w-full max-w-4xl items-center justify-between gap-space-12 px-space-16">
        <LoadStatus :load="saving" @retry="save">
          <span v-if="saving.status === 'ready'" class="font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">Saved</span>
        </LoadStatus>
        <div class="flex items-center gap-space-8">
          <Button label="Cancel" color-scheme="secondary" variant="outline" size="medium" @onClick="back" />
          <Button label="Save" color-scheme="primary" variant="solid" size="medium" :is-disabled="saving.status === 'loading'" @onClick="save" />
        </div>
      </div>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import Radio from '@/components/Radio/Radio.vue';
import Checkbox from '@/components/Checkbox/Checkbox.vue';
import InputV2 from '@/componentsV2/InputV2/InputV2.vue';
import SelectV2 from '@/componentsV2/SelectV2/SelectV2.vue';
import HeaderToolIcon from '@/componentsV2/HeaderToolIcon/HeaderToolIcon.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { go, isBuilt } from '~/modules/app/router';
import { ROLES, PROJECT, currentRole, setRole, getPerson, relDate } from '~/modules/correspondence/data';
import {
  EVENT_FAMILIES, CHANNELS, CADENCES, LOCKED, PRESETS, PRODUCT_CATALOG, preferencesFor, savePreferences, presetMatrix,
  activeCover, coverPreview, startCover, endCover, eventsSandbox,
} from '~/modules/notifications/data';

const DAYS = [
  { id: 'mon', label: 'Mon' }, { id: 'tue', label: 'Tue' }, { id: 'wed', label: 'Wed' }, { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' }, { id: 'sat', label: 'Sat' }, { id: 'sun', label: 'Sun' },
];

export default {
  name: 'NotificationsPreferences',
  prototype: {
    title: 'Notifications › Preferences',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3760',
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    events: eventsSandbox,
  },
  components: { AppShell, Button, Radio, Checkbox, InputV2, SelectV2, HeaderToolIcon, LoadStatus },
  data() {
    const role = currentRole();
    const prefs = preferencesFor(role);
    return {
      role,
      company: PROJECT.gc,
      prefs: { preset: prefs.preset, matrix: JSON.parse(JSON.stringify(prefs.matrix)), quiet: { ...prefs.quiet, days: [...prefs.quiet.days] } },
      presets: PRESETS,
      families: EVENT_FAMILIES,
      channels: CHANNELS,
      cadences: CADENCES.map((c) => ({ value: c.id, label: c.label })),
      days: DAYS,
      timezones: [
        { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
        { value: 'America/Denver', label: 'Mountain (Denver)' },
        { value: 'America/Chicago', label: 'Central (Chicago)' },
        { value: 'America/New_York', label: 'Eastern (New York)' },
      ],
      catalog: PRODUCT_CATALOG,
      advancedOpen: false,
      delegate: null,
      coverFrom: relDate(0).slice(0, 10),
      coverTo: relDate(14).slice(0, 10),
      coverTick: 0,
      saving: createLoad({ label: 'preferences', action: { busy: 'Saving', done: 'Saved', error: "Couldn't save." } }),
    };
  },
  computed: {
    delegates() {
      return ROLES.filter((r) => r.internal && r.personId !== this.role.personId).map((r) => ({ value: r.personId, label: `${(getPerson(r.personId) || {}).name} · ${r.label}` }));
    },
    delegateName() {
      return (getPerson(this.delegate) || {}).name || 'Your delegate';
    },
    cover() {
      this.coverTick; // eslint-disable-line no-unused-expressions
      const c = activeCover();
      return c && c.forId === this.role.personId ? c : null;
    },
    coverLine() {
      const c = this.cover;
      return `${(getPerson(c.byId) || {}).name} is covering for you until ${this.day(c.to)}. New items reach you both; what ${(getPerson(c.byId) || {}).name} can't see stays with you.`;
    },
    preview() {
      if (!this.delegate || !this.coverFrom || !this.coverTo || this.coverTo < this.coverFrom) return null;
      return coverPreview(this.role.personId, this.delegate);
    },
  },
  beforeDestroy() {
    this.saving.destroy();
  },
  methods: {
    day: (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''),
    cadenceLabel(id) {
      return (CADENCES.find((c) => c.id === id) || {}).label || id;
    },
    familyLabel(id) {
      return (EVENT_FAMILIES.find((f) => f.id === id) || {}).label || id;
    },
    lockOf(family, channel) {
      return LOCKED.find((l) => l.family === family && l.channel === channel) || null;
    },
    applyPreset(id) {
      this.prefs.preset = id;
      this.prefs.matrix = presetMatrix(id, this.prefs.matrix);
    },
    setCell(family, channel, value) {
      this.prefs.matrix = { ...this.prefs.matrix, [family]: { ...this.prefs.matrix[family], [channel]: value } };
      this.prefs.preset = 'custom';
    },
    setDay(id, on) {
      const days = this.prefs.quiet.days.filter((d) => d !== id);
      this.prefs.quiet.days = on ? [...days, id] : days;
    },
    save() {
      this.saving.run((signal) => mockRequest(() => savePreferences(this.prefs), { signal }), () => {});
    },
    beginCover() {
      if (!this.preview) return;
      startCover({ forId: this.role.personId, byId: this.delegate, from: `${this.coverFrom}T00:00:00`, to: `${this.coverTo}T23:59:00` });
      this.coverTick += 1;
    },
    stopCover() {
      endCover();
      this.coverTick += 1;
    },
    back() {
      if (!go('notifications')) go('email');
    },
    builtList: () => isBuilt('notifications'),
  },
};
</script>

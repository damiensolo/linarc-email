<template>
  <!-- A stand-in drawing sheet (docs/correspondence/00-plan.md §2: the Drawings screen is not the Drawings product).
       An SVG plan with a column grid, a few rooms, a title block and the markup clouds, drawn with design-system
       colour variables so it reads in both themes. `crop` shows the region around one pin's box (the preview's
       thumbnail); otherwise the whole sheet. Coordinates are percent of the sheet (pins[].box). -->
  <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" class="block h-full w-full" role="img" :aria-label="`${drawing.code} ${drawing.revision}: ${drawing.title}`">
    <rect x="0" y="0" :width="W" :height="H" class="sheet-paper" />
    <!-- Column grid A–F and row grid 1–8 -->
    <g class="sheet-grid">
      <template v-for="(c, i) in COLS">
        <line :key="`c-${c}`" :x1="colX(i)" y1="40" :x2="colX(i)" :y2="H - 110" />
        <circle :key="`cc-${c}`" :cx="colX(i)" cy="26" r="12" />
        <text :key="`ct-${c}`" :x="colX(i)" y="30" text-anchor="middle">{{ c }}</text>
      </template>
      <template v-for="r in ROWS">
        <line :key="`r-${r}`" x1="40" :y1="rowY(r)" :x2="W - 40" :y2="rowY(r)" />
        <circle :key="`rc-${r}`" cx="24" :cy="rowY(r)" r="12" />
        <text :key="`rt-${r}`" x="24" :y="rowY(r) + 4" text-anchor="middle">{{ r }}</text>
      </template>
    </g>
    <!-- Rooms and the corridor -->
    <g class="sheet-walls">
      <rect v-for="room in ROOMS" :key="room.id" :x="room.x" :y="room.y" :width="room.w" :height="room.h" />
      <text v-for="room in ROOMS" :key="`${room.id}-t`" :x="room.x + 10" :y="room.y + 22" class="sheet-label">{{ room.label }}</text>
      <!-- ceiling grid hatch in the corridor -->
      <g class="sheet-hatch">
        <line v-for="n in 14" :key="`h-${n}`" :x1="300 + n * 40" y1="300" :x2="300 + n * 40" y2="400" />
        <line x1="300" y1="350" x2="900" y2="350" />
      </g>
    </g>
    <!-- Markup clouds (pins) -->
    <g v-for="p in pins" :key="p.id" class="sheet-markup" :class="{ 'sheet-markup--active': p.id === highlightPinId }">
      <rect :x="px(p.box.x)" :y="py(p.box.y)" :width="pw(p.box.w)" :height="ph(p.box.h)" rx="14" />
      <text :x="px(p.box.x) + 8" :y="py(p.box.y) - 8" class="sheet-markup-label">{{ p.grid }}</text>
    </g>
    <!-- Title block -->
    <g v-if="!crop" class="sheet-title">
      <rect :x="W - 320" :y="H - 100" width="300" height="80" />
      <text :x="W - 308" :y="H - 72" class="sheet-title-main">{{ drawing.code }} · {{ drawing.revision }}</text>
      <text :x="W - 308" :y="H - 50" class="sheet-label">{{ drawing.title }}</text>
      <text :x="W - 308" :y="H - 32" class="sheet-label">{{ drawing.discipline }} · {{ drawing.revisionStatus === 'superseded' ? `Superseded by ${drawing.supersededBy}` : 'Current issue' }}</text>
    </g>
  </svg>
</template>

<script>
const W = 1000;
const H = 700;
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8];
// PLACEHOLDER DATA — rooms of a hospital floor plate, in sheet units.
const ROOMS = [
  { id: 'or2a', x: 60, y: 60, w: 220, h: 220, label: 'OR 2A' },
  { id: 'or2b', x: 300, y: 60, w: 220, h: 220, label: 'OR 2B' },
  { id: 'subst', x: 540, y: 60, w: 180, h: 220, label: 'Sub-sterile' },
  { id: 'elec', x: 740, y: 60, w: 200, h: 100, label: 'Elec 3E' },
  { id: 'mech', x: 740, y: 180, w: 200, h: 100, label: 'Mech 3E' },
  { id: 'corr', x: 60, y: 300, w: 880, h: 100, label: 'Corridor 3E' },
  { id: 'pt1', x: 60, y: 420, w: 200, h: 160, label: 'Patient 301' },
  { id: 'pt2', x: 280, y: 420, w: 200, h: 160, label: 'Patient 302' },
  { id: 'pt3', x: 500, y: 420, w: 200, h: 160, label: 'Patient 303' },
  { id: 'nurse', x: 720, y: 420, w: 220, h: 160, label: 'Nurse station' },
];

export default {
  name: 'SheetSvg',
  props: {
    drawing: { type: Object, required: true },
    /** [{ id, grid, box: { x, y, w, h } }] in percent of the sheet */
    pins: { type: Array, default: () => [] },
    highlightPinId: { type: String, default: '' },
    /** A pin's box to crop to (the preview thumbnail), or null for the whole sheet */
    crop: { type: Object, default: null },
  },
  data() {
    return { W, H, COLS, ROWS, ROOMS };
  },
  computed: {
    viewBox() {
      if (!this.crop) return `0 0 ${W} ${H}`;
      // 3:2 window around the box with a margin, kept inside the sheet.
      const bx = this.px(this.crop.x);
      const by = this.py(this.crop.y);
      const bw = this.pw(this.crop.w);
      const bh = this.ph(this.crop.h);
      const w = Math.max(bw * 1.6, (bh * 1.6 * 3) / 2);
      const h = (w * 2) / 3;
      const x = Math.min(Math.max(bx + bw / 2 - w / 2, 0), W - w);
      const y = Math.min(Math.max(by + bh / 2 - h / 2, 0), H - h);
      return `${x} ${y} ${w} ${h}`;
    },
  },
  methods: {
    colX: (i) => 60 + i * 176,
    rowY: (r) => 60 + (r - 1) * 74,
    px: (v) => (v / 100) * W,
    py: (v) => (v / 100) * H,
    pw: (v) => (v / 100) * W,
    ph: (v) => (v / 100) * H,
  },
};
</script>

<style scoped>
/* Colours are design-system variables (both themes); the markup is the primary accent, not red (red = failed, D-17). */
.sheet-paper {
  fill: var(--surface-container);
}
.sheet-grid line {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 6 6;
}
.sheet-grid circle {
  fill: none;
  stroke: var(--border-default);
  stroke-width: 1.5;
}
.sheet-grid text,
.sheet-label {
  fill: var(--text-subtle);
  font-family: var(--font-family-label, inherit);
  font-size: 13px;
}
.sheet-walls rect {
  fill: var(--surface-subtle);
  stroke: var(--text-default);
  stroke-width: 2.5;
}
.sheet-hatch line {
  stroke: var(--border-default);
  stroke-width: 1;
}
.sheet-markup rect {
  fill: none;
  stroke: var(--border-primary-default);
  stroke-width: 3;
  stroke-dasharray: 10 6;
}
.sheet-markup--active rect {
  stroke-width: 4;
  stroke-dasharray: none;
}
.sheet-markup-label {
  fill: var(--text-primary);
  font-family: var(--font-family-label, inherit);
  font-size: 14px;
  font-weight: 700;
}
.sheet-title rect {
  fill: var(--surface-container);
  stroke: var(--text-default);
  stroke-width: 2;
}
.sheet-title-main {
  fill: var(--text-default);
  font-family: var(--font-family-label, inherit);
  font-size: 18px;
  font-weight: 700;
}
</style>

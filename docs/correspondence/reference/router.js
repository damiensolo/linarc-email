// In-document router and sandbox record picker registry (D-18, D-24, D-27, 5-ui-patterns.md §6)
// Rule: Moving between screens never reloads the page (no location.assign or full-page <a href>).
// Each screen keeps its own slug (?p=<slug>), and the active record ID travels in the hash (#<id>).

export const SCREENS = [
  {
    slug: 'correspondence-context-dwg',
    title: 'Drawings › Sheet Markup & Contextual Email',
    tool: 'drawings',
    rail: 'sheets',
    defaultRecordId: 'A-302-Rev3',
    // D-27: Sandbox record picker options
    records: [
      { id: 'A-302-Rev3', label: 'A-302 Rev 3 — Level 3 RCP (Grid B-4 Clash)' },
      { id: 'S-201-Rev1', label: 'S-201 Rev 1 — Level 3 Framing (Superseded)' },
    ],
  },
  {
    slug: 'correspondence-list',
    title: 'Inbox › Project Correspondence',
    tool: 'inbox',
    rail: 'all-mail',
    records: [],
  },
  {
    slug: 'correspondence-thread',
    title: 'Inbox › Thread Detail & Promote (Slide-Over Panel)',
    tool: 'inbox',
    rail: 'all-mail',
    defaultRecordId: 'THR-1042',
    records: [
      { id: 'THR-1042', label: 'THR-1042 — Grid B-4 HVAC & Acoustic Clash (Needs Action)' },
      { id: 'THR-1039', label: 'THR-1039 — Level 2 OR Lead Drywall (Promoted to RFI-142)' },
      { id: 'THR-1031', label: 'THR-1031 — SUB-088 Door Hardware (Overdue + Bounced)' },
    ],
  },
  {
    slug: 'correspondence-thread-modal',
    title: 'Inbox › Thread Detail (version B: Modal Promote)',
    tool: 'inbox',
    rail: 'all-mail',
    defaultRecordId: 'THR-1042',
    // D-18: Version B comparison slug sharing state and components with correspondence-thread
    records: [
      { id: 'THR-1042', label: 'THR-1042 — Grid B-4 HVAC & Acoustic Clash' },
    ],
  },
  {
    slug: 'correspondence-context-rfi',
    title: 'RFIs › RFI Detail (Embedded Correspondence Tab)',
    tool: 'rfis',
    rail: 'open-rfis',
    defaultRecordId: 'RFI-143',
    records: [
      { id: 'RFI-143', label: 'RFI-143 — Grid B-4 W24 Beam Web Penetration (From THR-1042)' },
      { id: 'RFI-142', label: 'RFI-142 — Level 2 OR Lead-Lined Drywall (From THR-1039)' },
    ],
  },
  {
    slug: 'correspondence-portal',
    title: 'External › Magic Link Collaborator View',
    tool: null,
    rail: null,
    isExternalPortal: true,
    defaultRecordId: 'tk-marcus-a302',
    records: [
      { id: 'tk-marcus-a302', label: 'Marcus Vance (Acoustix) — A-302 Rev 3 + 45MB Video' },
      { id: 'tk-dave-sub88', label: 'Kenji Takahashi (Architect) — RFI-142 Lead Partition' },
    ],
  },
];

const listeners = new Set();

export const router = {
  /**
   * Reads the current screen slug (?p=...) and record ID (#...) without triggering a reload.
   */
  current() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('p') || SCREENS[0].slug;
    const screenDef = SCREENS.find((s) => s.slug === slug) || SCREENS[0];
    const rawHash = window.location.hash.replace(/^#/, '');
    const recordId = rawHash || screenDef.defaultRecordId || null;

    return {
      slug: screenDef.slug,
      recordId,
      screenDef,
      latency: params.get('latency') || 'instant',
      chrome: params.get('chrome') !== '0',
    };
  },

  /**
   * Builds an in-document URL string for href attributes (used with @click.prevent="router.go(...)").
   */
  href(slug, recordId = null) {
    const params = new URLSearchParams(window.location.search);
    params.set('p', slug);
    const screenDef = SCREENS.find((s) => s.slug === slug);
    const resolvedId = recordId || (screenDef && screenDef.defaultRecordId) || '';
    const hashPart = resolvedId ? `#${resolvedId}` : '';
    return `?${params.toString()}${hashPart}`;
  },

  /**
   * Navigates in-document without reloading the page (D-24, F-057).
   * Preserves window.__same = 1 verification check.
   */
  go(slug, recordId = null) {
    const nextUrl = this.href(slug, recordId);
    if (window.location.search + window.location.hash !== nextUrl) {
      window.history.pushState({ slug, recordId }, '', nextUrl);
    }
    this.notify();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    const state = this.current();
    listeners.forEach((fn) => fn(state));
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => router.notify());
  window.addEventListener('hashchange', () => router.notify());
}
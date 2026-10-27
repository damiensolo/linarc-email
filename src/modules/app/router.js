// Module router: links between screens (D-24).
//
// Each screen is its own prototype slug, so the sandbox picker and `yarn shot <slug>` keep working. A link from one
// screen to another sets `?p=<slug>` and carries the record id in the hash: `?p=example-detail#sub-004`. Other query
// params (theme, chrome, latency) are preserved.
//
// Navigation stays in the document (docs/5-ui-patterns.md §6): `go()` pushes a history entry and tells App.vue to swap
// the screen, so the app shell never blanks. Never `location.assign` or an `<a href>` page load (F-057). Back / Forward
// work through `popstate`.

/** Event App.vue listens for to swap the screen after `go()` changes the URL. */
export const NAVIGATE_EVENT = 'prototype:navigate';

/** screen name → prototype slug. Add a line per screen of your module; nav.js rail items refer to the screen name. */
export const SCREENS = Object.freeze({
  list: 'example-list',
  detail: 'example-detail',
  // Correspondence (docs/correspondence/screens.md)
  email: 'correspondence-list',
  thread: 'correspondence-thread',
  rfis: 'correspondence-rfi-list',
  rfi: 'correspondence-context-rfi',
  sheet: 'correspondence-context-dwg',
  portal: 'correspondence-portal',
  // Notifications (docs/notifications/screens.md): rail-less screens opened from the bell (D-52)
  notifications: 'notifications-list',
  notificationsPrefs: 'notifications-preferences',
});

const SLUG_TO_SCREEN = Object.fromEntries(Object.entries(SCREENS).map(([screen, slug]) => [slug, screen]));

// Slugs that exist as prototypes. A lazy glob only lists the files (nothing is imported), which avoids a circular
// import between the shell and the prototype registry.
const BUILT_SLUGS = Object.keys(import.meta.glob('../../prototypes/*/index.vue')).map((f) => f.split('/').slice(-2)[0]);

/** { screen, slug, id } for the current page. `id` is the hash without `#`, or null. */
export function currentRoute() {
  const slug = new URLSearchParams(window.location.search).get('p') || '';
  const id = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null;
  return { screen: SLUG_TO_SCREEN[slug] || null, slug, id };
}

/** Does a prototype exist for this screen? Links to unbuilt screens stay inert. */
export function isBuilt(screen) {
  return BUILT_SLUGS.includes(SCREENS[screen]);
}

/** URL for a screen, keeping theme / chrome / latency params. Unbuilt screens return null (render no link). */
export function href(screen, id) {
  if (!isBuilt(screen)) return null;
  const url = new URL(window.location.href);
  url.searchParams.set('p', SCREENS[screen]);
  url.hash = id ? encodeURIComponent(id) : '';
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Navigate. Returns false (and does nothing) for a screen that isn't built yet. */
export function go(screen, id) {
  const target = href(screen, id);
  if (!target) return false;
  window.history.pushState(null, '', target);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  return true;
}

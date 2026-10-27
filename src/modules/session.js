// The demo session (D-29): everything a person changes in the prototypes that should survive a reload and show up on
// the next screen (records they created, answers they saved, decisions they made). Screens keep reading the static
// mock data; this module overlays or patches it, so a change made on one screen is seen by every other screen on its
// next load. Kept in sessionStorage (per browser tab); the sandbox's "Reset demo data" clears it.
//
// How to use it: add a key to `empty()` for each kind of change, write through a named function here (never from a
// screen directly), call `persist()` after each change, and read `session.<key>` from the data modules.
// Imported by src/main.js before the app mounts, so the overlay is in place before any screen reads the data.
import Vue from 'vue';
import { clearFiles } from './fileStore';

const KEY = 'linarc-prototypes:session:v1';

// The shape of what a demo can change. Template keys first (the example screens and the nav use them), then the
// Correspondence module's (src/modules/correspondence/data/, docs/correspondence/spec.md).
const empty = () => ({
  created: [], // records created in the prototype (example-detail: none yet)
  patches: {}, // recordId → fields that changed (also RFI-143 once promoted)
  bookmarks: {}, // mega-menu item id → bookmarked, where the user changed it (nav.js MEGA_MENU holds the default)
  // Correspondence
  settings: {}, // sandbox settings that belong to the demo: `role` (the viewer, D-41)
  guests: [], // guest users created with Add a guest user (D-36, D-46)
  newThreads: [], // threads started in the demo (compose from a record or the Email screen)
  threadEntries: {}, // threadId → entries appended (messages, notes, events)
  threadPatches: {}, // threadId → fields changed (triage, promotion, addLinkedRecordIds, resolvedBounces, …)
  threadAudit: {}, // threadId → Delivery rows appended
  revokedLinks: {}, // token → true
  linkReplies: {}, // token → true once the recipient replied from the page
  // Notifications (src/modules/notifications/data/, docs/notifications/spec.md). Items are derived (D-55); only what a person did
  // is stored, keyed `<itemKey>|<personId>` where it is personal.
  ntfEngagement: {}, // item|person → { seenAt, acknowledgedAt }
  ntfPresentation: {}, // item|person → { snoozedUntil, archived }
  ntfAssignments: {}, // `rfi:<id>:<stepId>` or `thread:<id>` → { toId, byId, at }
  ntfCritical: {}, // item → a manual Mark as critical { reason, evidence, markedById, markedAt }
  ntfOverrides: {}, // item → a Critical override { outcome, reason, reviewOn, actorId, at, from, to }
  ntfHistory: {}, // item → history rows appended (acknowledged, snoozed, assigned, reminders, cover, overrides)
  ntfCover: {}, // the active cover { forId, byId, from, to, startedAt } (empty when none)
  ntfPrefs: {}, // personId → { preset, matrix, quiet }
});

function read() {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch (e) {
    return empty();
  }
}

/** The session state (reactive). Read it; change it only through the functions below. */
export const session = Vue.observable(read());

export function persistSession() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch (e) {
    // storage unavailable; the demo just won't survive a reload
  }
}

/** Example write: patch fields on a record so every screen sees the change. */
export function patchRecord(id, fields) {
  Vue.set(session.patches, id, { ...(session.patches[id] || {}), ...fields });
  persistSession();
}

/** Bookmark or un-bookmark a mega-menu item (the top nav's Bookmarks menu lists the bookmarked ones). */
export function setBookmark(id, bookmarked) {
  Vue.set(session.bookmarks, id, bookmarked);
  persistSession();
}

// --- Correspondence primitives. Flows that compose them (send, promote, link, resend) live in
// src/modules/correspondence/data/actions.js so this module never imports module data.

const pushTo = (map, id, item) => Vue.set(map, id, [...(map[id] || []), item]);

export function setSetting(key, value) {
  Vue.set(session.settings, key, value);
  persistSession();
}

export function addGuest(guest) {
  session.guests.push(guest);
  persistSession();
}

export function addThread(thread) {
  session.newThreads.push(thread);
  persistSession();
}

export function appendThreadEntry(threadId, entry) {
  pushTo(session.threadEntries, threadId, entry);
  persistSession();
}

export function appendThreadAudit(threadId, row) {
  pushTo(session.threadAudit, threadId, row);
  persistSession();
}

export function patchThread(threadId, fields) {
  Vue.set(session.threadPatches, threadId, { ...(session.threadPatches[threadId] || {}), ...fields });
  persistSession();
}

export function revokeLink(token) {
  Vue.set(session.revokedLinks, token, true);
  persistSession();
}

export function markLinkReplied(token) {
  Vue.set(session.linkReplies, token, true);
  persistSession();
}

// --- Notifications primitives (flows in src/modules/notifications/data/actions.js).

/** Set one entry of a Notifications map (`ntfEngagement`, `ntfPresentation`, `ntfAssignments`, `ntfCritical`, `ntfOverrides`). */
export function setNotificationEntry(mapKey, key, value) {
  Vue.set(session[mapKey], key, value);
  persistSession();
}

export function appendNotificationHistory(itemKey, row) {
  pushTo(session.ntfHistory, itemKey, row);
  persistSession();
}

export function setCover(cover) {
  session.ntfCover = cover || {};
  persistSession();
}

export function setPrefs(personId, prefs) {
  Vue.set(session.ntfPrefs, personId, prefs);
  persistSession();
}

/** Sandbox: is there anything to reset? */
export function hasChanges() {
  return Object.values(session).some((v) => (Array.isArray(v) ? v.length : Object.keys(v).length));
}

/** Sandbox: back to the static mock data (reloads the page so every module starts clean). */
export function resetSession() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
  // Files attached in the demo go too (their bytes are in IndexedDB, src/modules/fileStore.js).
  clearFiles().then(() => window.location.reload());
}

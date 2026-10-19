// File contents for the demo session (D-29): files people attach in the prototypes, and files the prototype generates
// (a record PDF), so they can be previewed, opened and downloaded like the static samples in public/files/. The
// session (sessionStorage) keeps only each file's description; the bytes live in IndexedDB, keyed by attachment id,
// and are turned into object URLs once per page load. `fileUrl(id)` is reactive: a tile shows its preview as soon as
// the stored file is read back. The sandbox's "Reset demo data" clears the store (resetSession).
import Vue from 'vue';

const DB = 'linarc-prototypes-files';
const STORE = 'files';

// attachment id → object URL. Nested one level: Vue 2 only tracks keys added later to an object that is reached
// through a reactive property, never to the root of Vue.observable().
const state = Vue.observable({ urls: {} });

/** The object URL of a file stored in this browser, or '' (reactive). */
export const fileUrl = (id) => state.urls[id] || '';

let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
      const req = window.indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, run) {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const result = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
        t.onerror = () => reject(t.error);
      }),
  );
}

/** Keep a file's bytes under an attachment id. The object URL is usable at once; storing finishes in the background. */
export function storeFile(id, blob) {
  Vue.set(state.urls, id, URL.createObjectURL(blob));
  tx('readwrite', (s) => s.put(blob, id)).catch(() => {
    // storage unavailable or full: the file still works until the page reloads
  });
  return state.urls[id];
}

/** Read every stored file back into object URLs. Called once at start-up (src/main.js). */
export function hydrateFiles() {
  return tx('readonly', (s) => {
    const req = s.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (!state.urls[cursor.key]) Vue.set(state.urls, cursor.key, URL.createObjectURL(cursor.value));
      cursor.continue();
    };
    return null;
  }).catch(() => {});
}

/** Forget every stored file (Reset demo data). */
export function clearFiles() {
  return tx('readwrite', (s) => s.clear()).catch(() => {});
}

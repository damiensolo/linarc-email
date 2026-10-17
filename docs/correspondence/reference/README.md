# Reference drafts from the PRD pass (2026-10-16)

Files produced by the first PRD-to-spec pass, kept for reference. **`correspondenceData.js` was carried forward on 2026-10-16** into `src/modules/correspondence/data/` (build step 1): split into `project`, `people`, `records`, `threads`, `links` and `actions`; fictional names; the project matches `nav.js` PROJECTS; `THR-1050` (unmatched) and `tk-expired` added; per-recipient delivery moved onto outbound messages; `sla` computed, not stored. This copy is history now.

Superseded, do not copy into `src/`:
- `router.js`: the template's `src/modules/app/router.js` keeps `SCREENS` as `screen → slug`; titles and record pickers live in each prototype's `prototype` meta (`src/prototypes/index.js`, D-27).
- `nav.js`: fold the Inbox / Drawings / RFIs tools into the template's `nav.js` shape (`TOOLS`, `RAILS`, `QUICK_CREATE`, `PROJECTS`); drop `getNavForScreen` and the rails without screens.
- `sessions.js`: extend the template's `src/modules/session.js` (D-29: `session`, `patchRecord`, `setBookmark`, `resetSession`) with the four correspondence mutations (add guest, append entry, link record, promote); don't replace it or its storage key.
- `status.js`: the dimensions are now `../status-model.md`; use tone `error`, not `danger`, and no `signal` field unless a renderer is built.

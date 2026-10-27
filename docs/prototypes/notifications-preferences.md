# Notifications › Preferences (`notifications-preferences`)

- **Date:** 2026-10-26
- **Figma:** [05 · Notifications › Preferences](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3760) and [06 · Change severity](https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4187-3761) on the Documentation file's **Notifications** page (`4187:3492`)
- **URL:** `/?p=notifications-preferences`
- **Status:** verified. Built in step 4 of `docs/notifications/00-plan.md` §8 together with the Critical override modal (`SeverityModal`, reachable from any card's More menu).

## Scope
- **Persona and decision:** GC PM / PE: choose a preset, adjust delivery per event family and channel, set quiet hours, hand over while away (`docs/notifications/screens.md` §2, spec §9, §11). Flow 3, Task 4.
- **Nav:** the Communication rail with Notifications highlighted (`screens` alias on the rail item); from the drawer's footer and the full page; the back button returns to the full page.
- **Data:** `preferencesFor`, `savePreferences`, `presetMatrix`, `coverPreview`, `startCover`, `endCover` (`src/modules/notifications/data/actions.js`); `EVENT_FAMILIES`, `CHANNELS`, `CADENCES`, `LOCKED`, `PRESETS`, `PRODUCT_CATALOG` (`policy.js`).
- **Patterns:** settings form (`5-ui-patterns.md` §1, §7, D-19, D-20, D-25): comfortable title bar with `HeaderToolIcon type="back"`, a centred `max-w-4xl` column, sections separated by white space and hairlines, the fixed bottom panel with Cancel · Save aligned to the column and a LoadStatus write line (*Saving…* / *Saved*). Preset as `Radio`; the matrix as a table of small `SelectV2` cells (Immediate · Digest · Off) with locked cells rendered as text plus *Set by Vanguard Construction Group policy*; quiet hours as `Checkbox` days, two time inputs and a timezone select; cover with a delegate select, two dates, a live preview of covered and excluded items with the reason, *Start cover* / *End cover*; the product's wider catalog behind a disclosure, read-only.

## Metrics
| Measure | Value |
|---|---|
| Time from spec to first render | ~45 min |
| Time to verified done | ~1.5 h |
| Components used (library / forked / new) | 8 library (AppShell parts, HeaderToolIcon, Radio, Checkbox, InputV2, SelectV2, Button) / 0 forked / 0 new candidates (LoadStatus reused) |
| Gaps found | 2 (below) |
| Verification rounds before passing | 3 |
| Computed-value checks (pass/total) | 16/16 (`scripts/interact-notifications-prefs.mjs`) |

## Gaps and how they were handled
| Gap | Handling | Log ID |
|---|---|---|
| A fixed `w-space-124` on the matrix selects truncated "Immediate" | Cells take the column width | — |
| `LoadStatus` shows nothing after a successful write unless the screen passes the done text in its slot | *Saved* passed in the slot while `status === 'ready'` | F-026 |
| FormV2 has no matrix field | The matrix is a plain table of `SelectV2` cells; the rest uses the inputs directly (the screens doc said FormV2 flat) | — |

## Verification
- `yarn verify` passes.
- `yarn shot notifications-preferences` at 1440 / 1024 / 390, light and dark: no console errors, no overflow (the matrix scrolls in its own box at 390).
- `node scripts/interact-notifications-prefs.mjs 5177 <out>`: 16/16. Sarah starts on the Project manager preset with Documents / Email = Digest and the two locked cells; the Superintendent preset refills the matrix; editing a cell makes it Custom; Save shows *Saved*; choosing Alex as delegate previews "will cover 2 items" and "Not covered: 2 (not a participant of this Confidential thread)"; Start cover makes Alex's bell read 3 need action; End cover returns; the override from the full page needs a reason, downgrades RFI-142 with a *Severity changed* history row, and the PE then sees Important; Reset restores the defaults.

## Design flags (for the Figma review, not fixed in code)
- Figma has no preferences page for this model; the matrix is drawn from the proposal's controls table. Today's `UserPreferredNotification` grid (mail / text checkboxes per module) is the baseline to compare against.
- Quiet-hour exceptions and SMS are described in copy, not controls (`00-plan.md` §2).
- Per-event overrides (Advanced) are read-only here.
- Cover dates default to today + two weeks; the proposal's handback rules (what happens at the end date) are a history row and a return to the owner, nothing more.

## Findings
F-026.

## Screenshots
Scratchpad only (`shots/notifications-preferences-*.png`, `prefs-pm.png`, `prefs-cover-preview.png`).

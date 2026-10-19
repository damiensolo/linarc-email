# Correspondence — screen inventory and component map

One row per screen (skill §0). Titles follow `<Tool> › <Screen>`. Stage: `spec` → `built` → `verified` → `figma`. Tests refer to `00-plan.md` §4. Screens, tabs and copy say **Email** (D-40).

## 1. Screens (`src/modules/app/router.js` `SCREENS`, `src/prototypes/<slug>/`)

| Slug | Title | Persona and decision | Nav (module › tool › rail) | Pattern (`../5-ui-patterns.md`) | Records (D-27) | States (`spec.md` §11) | Tests | Stage |
|---|---|---|---|---|---|---|---|---|
| `correspondence-list` | `Communication › Email` | GC PM: what needs my action, what is overdue, what arrived unlinked | Project › Communication › Email | List (§1): Title Bar / Page with *Compose*, SegmentedControl (All first) cross-linked with the grid Filter panel (§8), DataGrid in LoadRegion | — | empty, loading, error, empty segment | 3, 5, 6 | **figma** 2026-10-16 ([record](../prototypes/correspondence-list.md)); Compose added with step 4 |
| `correspondence-thread` | `Communication › Email thread` | GC PM / PE: read the summary, keep cost talk internal, promote, check delivery | Communication › Email (detail) | Detail without decision (§1): comfortable title bar + back; ThreadStream left; right panel TabNavigation (Linked items, Delivery); Promote in SlideOverPanel `md` | `THR-1042`, `THR-1039`, `THR-1031`, `THR-1050` (unmatched) | loading, error, summary unavailable, bounce, promoted, linked | 3, 4, 6 | **figma** 2026-10-16 ([record](../prototypes/correspondence-thread.md)) |
| `correspondence-context-rfi` | `RFIs › RFI` | GC PM: the RFI created from email and its thread on the upgraded Email tab | Project › RFIs › All RFIs (detail, **stand-in**) | Record detail: comfortable title bar; TabNavigation (Details, **Email**, Activity); ThreadStream in the Email tab; *Compose* opens the panel with the RFI pinned and *Attach record PDF* | `RFI-143`, `RFI-142` | empty tab, loading, error, closed record | 3 | **figma** 2026-10-16 ([record](../prototypes/correspondence-context-rfi.md)); ComposePanel built here |
| `correspondence-context-dwg` | `Drawings › Sheet` | GC PE: a clash at Grid B-4; email a consultant without leaving the sheet | Project › Drawings › Sheets (**stand-in**: static sheet image, one pin) | Host canvas + SlideOverPanel `md` compose with revision pin, markup preview, To with *Add a guest user* | `A-302-Rev3`, `S-201-Rev1` (superseded) | superseded note; sending; send failed | 1 | **figma** 2026-10-16 ([record](../prototypes/correspondence-context-dwg.md)) |
| `correspondence-portal` | `External › Secure link` | Recipient without an account, or anyone opening a large file or the markup from the mail: understand the ask on a phone, see the revision and files, reply (guests with accounts also get *Open in Linarc*, Q-14) | none (no shell; reduced top nav, no rail) | External user (§1): AppLayout, fixed bottom panel; mobile first | `tk-marcus-a302`, `tk-kenji-rfi142`, `tk-expired` | valid, expired, revoked, replied, send failed | 2 | **figma** 2026-10-16 ([record](../prototypes/correspondence-portal.md)) |

Deferred (`spec.md` §12): `correspondence-thread-modal`.

### Segments, rails and filters (D-30)
- One rail item, **Email**. Segments: **All**; **Needs action** (`triage = needs_action`); **Waiting** (`triage = waiting`); **Overdue** (`sla = overdue`); **Unmatched** (no linked record). Each non-All segment is one condition and a quick filter; a filter that is none of these selects no segment.
- Other quick filters: **Has attachments**, **Confidential** (`visibility = restricted`).
- Rails not in the MVP: Drawings › Revisions, RFIs › Drafts, Configure.

### Email screen columns (dimension in `status-model.md`)
Subject · Linked record (code and revision; *Link to record* action when empty) · From / company · Triage (`triage`) · Due (`sla`, date) · Delivery (`delivery`, weakest recipient) · Last activity · Promoted (`promotion`, link) · Cost impact (`canSeeCost` roles) · Actions (frozen right).

## 2. Component map (skill §2)

| Element | Class | Component | Notes |
|---|---|---|---|
| App frame, top nav, rail | existing | `~/modules/app/AppShell.vue` (`TopNavBar`, `SideNavV2`, `AppLayout`) | `header-size="comfortable"` + `HeaderToolIcon type="back"` on detail (D-25) |
| Table, segments, filter panel | existing | `DataGrid`, `DataGridToolbar`, `SegmentedControl` md | quick filters (P-044); DataGrid `loading` (P-034) |
| Loading and write states | existing (template candidates) | `LoadRegion`, `LoadStatus`, `Skeleton`, `createLoad` | buttons disabled while loading |
| Forms and inputs | existing | `FormV2` flat, `InputV2`, `SelectV2` (`multiple`, P-041 unchanged), `Textarea`, `TextEditorV2`, `DatePicker`, `Checkbox` | left-aligned; short dates (D-26) |
| **Add a guest user row** | existing (composition; Q-02 settled, D-46) | heading + one line, `InputV2` (large) + `Button` (large) on one row, opening an inline `FormV2` (name, company, role) | no library change |
| Upload zone | existing | `DropArea` (P-020) | large-file note is text under it |
| Tabs (record, right panel) | existing | `TabNavigation` (P-028) | |
| Status | existing | `StatusChip`, muted text, check, `StatusIndicator` spinner | one signal per value |
| AI tag | existing | `StatusChip` AI + `Tooltip` in a focusable span | §9 |
| Internal note, bounce | existing (template candidate) | `InlineNotice` warning / error | |
| **SlideOverPanel** | **candidate #1** | `src/candidates/SlideOverPanel/` | [proposal](../components/SlideOverPanel.md); compose, promote |
| **ThreadStream** | **candidate #2** | `src/candidates/ThreadStream/` | [proposal](../components/ThreadStream.md); list only (D-38) |
| **AiSummary** | **candidate #3** | `src/candidates/AiSummary/` | [proposal](../components/AiSummary.md) |
| **DrawingPinPreview** | **candidate #4** | `src/candidates/DrawingPinPreview/` | [proposal](../components/DrawingPinPreview.md); Q-13 confirmed no thumbnail exists in Figma or the Drawings tool |
| Thread composer | existing (composition) | `SelectV2` sm + `TextEditorV2` + `DropArea` + `Button` | screen-level (D-38) |

Four candidates, no library extension. `correspondence-portal` and `correspondence-context-rfi` need no candidates of their own.

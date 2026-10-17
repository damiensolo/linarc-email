# Correspondence System — Distilled Product & UI Specification

## 1. Purpose & Architecture
Linarc's Correspondence capability turns project email into a fast, construction-native communication layer woven directly into project tools[cite: 1]:
1. **In-Tool Contextual Compose (`SlideOverPanel`):** Triggered from a Drawing markup, RFI, Submittal, or Change Order without leaving the host screen[cite: 1].
2. **Embedded Record Correspondence Tab (`ThreadStream`):** Dropped into any RFI, Submittal, or CO detail view to show all external/internal threads linked to that record[cite: 1].
3. **Central Correspondence Inbox (`correspondence-list` & `correspondence-thread`):** A project-wide triage log (`All`, `Needs action`, `Waiting`, `Overdue`) where users collaborate via private internal notes and escalate informal emails into formal records[cite: 1, 6].
4. **External Collaborator Magic-Link Portal (`correspondence-portal`):** Zero-login web view for external subcontractors and consultants to inspect high-res drawings/large files and reply[cite: 1].

## 2. Navigation Structure (`src/modules/app/nav.js`)
Per `1-setup-playbook.md` §6 (rail labels ≤ 12 chars per word to fit the `82px` rail)[cite: 2, 3]:
- **Top Strip Tools (Project Management Context):**
  1. **Inbox** (Rail items: `All mail`, `Action`, `Waiting`, `Sent`) — Central Correspondence Hub[cite: 1, 2].
  2. **Drawings** (Rail items: `Sheets`, `Revisions`) — Host tool demonstrating contextual markup-to-email[cite: 1, 2].
  3. **RFIs** (Rail items: `Open RFIs`, `Drafts`) — Host tool demonstrating embedded `ThreadStream` tab and promoted records[cite: 1, 2].
  4. **Configure** (Rail items: `Routing`, `Templates`, `Inbound`)[cite: 2, 5]
- **Quick Create (`StaticMegaMenu` in `#create-dropdown`):** Includes `New Message` (opens `SlideOverPanel` compose over current screen)[cite: 6].

## 3. Core Patterns & Visual Rules (Aligned with `5-ui-patterns.md`)

### 3.1 Candidate 1: `SlideOverPanel` (`src/candidates/SlideOverPanel/`)
- **Anatomy:** Right-anchored overlay panel over a subtle backdrop (`bg-surface-overlay`), mounted inside `AppShell` `#content` slot (or via PortalVue)[cite: 2, 6].
- **Sizes:** `sm` (`420px`), `md` (`560px` — default for Contextual Compose and Promote to Record), `lg` (`720px`) on desktop; full-width (`100vw`) at `390px` mobile[cite: 4, 5].
- **Structure & Scroll Rule (F-051):**
  - **Header (`64px` fixed):** Title, optional context ID chip (`A-302 Rev 3`), and close icon button (`HeaderToolIcon` or icon-only close)[cite: 5, 6].
  - **Body (`flex-1 overflow-y-auto p-space-20`):** Single vertical scroll region with padding inside the scroller so content ends ≥ 16px before the scrollbar[cite: 4, 6]. Uses `FormV2 flat` (never cards inside the panel, D-17)[cite: 5, 6].
  - **Footer (`64px` fixed, top `1px border-border-subtle`):** Secondary `Cancel` on the left, primary label-only action (`Send message` or `Create RFI`) on the right[cite: 5, 6].

### 3.2 Contextual Compose (`ContextualComposePanel`) & `SelectV2` Extension
- **Trigger:** Clicking `Message stakeholder` on a Drawing markup (`correspondence-context-dwg`), clicking `Email external reviewer` inside an RFI (`correspondence-context-rfi`), or clicking `New message` in the Inbox header[cite: 1].
- **Form Fields (Left-aligned per D-26, `FormV2 flat` per D-17)[cite: 5, 6]:**
  1. **Linked records (`SelectV2 multiple`, `maxVisibleTags: 2`, P-041):** Pre-populated with the host record and its immutable revision pin (e.g., `Drawing A-302 · Rev 3`)[cite: 1, 6]. If triggered from a drawing markup, renders the cropped markup preview (`DrawingPinPreview` candidate) right below[cite: 1].
  2. **Recipients (`SelectV2 multiple` extended with `allow-create`, P-row):**
     - Lists suggested project stakeholders first (e.g., `Thornton Structural — SEOR`, `Apex Mechanical — HVAC Sub`)[cite: 1].
     - **Inline External Guest Flow:** Typing an unrecognized email (`m.vance@acoustix.com`) shows an inline row at the bottom of the dropdown: `Add "m.vance@acoustix.com" as external guest`[cite: 1]. Clicking it expands two compact left-aligned inputs inside the popover (*Full name* pre-filled from email prefix, *Company* pre-filled from domain, and *Role* select) with an `Add recipient` button[cite: 1, 6]. Saves to `session.js` and adds the chip immediately[cite: 5, 8].
  3. **Subject & Response Due Row:** `InputV2` for Subject (pre-filled with `[Riverside Med] A-302 Rev 3 — ...`) + `DatePicker` (`width: 'short'` / `124px`, D-26) for `Response due`[cite: 1, 2, 5, 6].
  4. **Message Body:** `TextEditorV2`[cite: 2].
  5. **Attachments (`DropArea`, P-020):** Files `>15MB` or linked Drawings display a muted status note: `Delivered via secure magic link (no 20MB limit)`[cite: 1, 6, 8].

### 3.3 Candidate 2: `ThreadStream` (`src/candidates/ThreadStream/`)
Used in both `correspondence-thread` (the main Inbox detail view) and embedded inside the `Correspondence` tab of `correspondence-context-rfi`[cite: 1]:
- **AI Summary Header (`5-ui-patterns.md` §9):** Shown on threads with 3+ messages[cite: 1]. Tagged with the **AI `StatusChip`** wrapped in a focusable `<span>` with `Tooltip`: *"This content was generated using AI and may contain errors or omissions. Verify important information before relying on it."*[cite: 6] Beneath the bullets (*Decisions*, *Open questions*), renders the mandatory evidence line: *"Summarised from 3 messages and 2 files in THR-1042."*[cite: 1, 6]
- **Hairline Message List (D-17):** Vertical list divided by `1px border-border-subtle` hairlines—no nested boxes or cards[cite: 5, 6].
  - *External Message Row:* Sender, company, timestamp, single `delivery` status signal from `status.js` (e.g., `Link viewed`), message body, attachment links (with file glyph icon), and a subtle `Promote to record` action[cite: 1, 6, 8].
  - *Private Internal Note Row:* Rendered as an `InlineNotice` (`tone="warning"`, tinted fill + tone icon, no outline per `5-ui-patterns.md` §3) prefixed with `Internal team note (hidden from external recipients)`[cite: 1, 6].
  - *Promoted Record Marker:* Muted inline row with link (`Promoted to RFI-143 by Damien Solomon · View RFI`)[cite: 1, 6].
- **Bottom Composer:** Includes a compact `SelectV2` mode selector (`External reply` vs. `Internal team note`), `Textarea` / `TextEditorV2`, `DropArea` toggle, and label-only submit button (`Send reply` or `Post internal note`)[cite: 1, 2, 6, 8].

### 3.4 Compact "Promote to Record" Flow (`PromoteRecordPanel` + `ModalV2` Variant)
When a user clicks `Promote to record` on any email message in `ThreadStream`[cite: 1]:
- **Default Pattern (`SlideOverPanel` `size="md"` / `560px`):** Slides out on the right while keeping the source email message visible and highlighted in the left column[cite: 1, 6].
- **Comparison Pattern (`correspondence-thread-modal` slug, D-18):** Opens a compact `ModalV2` with the exact same 5 pre-populated fields for A/B user testing[cite: 5, 6]:
  1. `Record type` (`SelectV2`: `RFI`, `Potential Change Order (PCO)`, `Submittal Revision`, `Field Issue`)[cite: 1, 6].
  2. `Title` (`InputV2`, pre-filled from thread subject/context)[cite: 1, 6].
  3. `Question / Scope` (`Textarea`, pre-filled with AI-distilled contractual question + AI `StatusChip` & `Tooltip` per §9)[cite: 1, 6].
  4. `Assigned to` (`SelectV2`, pre-selected to suggested reviewer, e.g., `Thornton Structural`) + `Due date` (`DatePicker`, `width: 'short'`)[cite: 1, 5, 6].
  5. `Include from email` (`Checkbox` group: `[x] Drawing A-302 Rev 3 (Grid B-4 markup)`, `[x] Beam_Penetration_Sketch.pdf`)[cite: 1, 8].
- **Submit Action:** Label-only button `Create RFI-143`[cite: 6]. Writes the new RFI record to `session.js`, injects the `Promoted to RFI-143` event row into `THR-1042`, and shows a confirmation notice with a direct link to open `RFI-143` (`correspondence-context-rfi#RFI-143`)[cite: 1, 5, 6, 8].

### 3.5 Central Inbox List (`correspondence-list`) & Right Panel Audit Trail (`correspondence-thread`)
- **`correspondence-list`:** Standard `AppShell` list screen with `SegmentedControl` (`All`, `Needs action`, `Waiting`, `Overdue`) cross-linked to the `DataGrid` `800px` Filter panel (D-30)[cite: 5, 6]. Wrapped in `LoadRegion` (`content-loads`) + `LoadStatus`[cite: 6, 7].
- **`correspondence-thread` Right Panel (`AppShell right-panel`):** Uses `TabNavigation` (P-028) for two tabs[cite: 6]:
  1. `Linked items` (Drawings with pinned revision badges, promoted RFIs/PCOs, files)[cite: 1].
  2. `Audit trail` (Immutable log of `SMTP_DELIVERED`, `MAGIC_LINK_ACCESSED`, and `ATTACHMENT_DOWNLOADED` with actor email, timestamp, IP, and `SHA-256` checksum, plus `Export proof pack` action)[cite: 1].

### 3.6 External Collaborator Magic-Link Portal (`correspondence-portal`)
- Uses `AppLayout` directly with reduced `TopNavBar` (Company variant, logomark) and **no side rail** (`5-ui-patterns.md` §1)[cite: 6, 8, 9].
- Responsive from `1440px` down to `390px` mobile (where external superintendents and consultants most frequently open email links)[cite: 1, 4, 5].
- Displays the pinned `Drawing A-302 Rev 3` markup snapshot, large video player (`45.2 MB` streamed via magic link), quick response radios (`Acknowledge receipt`, `Submit clarification`, `Flag cost or schedule impact`), reply `Textarea`, and `Submit response` bottom panel button[cite: 1, 6, 8].
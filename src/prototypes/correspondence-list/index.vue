<template>
  <!-- Communication › Email: the project Email screen, upgraded (docs/correspondence/spec.md §9, screens.md §1; D-40).
       List pattern (5-ui-patterns.md §1): AppShell with Title Bar / Page, a SegmentedControl of views cross-linked with
       the grid's Filter panel (D-30: a view other than All is one "View is …" condition; the views are quick filters;
       editing that condition in the panel moves the segment; a filter that is none of the views selects no segment),
       a meta line with LoadStatus, and the DataGrid in a LoadRegion (D-24). Role (D-41): the viewer from the sandbox
       role switcher decides which threads, notes and cost are visible; the screen remounts on change.
       Row action: Open → the thread; on an Unmatched row, Link to record → a short ModalV2 (spec §4).
       Compose (today's primary action) opens the compose panel with no record pinned; sending opens the new thread.
       The meta line names the project address (D-42): mail forwarded or Bcc'd to it from Outlook or Gmail lands on this
       list (Unmatched until linked). Plain text, no copy button: people set it up once, so it isn't an action.
       Reading view (D-65, 2026-11-04): the second view in the grid toolbar's switcher (List · Reading pane; the Grid view
       was removed in review on 2026-11-04, the list view is the table) renders
       ReadingView inside the grid's frame: the ViewsPane (views with counts, object type, record, company, date; every
       choice a condition in the grid's Filter panel), the ThreadList in the grid's display order, and the ReadingPane
       behind a draggable divider. The segments and the meta line hide there (the pane lists the same views with counts,
       so the panes start under the toolbar). The Reading pane is the default view (review 2026-11-04); a switch to List
       is kept in the demo session, and the hash (`#reading=THR-1042`, `#list`) asks for a view on arrival, so Back from a
       thread returns to the pane with its thread.
       Since 2026-11-06 (D-67): Drafts and Deleted are folders (a different row set: the views pane and the segments
       list them after the triage views; `#drafts`, `#deleted` open them); a thread is unread for the viewer until
       opened (bold Subject and From, the Unread quick filter); the table's selection toolbar offers what email needs
       (Delete, Mark as unread, Mark as read; Restore in Deleted) and nothing else; the reading pane's header carries the
       same actions; the Reading view's middle pane switches between a Preview and a List layout. -->
  <AppShell screen="email" title="Email">
    <!-- Title Bar / Page: the project address sits in a Tooltip behind a small help icon beside the title (review
         2026-11-06; it was a 12px line beside the title from 2026-10-27). The icon is focusable and carries the copy as
         its label, so the keyboard and a screen reader get it too; the empty state and the compose footer still print
         the address in full. -->
    <template #header>
      <div class="flex min-w-0 items-center gap-x-space-8">
        <span class="shrink-0 font-label font-bold text-fontsize-16 leading-lineheight-24 text-text-default">Email</span>
        <Tooltip :label="addressNote" placement="bottom">
          <span class="inline-flex shrink-0 rounded-radius-round text-icon-inactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-primary-focused" tabindex="0" :aria-label="addressNote">
            <HelpCircle :size="16" aria-hidden="true" />
          </span>
        </Tooltip>
      </div>
    </template>
    <template #header-actions>
      <Button label="Compose" color-scheme="primary" variant="solid" size="medium" @onClick="compose()" />
    </template>

    <template #content>
      <div class="flex h-full min-h-0 flex-col gap-space-16">
        <!-- The Reading view has no meta line (review 2026-11-04): the pane carries the views and their counts, and the
             row would only hold the thread count, so it goes and the panes start under the toolbar. First-load errors
             still show in the LoadRegion; a refresh error has no "Couldn't update." line there. -->
        <div v-if="mode !== 'reading'" class="flex flex-wrap items-center gap-x-space-16 gap-y-space-8" aria-label="Views">
          <!-- Seven segments overflow a 390px screen: the strip scrolls in its own box (as the stepper, F-070). -->
          <div class="max-w-full overflow-x-auto">
            <SegmentedControl :value="view" :options="viewOptions" aria-label="Email view" size="md" @input="pickView" />
          </div>
          <LoadStatus :load="load" size="xs" @retry="fetch"><span><strong class="font-bold text-text-default">{{ count }}</strong>{{ noun }}</span></LoadStatus>
        </div>

        <LoadRegion v-slot="{ skeleton }" class="min-h-0 w-full min-w-0 flex-1" :load="load" content-loads @retry="fetch">
          <!-- Empty (spec §11): plain text, no illustration; the project address is the way mail gets here. In the
               Reading view the list says it instead, so the Views pane stays to move on. -->
          <div v-if="load.hasData && !rows.length && mode !== 'reading'" class="font-label text-fontsize-14 leading-lineheight-20 text-text-subtle pt-space-16">
            {{ emptyText }}
          </div>
          <DataGrid
            v-else
            ref="grid"
            class="min-h-0 w-full min-w-0 flex-1"
            :data="rows"
            :loading="skeleton"
            :header="columns"
            :quick-filters="quickFilters"
            id-field="id"
            :views="['list', 'reading']"
            :custom-views="customViews"
            :default-view="mode"
            :views-feature-enabled="true"
            :view-tabs="[]"
            :show-print="true"
            :show-save-template="false"
            :application-should-handle-download="true"
            :row-height="40"
            :selection-toolbar="selectionToolbar"
            height="100%"
            @filter-change="onFilterChange"
            @view-change="onViewChange"
            @row-click="openRow"
            @selection-change="onSelection"
            @selection-delete="bulkDelete"
            @selection-action="bulkAction"
          />
        </LoadRegion>
      </div>

      <!-- Link to record (spec §4): a short single-step task, so a compact modal (5-ui-patterns.md §1), inside #content.
           The SmartPicker candidate (D-61): records the subject names come first as Suggested, then Recent, then by kind. -->
      <ModalV2
        :is-visible="!!linking"
        size="md"
        title="Link to record"
        :title-description="linking ? linking.subject : ''"
        primary-label="Link"
        secondary-label="Cancel"
        :primary-disabled="!linkTarget || linkBusy"
        :secondary-disabled="linkBusy"
        :close-on-primary-click="false"
        @onPrimaryClick="confirmLink"
        @closeModal="closeLink"
      >
        <template #modal-body>
          <div class="flex flex-col gap-space-16 font-label">
            <p class="m-0 text-fontsize-14 leading-lineheight-20 text-text-subtle">
              This mail arrived at {{ project.inboundAddress }} and matches no thread. Linking it to a record puts it on that record's Email tab and in its history.
            </p>
            <SmartPicker v-if="linking" v-model="linkTarget" :items="linkItems" :kinds="linkKinds" noun="records" placeholder="Search by code or title" :visible-rows="5" />
          </div>
        </template>
      </ModalV2>

      <!-- Compose, or a compose draft from the Drafts folder (its record and pin name the draft; D-67) -->
      <ComposePanel :open="composing" :role="role" :record-id="composeRecordId" :pin-id="composePinId" @close="closeCompose" @sent="onSent" />
    </template>
  </AppShell>
</template>

<script>
import { HelpCircle, PanelRight } from '@development/linarc-icons';
import Tooltip from '@/componentsV2/Tooltip/index.vue';
import Button from '@/components/Button/Button.vue';
import DataGrid from '@/components/DataGrid/index.vue';
import ModalV2 from '@/componentsV2/ModalV2/ModalV2.vue';
import SegmentedControl from '@/componentsV2/SegmentedControl/SegmentedControl.vue';
import LoadRegion from '~/candidates/LoadRegion/LoadRegion.vue';
import LoadStatus from '~/candidates/LoadStatus/LoadStatus.vue';
import SmartPicker from '~/candidates/SmartPicker/SmartPicker.vue';
import { createLoad } from '~/candidates/LoadRegion/createLoad';
import { mockRequest } from '~/modules/mock/request';
import AppShell from '~/modules/app/AppShell.vue';
import { currentRoute, go } from '~/modules/app/router';
import { session, setSetting } from '~/modules/session';
import {
  PROJECT, ROLES, currentRole, setRole, visibleThreads, deletedThreads, listDrafts, clearDraft, inboundSandbox, linkThreadToRecord, pickerRecords,
  suggestRecordIds, recentRecordIds, RECORD_KINDS, markRead, markUnread, deleteThreads, restoreThreads,
} from '~/modules/correspondence/data';
import { eventsSandbox } from '~/modules/notifications/data';
import { VIEWS, VIEW_FIELD, READ_FIELD, isFolderView, emailRows, draftRows, emailColumns, emailQuickFilters } from '~/modules/correspondence/emailColumns';
import ComposePanel from '~/modules/correspondence/components/ComposePanel.vue';
import ReadingView from '~/modules/correspondence/components/ReadingView.vue';

/** The single view a filter config expresses ('all' when it has no view condition), or null when it is more. */
function viewOf(config) {
  if ((config.groups || []).length) return null;
  const conds = config.conditions || [];
  const views = conds.filter((c) => c.field === VIEW_FIELD);
  if (!views.length) return conds.length ? null : 'all';
  if (views.length > 1 || conds.length > 1) return null;
  const { operator, value } = views[0];
  if (operator === 'is') return value;
  if (operator === 'isAnyOf' && Array.isArray(value) && value.length === 1) return value[0];
  return null;
}

/**
 * The hash can ask for a view on arrival: `#reading=THR-1042` opens a thread in the Reading pane (the default view since
 * 2026-11-04), `#list` opens the table (the interaction scripts and `yarn shot correspondence-list#list` use it),
 * `#drafts` / `#deleted` open a folder in the Reading pane (D-67).
 */
function modeFromHash() {
  const id = currentRoute().id || '';
  if (id === 'list') return { mode: 'list', selectedId: '', folder: 'inbox' };
  if (isFolderView(id)) return { mode: 'reading', selectedId: '', folder: id };
  if (!id.startsWith('reading')) return null;
  return { mode: 'reading', selectedId: id.includes('=') ? id.slice(id.indexOf('=') + 1) : '', folder: 'inbox' };
}

const EMPTY = {
  inbox: `No email yet. Mail sent from drawings and records, and mail sent to ${PROJECT.inboundAddress}, appears here.`,
  drafts: 'No drafts. A message you save, or close before sending, waits here.',
  deleted: 'Nothing deleted. A deleted email waits here until it is restored.',
};

export default {
  name: 'CorrespondenceList',
  prototype: {
    title: 'Communication › Email',
    figma: 'https://www.figma.com/design/9ANM41f3QwNjt27Sl08i8O/Documentation?node-id=4090-93',
    roles: () => ({ options: ROLES.map((r) => ({ value: r.id, label: r.label })), value: currentRole().id, set: setRole }),
    inbound: inboundSandbox,
    events: eventsSandbox,
  },
  components: { AppShell, Button, DataGrid, ModalV2, SegmentedControl, LoadRegion, LoadStatus, SmartPicker, ComposePanel, Tooltip, HelpCircle },
  provide() {
    return { readingContext: this.readingCtx };
  },
  data() {
    const asked = modeFromHash();
    // Reading pane is the default (review 2026-11-04); the session remembers a switch to List.
    const mode = asked ? asked.mode : session.settings.emailView === 'list' ? 'list' : 'reading';
    const folder = asked ? asked.folder : 'inbox';
    return {
      project: PROJECT,
      role: currentRole(),
      view: folder === 'inbox' ? 'all' : folder,
      viewOptions: VIEWS.map((v) => ({ label: v.label, value: v.id })),
      quickFilters: emailQuickFilters,
      // The three row sets (D-67): the inbox, the deleted threads, the drafts; `rows` is the folder's.
      sets: { inbox: [], deleted: [], drafts: [] },
      folder,
      rows: [],
      shown: 0,
      filtered: false,
      selectedIds: [],
      load: createLoad({ label: 'email' }),
      linking: null,
      linkTarget: null,
      linkBusy: false,
      linkKinds: RECORD_KINDS,
      composing: false,
      composeRecordId: null,
      composePinId: null,
      // Reading view (D-65): the grid's second view, beside List (the Grid view was removed in review, 2026-11-04).
      mode,
      customViews: [{ id: 'reading', label: 'Reading pane', icon: PanelRight, component: ReadingView }],
      // What ReadingView and its panes need from the screen (provide / inject: the grid passes a view only its services).
      readingCtx: {
        rows: [],
        inboxRows: [],
        counts: {},
        folder,
        emptyText: EMPTY[folder],
        role: currentRole(),
        selectedId: asked ? asked.selectedId : '',
        paneWidth: session.settings.readingPaneWidth || null,
        listLayout: session.settings.readingListLayout === 'list' ? 'list' : 'preview',
        select: (id) => this.selectThread(id),
        open: (id) => go('thread', id),
        setFilters: (next) => this.$refs.grid && this.$refs.grid.setFilters(next),
        setPaneWidth: (px) => this.setPaneWidth(px),
        setListLayout: (layout) => this.setListLayout(layout),
        setFolder: (id) => this.setFolder(id),
        changed: () => this.fetch(),
        read: (id) => this.patchRow(id, { unread: false, [READ_FIELD]: 'Read' }),
        markUnread: (id) => this.setUnread([id], true),
        remove: (id) => this.removeRows([id]),
        restore: (id) => this.restoreRows([id]),
        // the list bar's actions on the ticked rows (D-68): the same set as the table's selection toolbar
        bulk: (key, ids) => this.applyBulk(key, ids),
      },
    };
  },
  computed: {
    /** The tooltip and the icon's accessible name: one sentence, the address in full (D-42). */
    addressNote() {
      return `Mail sent to ${this.project.inboundAddress} lands here.`;
    },
    /** The count, bold (review 2026-10-28); nothing until the first answer: "0 threads" before loading would be a false result. */
    count() {
      if (!this.load.hasData) return '';
      const n = this.filtered ? this.shown : this.rows.length;
      return n === this.rows.length ? `${n}` : `${n} of ${this.rows.length}`;
    },
    noun() {
      if (!this.load.hasData) return '';
      const one = this.folder === 'drafts' ? 'draft' : 'thread';
      return this.rows.length === 1 ? ` ${one}` : ` ${one}s`;
    },
    emptyText() {
      return EMPTY[this.folder];
    },
    columns() {
      return emailColumns((row) => this.onAction(row), this.role);
    },
    /**
     * The table's selection toolbar (D-67): only what email can do. Cut, copy, paste, Deselect and Select all are off;
     * Delete stays (a draft is discarded, a thread goes to Deleted); the label actions follow the folder (P-069).
     */
    selectionToolbar() {
      const off = { display: false };
      const base = { cut: off, copy: off, paste: off, copyHierarchy: off, deselect: off, selectAll: off };
      if (this.folder === 'deleted') return { ...base, delete: off, actions: [{ key: 'restore', label: 'Restore' }] };
      if (this.folder === 'drafts') return { ...base, actions: [] };
      return { ...base, actions: [{ key: 'unread', label: 'Mark as unread' }, { key: 'read', label: 'Mark as read' }] };
    },
    /** The picker's records: those the mail's subject names are Suggested, the latest threads' records Recent. */
    linkItems() {
      return pickerRecords({ suggestedIds: this.linking ? suggestRecordIds(this.linking.subject) : [], recentIds: recentRecordIds() });
    },
  },
  created() {
    this.fetch();
    // A view asked for in the hash is remembered like a switch, so a role change (remount) keeps it.
    if (modeFromHash()) setSetting('emailView', this.mode);
    this.syncHash();
  },
  beforeDestroy() {
    this.load.destroy();
  },
  methods: {
    fetch() {
      this.load.run(
        (signal) =>
          mockRequest(
            () => ({
              inbox: emailRows(visibleThreads(this.role), this.$moment, this.role),
              deleted: emailRows(deletedThreads(this.role), this.$moment, this.role),
              drafts: draftRows(listDrafts(this.role), this.$moment),
            }),
            { signal },
          ),
        (sets) => {
          this.sets = sets;
          this.applyFolder();
        },
      );
    },
    /** The folder's rows go to the grid and the pane; the inbox's rows feed the counts and the facets (D-67). */
    applyFolder() {
      const rows = this.sets[this.folder] || [];
      this.rows = rows;
      const ctx = this.readingCtx;
      ctx.rows = rows;
      ctx.inboxRows = this.sets.inbox;
      ctx.folder = this.folder;
      ctx.emptyText = EMPTY[this.folder];
      ctx.counts = { drafts: this.sets.drafts.length, deleted: this.sets.deleted.length };
      if (ctx.selectedId && !rows.some((r) => r.id === ctx.selectedId)) this.selectThread('');
      this.$nextTick(() => {
        this.syncCount();
        // A view chosen before the answer arrived (or kept across a refresh) is re-applied to the grid.
        if (this.folder === 'inbox' && this.view !== 'all') this.pickView(this.view);
      });
    },
    /** One row changes in place (read, unread): no refetch, no "Updating…" for a click on a row. */
    patchRow(id, fields) {
      const patch = (list) => list.map((r) => (r.id === id ? { ...r, ...fields } : r));
      Object.keys(this.sets).forEach((k) => {
        this.sets[k] = patch(this.sets[k]);
      });
      this.rows = this.sets[this.folder];
      this.readingCtx.rows = this.rows;
      this.readingCtx.inboxRows = this.sets.inbox;
    },
    /** A folder (Drafts, Deleted) or the inbox: the rows swap, the view condition goes, the selection clears (D-67). */
    setFolder(id) {
      const folder = isFolderView(id) ? id : 'inbox';
      if (folder === this.folder) return;
      this.folder = folder;
      this.view = folder === 'inbox' ? 'all' : folder;
      this.selectedIds = [];
      const grid = this.$refs.grid;
      if (grid) {
        grid.uncheckAll();
        const config = grid.getFilterService().getFilterConfig();
        const others = (config.conditions || []).filter((c) => c.field !== VIEW_FIELD);
        if (others.length !== (config.conditions || []).length) grid.setFilters((config.groups || []).length ? { conditions: [], groups: config.groups } : others);
      }
      this.applyFolder();
    },
    /** Segment → grid: a folder swaps the rows; a view replaces any view condition with its own (none for All), the rest kept. */
    pickView(id) {
      if (isFolderView(id)) {
        this.setFolder(id);
        return;
      }
      if (this.folder !== 'inbox') this.setFolder('inbox');
      this.view = id;
      const grid = this.$refs.grid;
      if (!grid) return;
      const config = grid.getFilterService().getFilterConfig();
      if (viewOf(config) === id) return;
      const others = (config.conditions || []).filter((c) => c.field !== VIEW_FIELD);
      const next = id === 'all' ? others : [...others, { field: VIEW_FIELD, operator: 'is', value: id, join: 'and' }];
      grid.setFilters((config.groups || []).length ? { conditions: [], groups: config.groups } : next);
    },
    /** Grid → segment: the panel (quick filter, edit, Clear all) moves the segment; a mixed filter selects none. */
    onFilterChange({ filterConfig }) {
      const conds = filterConfig.conditions || [];
      const viewConds = conds.filter((c) => c.field === VIEW_FIELD && c.operator === 'is');
      // Views are one choice, as in the segmented control: a second view quick filter replaces the first.
      if (viewConds.length > 1 && !(filterConfig.groups || []).length) {
        const keep = viewConds[viewConds.length - 1];
        this.$refs.grid.setFilters(conds.filter((c) => c.field !== VIEW_FIELD || c === keep));
        return;
      }
      this.view = this.folder === 'inbox' ? viewOf(filterConfig) : this.folder;
      this.filtered = conds.length + (filterConfig.groups || []).length > 0;
      this.$nextTick(this.syncCount);
    },
    syncCount() {
      const grid = this.$refs.grid;
      this.shown = grid ? grid.getDisplayRowCount() : this.rows.length;
    },
    /** The toolbar's view switcher: the mode is remembered for the session and written to the hash (D-65). */
    onViewChange({ view }) {
      this.mode = view;
      setSetting('emailView', view);
      this.syncHash();
    },
    /** A row of the list: a thread opens in the pane; a draft opens where it is written (D-67). */
    selectThread(id) {
      if (id && this.folder === 'drafts') {
        const row = this.rows.find((r) => r.id === id);
        if (row) this.editDraft(row);
        return;
      }
      this.readingCtx.selectedId = id;
      this.syncHash();
    },
    setPaneWidth(px) {
      this.readingCtx.paneWidth = px;
      setSetting('readingPaneWidth', px);
    },
    /** The middle pane's layout (Preview · List), kept for the session (D-67). */
    setListLayout(layout) {
      this.readingCtx.listLayout = layout;
      setSetting('readingListLayout', layout);
    },
    /** `#reading=THR-1042` while a thread is open in the pane, `#list` for the table, no hash otherwise; replaced in place so Back still leaves the screen. */
    syncHash() {
      const url = new URL(window.location.href);
      const { selectedId } = this.readingCtx;
      // `#list` stays in the URL while the table is shown, so a reload or Reset demo data keeps the table (the scripts rely on it).
      const next = this.mode === 'list' ? '#list' : selectedId ? `#reading=${encodeURIComponent(selectedId)}` : '';
      if (url.hash === next) return;
      url.hash = next;
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    },
    onAction(row) {
      if (!row) return;
      if (row.draft) this.editDraft(row);
      else if (row.deleted) this.restoreRows([row.id]);
      else if (row.unmatched) this.startLink(row);
      else go('thread', row.id);
    },
    openRow({ row }) {
      if (!row) return;
      if (row.draft) this.editDraft(row);
      else go('thread', row.id);
    },
    // --- selection (the table's checkboxes; D-67)
    onSelection({ selectedRowIds }) {
      this.selectedIds = [...selectedRowIds];
    },
    /** The table's Delete: a thread goes to Deleted (restorable), a draft is discarded. */
    bulkDelete() {
      this.applyBulk('delete', this.selectedIds);
    },
    bulkAction(key) {
      this.applyBulk(key, this.selectedIds);
    },
    /** One action on a set of rows, from the table's selection toolbar or the Reading view's list bar (D-67, D-68). */
    applyBulk(key, ids) {
      if (!ids || !ids.length) return;
      if (key === 'unread') this.setUnread(ids, true);
      else if (key === 'read') this.setUnread(ids, false);
      else if (key === 'restore') this.restoreRows(ids);
      else if (key === 'delete') {
        if (this.folder === 'drafts') {
          ids.forEach(clearDraft);
          this.afterBulk();
        } else if (this.folder === 'inbox') {
          this.removeRows(ids);
        }
      }
    },
    afterBulk() {
      this.selectedIds = [];
      if (this.$refs.grid) this.$refs.grid.uncheckAll();
      this.fetch();
    },
    setUnread(ids, unread) {
      ids.forEach((id) => (unread ? markUnread(id, this.role.personId) : markRead(id, this.role.personId)));
      ids.forEach((id) => this.patchRow(id, { unread, [READ_FIELD]: unread ? 'Unread' : 'Read' }));
      if (this.selectedIds.length) {
        this.selectedIds = [];
        if (this.$refs.grid) this.$refs.grid.uncheckAll();
      }
    },
    removeRows(ids) {
      deleteThreads(ids, { actorId: this.role.personId });
      if (ids.includes(this.readingCtx.selectedId)) this.selectThread('');
      this.afterBulk();
    },
    restoreRows(ids) {
      restoreThreads(ids);
      if (ids.includes(this.readingCtx.selectedId)) this.selectThread('');
      this.afterBulk();
    },
    // --- compose and drafts
    compose() {
      this.composeRecordId = null;
      this.composePinId = null;
      this.composing = true;
    },
    /** A compose draft reopens the panel with its record and pin; a reply draft is on its thread (D-67). */
    editDraft(row) {
      const d = row.draft;
      if (!d) return;
      if (d.kind === 'reply') {
        go('thread', d.threadId);
        return;
      }
      this.composeRecordId = d.recordId;
      this.composePinId = d.pinId;
      this.composing = true;
    },
    /** Closing keeps the draft (D-59): the Drafts count may have changed. */
    closeCompose() {
      this.composing = false;
      this.fetch();
    },
    startLink(row) {
      this.linkTarget = null;
      this.linking = row;
    },
    closeLink() {
      if (this.linkBusy) return;
      this.linking = null;
    },
    confirmLink() {
      if (!this.linking || !this.linkTarget) return;
      this.linkBusy = true;
      const threadId = this.linking.id;
      linkThreadToRecord(threadId, this.linkTarget, { actorId: this.role.personId });
      this.linkBusy = false;
      this.linking = null;
      // The row now has a record: refresh keeps the rows on screen with "Updating…" (D-24), then shows the change.
      this.fetch();
    },
    /** A message sent from here starts a thread; opening it is the acknowledgement. */
    onSent(thread) {
      this.composing = false;
      go('thread', thread.id);
    },
  },
};
</script>

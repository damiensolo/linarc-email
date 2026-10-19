<template>
  <!-- Shared shell for every screen of the module (D-13): top nav with the module tile, the tool strip and the
       account rail; the side-nav rail of the tool that lists the screen; AppLayout for the page. Module config:
       ./nav.js. Figma: Top Nav Bar (Module=…), Side Nav <Module>, Title Bar / Page or Title Bar / Workflow.
       The rail's selector bar is the module accent (nav.js ACCENT); without it SideNavV2 falls back to blue (F-063). -->
  <div class="flex flex-col h-full bg-surface-page">
    <TopNavBar
      ref="topNav"
      :module="{ ...MODULE, clickToToggle: true, chevronOpen: menuOpen }"
      :tools="{ items: tools, needBookmarks: true, needCreate: !!QUICK_CREATE, isAdmin: false, selectedColor: ACCENT.text, dropdownOffsetY: MENU_OFFSET }"
      :context="{
        enabled: true,
        primaryLabel: currentProject.label,
        primaryOptions: PROJECTS,
        primarySelectedValue: currentProject.value,
        secondaryOptions: PLACES,
      }"
      :account="account"
      :overflow="overflow"
      :user-details="USER"
      @tool-click="onTool"
      @account-click="onAccountClick"
      @module-click="menuOpen = !menuOpen"
    >
      <!-- Bookmarks menu: the mega-menu items the user bookmarked (DynamicMegaMenu, Figma Mega Menu/Bookmarks). -->
      <template #bookmarks-dropdown>
        <DynamicMegaMenu
          :items="bookmarkedItems"
          :active-module-id="activeMenuItem"
          aria-label="Bookmarks"
          empty-state-title="No bookmarks yet"
          empty-state-description="Bookmark items in the menu to add them here."
          :empty-state-render-icon="bookmarkIcon"
          @item-click="onMenuItem"
          @item-bookmark-click="onBookmark"
        >
          <template #item-icon="{ item, iconColor }">
            <component :is="item.icon" :size="20" :stroke-width="1.75" :color="iconColor" />
          </template>
        </DynamicMegaMenu>
      </template>
      <!-- Create menu: Quick Create Menu (StaticMegaMenu, in flow inside the Create cell's dropdown). -->
      <template v-if="QUICK_CREATE" #create-dropdown>
        <StaticMegaMenu :columns="QUICK_CREATE" aria-label="Quick create" @item-click="onCreate">
          <template #item-icon="{ item, iconColor }">
            <component :is="item.icon" :size="20" :stroke-width="1.75" :color="iconColor" />
          </template>
        </StaticMegaMenu>
      </template>
    </TopNavBar>

    <!-- Module mega menu: every area of the app (nav.js MEGA_MENU), floating under the module tile. The tile toggles it;
         a click outside, Escape, the X (phone layout) or picking an item closes it. -->
    <StaticMegaMenu
      :columns="menuColumns"
      :target-ref="menuAnchor"
      :position-active="menuOpen"
      :target-offset-y="MENU_OFFSET"
      :shift-padding="0"
      :active-module-id="activeMenuItem"
      aria-label="Modules"
      @item-click="onMenuItem"
      @item-bookmark-click="onBookmark"
      @dismiss="menuOpen = false"
      @close="closeMenu"
    >
      <template #item-icon="{ item, iconColor }">
        <component :is="item.icon" :size="20" :stroke-width="1.75" :color="iconColor" />
      </template>
    </StaticMegaMenu>

    <div class="flex flex-1 min-h-0">
      <SideNavV2
        class="hidden md:flex h-full shrink-0"
        :aria-label="currentTool.label"
        :module-list="rail"
        :selected-id="selectedNav"
        :selector-color="ACCENT.icon"
        @click="onNav"
      />

      <AppLayout
        class="flex-1 min-w-0"
        :left-panel-enabled="false"
        :right-panel-enabled="rightPanel"
        :right-panel-visible="rightPanel"
        :bottom-panel-enabled="bottomPanel"
        :bottom-panel-visible="bottomPanel"
        :bottom-panel-resizable="false"
        :bottom-panel-default-height="64"
        :bottom-panel-min-height="64"
        :no-bottom-padding="true"
        :scrollable-content="scrollableContent"
        :persist-preferences="false"
        :header-size="headerSize"
      >
        <template #header>
          <!-- Default: Title Bar / Page (title only). Detail and create screens pass their own (Title Bar / Workflow). -->
          <slot name="header">
            <span class="font-label font-bold text-fontsize-16 leading-lineheight-24 text-text-default">{{ title }}</span>
          </slot>
        </template>
        <template #header-actions>
          <slot name="header-actions" />
        </template>
        <template #content>
          <slot name="content" />
        </template>
        <template v-if="rightPanel" #right-panel>
          <slot name="right-panel" />
        </template>
        <template v-if="bottomPanel" #bottom-panel>
          <slot name="bottom-panel" />
        </template>
      </AppLayout>
    </div>
  </div>
</template>

<script>
import TopNavBar from '@/components/TopNavBar/index.vue';
import StaticMegaMenu from '@/components/MegaMenu/StaticMegaMenu/index.vue';
import DynamicMegaMenu from '@/components/MegaMenu/DynamicMegaMenu/index.vue';
import SideNavV2 from '@/componentsV2/SideNavV2/SideNavV2.vue';
import AppLayout from '@/componentsV2/AppLayout/AppLayout.vue';
import { Bookmark } from '@development/linarc-icons';
import { MODULE, ACCENT, TOOLS, RAILS, MEGA_MENU, QUICK_CREATE, PROJECTS, CURRENT_PROJECT, PLACES, USER } from './nav';
import { go, href, isBuilt } from './router';
import { accountWithSettings, overflowWithSettings, onAccountClick } from '~/modules/sandbox';
import { session, setBookmark } from '~/modules/session';

/** Gap (px) between the top nav and its menus: the module mega menu and the tool dropdowns line up. */
const MENU_OFFSET = 6;

export default {
  name: 'AppShell',
  components: { TopNavBar, StaticMegaMenu, DynamicMegaMenu, SideNavV2, AppLayout },
  props: {
    /** Screen name from router.js SCREENS; selects the tool and its rail item. */
    screen: { type: String, required: true },
    /** Page title for the default header (Title Bar / Page). */
    title: { type: String, required: true },
    /** Sets AppLayout's right panel enabled and visible (both are needed, F-046). */
    rightPanel: { type: Boolean, default: false },
    /** Fixed 64px bar under the content (step navigation on create screens). */
    bottomPanel: { type: Boolean, default: false },
    scrollableContent: { type: Boolean, default: false },
    /** `comfortable` (64px, Title Bar / Workflow Size=Comfortable) on detail and create screens with a back button
        (HeaderToolIcon type="back", D-25); list screens keep the 48px Title Bar / Page (`default`). */
    headerSize: { type: String, default: 'default' },
  },
  data() {
    // The tool whose rail lists this screen; the first tool otherwise.
    const owner = Object.keys(RAILS).find((tool) => RAILS[tool].some((i) => i.screen === this.screen));
    return {
      MODULE,
      ACCENT,
      QUICK_CREATE,
      PROJECTS,
      PLACES,
      USER,
      MENU_OFFSET,
      selectedTool: owner || TOOLS[0].id,
      menuOpen: false,
    };
  },
  computed: {
    /** MEGA_MENU with the session's bookmarks applied; a row whose tool has a built screen gets that screen's link
        (so open-in-new-tab works); the rest have no link (nothing to open in the prototype). */
    menuColumns() {
      return MEGA_MENU.map((column) => ({
        ...column,
        groups: column.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            const bookmarked = item.id in session.bookmarks ? session.bookmarks[item.id] : !!item.bookmarked;
            const screen = this.menuItemScreen(item.id);
            return { ...item, bookmarked, url: (screen && href(screen)) || '' };
          }),
        })),
      }));
    },
    /** Bookmarked rows in menu order, each keeping its section's icon colour. */
    bookmarkedItems() {
      return this.menuColumns.flatMap((column) =>
        column.groups.flatMap((group) =>
          group.items.filter((item) => item.bookmarked).map((item) => ({ iconColor: group.iconColor, ...item })),
        ),
      );
    },
    /** The mega-menu row of the tool on screen. */
    activeMenuItem() {
      return this.currentTool.menuItem || null;
    },
    account() {
      return accountWithSettings({ announcement: true, message: true, chatSupport: true, help: true, notifications: true, profile: true });
    },
    overflow() {
      return overflowWithSettings();
    },
    tools() {
      return TOOLS.map((t) => ({ ...t, isSelected: t.id === this.selectedTool }));
    },
    currentTool() {
      return TOOLS.find((t) => t.id === this.selectedTool) || TOOLS[0];
    },
    currentProject() {
      return PROJECTS.find((p) => p.value === CURRENT_PROJECT) || PROJECTS[0];
    },
    rail() {
      return RAILS[this.selectedTool] || [];
    },
    selectedNav() {
      const item = this.rail.find((i) => i.screen === this.screen);
      return item ? item.id : (this.rail[0] || {}).id;
    },
  },
  watch: {
    // Escape closes the menu while focus is still on the tile (the panel only hears keys from inside it).
    menuOpen(open) {
      document[open ? 'addEventListener' : 'removeEventListener']('keydown', this.onMenuKeydown);
    },
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onMenuKeydown);
  },
  methods: {
    onAccountClick,
    bookmarkIcon() {
      return Bookmark;
    },
    /** StaticMegaMenu's `targetRef`: the 82px module tile. */
    menuAnchor() {
      return this.$refs.topNav ? this.$refs.topNav.moduleIconEl() : null;
    },
    /** Close the module menu and give focus back to the tile it opened from. */
    closeMenu() {
      this.menuOpen = false;
      const tile = this.menuAnchor();
      const button = tile && tile.querySelector('[role="button"]');
      if (button) button.focus();
    },
    onMenuKeydown(e) {
      if (e.key === 'Escape') this.closeMenu();
    },
    /** First built screen of the tool a mega-menu row stands for, or null. */
    menuItemScreen(menuItem) {
      const tool = TOOLS.find((t) => t.menuItem === menuItem);
      const item = tool && (RAILS[tool.id] || []).find((i) => i.screen && isBuilt(i.screen));
      return item ? item.screen : null;
    },
    /** A row in the module or Bookmarks menu: open its tool's screen when the prototype has one, then close the menus.
        Areas outside this prototype stay where they are. */
    onMenuItem({ item } = {}) {
      this.menuOpen = false;
      const tools = this.$refs.topNav && this.$refs.topNav.$refs.projectTools;
      const bookmarks = tools && tools.$refs.bookmarksTools;
      if (bookmarks) bookmarks.closeDropdown();
      const tool = item && TOOLS.find((t) => t.menuItem === item.id);
      if (!tool) return;
      const screen = this.menuItemScreen(item.id);
      if (screen && screen !== this.screen) go(screen);
      else this.selectedTool = tool.id;
    },
    onBookmark({ id, bookmarked }) {
      setBookmark(id, bookmarked);
    },
    /** A top-nav tool opens its first built screen (Communication → Email from Drawings), as its mega-menu row does.
        A tool with no built screen, or the one already open, only shows its rail. */
    onTool({ id }) {
      const item = (RAILS[id] || []).find((i) => i.screen && isBuilt(i.screen));
      if (item && item.screen !== this.screen) go(item.screen);
      else if (RAILS[id]) this.selectedTool = id;
    },
    onNav({ id }) {
      const item = this.rail.find((i) => i.id === id);
      // Only screens that exist as prototypes navigate; the rest are inert until built.
      if (item && item.screen && item.screen !== this.screen && isBuilt(item.screen)) go(item.screen);
    },
    /** A Quick Create item: navigate when its create screen exists (name the screen `create-<id>` in router.js). */
    onCreate(item) {
      if (item && item.id) go(`create-${item.id}`);
    },
  },
};
</script>

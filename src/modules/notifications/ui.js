// Notifications: shell-level UI state that must survive a screen remount but not a reload (docs/notifications/spec.md §7):
// whether the Notifications drawer is open, and which Critical banners were dismissed this session (a dismissed banner
// never replays on navigation; the item itself stays). Not part of the demo session (nothing a person "did" to data).
import Vue from 'vue';

export const ui = Vue.observable({
  drawerOpen: false,
  dismissedBanners: [], // item keys
});

export const openDrawer = () => {
  ui.drawerOpen = true;
};
export const closeDrawer = () => {
  ui.drawerOpen = false;
};
export function dismissBanner(key) {
  if (!ui.dismissedBanners.includes(key)) ui.dismissedBanners.push(key);
}

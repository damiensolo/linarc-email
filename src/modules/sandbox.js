import Vue from 'vue';
import { HelpCircle, LogOut, Settings } from '@development/linarc-icons';

// Sandbox chrome visibility (the "Prototypes" bar in App.vue). Toggled by the settings gear in each screen's
// top nav (account rail, P-045; the hamburger drawer on narrow screens). Remembered per browser; ?chrome=0 starts hidden.
const KEY = 'linarc-prototypes:controls';

function initial() {
  if (new URLSearchParams(window.location.search).get('chrome') === '0') return false;
  try {
    return window.localStorage.getItem(KEY) !== 'hidden';
  } catch (e) {
    return true;
  }
}

export const sandbox = Vue.observable({ controls: initial() });

export function toggleControls() {
  sandbox.controls = !sandbox.controls;
  try {
    window.localStorage.setItem(KEY, sandbox.controls ? 'shown' : 'hidden');
  } catch (e) {
    // storage unavailable; the choice lasts for this page only
  }
}

/** Account rail config with the settings gear added; `show` = the screen's own account controls. */
export function accountWithSettings(show) {
  return {
    enabled: true,
    show: { ...show, settings: true },
    ariaLabels: { settings: sandbox.controls ? 'Hide prototype controls' : 'Show prototype controls' },
  };
}

/** Hamburger drawer actions (≤736px) with the same toggle, so it is reachable on a phone too. */
export function overflowWithSettings() {
  return {
    actions: [
      { id: 'help', label: 'Help', icon: HelpCircle },
      { id: 'settings', label: sandbox.controls ? 'Hide prototype controls' : 'Show prototype controls', icon: Settings },
      { id: 'logout', label: 'Logout', icon: LogOut },
    ],
  };
}

/** `account-click` handler for a top nav: the gear toggles the sandbox chrome. */
export function onAccountClick({ id } = {}) {
  if (id === 'settings') toggleControls();
}

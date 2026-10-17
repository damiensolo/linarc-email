import Vue from 'vue';
import PortalVue from 'portal-vue';
import Vuelidate from 'vuelidate';
import Vuex from 'vuex';
import moment from 'moment';
import './style.css';
// The demo session patches the shared mock data before any screen reads it (src/modules/session.js).
import '~/modules/session';
import App from './App.vue';

Vue.config.productionTip = false;

// Same globals the library's install() / Storybook preview register (src/build.js, .storybook/preview.js).
Vue.use(PortalVue);
// InputV2, SelectV2 and FormV2 validate through Vuelidate (`this.$v`); the library installs it in build.js. F-036.
Vue.use(Vuelidate);
Vue.prototype.$moment = moment;

// Components that read from the host app's Vuex store. Without a store the DatePicker (FormV2 `date` fields) threw on
// open and rendered as a 2px box (F-065). Same mocks as the library's Storybook preview.js; add a module here when
// another store-bound component appears (its getters are listed in preview.js).
Vue.use(Vuex);
const store = new Vuex.Store({
  modules: {
    DatePicker: {
      namespaced: true,
      state: { holidays: [], workingDays: ['0', '1', '2', '3', '4'] }, // Mon–Fri
      getters: {
        getHolidays: (state) => state.holidays,
        getWorkingDays: (state) => state.workingDays,
      },
    },
    // SpreadSheetV2
    grid: {
      namespaced: true,
      state: {},
      getters: {
        getViewFilters: () => () => [],
        getGroupViews: () => () => [],
        getFinalData: () => () => [],
        getFormattings: () => () => ({}),
        getCurrentViewId: () => () => '',
        getCurrentActivteView: () => () => ({}),
        getIsShared: () => () => false,
        getSearchQuery: () => () => '',
        getViewsColumns: () => () => [],
        getSortView: () => () => [],
        getGroupSorts: () => () => [],
        getAllViews: () => () => [],
        getPinnedViews: () => () => [],
        getPinnedViewIds: () => () => [],
      },
      actions: {
        updateGroups: () => {},
        updateFilters: () => {},
        updateSort: () => {},
        updateView: () => {},
        getTableViews: () => {},
        updateActiveView: () => {},
        getFilteredData: () => Promise.resolve([]),
      },
    },
    // Form (legacy)
    FormData: {
      namespaced: true,
      state: { formData: {} },
      getters: {
        getFormData: (state) => (formId) => state.formData[formId] || {},
        getFormDataById: (state) => (formId, fieldId) => (state.formData[formId] || {})[fieldId],
      },
      mutations: {
        SET_FORM_DATA(state, { formId, formData }) {
          state.formData = { ...state.formData, [formId]: formData };
        },
        UPDATE_FORM_DATA(state, { formId, formData }) {
          state.formData = { ...state.formData, [formId]: { ...(state.formData[formId] || {}), ...formData } };
        },
      },
      actions: {
        setFormData: ({ commit }, payload) => commit('SET_FORM_DATA', payload),
        updateFormData: ({ commit }, payload) => commit('UPDATE_FORM_DATA', payload),
      },
    },
  },
});

// TopNavBar and ToolsItem use <Teleport>, which Vue 2.7 doesn't have and the library never registers. Render its
// children in place so the nav works without an unknown-element warning. F-016.
Vue.component('Teleport', {
  functional: true,
  render: (h, ctx) => ctx.children,
});

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');

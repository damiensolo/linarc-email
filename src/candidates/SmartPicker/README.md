# SmartPicker (candidate)

Proposal, anatomy, tokens and behaviour: `docs/components/SmartPicker.md` (D-61). Import as `~/candidates/SmartPicker/SmartPicker.vue`.

A search-first picker for records and files: a search box that ranks matches as you type (title, code, keywords, description), a checkbox per kind with live counts (all on; untick to hide), the list grouped as Suggested, Recent and then by kind while nothing is typed in a fixed-height card, a checkbox per row and removable chips on an always-present line when `multiple`, and an empty state that says how to widen the search. Nothing moves while it is used (D-62). It fills the body of a ModalV2 `size="md"` (D-34, P-059); the host owns the primary button.

```vue
<ModalV2 :is-visible="open" size="md" title="Attach a record" :primary-label="`Attach ${ids.length || ''}`" :primary-disabled="!ids.length" @onPrimaryClick="attach">
  <template #modal-body>
    <SmartPicker v-model="ids" :items="records" :kinds="RECORD_KINDS" noun="records" placeholder="Search by code or title" multiple />
  </template>
</ModalV2>
```

```js
// items: what the host knows, resolved; the picker holds no module data
records = [
  { id: 'RFI-143', kind: 'rfi', label: 'RFI-143 · Level 3 ceiling cove vs HVAC trunk', chipLabel: 'RFI-143', description: '09 51 00 · Acoustical Ceilings · With Studio West', meta: 'RFI', keywords: ['RFI143'], suggested: true },
  { id: 'A-302-Rev3', kind: 'drawing', label: 'A-302 · Level 3 Reflected Ceiling Plan', chipLabel: 'A-302 · Rev 3', description: 'Architectural · Rev 3', meta: 'Drawing', recent: true },
];
kinds = [{ id: 'rfi', label: 'RFIs' }, { id: 'drawing', label: 'Drawings' }];
```

| Prop | Default | Notes |
|---|---|---|
| `value` | `null` | v-model: the picked id, or the picked ids in pick order when `multiple` |
| `items` | `[]` | `[{ id, label, description?, meta?, kind?, keywords?, chipLabel?, suggested?, recent? }]` |
| `kinds` | `[]` | `[{ id, label }]` kind checkboxes in order, all on at first; empty hides them |
| `multiple` | `false` | checkbox rows, Enter toggles, picks as removable chips on a line that is always there |
| `placeholder` | `'Search'` | |
| `noun` | `'items'` | accessible names and the empty state: *records*, *files* |
| `suggestedLabel` / `recentLabel` | `'Suggested'` / `'Recent'` | group headings while nothing is typed |
| `visibleRows` | `6` | the list's fixed height in rows (56px each); the pickers use 5 |
| `maxResults` | `50` | most rows for one query |
| `autofocus` | `true` | focus the search box on mount |

Events: `input` (the id or ids), `pick` (the item, single mode).

Ranking (`smartPicker.js`): every word of the query must match; the label at a word start counts most, then keywords and the description; a word also matches the compacted text, so `rfi143` and `143` find *RFI-143*. Suggested, then recent items win ties.

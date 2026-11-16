# RecipientField (candidate)

Proposal, anatomy, tokens and behaviour: `docs/components/RecipientField.md` (D-47). Import as `~/candidates/RecipientField/RecipientField.vue`.

An address field with input chips: typeahead over a directory, chips for internal / external / invalid recipients, keyboard editing (Enter, Tab, comma, paste, Backspace cascade, double-click to edit, ⌘C / ⌘X), drag between fields of a group, and a chip menu (View contact, Copy, Show email address, Move to…, Edit, Remove).

```vue
<RecipientField
  v-model="to"
  label="To"
  :contacts="directory"
  :internal-domains="['vanguard-gc.com']"
  :allow-unknown="false"
  group="compose"
  :move-targets="[{ id: 'cc', label: 'Cc' }, { id: 'bcc', label: 'Bcc' }]"
  @move="({ recipient, to }) => addTo(to, recipient)"
>
  <template #trailing><Button label="Bcc" variant="text" size="small" @onClick="showBcc = true" /></template>
</RecipientField>
```

| Prop | Default | Notes |
|---|---|---|
| `value` | `[]` | `[{ email, name?, company?, role?, avatarUrl?, id?, invalid? }]` (v-model) |
| `label` | `'To'` | leading label inside the field |
| `groups` | `[]` | distribution lists as one chip each (D-75): `[{ id, name, members, own? }]`; an `own` group is offered before anything is typed; expand with `expandRecipients` on send |
| `contacts` | `[]` | directory for the typeahead; empty query keeps this order |
| `internalDomains` | `[]` | other domains get the amber chip |
| `organizationName` | `''` | external tooltip: *Outside {organizationName}* |
| `showAvatar` | `true` | avatars on chips and list rows |
| `allowUnknown` | `true` | `false` → `unknown` event instead of a chip |
| `unknownActionLabel` | `''` | list row offered for an unknown address when the page adds people itself (`'Add {email}'`); empty → no row |
| `unknownMessage` | *{email} isn't in the project directory. Only people on the project can be emailed; add them in My Team › Guests first.* | shown in the list (and announced) for an unknown address when there is no action; the text stays in the field |
| `group` | `'recipients'` | drag-and-drop group |
| `moveTargets` | `[]` | *Move to …* menu rows |
| `suggestOnFocus` | `true` | list on focus with an empty query |
| `maxSuggestions` | `8` | |
| `placeholder` | `''` | shown only while the field is empty |
| `error` | `false` | Boolean: the error outline; the page says what is wrong next to it |
| `disabled` | `false` | |

Events: `input`, `unknown { email, name }`, `move { recipient, to }`, `focus`, `blur`. Slot: `trailing`.

Pure helpers in `recipients.js` (`isEmail`, `domainOf`, `parseToken`, `splitTokens`, `kindOf`, `matchContacts`, `toClipboardText`; for groups `isGroup`, `asGroupRecipient`, `matchGroups`, `expandRecipients`, D-75) are exported for pages and tests. A group chip carries `data-group-chip`, its typeahead row `data-group-option`.

Each chip sits in the library Tooltip (external: why it's amber; internal: the address; invalid: how to fix it).

Library parts it relies on (P-050): `StatusChip` `avatarInitials`, `Avatar` `size="xs"`, `SelectV2ListItem` detailed row with `option.avatarInitials`.

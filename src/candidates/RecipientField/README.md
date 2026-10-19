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
  unknown-action-label="Add {email} as a guest user…"
  group="compose"
  :move-targets="[{ id: 'cc', label: 'Cc' }, { id: 'bcc', label: 'Bcc' }]"
  @unknown="openGuestForm"
  @move="({ recipient, to }) => addTo(to, recipient)"
>
  <template #trailing><Button label="Bcc" variant="text" size="small" @onClick="showBcc = true" /></template>
</RecipientField>
```

| Prop | Default | Notes |
|---|---|---|
| `value` | `[]` | `[{ email, name?, company?, role?, avatarUrl?, id?, invalid? }]` (v-model) |
| `label` | `'To'` | leading label inside the field |
| `contacts` | `[]` | directory for the typeahead; empty query keeps this order |
| `internalDomains` | `[]` | other domains get the amber chip |
| `organizationName` | `''` | external tooltip: *Outside {organizationName}* |
| `showAvatar` | `true` | avatars on chips and list rows |
| `allowUnknown` | `true` | `false` → `unknown` event instead of a chip |
| `unknownActionLabel` | `'Add {email}'` | list row for an unknown address |
| `group` | `'recipients'` | drag-and-drop group |
| `moveTargets` | `[]` | *Move to …* menu rows |
| `suggestOnFocus` | `true` | list on focus with an empty query |
| `maxSuggestions` | `8` | |
| `placeholder`, `error`, `disabled` | | |

Events: `input`, `unknown { email, name }`, `move { recipient, to }`, `focus`, `blur`. Slot: `trailing`.

Pure helpers in `recipients.js` (`isEmail`, `parseToken`, `splitTokens`, `kindOf`, `matchContacts`, `toClipboardText`) are exported for pages and tests.

Each chip sits in the library Tooltip (external: why it's amber; internal: the address; invalid: how to fix it).

Library parts it relies on (P-050): `StatusChip` `avatarInitials`, `Avatar` `size="xs"`, `SelectV2ListItem` detailed row with `option.avatarInitials`.

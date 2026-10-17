# ThreadStream (candidate)

Proposal and rules: `docs/components/ThreadStream.md` (D-17, D-38). Import as `~/candidates/ThreadStream/ThreadStream.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `entries` | Array | `[]` | resolved entries, oldest first (shape below); the screen applies the role first |
| `highlightId` | String | `''` | the entry kept highlighted while a panel acts on it |
| `loading` | Boolean | `false` | three skeleton entries |
| `emptyText` | String | `'No messages yet.'` | or the `empty` slot |

Entry shapes:
- message `{ id, type: 'message', direction, sender: { name, company, initials }, sentAt, body, toText?, attachments: [{ id, name, sizeMb, byLink }], delivery?: { label, tone }, bounce?: { email, reason, resolved }, resendOf? }`
- note `{ id, type: 'note', sender, sentAt, body }`
- event `{ id, type: 'event', sentAt, text, recordId? }`

Slots: `message-actions` (scoped `entry`), `bounce-actions` (scoped `entry`), `empty`. Events: `open-attachment` (file), `navigate` (recordId).
The mapper from module data to this shape is `src/modules/correspondence/view.js`.

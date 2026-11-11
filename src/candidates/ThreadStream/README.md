# ThreadStream (candidate)

Proposal and rules: `docs/components/ThreadStream.md` (D-17, D-38). Import as `~/candidates/ThreadStream/ThreadStream.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `entries` | Array | `[]` | resolved entries, oldest first (shape below); the screen applies the role first |
| `highlightId` | String | `''` | the entry kept highlighted while a panel acts on it |
| `loading` | Boolean | `false` | three skeleton entries |
| `emptyText` | String | `'No messages yet.'` | or the `empty` slot |

Entry shapes:
- message `{ id, type: 'message', direction, sender: { name, company, initials, avatarUrl? }, sentAt, body, bodyHtml?, links?: [{ url, name? }], toText?, attachments: [{ id, name, sizeMb, byLink, thumbnailUrl? }], delivery?: { label, tone }, bounce?: { email, reason, resolved }, resendOf? }` (`bodyHtml` is rendered when the message was written in the composer, else `body`; `links` are listed under the body)
- note `{ id, type: 'note', sender, sentAt, body, bodyHtml? }`
- event `{ id, type: 'event', sentAt, text, recordId? }`

Slots: `message-actions` (scoped `entry`), `bounce-actions` (scoped `entry`), `empty`. Events: `open-attachment` (file, the message's files, index), `download-attachment` (file), `navigate` (recordId). Files render as the library's `AttachmentThumbnail` tiles (P-048) with a name / size caption; the screen opens them in `FileViewer`.
The mapper from module data to this shape is `src/modules/correspondence/view.js`.

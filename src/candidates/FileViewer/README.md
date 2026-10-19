# FileViewer (candidate)

Proposal and rules: `docs/components/FileViewer.md` (D-45). Import as `~/candidates/FileViewer/FileViewer.vue`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | Boolean | `false` | |
| `files` | Array | `[]` | `[{ id, name, url, kind?, posterUrl?, meta? }]`; `kind` image · pdf · video · other, from the extension by default |
| `index` | Number | `0` | the file shown; use `:index.sync` |

Events: `close`, `update:index`, `download` (file), `view` (file, each time one is shown). Named export `fileKind(file)`.

```vue
<FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="viewer.open = false" @download="save" />
```

The correspondence screens use it through `src/modules/correspondence/fileViewing.js` (state, open, download).

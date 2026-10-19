// Opening and downloading files on a correspondence screen: the state FileViewer needs and what its events do.
// Mixed into the screens that show attachments (thread, the RFI Email tab, the secure link page):
//   <ThreadStream @open-attachment="openFiles" @download-attachment="downloadFile" … />
//   <FileViewer :open="viewer.open" :files="viewer.files" :index.sync="viewer.index" @close="closeFiles" @download="downloadFile" />
// Files are fileView() objects (view.js).

/** Save a file through the browser (same-origin URLs and object URLs keep their name). */
export function saveFile(file) {
  if (!file || !file.url) return;
  const a = document.createElement('a');
  a.href = file.url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const fileViewing = {
  data() {
    return { viewer: { open: false, files: [], index: 0 } };
  },
  methods: {
    /** Open `file` in the viewer, stepping through `files` (the message's set) when given. */
    openFiles(file, files = [file], index = files.indexOf(file)) {
      this.viewer = { open: true, files, index: Math.max(0, index) };
    },
    closeFiles() {
      this.viewer = { ...this.viewer, open: false };
    },
    downloadFile(file) {
      saveFile(file);
    },
  },
};

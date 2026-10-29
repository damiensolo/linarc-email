// PLACEHOLDER DATA
// The project's connected drives as the composer's *Choose from cloud drive* lists them (docs/correspondence/spec.md
// §7). A pick is copied in as a file (actions.js `cloudAttachment`: a generated PDF in the file store), so it opens,
// previews and downloads like any other attachment; the size shown is the drive's, so a big file goes by secure link.
export const CLOUD_FILES = Object.freeze([
  { id: 'cloud-1', provider: 'Google Drive', folder: 'RMC-04 / Structural', name: 'Level 3 deck pour sequence.pdf', title: 'Level 3 deck pour sequence, Rev B', sizeMb: 1.8, modified: '14 Oct 2026' },
  { id: 'cloud-2', provider: 'OneDrive', folder: 'RMC-04 / Site logistics', name: 'Site logistics plan Rev C.pdf', title: 'Site logistics plan, Rev C (crane and laydown)', sizeMb: 4.2, modified: '9 Oct 2026' },
  { id: 'cloud-3', provider: 'Dropbox', folder: 'Owner / Imaging suite', name: 'Imaging suite equipment cut sheets.pdf', title: 'Imaging suite equipment cut sheets (MRI, CT)', sizeMb: 26.5, modified: '2 Oct 2026' },
]);

export const cloudFile = (id) => CLOUD_FILES.find((f) => f.id === id) || null;

/** The connected drives as the picker's quick filters (SmartPicker `kinds`). */
export const CLOUD_KINDS = Object.freeze(
  CLOUD_FILES.map((f) => f.provider).filter((p, i, arr) => arr.indexOf(p) === i).map((p) => ({ id: p, label: p })),
);

/** Every drive file as a SmartPicker item (D-61): name, folder and date, size (and whether it goes by secure link). */
export function pickerCloudFiles(limitMb) {
  return CLOUD_FILES.map((f) => ({
    id: f.id,
    kind: f.provider,
    label: f.name,
    chipLabel: f.name,
    description: `${f.folder} · ${f.modified}`,
    meta: `${f.sizeMb} MB${limitMb && f.sizeMb > limitMb ? ' · by secure link' : ''}`,
    keywords: [f.provider, f.title],
  }));
}

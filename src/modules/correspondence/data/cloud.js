// PLACEHOLDER DATA
// The project's drives as the composer's *Choose from cloud drive* lists them (docs/correspondence/spec.md §7):
// Linarc Drive (the project's own files) first, then the connected drives, in this order (2026-10-28). A pick is
// copied in as a file (actions.js `cloudAttachment`: a generated PDF in the file store), so it opens, previews and
// downloads like any other attachment; the size shown is the drive's, so a big file goes by secure link.
export const CLOUD_FILES = Object.freeze([
  { id: 'cloud-0', provider: 'Linarc Drive', folder: 'RMC-04 / Submittals', name: 'SUB-088 door hardware schedule Rev 1.pdf', title: 'SUB-088 patient room card-reader door hardware schedule, Rev 1', sizeMb: 2.4, modified: '20 Oct 2026' },
  { id: 'cloud-4', provider: 'Linarc Drive', folder: 'RMC-04 / Meeting minutes', name: 'OAC meeting minutes 21 Oct 2026.pdf', title: 'Owner-architect-contractor meeting minutes, 21 Oct 2026', sizeMb: 0.6, modified: '22 Oct 2026' },
  { id: 'cloud-1', provider: 'Google Drive', folder: 'RMC-04 / Structural', name: 'Level 3 deck pour sequence.pdf', title: 'Level 3 deck pour sequence, Rev B', sizeMb: 1.8, modified: '14 Oct 2026' },
  { id: 'cloud-2', provider: 'OneDrive', folder: 'RMC-04 / Site logistics', name: 'Site logistics plan Rev C.pdf', title: 'Site logistics plan, Rev C (crane and laydown)', sizeMb: 4.2, modified: '9 Oct 2026' },
  { id: 'cloud-3', provider: 'Dropbox', folder: 'Owner / Imaging suite', name: 'Imaging suite equipment cut sheets.pdf', title: 'Imaging suite equipment cut sheets (MRI, CT)', sizeMb: 26.5, modified: '2 Oct 2026' },
]);

export const cloudFile = (id) => CLOUD_FILES.find((f) => f.id === id) || null;

/** The drives as the picker's kind checkboxes (SmartPicker `kinds`): Linarc Drive first, then the connected drives. */
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

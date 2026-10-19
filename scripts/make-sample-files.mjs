// Writes the sample PDFs the correspondence mock attachments point at (public/files/). PLACEHOLDER DATA: drawn to be
// plausible, not real engineering. Run once after changing a drawing below: `node scripts/make-sample-files.mjs`.
// The images and the site-walk clip in public/files/ are not generated here (see docs/prototypes/correspondence-thread.md
// › Sample files).
import fs from 'fs';
import path from 'path';
import { makePdf, wrap } from '../src/modules/mock/pdf.js';

const OUT = path.resolve('public/files');
fs.mkdirSync(OUT, { recursive: true });
const TABLOID = [1224, 792];

const text = (x, y, t, size = 10, extra = {}) => ({ t: 'text', x, y, text: t, size, ...extra });
const line = (x1, y1, x2, y2, extra = {}) => ({ t: 'line', x1, y1, x2, y2, ...extra });
const rect = (x, y, w, h, extra = {}) => ({ t: 'rect', x, y, w, h, ...extra });

/** Sheet border and a title block along the bottom right, as on a shop drawing. */
function sheetFrame([w, h], { firm, title, number, date, by }) {
  const bx = w - 360;
  return [
    rect(18, 18, w - 36, h - 36, { width: 1.5 }),
    rect(bx, 18, 342, 110, { width: 1 }),
    line(bx, 92, w - 18, 92, { width: 0.5 }),
    line(bx, 56, w - 18, 56, { width: 0.5 }),
    line(bx + 220, 18, bx + 220, 56, { width: 0.5 }),
    text(bx + 10, 106, firm, 11, { bold: true }),
    text(bx + 10, 74, title, 9),
    text(bx + 10, 38, `Drawn ${by} · ${date}`, 8, { gray: 0.35 }),
    text(bx + 10, 26, 'Riverside Medical Center - North Tower (RMC-04)', 7, { gray: 0.35 }),
    text(bx + 230, 36, number, 14, { bold: true }),
  ];
}

/** A horizontal dimension string with ticks and a label above. */
function dimH(x1, x2, y, label) {
  return [line(x1, y, x2, y, { width: 0.5 }), line(x1, y - 5, x1, y + 5, { width: 0.5 }), line(x2, y - 5, x2, y + 5, { width: 0.5 }), text((x1 + x2) / 2 - label.length * 2.4, y + 6, label, 8)];
}
function dimV(x, y1, y2, label) {
  return [line(x, y1, x, y2, { width: 0.5 }), line(x - 5, y1, x + 5, y1, { width: 0.5 }), line(x - 5, y2, x + 5, y2, { width: 0.5 }), text(x + 8, (y1 + y2) / 2 - 3, label, 8)];
}

// 1. Apex's beam penetration sketch (THR-1042, msg-1042-2)
function beamSketch() {
  const ops = [
    ...sheetFrame(TABLOID, { firm: 'APEX MECHANICAL SYSTEMS', title: 'W24x68 web penetration - Grid B-4, Level 3', number: 'SK-M-014', date: 'Oct 14', by: 'D. Okafor' }),
    text(48, 740, 'ELEVATION - BEAM W24x68 AT GRID B-4 (LOOKING NORTH)', 12, { bold: true }),
    text(48, 724, 'Scale: 1" = 1\'-0" (for coordination only - not for fabrication)', 8, { gray: 0.35 }),
  ];
  // Beam: top flange, web, bottom flange (24" deep → 240pt, 9" flange)
  const x0 = 120;
  const x1 = 760;
  const top = 600;
  const bot = 360;
  ops.push(rect(x0, top - 14, x1 - x0, 14, { fill: 0.85, width: 1 }));
  ops.push(rect(x0, bot, x1 - x0, 14, { fill: 0.85, width: 1 }));
  ops.push(line(x0, top - 14, x0, bot + 14, { width: 1 }), line(x1, top - 14, x1, bot + 14, { width: 1 }));
  // Neutral axis and the 10" opening with its reinforcing ring
  const cx = 440;
  const cy = (top + bot) / 2;
  ops.push(line(x0 - 30, cy, x1 + 30, cy, { width: 0.5, dash: true, gray: 0.4 }), text(x1 + 34, cy - 3, 'N.A.', 8, { gray: 0.4 }));
  ops.push({ t: 'circle', x: cx, y: cy, r: 50, width: 2 }, { t: 'circle', x: cx, y: cy, r: 66, width: 1, gray: 0.3 });
  ops.push(text(cx - 26, cy - 3, '10" DIA', 9, { bold: true }));
  // Duct passing through
  ops.push(rect(cx - 260, cy - 44, 520, 88, { width: 0.75, gray: 0.5 }));
  ops.push(text(cx - 250, cy + 50, '18" SUPPLY TRUNK - TRANSITION TO 10" ROUND THROUGH WEB', 8, { gray: 0.45 }));
  ops.push(...dimV(x0 - 40, bot, top, '24" (W24x68)'));
  ops.push(...dimH(x0, cx, bot - 40, '4\'-2" FROM COL. FACE'));
  ops.push(...dimH(cx - 66, cx + 66, top + 30, '13" RING O.D.'));
  // Notes
  const notes = [
    '1. Opening centred on the beam neutral axis; min. clear distance to flanges 7".',
    '2. 3/8" x 1-1/2" reinforcing ring plate, both faces, 1/4" fillet all round (by others).',
    '3. Duct transitions 18"x14" rect to 10" round 2\'-0" each side of beam; static pressure checked, see calc M-14.',
    '4. Penetration subject to approval by Thornton Structural Engineers (EOR). Do not cut until approved.',
    '5. Acoustic cove framing in Corridor 3E holds at +9\'-6" AFF per A-302 Rev 3.',
  ];
  ops.push(text(48, 280, 'NOTES', 10, { bold: true }));
  notes.forEach((nt, i) => ops.push(text(48, 262 - i * 15, nt, 9)));
  ops.push(rect(900, 640, 270, 90, { width: 1, gray: 0.6 }), text(912, 712, 'FOR REVIEW', 14, { bold: true, gray: 0.5 }), text(912, 694, 'Issued to Vanguard for RFI', 9, { gray: 0.5 }), text(912, 680, 'with EOR - Oct 14', 9, { gray: 0.5 }));
  return makePdf({ title: 'Apex W24 beam penetration sketch - Grid B-4', pages: [{ size: TABLOID, ops }] });
}

// 2. Submittal SUB-088 power supply revision (THR-1031)
function sub088() {
  const head = (ops, page) => [
    text(54, 750, 'SUBMITTAL SUB-088 - 08 71 00 Door Hardware', 9, { gray: 0.35 }),
    text(470, 750, `Page ${page} of 3`, 9, { gray: 0.35 }),
    line(54, 742, 558, 742, { width: 0.5, gray: 0.6 }),
    ...ops,
  ];
  const cover = head(
    [
      text(54, 700, 'Card-reader door hardware - 24V power supply', 18, { bold: true }),
      text(54, 678, 'Revision 1 · Patient rooms, Level 2', 12, { gray: 0.3 }),
      ...[
        ['Project', 'Riverside Medical Center - North Tower Expansion (RMC-04)'],
        ['Submitted by', 'Secure Access Hardware Co. - via Vanguard Construction Group'],
        ['Spec section', '08 71 00 Door Hardware; 28 13 00 Access Control'],
        ['Revision', 'Rev 1 supersedes Rev 0 (12V supply)'],
        ['Reason', 'Electrified mortise locks specified at 24VDC; Rev 0 listed a 12VDC supply.'],
        ['Action requested', 'Owner acknowledgement before hardware fabrication release.'],
      ].flatMap(([k, v], i) => [text(54, 630 - i * 26, k, 9, { bold: true, gray: 0.35 }), text(180, 630 - i * 26, v, 10)]),
      rect(54, 300, 504, 120, { width: 0.75, gray: 0.6 }),
      text(66, 400, 'REVIEW STAMP', 9, { bold: true, gray: 0.5 }),
      text(66, 380, '[ ] Reviewed - no exceptions   [ ] Make corrections noted   [ ] Revise and resubmit', 9, { gray: 0.4 }),
      text(66, 330, 'Reviewer: ____________________     Date: ____________', 9, { gray: 0.4 }),
    ],
    1,
  );
  const rows = [
    ['Door', 'Lock', 'Reader', 'Supply', 'Draw (A)'],
    ['L2-201', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-203', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-205', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-207', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-209', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-211', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-213', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
    ['L2-215', 'ML20900 EL', 'R10 iCLASS', 'PS902 24V', '0.45'],
  ];
  const cols = [54, 140, 250, 360, 470];
  const schedule = head(
    [
      text(54, 710, 'Hardware schedule - patient room doors (excerpt)', 14, { bold: true }),
      ...rows.flatMap((r, i) => [
        ...(i === 0 ? [rect(54, 668 - i * 24, 504, 22, { fill: 0.9, width: 0 })] : [line(54, 668 - i * 24, 558, 668 - i * 24, { width: 0.4, gray: 0.75 })]),
        ...r.map((c, j) => text(cols[j] + 6, 675 - i * 24, c, 9, { bold: i === 0 })),
      ]),
      text(54, 420, 'Rough-in: single-gang box at 48" AFF on the latch side, 6" from the frame (revised from 42").', 9),
      text(54, 404, 'Changed in Rev 1 are the supply and the reader box height; lock hardware is unchanged.', 9, { gray: 0.35 }),
    ],
    2,
  );
  const sheet = head(
    [
      text(54, 710, 'Product data - PS902 power supply', 14, { bold: true }),
      ...wrap(
        'Regulated, filtered 24VDC 2A power supply with fire-alarm interface and battery charging. Supports up to four electrified locks on independent PTC-protected outputs. UL 294 and UL 603 listed. Enclosure 11" x 11" x 4", mounts above the ceiling within 50 ft of the door, served from the nearest life-safety branch circuit.',
        90,
      ).map((l, i) => text(54, 680 - i * 14, l, 10)),
      rect(54, 420, 220, 160, { width: 1, gray: 0.5 }),
      rect(74, 440, 180, 120, { width: 0.5, gray: 0.6 }),
      text(120, 495, 'PS902 enclosure', 9, { gray: 0.5 }),
    ],
    3,
  );
  return makePdf({ title: 'SUB-088 24V power supply Rev 1', pages: [{ ops: cover }, { ops: schedule }, { ops: sheet }] });
}

// 3. Sample file a simulated inbound mail can carry
function shopMarkup() {
  const ops = [...sheetFrame(TABLOID, { firm: 'SUNSTATE CEILINGS', title: 'Corridor 3E ceiling - field markup', number: 'SD-C-301', date: 'Oct 15', by: 'R. Diaz' })];
  ops.push(text(48, 740, 'REFLECTED CEILING PLAN - CORRIDOR 3E (PARTIAL)', 12, { bold: true }));
  // Grid lines A–D / 3–5
  ['A', 'B', 'C', 'D'].forEach((g, i) => {
    const x = 160 + i * 200;
    ops.push(line(x, 180, x, 700, { width: 0.5, dash: true, gray: 0.55 }), { t: 'circle', x, y: 712, r: 12, width: 0.75 }, text(x - 3, 708, g, 10, { bold: true }));
  });
  ['3', '4', '5'].forEach((g, i) => {
    const y = 620 - i * 200;
    ops.push(line(100, y, 820, y, { width: 0.5, dash: true, gray: 0.55 }), { t: 'circle', x: 84, y, r: 12, width: 0.75 }, text(81, y - 4, g, 10, { bold: true }));
  });
  ops.push(rect(140, 360, 700, 120, { width: 1.5 }), text(150, 466, 'ACOUSTIC BAFFLE CEILING +9\'-6" AFF', 9));
  ops.push(rect(310, 380, 140, 80, { width: 2.5, gray: 0.15 }), text(320, 444, 'HOLD - DUCT CLASH', 10, { bold: true }), text(320, 430, 'see SK-M-014', 9));
  ops.push(text(870, 600, 'Field notes', 11, { bold: true }));
  ['Track hanging starts Monday.', 'Bay at B-4 held until the', 'duct reroute is approved.', 'All other bays proceed.'].forEach((t, i) => ops.push(text(870, 582 - i * 14, t, 9)));
  return makePdf({ title: 'Corridor 3E ceiling field markup', pages: [{ size: TABLOID, ops }] });
}

const files = {
  'Apex_W24_Beam_Penetration_Sketch_B4.pdf': beamSketch(),
  'SUB-088_24V_Power_Supply_Rev1.pdf': sub088(),
  'Shop_Drawing_Markup.pdf': shopMarkup(),
};
Object.entries(files).forEach(([name, pdf]) => {
  fs.writeFileSync(path.join(OUT, name), Buffer.from(pdf, 'latin1'));
  console.log(`public/files/${name}`);
});

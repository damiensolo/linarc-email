// A tiny PDF writer for prototype files: Helvetica text, lines and rectangles, any number of pages. Enough to give
// mock attachments real content the File viewer can show (the browser's own PDF viewer renders it). Plain ES module
// with no imports, so scripts/make-sample-files.mjs uses it in Node and screens use it in the browser.
//
// A page is { size: [width, height] (points, default US Letter), ops: [...] } and an op is one of
//   { t: 'text', x, y, text, size = 10, bold = false, gray = 0 }   (y from the bottom, as PDF draws)
//   { t: 'line', x1, y1, x2, y2, width = 1, gray = 0, dash = false }
//   { t: 'rect', x, y, w, h, width = 1, gray = 0, fill = null }     (fill: a gray level 0–1, stroke skipped when null width)
//   { t: 'circle', x, y, r, width = 1, gray = 0 }
// Returns the file as a binary string (Latin-1); `pdfBlob()` wraps it for the browser.

const LETTER = [612, 792];

// The standard fonts only cover Latin-1; typographic marks a mock text may carry become ASCII.
const ascii = (s) =>
  String(s)
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/×/g, 'x')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7E]/g, '');
const esc = (s) => ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const n = (v) => Number(v.toFixed(2));

function opStream(op) {
  const g = n(op.gray || 0);
  switch (op.t) {
    case 'text':
      return `BT ${g} g /${op.bold ? 'F2' : 'F1'} ${op.size || 10} Tf ${n(op.x)} ${n(op.y)} Td (${esc(op.text)}) Tj ET`;
    case 'line':
      return `${n(op.width || 1)} w ${g} G ${op.dash ? '[4 3] 0 d' : '[] 0 d'} ${n(op.x1)} ${n(op.y1)} m ${n(op.x2)} ${n(op.y2)} l S`;
    case 'rect': {
      const box = `${n(op.x)} ${n(op.y)} ${n(op.w)} ${n(op.h)} re`;
      if (op.fill != null) return `${n(op.fill)} g ${box} f${op.width ? ` ${n(op.width)} w ${g} G [] 0 d ${box} S` : ''}`;
      return `${n(op.width || 1)} w ${g} G [] 0 d ${box} S`;
    }
    case 'circle': {
      // Four Bézier arcs (k = 0.5523).
      const { x, y, r } = op;
      const k = r * 0.5523;
      return [
        `${n(op.width || 1)} w ${g} G [] 0 d ${n(x + r)} ${n(y)} m`,
        `${n(x + r)} ${n(y + k)} ${n(x + k)} ${n(y + r)} ${n(x)} ${n(y + r)} c`,
        `${n(x - k)} ${n(y + r)} ${n(x - r)} ${n(y + k)} ${n(x - r)} ${n(y)} c`,
        `${n(x - r)} ${n(y - k)} ${n(x - k)} ${n(y - r)} ${n(x)} ${n(y - r)} c`,
        `${n(x + k)} ${n(y - r)} ${n(x + r)} ${n(y - k)} ${n(x + r)} ${n(y)} c S`,
      ].join(' ');
    }
    default:
      return '';
  }
}

/** Build a PDF. `title` goes into the document info (the browser viewer's tab title). */
export function makePdf({ title = 'Document', pages = [] } = {}) {
  const objects = []; // index i → object i + 1
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalog = add(null);
  const pagesObj = add(null);
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const info = add(`<< /Title (${esc(title)}) /Producer (Linarc prototype) >>`);
  const kids = pages.map((p) => {
    const [w, h] = p.size || LETTER;
    const stream = p.ops.map(opStream).filter(Boolean).join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  let out = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

/** Wrap a PDF string as a Blob (browser). */
export function pdfBlob(pdf) {
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Break text into lines of at most `max` characters (Helvetica 10pt ≈ 95 characters on a Letter page). */
export function wrap(text, max = 95) {
  return ascii(text)
    .split('\n')
    .flatMap((para) => {
      const lines = [];
      let line = '';
      para.split(/\s+/).forEach((word) => {
        if ((line + ' ' + word).trim().length > max) {
          lines.push(line);
          line = word;
        } else line = (line + ' ' + word).trim();
      });
      lines.push(line);
      return lines;
    });
}

/**
 * Today's "Attach a PDF of the record": one Letter page with the project header, the record's code and title, and
 * its fields as label / value rows. `fields` is [[label, value], …]; long values wrap.
 */
export function recordPdf({ project, code, title, fields = [] }) {
  const ops = [
    { t: 'text', x: 54, y: 742, text: project, size: 9, gray: 0.4 },
    { t: 'text', x: 54, y: 716, text: code, size: 18, bold: true },
    ...wrap(title, 70).map((l, i) => ({ t: 'text', x: 54, y: 694 - i * 16, text: l, size: 12 })),
    { t: 'line', x1: 54, y1: 668, x2: 558, y2: 668, width: 0.5, gray: 0.7 },
  ];
  let y = 644;
  fields.forEach(([label, value]) => {
    ops.push({ t: 'text', x: 54, y, text: label, size: 9, bold: true, gray: 0.35 });
    wrap(value || '-', 78).forEach((l) => {
      ops.push({ t: 'text', x: 180, y, text: l, size: 10 });
      y -= 14;
    });
    y -= 8;
  });
  ops.push({ t: 'text', x: 54, y: 40, text: `${code} - generated from Linarc`, size: 8, gray: 0.5 });
  return makePdf({ title: `${code} ${title}`, pages: [{ ops }] });
}

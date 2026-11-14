#!/usr/bin/env node
// Usage: node generate.js <template.pdf> <names.csv> [--font file.ttf] [--out dir]
// The template needs a fillable text field named "full_name"; its position, size and alignment are used as-is.
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { parse } = require('csv-parse/sync');

const FIELD = 'full_name';
// shortcut: static fonts only, variable .ttf files render unreliably in pdf-lib
const DEFAULT_FONT = path.join(__dirname, 'fonts', 'static', 'GoogleSans-SemiBold.ttf');

async function generate({ template, csv, font = DEFAULT_FONT, out = 'output' }) {
  const rows = parse(fs.readFileSync(csv, 'utf8'), { columns: true, bom: true, skip_empty_lines: true, trim: true });
  if (!rows.length || !(FIELD in rows[0])) throw new Error(`CSV needs a "${FIELD}" column`);
  const names = rows.map(r => r[FIELD]).filter(Boolean);

  const templateBytes = fs.readFileSync(template);
  const fontBytes = fs.readFileSync(font);
  fs.mkdirSync(out, { recursive: true });

  const used = new Set();
  for (const name of names) {
    const pdf = await PDFDocument.load(templateBytes);
    pdf.registerFontkit(fontkit);
    const form = pdf.getForm();
    // throws with a clear message if the template has no such field
    form.getTextField(FIELD).setText(name);
    // full font + no ligatures: subset embedding and fi/fl ligatures drew wrong or missing glyphs in flattened names
    form.updateFieldAppearances(await pdf.embedFont(fontBytes, { subset: false, features: { liga: false, clig: false } }));
    form.flatten();

    let base = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_'), file = base, i = 2;
    while (used.has(file.toLowerCase())) file = `${base}_${i++}`;
    used.add(file.toLowerCase());
    fs.writeFileSync(path.join(out, `${file}.pdf`), await pdf.save());
  }
  return names.length;
}

module.exports = { generate };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf(k); return i < 0 ? undefined : args.splice(i, 2)[1]; };
  const font = opt('--font'), out = opt('--out');
  const [template, csv] = args;
  if (!template || !csv) { console.error('Usage: node generate.js <template.pdf> <names.csv> [--font file.ttf] [--out dir]'); process.exit(1); }
  generate({ template, csv, font, out })
    .then(n => console.log(`Wrote ${n} certificate(s) to ${out || 'output'}/`))
    .catch(e => { console.error('Error:', e.message); process.exit(1); });
}

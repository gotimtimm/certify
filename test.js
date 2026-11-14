// Self-check: builds a template with a full_name field, runs the generator, asserts on the output.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, TextAlignment } = require('pdf-lib');
const { generate } = require('./generate');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'certify-'));
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 400]);
  const f = doc.getForm().createTextField('full_name');
  f.setAlignment(TextAlignment.Center);
  f.addToPage(page, { x: 50, y: 180, width: 500, height: 50 });
  f.setFontSize(28);
  fs.writeFileSync(path.join(dir, 't.pdf'), await doc.save());
  // "José" tests non-ASCII, duplicate "Ann" tests filename collisions, "A/B" tests sanitizing
  fs.writeFileSync(path.join(dir, 'n.csv'), '﻿full_name\nJosé Müller\nAnn\nAnn\nA/B\n');

  const out = path.join(dir, 'out');
  const n = await generate({ template: path.join(dir, 't.pdf'), csv: path.join(dir, 'n.csv'), out });
  assert.strictEqual(n, 4);
  assert.deepStrictEqual(fs.readdirSync(out).sort(), ['A_B.pdf', 'Ann.pdf', 'Ann_2.pdf', 'José Müller.pdf']);
  const result = await PDFDocument.load(fs.readFileSync(path.join(out, 'Ann.pdf')));
  assert.strictEqual(result.getForm().getFields().length, 0, 'field should be flattened');

  fs.writeFileSync(path.join(dir, 'bad.csv'), 'name\nBob\n');
  await assert.rejects(generate({ template: path.join(dir, 't.pdf'), csv: path.join(dir, 'bad.csv'), out }), /full_name/);

  console.log('ok. sample output:', path.join(out, 'José Müller.pdf'));
})().catch(e => { console.error(e); process.exit(1); });

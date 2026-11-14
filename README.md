# certify

Node.js tool that stamps member names onto a certificate template using [pdf-lib](https://pdf-lib.js.org/). One PDF is produced per row of a CSV.

## Setup

```
npm install
```

## Template requirements

pdf-lib cannot detect text drawn on a flat PDF, so each template needs a **fillable text field named `full_name`** placed where the name should appear (add it in Acrobat, LibreOffice, PDFescape, etc.). The field's position, size and alignment are used as-is, so every design can place the name differently with no code changes.

## CSV

A file with a `full_name` column:

```
full_name
José Müller
Ann Lee
```

## Usage

```
node generate.js <template.pdf> <names.csv> [--font file.ttf] [--out dir]
```

| Option | Default |
| --- | --- |
| `--font` | `fonts/static/GoogleSans-SemiBold.ttf` |
| `--out` | `output/` |

Each certificate is flattened (the name can't be edited) and saved as `<name>.pdf`. Duplicate names get `_2`, `_3`, ... and characters that are invalid in filenames become `_`.

Use a static `.ttf` font, not a variable one, which renders unreliably in pdf-lib.

## Test

```
node test.js
```

## Fonts

Fonts live in `fonts/`, which is not tracked by git. Copy the folder in by hand after cloning. The default font is Google Sans, licensed under the SIL Open Font License (see `fonts/OFL.txt`).

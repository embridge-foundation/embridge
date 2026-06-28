# Embridge

CLI and parser for validating Embridge Markdown files.

The package validates Embridge Markdown. It does not rewrite files or change the
Embridge format version declared in a document.

## Quick Start

Validate one or more files without installing the package first:

```sh
npx embridge validate file.md
```

Convert one file to the parser JSON result:

```sh
npx embridge to-json file.md
```

Install it as a development dependency:

```sh
npm install --save-dev embridge
npx embridge validate file.md
```

## Commands

```sh
embridge validate <file...>
embridge to-json <file.md>
embridge help
embridge --help
embridge --version
```

`validate` parses each file and prints diagnostics to stderr. It prints nothing
when parsing completes without diagnostics.

Exit codes:

- `0`: parsing completed without diagnostics
- `1`: parsing completed and one or more diagnostics were found
- `2`: command usage error, unreadable file, or unexpected runtime failure

Diagnostics include the file name, line number when available, severity, and
message:

```text
file.md:12: warning: Duplicate item id "abc123"
```

`to-json` prints the full parser result as pretty JSON. Parser diagnostics do
not make `to-json` fail because the JSON output is useful for diagnosis.

## Library Usage

```js
const { parseEmbridge } = require("embridge");

const tree = parseEmbridge(markdown, { sourceName: "file.md" });
```

The parser result includes `documentMetadata`, parsed `lists`, and
`diagnostics`.

## Format Documentation

The Embridge format specification lives in the main repository:

- https://github.com/embridge-foundation/embridge
- https://embridge.net

This package currently ships the JavaScript reference parser and CLI from the
repository's `tools/reference-parser/` directory.

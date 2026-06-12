# Embridge Reference Parser

Repo-local JavaScript reference parser for Embridge v0.2.0.

This parser is intentionally kept under `tools/reference-parser/` while the
format is young. The canonical conformance assets remain at the repo root:
`tests/fixtures/*.md` and `tests/expected/*.json`.

## Usage

Parse one file:

```sh
node bin/embridge-parse.js ../../tests/fixtures/full-featured.md
```

Run the conformance suite:

```sh
npm test
node bin/embridge-parse.js --check ../../tests/fixtures ../../tests/expected
```

Use as a library:

```js
const { parseEmbridge } = require("./src");

const tree = parseEmbridge(markdown, { sourceName: "example.md" });
```


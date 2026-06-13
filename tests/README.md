# Embridge Conformance Test Suite

Test fixtures and expected parse trees for the Embridge format specification v0.2.1.

## Structure

```
tests/
  fixtures/    — .md input files (valid and edge-case Embridge documents)
  expected/    — .json files with the expected parse tree for each fixture
  README.md    — this file
```

Each fixture file in `fixtures/` has a matching JSON file in `expected/` with the same base name. For example, `fixtures/basic-bullet-items.md` is verified against `expected/basic-bullet-items.json`.

## Expected JSON Schema

Every expected file follows this structure:

```json
{
  "documentMetadata": null | { "title", "sync", "uuid", "lists", "fields", "syntax", "format" },
  "lists": [
    {
      "title": "string | null (null = implicit/no-heading list)",
      "id": "string | omitted (canonical list id from document metadata, or inline section id fallback)",
      "preamble": ["string"] | null,
      "fields": {},          // present only when section metadata is supplied inline
      "description": "...",  // present only when a section description is supplied inline
      "items": [
        {
          "title": "string",
          "completed": "true | false | null",
          "marker": { "type": "bullet" } | { "type": "ordered", "number": N } | { "type": "none" },
          "fields": {},
          "description": "string | null",
          "comments": [],
          "subitems": []
        }
      ]
    }
  ],
  "diagnostics": []
}
```

### Field Definitions

| Field | Description |
|-------|-------------|
| `documentMetadata` | `null` if no HTML comment metadata block; otherwise an object with document-level fields |
| `lists[].title` | List heading text, or `null` for the implicit default list |
| `lists[].id` | Canonical list identity when resolved from document metadata `lists:`; falls back to inline section `id:` only where the registry cannot provide one |
| `lists[].preamble` | Blank-lines mode only: non-item text after a heading; `null` otherwise |
| `lists[].fields` / `lists[].description` | Section metadata (tolerated, not recommended): a metadata line or description shorthand directly after a heading, before the first item. Key present only when supplied inline |
| `items[].title` | Item title text (after marker and optional checkbox) |
| `items[].completed` | `true` (checked), `false` (unchecked), or `null` (no checkbox) |
| `items[].marker` | `{"type":"bullet"}`, `{"type":"ordered","number":N}`, or `{"type":"none"}` (blank-lines mode) |
| `items[].fields` | Object of parsed metadata key-value pairs (empty `{}` if none) |
| `items[].description` | Parsed description string, or `null` |
| `items[].comments` | Array of comment objects with `replyDepth`, `author`, `timestamp`, `text` |
| `items[].subitems` | Nested array of item objects (same schema, recursive) |
| `diagnostics` | Array of `{"line":N,"severity":"warning","message":"..."}` for non-conformant input |

## Test Categories

| Prefix | Coverage |
|--------|----------|
| `basic-*` | Bullet and ordered items, checkbox states |
| `nesting-*` | Subitems at various depths, mixed markers |
| `metadata-*` | Key-value fields, quoting, aliases, indentation |
| `description-*` | Shorthand and multiline descriptions |
| `comments-*` | Basic, threaded, multiline, subitem comments |
| `attachments` | Link and image attachment convention |
| `sections-*` | H1 list headings, implicit lists |
| `doc-metadata-*` | Document metadata block variations |
| `blank-lines-*` | Blank-lines mode parsing |
| `edge-*` | Edge cases and non-conformant input |
| `full-*` | Complete real-world-style documents |

## Running Tests

A conformant parser should:

1. Parse each `fixtures/*.md` file
2. Produce a JSON parse tree
3. Compare against the matching `expected/*.json` file
4. Verify that all diagnostics in the expected file are emitted

Diagnostic messages are guidance — implementations may use different wording. The important thing is that the correct line numbers and severity levels match.

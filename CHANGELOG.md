# Changelog

All notable changes to the Embridge format are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

## [0.2.2] - 2026-06-23

- Added reader tolerance for consecutive item/subitem metadata lines, including
  marker mode and blank-lines mode.
- Clarified that one-line comma-separated metadata remains canonical output,
  while preserved multiline metadata is valid but non-canonical.
- Defined repeated scalar field handling as last-wins with diagnostics when
  possible.
- Clarified that comments, blank lines, item markers, list headings, and
  free-form lines close item metadata eligibility.
- Documented attachment subitem metadata ownership.

## [0.2.1] - 2026-06-13

- Clarified parser bootstrap ordering for document metadata and syntax-mode
  selection.
- Clarified indentation-column handling for marker nesting and comment
  ownership, especially under ordered markers.
- Clarified that blank-lines mode parsers must recognize leading checkboxes.
- Clarified that H1 list headings are recognized only at column 0.
- Updated metadata regex guidance to tolerate non-canonical `key : value`
  spacing.

## [0.2.0] - 2026-06-13

- Custom metadata keys are now valid without declaring them in `fields:`, and
  parsers preserve unknown fields for forward compatibility.
- Added an optional `lists:` registry in document metadata for stable list
  identifiers, plus reader tolerance for section-level metadata.
- Document metadata may appear at the top or bottom of a file; tooling still
  writes it at the end.
- Added a single-line inline format tag (`<!-- embridge v0.2.0 -->`).
- Clarified HTML comment terminator handling so `-->` inside metadata values no
  longer ends the block early.
- Added a JavaScript reference parser and conformance test suite.
- Terminology: "round-trip-safe" replaces "sync-ready" throughout.

## [0.1.0] - 2026-02-14

- First public release of the Embridge item/task list format: items, nesting,
  metadata fields, list sections, and document metadata.

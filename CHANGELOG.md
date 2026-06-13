# Changelog

All notable changes to the Embridge format are documented here. This project
adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-12

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

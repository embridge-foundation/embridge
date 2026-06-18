---
name: embridge
description: Create, read, edit, validate, diagnose, and convert MIT-licensed Embridge Markdown item lists and task lists. Use when working with Embridge, .md item lists, task lists, list metadata, item metadata, format validation, the official parser, converting Markdown lists, editing Embridge files, preserving IDs/comments/attachments/document metadata, or producing round-trip-safe output.
license: MIT
---

# Embridge

## Start Here

Embridge is a Markdown-based format for item/task lists. The `.md` file is the source of truth for list titles, item titles, completion state, descriptions, comments, attachments, and metadata. Apps may store UI-only state elsewhere, but do not invent app-only fields in Embridge output.

This skill is self-contained for common create, edit, and convert tasks — work from the rules below without fetching. Retrieve official sources only to (a) confirm the latest version, (b) resolve a genuine edge case not covered here, or (c) run parser validation. The canonical upstream locations are `https://github.com/embridge-foundation/embridge` and `https://embridge.net`. Examples in this skill write the format version as the placeholder `vX.Y.Z`; substitute the verified latest upstream version in real output, and confirm it whenever the user asks for latest behavior, when creating versioned output, or when version compatibility matters.

## Positioning

Embridge sits between plain text task formats and fully structured interchange formats. Prefer it over JSON or YAML when the content is primarily human-edited lists, notes, comments, links, images, and checkboxes, so one `.md` stays readable without splitting human notes from machine data. Prefer it over TODO.TXT when you need to preserve more than flat tasks — multiple lists, nesting, descriptions, comments, attachments, stable IDs, document metadata, and custom fields. Reach for JSON, YAML, or a database instead when the data is mostly non-list structured records with no human-editing or Markdown-readability requirement.

Choose the output contract before editing:

- **Basic Embridge:** minimal human-readable Markdown list items. IDs, checkboxes, headings, and document metadata are optional.
- **Round-trip-safe Embridge:** stricter output for app/sync workflows. Preserve or add stable item IDs, document metadata, list registry entries, comments, descriptions, attachments, unknown fields, marker style, and format declaration.

When editing existing files, preserve the declared format version, unknown metadata, human-authored layout, IDs, comments, and attachments unless the user asks for a migration or normalization. Prefer small textual edits over whole-file rewrites.

## Source Selection

When the rules above are not enough (latest-version confirmation, an uncovered edge case, or parser validation), retrieve only the official sources needed:

- Primary source: `https://github.com/embridge-foundation/embridge`.
- Project site: `https://embridge.net`.
- Interactive validator: `https://embridge.net/validator`.
- For current syntax and writer rules, find the highest-version `embridge_format_specifications_v*.md` at the GitHub repo root on `main`.
- For canonical shape and compact examples, read the matching `embridge_output_demo_v*.md` at the GitHub repo root on `main`.
- For project version context, check the official repo `README.md` and `CHANGELOG.md`.
- For older declared versions, use the official GitHub `versions/vX_Y_Z/` folder as a read-only historical reference. The matching files use names like `embridge_format_specifications_vX.Y.Z.md` and `embridge_output_demo_vX.Y.Z.md`.
- For parser behavior or validation, use the official GitHub repo's `tools/reference-parser/` docs and package metadata if you have cloned or downloaded that official repo.
- For ambiguous parse behavior, inspect official conformance files in `tests/fixtures/` and `tests/expected/` after opening or cloning the official repo.

GitHub URL patterns:

- Current repo root: `https://github.com/embridge-foundation/embridge/tree/main`
- Current raw file: `https://raw.githubusercontent.com/embridge-foundation/embridge/main/{filename}`
- Older version folder: `https://github.com/embridge-foundation/embridge/tree/main/versions/vX_Y_Z`
- Older raw spec: `https://raw.githubusercontent.com/embridge-foundation/embridge/main/versions/vX_Y_Z/embridge_format_specifications_vX.Y.Z.md`

Treat the highest-version spec/demo at the official repo root as current unless upstream documentation says otherwise. Treat `versions/vX_Y_Z/` as historical reference material only.

## Creation Workflow

1. Decide whether the user needs Basic or round-trip-safe output. Default to Basic for simple personal lists; use round-trip-safe for sync, app import/export, automation, stable references, or when the user mentions IDs, metadata, validation, parser compatibility, or preserving existing state.
2. Use `# H1` headings for named lists/columns such as `# To-do`, `# In Progress`, and `# Done`. Items may also exist in an implicit list when no heading is present.
3. Write items with either bullet markers or ordered markers:

```markdown
- [ ] Incomplete task
- [x] Complete task
- Item with unknown completion
1. [ ] Ordered task
```

4. Put item metadata immediately below the item it belongs to. Use one comma-separated metadata line unless using multiline description shorthand.
5. Quote metadata values containing commas, leading/trailing spaces, or quotes. Escape a literal quote inside quoted values as `""`.
6. For nested items, indent the child marker to the parent content column: 2 spaces under `- `, 3 spaces under `1. `, 4 spaces under `10. `.
7. Represent attachments as subitems whose title is exactly one Markdown link or image, for example `  - [Spec](docs/spec.pdf)` or `  - ![Screenshot](assets/login.png)`.
8. For round-trip-safe output, add a final document metadata block with at least `title:` and `format:`, and include `lists:` when stable list IDs matter.

Minimal Basic:

```markdown
# To-do
- Buy apples
- Charge battery
```

Minimal round-trip-safe shape:

```markdown
# To-do
- [ ] Buy apples
id: a1b2c3d
- [ ] Charge battery
id: e4f5g6h

<!--
title: Items/Tasks
lists: "To-do" l1st01a
format: Embridge vX.Y.Z, github.com/embridge-foundation/embridge
-->
```

## Editing Workflow

1. Inspect the existing file first. Identify declared `format:`, inline format tags, document metadata location, `syntax:` mode, list headings, IDs, comments, attachments, and any unknown metadata fields.
2. If `syntax: mode: blank-lines` is declared, apply blank-lines mode rules. Otherwise use marker mode.
3. Preserve the file's declared version and marker style unless the user asks to migrate, normalize, or reformat.
4. Preserve item IDs. Do not change an `id` only because the title or metadata changed. Add IDs only when the task requires sync/round-trip safety or the user requests normalization.
5. Preserve unknown document, section, and item metadata. Unknown fields are valid forward-compatible data, not clutter.
6. Preserve comments and descriptions. A `>` line is a comment and must be parsed before metadata; quoted shorthand at the start of a metadata line is a description.
7. Preserve attachment subitems unless the user explicitly removes the attached content.
8. Avoid rewriting the whole document for a single-item edit. Whole-file normalization is appropriate for migrations, parser repair, deduplication, and app/sync export tasks.
9. After non-trivial edits, validate with the official parser or official validator when available.

When converting informal Markdown lists, avoid over-normalizing. A normal Markdown list can become Basic Embridge with list markers and optional headings. Add metadata, IDs, document metadata, or checkboxes only when the user asks, the input already uses them, or the intended workflow needs round-trip safety.

## Syntax Rules Agents Commonly Get Wrong

- Item markers require a space: `- Item`, `- [ ] Item`, `1. Item`, and `1. [ ] Item` are valid; `-Item` and `1.Item` are not.
- Ordered marker numbers are decorative. File order defines item order. Preserve ordered numbers by default; renumber only as an explicit formatting action.
- H1 list headings are recognized only at column 0. Do not treat indented `# ` as a list heading.
- List IDs do not belong directly below headings when generating or rewriting. Use document metadata `lists:` for canonical list IDs. Inline section metadata is reader-tolerance and should be preserved only for lossless round-trips.
- `status:` is independent of list membership. If an item under `# Done` says `status: todo`, preserve the conflict unless the task is to reconcile it; the field is authoritative for status consumers.
- Item metadata belongs to the item directly above. Metadata indentation is visual only and does not establish hierarchy.
- Marker indentation, not metadata indentation, determines nesting. Compare leading-space columns; do not divide spaces by 2, especially under ordered markers.
- For writer output, indent child markers to the parent content column: `- ` plus 2, `1. ` plus 3, `10. ` plus 4.
- Each item gets at most one metadata block. A second metadata-like line is non-conformant; diagnose or repair rather than silently merging if fidelity matters.
- Values containing commas must be quoted: `tags: "backend, api"`. Without quotes, text after the comma may be ignored or misread as another field.
- Custom item fields are valid even when not declared in `fields:`. Preserve them.
- Unknown document metadata fields should be preserved on edits. Do not discard future-version data.
- Comments start with `>` after optional spaces and attach to an item/subitem. Thread depth is the number of `>` characters. `@author` is recognized only with the `@` prefix and a colon before content.
- Free-form text immediately after an item is non-conformant. Convert notes to a quoted description, a metadata field, or a comment line.
- Do not add checkboxes to attachment subitems during normalization. Attachment classification is based on the title being exactly one Markdown link or image.
- Do not place document metadata at the top for new normalized output. Parsers tolerate top metadata, but tooling should write it at the end.
- Do not confuse reader tolerance with writer recommendations. Preserve tolerated input when editing; emit canonical output when normalizing or generating round-trip-safe files.

## Document Metadata

A full document metadata block is an HTML comment, usually at the end:

```markdown
<!--
title: Project title
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "To-do" l1st01a, "Done" l1st02b
fields: sprint, client
syntax: mode: blank-lines
format: Embridge vX.Y.Z, github.com/embridge-foundation/embridge
-->
```

For round-trip-safe output, ensure `title:` and `format:` exist. Prefer document metadata field order: `title`, `sync`, `uuid`, `lists`, `fields`, `syntax`, `format`.

Use `lists:` as the canonical list registry. Entries map list titles to list IDs: `lists: "Backlog" k3m9p2a, "Done" r5t6y7e`. If duplicate list titles exist, registry entries pair by document order where possible; otherwise preserve inline section IDs as fallback.

Use `fields:` to advertise custom item metadata keys for tooling and UI hints, but do not require it before preserving custom fields.

Use `syntax:` only when needed. Omit `syntax:` for default marker mode. If `syntax: mode: blank-lines` is present, it is parse-critical.

Inline format tags are valid for lightweight Basic files:

```markdown
<!-- format: Embridge vX.Y.Z -->
<!-- embridge vX.Y.Z -->
```

If adding document fields beyond `format:`, use a full metadata block. If both inline format and full metadata exist, the full block's `format:` wins.

## Blank-Lines Mode

Blank-lines mode is enabled only by document metadata. In this mode, blank lines separate unmarked items. Marker items still take precedence and may be mixed with blank-line-delimited items. A non-marker item may start with a checkbox.

Example:

```markdown
# Produce
owner: kitchen
Review before shopping.

[ ] apples

[x] oranges

pears
"fresh batch"

  Bartlett pears

- bananas
id: abc123d

<!--
syntax: mode: blank-lines
-->
```

Rules to preserve:

- Level-1 headings still define lists.
- Section metadata must appear directly below the heading with no intervening blank line.
- Preamble text after a heading is preserved but not parsed as items.
- A block starts at the first non-empty non-heading line after a blank-line boundary.
- Metadata and comments must stay in the same block as the item title; a blank line breaks ownership.
- Blank lines inside an open multiline quoted description do not end the block.
- Blank-line nesting is determined by leading spaces on the title line. Writers should indent children by 2 spaces per level because there is no marker width.

If a parser does not support blank-lines mode, it should fall back to marker mode and warn about possible uncertainty. When editing a blank-lines file, do not convert it to marker mode unless asked.

## Validation

Use official validation when available for non-trivial rewrites, migrations, synchronization work, parser-facing output, blank-lines mode, duplicate-ID repair, metadata quoting changes, or when diagnosing why a file parses unexpectedly.

Options, in order of how reliably they are available to you:

- **Manual checklist (always available, no parser or network needed).** When neither the reference parser nor `https://embridge.net` is reachable, validate by hand against these rules and report any that fail:
  - Every item marker is followed by a space: `- `, `- [ ] `, `1. `, `1. [ ] ` — never `-Item` or `1.Item`.
  - Each item's metadata line sits directly below its item, with no blank line between (except in blank-lines mode).
  - Values containing commas, leading/trailing spaces, or quotes are quoted, with literal quotes escaped as `""`.
  - Each item has at most one metadata block; a second metadata-like line is non-conformant.
  - Nesting is set by marker indentation to the parent content column (`- ` +2, `1. ` +3, `10. ` +4), not by metadata indentation.
  - Existing item IDs and unknown metadata fields are preserved unchanged.
  - Document metadata is a single trailing HTML comment block, with `title:` and `format:` present for round-trip-safe output.
- Use the project site's validator at `https://embridge.net` when online validation is suitable.
- If you have cloned or downloaded `https://github.com/embridge-foundation/embridge`, use the official JavaScript reference parser under `tools/reference-parser/`.

From a clone of the official GitHub repo:

```sh
cd tools/reference-parser
npm test
node bin/embridge-parse.js ../../tests/fixtures/full-featured.md
node bin/embridge-parse.js --check ../../tests/fixtures ../../tests/expected
```

This is the `embridge-reference-parser` package, which lives in the official GitHub repo at `tools/reference-parser/`; its version tracks the Embridge format version it supports. `npm test` runs the conformance fixtures and release consistency checks. Adjust the relative paths above to match where you cloned the repo.

For an arbitrary file, parse it and inspect:

- `documentMetadata` for `format`, `syntax`, `lists`, `fields`, and unknown fields.
- `lists[].id` for canonical list identity from `lists:`.
- `items[].fields.id` for item identity and duplicate warnings.
- `items[].description`, `comments`, and `subitems` for data that may be lost during naive rewrites.
- `diagnostics` for duplicate IDs, ignored metadata, invalid markers, orphan comments, and non-conformant lines.

Parser output proves parse behavior, not necessarily that a rewrite is semantically correct. Also compare the edited Markdown against the user's intended change and preserve unrelated content.

## Version Handling

For new files, use the latest official spec version after checking `https://github.com/embridge-foundation/embridge` or `https://embridge.net`. Write that verified version into the format line in place of the `vX.Y.Z` placeholder:

```markdown
format: Embridge vX.Y.Z, github.com/embridge-foundation/embridge
```

For existing files:

- If the file declares `format: Embridge vX.Y.Z`, preserve that version.
- If the file has only an inline format tag, preserve it unless adding a full metadata block is needed.
- If the declared version is older than the latest official version, consult the official GitHub `versions/vX_Y_Z/` folder as read-only reference and edit according to that version's rules.
- If the user asks to migrate, read both old and latest specs, plan the changes, preserve IDs and unknown fields, validate, and make the version update only as part of the requested migration.
- If the declared version is newer than the official sources you can retrieve or newer than this skill knows, parse best-effort only when reasonable, warn clearly about version uncertainty, and avoid normalization that could destroy unknown data.

Files without a declared format are still valid Basic Embridge. Do not add a format tag unless the task needs format identification, validation, or round-trip-safe output.

## Output Patterns

Use compact metadata for normal items:

```markdown
- [ ] Fix pagination bug
"Users report duplicate results on page 2.", prio: high, due: 2025-01-20, id: f8g9h0q
> @alice [2025-01-16]: Found the issue in paginate.js
  - [Bug screenshot](assets/pagination-page2.png)
```

Use standard field order when rewriting metadata: `description`, `status`, `prio`, `tags`, `assignee`, `created`, `updated`, `on`, `due`, `id`. Prefer description shorthand for concise output:

```markdown
- [ ] Research caching strategies
"Compare Redis and Memcached tradeoffs.", status: ideas, prio: high, tags: "research, backend", due: 2025-02-01, id: a1b2c3d
```

Use Basic output when the user wants a simple list:

```markdown
# Groceries
- apples
- pears
- oranges
```

Use round-trip-safe output when stable synchronization matters:

```markdown
# Backlog
- [ ] Research caching strategies
id: a1b2c3d

# Done
- [x] Set up CI pipeline
id: g7h8i9b

<!--
title: Project Tasks
lists: "Backlog" k3m9p2a, "Done" r5t6y7e
format: Embridge vX.Y.Z, github.com/embridge-foundation/embridge
-->
```

When diagnosing a user-provided file, report concrete line-level issues and the minimal repair. Separate "invalid Basic Embridge" from "valid but non-canonical" from "round-trip-safety risk."

## Failure Handling

If official source docs, parser files, tests, or online validation are unavailable, continue from this skill and the user-provided file, and say what could not be verified. If the official parser and official spec disagree, prefer the latest official spec for format rules, then inspect parser/tests if available to explain current tool behavior. If validation fails, fix the Markdown and rerun until it passes or explain the remaining failure precisely.

Do not hide uncertainty about version support, blank-lines mode, duplicate IDs, malformed metadata, or unknown future fields. Preserve data first, normalize second, and only drop content when the user explicitly requests removal.

# Specifications for Embridge: an open source item/task list format

- **Version:** 0.2.0  
- **Last Updated:** 2026-06-12  
- **Example output:** `embridge_output_demo_v0.2.0.md`   
- **Github:** https://github.com/embridge-foundation/embridge  
- **Project website:** https://embridge.net  
- **Author:** xpiu 
- **Licence:** MIT

---

## Table of contents

- [What is Embridge?](#what-is-embridge)
- [Project goals](#project-goals)
- [Bridge Philosophy](#bridge-philosophy)
- [Format architecture and design principles](#format-architecture-and-design-principles)
- [On conformance](#on-conformance)
- [Versioning](#versioning)
- [Syntax and File Structure](#syntax-and-file-structure)
  - [File Shape (Informative)](#file-shape-informative)
  - [Quick Reference (Informative)](#quick-reference-informative)
  - [Document Model (Informative)](#document-model-informative)
  - [Lexical Conventions](#lexical-conventions)
    - [Encoding and Line Endings](#encoding-and-line-endings)
    - [Line Roles](#line-roles)
  - [Item Lines](#item-lines)
  - [Nesting (Subitems/Subtasks)](#nesting-subitemssubtasks)
  - [Item Metadata (Optional Line)](#item-metadata-optional-line)
  - [Standard Fields (Non-exhaustive)](#standard-fields-non-exhaustive)
  - [Comments (Optional)](#comments-optional)
  - [Attachments (Convention)](#attachments-convention)
  - [List Sections (H1 Headings)](#list-sections-h1-headings)
  - [Document Metadata (HTML Comment)](#document-metadata-html-comment)
- [Parsing](#parsing)
  - [Bootstrap (mode selection)](#bootstrap-mode-selection)
  - [Reader (import / parse-only) — marker mode](#reader-import--parse-only--marker-mode)
  - [Blank-Lines Mode (optional syntax extension)](#blank-lines-mode-optional-syntax-extension)
    - [Reader (import / parse-only) — blank-lines mode](#reader-import--parse-only--blank-lines-mode)
  - [Tooling export/rewrite normalization (optional, recommended for round-trip-safe output)](#tooling-exportrewrite-normalization-optional-recommended-for-round-trip-safe-output)
  - [Regex Patterns](#regex-patterns)
- [Synchronisation](#synchronisation)
  - [App → Markdown (export logic from apps)](#app--markdown-export-logic-from-apps)
  - [Markdown → App (import logic into apps)](#markdown--app-import-logic-into-apps)
  - [Conflict Resolution](#conflict-resolution)
- [Examples](#examples)
  - [Minimal Basic Embridge File](#minimal-basic-embridge-file)
  - [Minimal Format Tag (Inline Metadata)](#minimal-format-tag-inline-metadata)
  - [Minimal Blank-Lines Mode File (Syntax Extension)](#minimal-blank-lines-mode-file-syntax-extension)
  - [Blank-Lines Mode with Mixed Markers](#blank-lines-mode-with-mixed-markers)
  - [Blank-Lines Mode with Section Preamble](#blank-lines-mode-with-section-preamble)
  - [Blank-Lines Mode with Comments](#blank-lines-mode-with-comments)
  - [Blank-Lines Mode with Checkboxes (No Markers)](#blank-lines-mode-with-checkboxes-no-markers)
  - [Blank-Lines Mode: Non-conformant Patterns (Warning Cases)](#blank-lines-mode-non-conformant-patterns-warning-cases)
  - [Minimal Numbered List](#minimal-numbered-list)
  - [Numbered List with Metadata](#numbered-list-with-metadata)
  - [Nested Numbered Items](#nested-numbered-items)
  - [Numbered Items with Comments](#numbered-items-with-comments)
  - [Minimal Round-Trip-Safe File](#minimal-round-trip-safe-file)
  - [Full-Featured File](#full-featured-file)
- [Rendering Compatibility (Appendix)](#rendering-compatibility-appendix)
- [References](#references)
- [License](#license)

---

## What is Embridge?

Embridge is a markdown-based format for storing items, tasks and lists, designed to act as a **bridge** between human editors, AI agents, and application GUIs. It keeps lists readable and editable by hand while remaining consistently parseable by machines. The name is a blend of the words 'item' and 'bridge'.

---

## Project goals

- **Primary goal:** Offer an item and list text format that humans like to use (human-friendly first). Easy to learn, read and edit, with some editing flexibility.
- Be AI-friendly. Easy for AI to read, understand and edit.
- Provide guidance on usage in apps
- Stay merge- and diff-friendly for git workflows
- Remain tool- and vendor-agnostic (portable across editors/apps/forges)
- Preserve forward compatibility (ignore/preserve unknown fields)
- Use Markdown-inspired syntax (designed to degrade gracefully in Markdown renderers; see [Rendering Compatibility](#rendering-compatibility-appendix))

---

## Bridge Philosophy

This format exists to solve a fundamental tension in item/task management:

```
Strict formats        <────────────>        No format
(JSON, YAML)             THIS FORMAT            (prose)

Humans often think JSON/YAML is too complex to edit, but machines love it.
Machines struggle with interpretation of spontaneous human-written lists.
The Embridge format aims to find middle ground.
```

## Format architecture and design principles

1. **Developers won't fight it, AI can still parse it.**
   The format is loose enough for quick hand-editing, structured enough for reliable parsing.

2. **Structure without strictness.**
   The format defines structure (lists, indentation), not validation. Field values are interpreted liberally.

3. **At the item/task level, everything is optional.**
   A valid item/task can be a single line. Metadata is added only when needed. For reliable syncing and round-tripping, exporting/rewriting tools typically add stable IDs and document metadata, but Basic Embridge validity does not require them.

4. **The `.md` file is the source of truth for content.**
   Application databases store supplementary data (UI preferences, colors). The markdown file owns the items/tasks.

---

## On conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

| Plain English | RFC term |
|---------------|----------|
| "You must do this" | **MUST** |
| "Don't ever do this" | **MUST NOT** |
| "We suggest doing this" | **SHOULD** |
| "Please avoid this unless you have a reason" | **SHOULD NOT** |
| "Totally fine either way" | **MAY** |

REQUIRED/SHALL, RECOMMENDED, OPTIONAL, and NOT RECOMMENDED are synonyms as defined in RFC 2119.

Embridge intentionally separates:

- **Validity (Basic Embridge):** the minimum required for a document to be considered valid Embridge and parseable as lists/items.
- **Tooling export/rewrite guidance:** recommendations and requirements for apps/parsers/AI agents when exporting, rewriting, or normalizing Embridge (especially for diff-friendly output and reliable round-trips).
- **Parser/import guidance:** recommendations and requirements for readers to be tolerant (accept common human variations, preserve unknown fields, avoid data loss).
- **Notes:** tips, rationale, and practical implementation advice.

When this spec says something is "required", it is either:

- required for **Basic Embridge validity**, or
- required for **round-trip-safe output** — output that tooling emits so files round-trip losslessly between tools (and therefore synchronize reliably), even though a human-authored file without it is still valid Basic Embridge.

Within round-trip-safe output, this spec still uses MUST / SHOULD / MAY (and RECOMMENDED / OPTIONAL) to distinguish what is strictly required from formatting that is merely recommended for more demanding consumers (e.g. parsers or agents with stricter needs).

**Parser conformance testing:** The `tests/` directory contains a conformance test suite of input files and expected parse trees. Each `.md` fixture in `tests/fixtures/` has a corresponding `.json` file in `tests/expected/` with the expected parsed output. The suite covers basic items, ordered markers, nesting, metadata, descriptions, comments, attachments, list sections, document metadata, blank-lines mode, and edge cases. See `tests/README.md` for the expected JSON schema and instructions.

---

## Versioning

Embridge files MAY declare a format version using the `format:` field in document metadata or an inline format tag. Files without a declared version are still valid Basic Embridge.

When present, the version number MUST use semantic versioning in the form `v{major}.{minor}.{patch}` (for example, `v0.2.0`):

- Patch versions, such as `v0.2.1`, contain editorial clarifications, typo fixes, examples, and non-breaking corrections.
- Minor versions, such as `v0.2.0`, may add backward-compatible features.
- Major versions, such as `v1.0.0`, may introduce breaking changes.

Parsers MAY parse files without a declared version using their current supported Embridge version. For versioned files, parsers SHOULD attempt best-effort parsing and warn on newer minor versions, and SHOULD reject newer major versions with a clear diagnostic unless explicitly configured for best-effort import.

---

## Syntax and File Structure

### File Shape (Informative)

This example shows the typical layout of an Embridge document:

```markdown
# {List Title}
- [ ] {Item/Task title}
{optional item metadata (see below)}

- {Item/Task without checkbox}
{optional item metadata}

# {Another List Title}
- [x] {Completed item/task}
{optional item metadata}

<!--
title: {Title of document content}
sync: {ISO 8601 timestamp}
uuid: {document identifier, UUIDv7 recommended}
format: Embridge v0.2.0, github.com/embridge-foundation/embridge
-->
```

For minimal format identification, a single-line **inline format tag** may be used instead of (or alongside) the full metadata block:

```markdown
- {Item/Task}

<!-- format: Embridge v0.2.0 -->
```

A shorter form without the `format:` key is also valid (case-insensitive):

```markdown
<!-- embridge v0.2.0 -->
```

Notes:
- Item metadata does not require indentation; parsers associate it with the item/task directly above.
- Descriptions use the `description:` field or the shorthand `"..."` when the first non-whitespace character on the metadata line is `"`.

The subsections below define the full validity, canonical output guidance, and reader tolerance rules for each element.

### Quick Reference (Informative)

- **Lists:** H1 headings (`# `) define list sections (optional).
- **Items:** Markdown list items using either `- ` or `{number}. ` markers (a space after the marker is required).
- **Completion:** An optional checkbox follows the marker: `[ ]` (incomplete) or `[x]` / `[X]` (complete). Items without checkboxes are valid and have an "unknown" completion state (`completed: null`).
- **Item metadata (optional):** One metadata block may appear immediately after an item. It is either:
  - a single metadata line of comma-separated `key: value` pairs, or
  - a quoted description shorthand (`"..."`), which MAY span multiple lines until the closing `"`.
- **Comments (optional):** Lines starting with `>` attach to the item/subitem above and MAY be threaded via `>>`, `>>>`, etc.
- **Section metadata (optional, discouraged):** A section metadata block of field lines and/or quoted description shorthand MAY follow a list heading, before the first item; tooling SHOULD instead store canonical list-level data in document metadata.
- **Document metadata (optional):** An HTML comment stores document-level fields for round-trip-safe output. Tooling SHOULD write it at the end of the file; parsers SHOULD also accept it at the top for reader tolerance.
  - A single-line **inline format tag** (`<!-- format: Embridge v0.2.0 -->` or shorter `<!-- embridge v0.2.0 -->`) may be used instead for minimal format identification.
  - Document metadata keys and the format identifier are parsed case-insensitively.

### Document Model (Informative)

Conceptually, an Embridge document is:

- **Document**
  - **Lists** (optional; derived from `# {List Title}` headings)
    - **Items/Tasks** (a tree; nesting is based on marker indentation)
      - **title** (required; remainder of the item line)
      - **completed** (`true` / `false` / `null`)
      - **fields** (optional; `key: value` pairs from the item metadata)
      - **description** (optional; explicit `description:` field or shorthand `"..."`)
      - **comments** (optional; `>` lines)
      - **attachments** (convention; subitems whose title is exactly one Markdown link or image)

### Lexical Conventions

#### Encoding and Line Endings

Embridge files MUST be encoded as UTF-8. A byte-order mark (BOM) is optional; parsers MUST ignore a leading BOM if present.

Parsers MUST accept LF (`\n`), CRLF (`\r\n`), and CR (`\r`) line endings and normalize them to LF internally. Writers SHOULD use LF line endings. No maximum line length is imposed.

#### Line Roles

The role of a line is determined by its first non-whitespace characters:

- `# ` → list heading (section)
- `- ` or `{number}. ` (optionally preceded by indentation spaces) → item/subitem line
- `>` (optionally preceded by spaces) → comment line (belongs to the item/subitem above; detected before metadata parsing)
- Otherwise, a non-empty line immediately following an item line is interpreted as that item's metadata (if it matches metadata/description rules); free-form text is non-conformant (see "Item metadata").

**Indentation (marker only):** hierarchy is determined solely by the indentation spaces before the marker — a child has more leading spaces than its parent, and its parent is the nearest earlier item with fewer leading spaces. Metadata indentation does not affect ownership.

Typical indentation under a `- ` parent (marker width 2):

| Spaces before marker | Meaning |
|----------------------|---------|
| 0 | Top-level item/task |
| 2 | Subitem/Subtask (level 1) |
| 4 | Sub-subitem/subtask (level 2) |
| 6 | Level 3, etc. |

**Validity (Basic Embridge):**
- A child item's leading spaces MUST be strictly greater than its parent's leading spaces.

**Tooling export/rewrite guidance:**
- Writers MUST indent each child to its parent's content column — i.e., parent's leading spaces plus the parent's marker width. So `- ` parents → child indented +2 spaces, `1. ` → +3, `10. ` → +4. This matches CommonMark and keeps Embridge output renderable in standard Markdown viewers.

**Parser/import guidance:**
- Parsers MUST accept any indent strictly greater than the parent's as a valid child indent, regardless of the exact width. This preserves backwards compatibility with files written under earlier rules (which used a flat 2-space increment under every parent).

### Item Lines

An item/task is a Markdown list item: **marker** → **optional checkbox** → **title**.

**Syntax (examples):**

**Bullet marker forms:**
```markdown
- [ ] Item/Task with unchecked checkbox
- [x] Item/Task with checked checkbox (lowercase)
- [X] Item/Task with checked checkbox (uppercase)
- Item/Task without checkbox
```

**Ordered marker forms:**
```markdown
1. [ ] Item/Task with unchecked checkbox
2. [x] Item/Task with checked checkbox
3. Item/Task without checkbox
```

**Validity (Basic Embridge):**
- An item/task line MUST start with either:
  - `- ` (bullet marker followed by a single space), OR
  - `{number}. ` where `{number}` is either `0` or a base-10 integer without leading zeros (ordered marker followed by a single space)
- A space MUST follow the marker — `1.Item` and `-Item` are invalid
- Both markers MAY be preceded by indentation spaces for subitems
- The checkbox, if present, MUST follow the marker with the same syntax: `- [ ]` or `1. [ ]`
- The remainder of the line (after checkbox, if present) is the item/task title

**Ordered marker constraints:**
- This specification intentionally excludes `1)` markers to keep the format minimal.
- Ordered marker numbers are **purely decorative** — item order is determined solely by position in the file, not by numeric value. Numbers carry no semantic meaning for ordering purposes.
- Parsers MUST ignore numeric values for ordering purposes (numbers do not need to be sequential or start at 1).
- Tooling MUST NOT emit leading zeros in ordered markers (e.g., write `1.` not `01.`).

**Ordered marker digit count (interoperability guidance):**
- Tooling SHOULD emit ordered markers with 1–9 digits (e.g. `1. ` … `999999999. `) to maximize compatibility with common Markdown renderers.
- Parsers MAY accept more than 9 digits, but tooling that rewrites files SHOULD avoid emitting >9-digit ordered markers unless explicitly requested.

**Canonical output (tooling export/rewrite guidance):**
- Tooling SHOULD emit checkboxes for interoperability and consistent rendering.
- Tooling SHOULD prefer `- [ ]` or `1. [ ]` for incomplete and `- [x]` or `1. [x]` for complete (readers still accept uppercase `X`).
- Tooling SHOULD preserve the original marker style when rewriting items (if an item was authored with `1.`, export as `1.`, not `-`).

**Reader tolerance (parser/import guidance):**
- Parsers SHOULD accept items without checkboxes and treat their completion state as "unknown" (`completed: null`) until an app assigns a default.

**Completion mapping:**

| Item form | `completed` |
|----------|-------------|
| `- [ ] ...` or `1. [ ] ...` | `false` |
| `- [x] ...`, `- [X] ...`, `1. [x] ...`, or `1. [X] ...` | `true` |
| `- ...` or `1. ...` (no checkbox) | `null` |

**Checkbox behavior:**
- **For humans:** Checkboxes are optional. You can write `- Buy milk` or `1. Buy milk` without a checkbox — it's valid and convenient for quick entry.
- **For parsers/apps:** When writing items back to the file, parsers SHOULD add checkboxes (`[ ]` or `[x]`) to items and subitems that don't have them. This normalizes the format for consistent rendering and interoperability.
- Items without checkboxes are treated as `completed: null` (unchecked by default when a parser adds the checkbox).

### Nesting (Subitems/Subtasks)

Items/Tasks can contain nested subitems/subtasks. **Hierarchy is determined solely by the indentation of the marker (bullet or ordered).**

```markdown
- [ ] Parent item/task
prio: high, id: a1b2c3d
  - [ ] Subitem/Subtask one
  status: todo, id: d4e5f6a
  - Subitem/Subtask two (no checkbox)
  "Subitems/Subtasks can omit things like checkboxes and id"
    - [ ] Sub-subitem/subtask
    id: nested12
```

Ordered subitems follow the same rule, but children indent to the parent's content column (3 spaces under a single-digit `1. ` parent, 4 under a `10. ` parent):

```markdown
1. [ ] Parent item
prio: high, id: a1b2c3d
   1. [ ] Subitem one
   id: d4e5f6a
   2. [ ] Subitem two
   id: g7h8i9b
      1. [ ] Sub-subitem
      id: j0k1l2c
```

**Mixed styles (guidance, not enforced):**
- Within the same section and indentation level, authors SHOULD prefer a consistent marker style for readability.
- Parent and children MAY use different styles (valid but not recommended).

**Parsing rules (nesting):**
- A new marker line is a child of the nearest earlier item whose leading-space count is strictly less than its own.
- Writers MUST indent each child by the parent's marker width (`- ` → +2, `1. ` → +3, `10. ` → +4); parsers MUST accept any deeper indent for backwards compatibility with legacy 2-space-everywhere files.
- Subitems/Subtasks follow the same syntax as items/tasks (optional checkbox, optional metadata).
- Nesting depth is unlimited, but 2 levels is typical.

### Item Metadata (Optional Line)

An item/task MAY be followed by an **item metadata block**. If present, it belongs to the item/task directly above it. **Metadata does not require indentation** — indentation is purely for visual preference.

Metadata for a subitem does NOT need to match the subitem's indentation:

```markdown
- [ ] Parent item
  - [ ] Subitem
status: todo, id: def456a      ← no indentation needed, still belongs to subitem above
```

An item metadata block is either:

- a single metadata line of comma-separated `key: value` pairs, optionally beginning with description shorthand (`"..."`), OR
- a quoted description shorthand that spans multiple lines until a closing `"`, optionally followed by additional `key: value` pairs after the closing quote.

```markdown
- [ ] Example item/task
status: todo, prio: high, tags: "backend, api", due: 2025-01-15, id: a1b2c3d
```

Indented metadata is also valid (for visual preference):

```markdown
- [ ] Example item/task
  status: todo, prio: high, tags: "backend, api", due: 2025-01-15, id: a1b2c3d
```

Ordered markers work the same way:

```markdown
1. [ ] Example item/task
status: todo, prio: high, tags: "backend, api", due: 2025-01-15, id: a1b2c3d
```

**Validity (Basic Embridge):**
- Item metadata is OPTIONAL. Items/tasks MAY appear without any metadata block.
- A metadata line (when present) is a comma-separated list of field pairs: `key: value, key: value`.
- Keys SHOULD be written in lowercase and MAY contain lowercase letters, digits, and hyphens (`[a-z][a-z0-9-]*`). Capitalization MAY be used (e.g., `Prio: high` and `prio: high` are both valid). Hyphens enable natural multi-word keys like `due-date` or `start-time`.
- A line is recognized as item metadata when it contains at least one **known key** — a standard field (or alias) from the table below, or a custom key declared via `fields:` in the document metadata block. All `key: value` pairs on that line are parsed and preserved, including any undeclared keys alongside a known key.
- A line containing only undeclared keys (e.g., `remember: call the client`) is not recognized as metadata and is treated as non-conformant free-form text. This prevents English prose containing colons from being misinterpreted as metadata.
- Space after colon is optional: `key: value` and `key:value` are both valid.
- Since commas separate field pairs, any value containing a comma MUST be quoted with `"` so it stays a single value.
- Inside a quoted value, a literal `"` is written as `""`.
- Trailing comma is allowed but not required: `prio: high, due: 2025-01-15,` (valid).
- Metadata indentation is optional — parsers accept both indented and non-indented.
- Each item/task gets at most **one** metadata block. If a second metadata-like line appears after an item's metadata block, parsers MUST ignore it and SHOULD emit a diagnostic warning (e.g., "line 5: additional metadata line ignored").
- The `id` field, when present, identifies one item/task. Duplicate `id` values do not make Basic Embridge unparseable, but parsers SHOULD diagnose them and tooling producing round-trip-safe output MUST resolve them before using IDs for matching.

**Canonical output (tooling export/rewrite guidance):**
- Tooling SHOULD emit keys in lowercase (e.g., `prio: high`, not `Prio: high`).
- Tooling SHOULD use `key: value` (with a single space after `:`) for readability.
- Tooling SHOULD NOT output a space before the colon (`key : value`).
- Tooling SHOULD quote values that contain commas, leading/trailing spaces, or `"` characters.
- Tooling MUST NOT emit duplicate item `id` values in round-trip-safe output. If multiple imported items share an `id`, tooling SHOULD keep the first occurrence and assign fresh IDs to later duplicates, with a warning or import log entry.
- Tooling SHOULD NOT use shared `id` values to express groups, batches, projects, or AI-generated bundles. Use a parent item/subitems, list sections, or a separate metadata field such as `group`, `batch`, or `project` instead.

**Reader tolerance (parser/import guidance):**
- Parsers SHOULD be tolerant about whitespace and MAY accept `key : value` (treat as non-canonical and warn if possible).
- Parsers SHOULD trim surrounding whitespace from unquoted values.

**Quoting note — values with commas:**

Since commas separate field pairs, any value containing a comma MUST be quoted. Parsers importing/exporting Embridge data MUST handle this:

| Example | Valid? | Reason |
|---------|--------|--------|
| `tags: apples, created: 2025-01-15` | ✓ | Single tag, no ambiguity |
| `tags: apples, oranges, created: 2025-01-15` | ✗ | Parser sees `oranges` as a key |
| `tags: "apples, oranges", created: 2025-01-15` | ✓ | Quoted value, comma is protected |

Parsers SHOULD automatically quote values containing commas when writing, and MUST handle quoted values when reading.

**Quoting note — escaping quotes:**

Inside a quoted value, a literal double quote is represented as two double quotes (`""`). Parsers MUST unescape `""` to `"` when reading quoted values, and parsers writing quoted values SHOULD escape `"` as `""`.

**Descriptions (as metadata):**

Descriptions use the `description:` field (or its aliases `desc:` / `descr:`) with a quoted value:

```markdown
- [ ] Complex item/task
description: "This explains the item/task in detail", prio: high, due: 2025-01-15, id: a1b2c3d
```

**Description shorthand syntax:** A quoted string at the start of a metadata line is treated as an implicit `description:` value:

```markdown
- [ ] Complex item/task
"This explains the item/task in detail", prio: high, due: 2025-01-15, id: a1b2c3d
```

Both forms are equivalent. The shorthand can also stand alone:

```markdown
- [ ] Simple item with just a description
"More details about this item"
```

**Shorthand rules:**
- Applies only when `"` is the first non-whitespace character on the metadata line.
- The quoted value is parsed as `description:` (same escaping rules: `""` → `"`).
- Can be followed by other fields after a comma: `"My description", prio: high, id: abc123d`.
- If both shorthand and explicit `description:` appear, parsers SHOULD treat this as an error (or use last-wins).
- When exporting, tooling SHOULD prefer the shorthand form for brevity (explicit `description:` / `desc:` / `descr:` are also valid).

**Multiline descriptions:** The shorthand syntax supports descriptions spanning multiple lines. The description starts with `"` on the first metadata line and continues until the closing `"` is found:

```markdown
- [ ] Complex item/task
"This is a longer description
that spans multiple lines.
It can include detailed notes.", prio: high, id: a1b2c3d
```

**Multiline rules:**
- The opening `"` MUST be the first non-whitespace character on the metadata line (same as single-line shorthand).
- All lines until the closing `"` are part of the description value.
- Newlines are preserved literally in the parsed description.
- Escaped quotes (`""`) work the same: `""` → `"`. Parsers MUST consume `""` pairs left-to-right before matching a closing `"`, so a trailing `"""` is unambiguously an escaped quote followed by the closing delimiter.
- Other metadata fields follow after the closing `"` and a comma (on the same line as the closing quote).
- Parsers track "inside open quote" state across lines until the closing `"` is found.

```markdown
- [ ] Item with multiline description and metadata
"First line of description.
Second line with more detail.
Third line wrapping up.", status: todo, prio: high, id: x1y2z3e
```

**Important (Validity):** Free-form text immediately after an item/task is **non-conformant** Embridge. The first non-empty line after an item/task MUST be either:

- a valid metadata line (`key: value, key: value`), OR
- a description shorthand (`"..."`, single-line or multiline), OR
- a comment line (`>`), OR
- another item line (marker) / list heading.

**Canonical output guidance:** If you want to attach human notes, convert them into either:
- a description (`"..."` shorthand, including multiline), or
- a declared custom field (e.g., declare `note` via `fields:` in document metadata, then use `note: "..."`).

**Reader tolerance guidance:** Readers MAY choose to treat non-conformant free-form lines as a best-effort description during import (to avoid data loss), but tooling SHOULD NOT emit that form.

```markdown
- [ ] Call the client
They prefer mornings            ← NOT VALID (free-form text, not key: value)

- [ ] Call the client
Remember: call the client      ← NOT VALID (remember is not a known key)

- [ ] Call the client
descr: they prefer mornings    ← VALID (descr is a standard field)

- [ ] Call the client
note: they prefer mornings     ← VALID only if note is declared via fields:
                                  in document metadata; otherwise non-conformant

- [ ] Call the client
"they prefer mornings"         ← VALID (description shorthand)
```

### Standard Fields (Non-exhaustive)

The fields listed here (and their aliases) are the **known keys** that parsers use to recognize a line as item metadata. Parsers MUST recognize these keys (case-insensitively). Custom keys MAY be declared via `fields:` in the document metadata block to extend the known set. Once a line is recognized as metadata, all `key: value` pairs on it are parsed and preserved — including undeclared keys alongside a known key.

| Field | Aliases | Description | Example Values |
|-------|---------|-------------|----------------|
| `description` | `desc`, `descr` | Short description | `"Fix the login bug"` |
| `status` | | Workflow status | `todo`, `doing`, `done`, `backlog`, `ideas` |
| `prio` | `priority` | Priority level | `high`, `med`, `low`, `1`, `2`, `3` |
| `tags` | `keywords` | Labels (single or quoted list) | `backend` or `"backend, api, urgent"` |
| `assignee` | `owner`, `assigned` | Who's responsible | `@alice`, `team-backend` |
| `created` | `date`, `createddate` | Created/reference date | `2025-01-15` |
| `updated` | `modified`, `mod` | Last modified date | `2025-01-18` |
| `on` | `ondate`, `on-date`, `scheduled` | Date the item happens or is scheduled for | `2025-01-15` (recommended), `tomorrow`, `third Tuesday of next month` |
| `due` | `duedate` | Due date | `2025-01-15` (recommended), `tomorrow`, `end of Q3` |
| `id` | | Stable identifier (recommended) | `a1b2c3`, `x7y8z9` |

**Date-valued fields (parser/AI agent guidance):**

The `on` field means the date an item happens or is scheduled for. It is distinct from `due`, which means a deadline, and from `created`/`date`, which means when the item was created or recorded.

Date-valued fields SHOULD use ISO 8601 date strings (`YYYY-MM-DD`, e.g. `2025-01-15`) for unambiguous, machine-readable dates. However, arbitrary natural-language expressions (e.g. `tomorrow`, `next-week`, `end of Q3`, `third Tuesday of next month`) are permitted — Embridge is designed for human authoring flexibility and does not restrict the value to a closed set. Parsers and AI agents MUST be prepared to encounter free-form date text and SHOULD attempt to resolve it to an absolute date when needed; if resolution is not possible or unambiguous, the raw value SHOULD be preserved as-is.

**tags value shape (special rule):**

Tags support both single and multiple values:

- **Single tag (no quotes needed):**
  ```markdown
  tags: backend
  tags:backend
  ```
- **Multiple tags (quoted, comma-separated):**
  ```markdown
  tags: "backend, api, urgent"
  tags: "backend,api,urgent"
  ```

The space after the comma inside quotes is recommended for readability but optional. Both `"backend, api"` and `"backend,api"` are valid.

**Canonical output (tooling export/rewrite guidance):**
- Tooling SHOULD output fields in this canonical order for diff-friendly output:
  `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `on` → `due` → `id`.
- Tooling SHOULD write canonical field names (not aliases).

**Reader tolerance (parser/import guidance):**
- Field order does not matter when importing/reading — accept any order.
- Parsers SHOULD accept both the canonical field name and its aliases.

**`id` conformance (recommended for round-trip-safe output):**
- For round-trip-safe output, if an `id` field is present, it MUST be unique within the file (across all items and subitems).
- This requirement applies to item/subitem `id` fields only. List/section identifiers from section metadata or the document metadata `lists:` registry are a separate list namespace and MUST NOT be treated as duplicate item IDs.
- The Embridge format does not impose requirements on the shape, casing, or character set of `id` values — the format of IDs is chosen by the user, app, or AI agent generating them.
- When generating IDs, tooling SHOULD use at least 7 characters for collision resistance. Lowercase alphanumeric IDs (e.g. `[a-z0-9]`) are a sensible default, but other schemes (UUIDs, hashes, sequential IDs, etc.) are equally valid.
- Parsers MUST accept any non-empty `id` value and MUST NOT reject items based on ID length, casing, or character set.
- A shared grouping concept SHOULD NOT be represented by reusing the same `id` on multiple items. Prefer a parent item/subitems, list section, or a separate field such as `group`, `batch`, or `project` (declared via `fields:` if needed).

**Parsing notes — duplicate item `id` values:**
- Parsers SHOULD NOT assume humans or AI agents always keep item IDs unique; duplicate `id` values are an expected input-quality error.
- Parsers SHOULD detect duplicate item IDs during import and SHOULD surface a warning/event for observability.
- Duplicate-ID resolution is implementation-defined. Parsers MAY:
  - keep the first occurrence and auto-assign new IDs to later duplicates (recommended default), OR
  - import with collisions flagged for later repair, OR
  - reject import in strict-validation mode.
- If tooling rewrites/exports after import, emitted item IDs MUST be unique within the file.

**Note — why at least 7 characters?** 7-character lowercase alphanumeric IDs provide 36^7 ≈ 78.4 billion combinations. Collision probability reaches ~1% around 39,500 items (birthday paradox). For typical personal/small-team usage (hundreds to a few thousand items), the collision probability is effectively negligible. Longer IDs or other formats (UUIDs, hashes) are fine — use whatever suits your workflow.

### Comments (Optional)

Comments attach notes to items/subitems. Unlike descriptions (which are a single explanatory text), comments are multiple entries that accumulate over time. Like other metadata, author and timestamp are optional.

**Syntax (examples):**

```markdown
> comment text
> @author: comment text
> [timestamp]: comment text
> @author [timestamp]: comment text
```

**Example:**

```markdown
- [ ] Fix pagination bug
prio: high, id: abc123d
> check the offset calculation
> @alice [2025-01-20]: confirmed on page 3
```

**Validity (Basic Embridge):**
- Comment lines MUST contain one or more `>` characters as the first non-whitespace content. Leading spaces determine ownership: a `>` line indented to the same depth as an item/subitem belongs to that item/subitem (e.g., 0 spaces = top-level item, 2 spaces = level-1 subitem).
- Author and timestamp are OPTIONAL
- If present, author MUST be prefixed with `@`: `@username`. A bare `username` without `@` is not recognized as an author — the entire text (including the word before the colon) is treated as comment content. This prevents natural-language colons (e.g., `> note: remember to update`) from being misinterpreted as authored comments.
- If present, timestamp format: ISO 8601 date, optionally with time (`2025-01-20` or `2025-01-20 14:30`)
- Comment block belongs to the item/subitem directly above it
- Comment block ends at next item line (marker), heading (`#`), or non-`>` line

**Threading (replies):**
Multiple `>` characters indicate reply depth:
- `>` = top-level comment
- `>>` = reply to a comment
- `>>>` = reply to a reply

```markdown
- [ ] Refactor auth
id: abc123d
> @alice [2025-01-20]: Starting refactor today
>> @bob [2025-01-21]: Use the new OAuth library
>> @alice [2025-01-22]: Good idea, will do
> @charlie [2025-01-23]: Ready for review
```

**Multiline comments:**
Continuation lines use the same `>` prefix without author/timestamp:

```markdown
- [ ] Complex feature
id: def456a
> @alice [2025-01-20]: This needs careful review.
> The API changed since v2.0 and we need to
> handle backwards compatibility.
```

**Comments on subitems:**

```markdown
- [ ] Main task
prio: high, id: a1b2c3d
> starting today
  - [ ] Subtask one
  id: x1y2z3e
  > @bob: I'll handle this
```

**Canonical output (tooling export/rewrite guidance):**
- Tooling MAY add author/timestamp when context is available (e.g., current user, current date)
- Tooling SHOULD preserve existing comment formatting and content
- Tooling SHOULD output comments after the item metadata block (if any), before the next item

**Reader tolerance (parser/import guidance):**
- Parsers SHOULD accept comments with or without author/timestamp
- Parsers SHOULD preserve the threading depth (count of `>` characters)
- Parsers SHOULD treat continuation lines (no author/timestamp) as part of the previous comment
- Comment ownership is determined by indentation: a `>` line at column 0 belongs to the most recent top-level item; a `>` line at column 2 belongs to the most recent level-1 subitem, and so on. If indentation is absent or ambiguous, parsers SHOULD fall back to the most recent item/subitem above.

**Notes (parsing):**
- **Precedence:** Comment lines (`>`) MUST be detected before checking for metadata patterns. Lines like `> @alice: text` contain substrings matching `key: value` syntax, but the leading `>` takes precedence.
- **Author prefix:** The `@` prefix is REQUIRED for author detection. `> @alice: comment` → author="alice", but `> alice: comment` → content="alice: comment" (no author parsed, entire text is content). This avoids ambiguity with natural-language colons.
- **Colon requirement:** The colon (`:`) before content is required when author or timestamp is present. Without it, the entire text is treated as content: `> @alice: comment` → author="alice", but `> @alice comment` → content="@alice comment" (no author parsed).

### Attachments (Convention)

Embridge does not introduce a separate syntax for attachments. Instead, **attachments are represented as subitems** using standard Markdown link and image syntax.

This is intentionally a *convention* (how apps/UIs interpret content), not a special Embridge token. Attachment lines are still valid list items.

**Syntax (recommended forms as subitems):**

```markdown
- [ ] Parent item/task
id: abc123d
  - [Design spec](docs/spec.pdf)
  - [Demo video](media/demo.mp4)
  - [Installer](dist/app.exe)
  - ![Screenshot](assets/login.png)
```

**Notes:**
- `- [title](path)` MAY be used for **any** attachment type (including images). This keeps the format flexible for humans.
- `- ![alt](path)` is recommended for images because many Markdown renderers display the image inline.

**Recommended interpretation (UI):**
- Checkboxes are optional in valid Embridge, so apps/tools SHOULD NOT rely on presence/absence of a checkbox to classify attachments.
- An item/subitem MAY be interpreted as an attachment if its title, after trimming leading and trailing whitespace, is **exactly one** Markdown link (`[...](...)`) or image (`![...](...)`) matching the attachment-title regex below.
- If an attachment item includes a checkbox, parsers/apps SHOULD still treat it as an attachment (not a subtask) and SHOULD ignore checkbox state for task completion; tooling SHOULD emit attachment items without checkboxes and SHOULD NOT add checkboxes to attachment items during normalization.

**Attachment-title detection heuristic:**

Tooling that implements the link-only / image-only attachment heuristic SHOULD apply this rule to the parsed item title, after removing the list marker and optional checkbox:

1. Trim leading and trailing whitespace from the parsed title.
2. Interpret the item as an attachment if and only if the trimmed title matches this regex:

```regex
^!?\[(?:\\.|[^\]\\\n])*\]\((?:\\.|[^\)\\\n])+\)$
```

- `!?` permits either a Markdown image (`![alt](path)`) or regular link (`[title](path)`).
- The link/image label may be empty and may contain escaped characters such as `\]`.
- The destination MUST contain at least one character and may contain escaped characters such as `\)`.
- The regex is anchored, so surrounding text makes the title a normal item title, not an attachment signal.
- This regex is a deterministic heuristic, not a full CommonMark inline parser. Authors SHOULD escape literal `]` in labels and literal `)` in destinations when they need those characters inside attachment titles.

Attachment detection test cases:

| Parsed item title | Attachment? | Notes |
| --- | --- | --- |
| `[Design spec](docs/spec.pdf)` | Yes | Plain link-only title |
| `![Screenshot](assets/login.png)` | Yes | Image-only title |
| `  [Design spec](docs/spec.pdf)  ` | Yes | Leading/trailing title whitespace is trimmed before matching |
| `[Spec \] draft](docs/spec.pdf)` | Yes | Escaped `]` in label |
| `[Spec](docs/spec\).pdf)` | Yes | Escaped `)` in destination |
| `See [Design spec](docs/spec.pdf)` | No | Extra text before link |
| `[Design spec](docs/spec.pdf) notes` | No | Extra text after link |
| `assets/login.png` | No | Bare path is a normal title |
| `[Design spec](docs/spec.pdf` | No | Missing closing `)` |
| `[Spec](docs/spec).pdf)` | No | Literal `)` in destination is not escaped |

**Important: bare paths are just titles**

This is valid Embridge, but it is simply an item title (not an attachment signal):

```markdown
  - assets/login.png
```

**Canonical output (tooling export/rewrite guidance):**
- Tooling SHOULD treat attachment subitems as content, but SHOULD NOT require attachment items to have an `id`.
- When stable syncing is a goal, tooling MAY still assign IDs to attachment subitems, but this is not required; apps MAY instead treat the attachment path/URL as the identifier.

**Reader tolerance (parser/import guidance):**
- Parsers MAY detect attachments using the "link-only / image-only title" rule above.
- If an app wants to show previews, it MAY infer media type from the link destination (e.g., `.png`, `.jpg`, `.gif`, `.mp4`) when an extension is present; if not, treat as a generic file/link.

### List Sections (H1 Headings)

H1 headings (`# `) define lists/groups. The heading text is the list title.

```markdown
# Backlog
- [ ] Item/Task in backlog

# In Progress
- [ ] Item/Task being worked on

# Done
- [x] Completed item/task
```

**Validity (Basic Embridge):**
- List headers are OPTIONAL; items/tasks MAY appear without any list heading.
- If present, list headers MUST start with `# ` (a hash and a space) at column 0.
- Items/tasks belong to the most recent list header above them, or to an implicit default list if none precedes them.

**Canonical output (tooling export/rewrite guidance):**
- List titles are arbitrary (not predefined statuses).
- List titles SHOULD be unique within a file (to avoid ambiguity).
- When exporting, tooling SHOULD add a list heading for items that lack one.

**Reader tolerance (parser/import guidance):**
- Parsers SHOULD tolerate duplicate list titles.
- Parsers SHOULD accept items without a preceding list heading.
- The `status` field is independent of list membership. When an explicit `status:` value conflicts with the containing section heading (e.g., an item under `# Done` with `status: todo`), tools SHOULD treat the `status:` field as authoritative.

**Section metadata / description (tolerated, not recommended):**

A section metadata block MAY appear immediately after an H1 list heading, before the first item or comment. It contains one or more consecutive lines that are clearly not list items and are one of:

- a metadata field line of comma-separated `key: value` pairs, or
- a quoted description shorthand (`"..."`) that is clearly not a list item (for example, it is not preceded by `- ` or `{number}. `).

The block attaches to the list/section, not to any item.

- **Validity (Basic Embridge):** A section metadata block is OPTIONAL and, when present, MUST start on the line directly below the heading, with no intervening blank line. It continues through consecutive metadata field lines and/or quoted description shorthand, and ends at the first item, comment, blank line, or non-metadata line. Section metadata field lines follow the normal field separation rules (`key: value`, comma-separated when multiple fields appear on one line).
- **Reader tolerance (parser/import guidance):** Parsers SHOULD accept it and attach the fields or description to the list/section. Unlike item metadata, section/list metadata field lines do not need to contain a known key. Parsers, agents, bots, and apps SHOULD preserve unknown or unsupported section/list fields and values for forward compatibility. Human editors SHOULD leave unfamiliar section/list field lines intact unless intentionally removing them. If the same inline section field appears more than once, the later value wins.
- **Preservation recommendation:** When preserving imported inline section/list fields, tools SHOULD prefer one metadata field line directly below the heading, with fields placed next to each other as comma-separated pairs (for example, `status: backlog, future-field: alpha`). Consecutive metadata field lines remain valid reader input.
- **Canonical output (tooling export/rewrite guidance):** When generating or rewriting Embridge, tools MUST NOT place list IDs directly below headings. List IDs belong in document metadata via `lists:`. Inline section metadata is reader-tolerance only and should be preserved only when importing existing files for lossless round-trips. List-level data SHOULD be normalized into the document metadata block at the end of the file where a canonical destination exists (e.g. the `lists:` registry). When the same field is provided both inline and in document metadata, the document metadata block wins. In particular, if inline section metadata contains `id:` and the document metadata `lists:` registry also gives that list an ID, parsers, agents, and machines SHOULD use the `lists:` registry ID as the canonical list identity. Imported unknown or unsupported section/list fields SHOULD be preserved for lossless round-trips rather than dropped.

### Document Metadata (HTML Comment)

An HTML comment can contain document-level metadata. Tooling SHOULD write the document metadata block at the end of the file. Parsers SHOULD also accept a document metadata block at the top of the file for reader tolerance, but tooling SHOULD NOT emit new files with document metadata at the top unless preserving an existing file layout.

**Validity (Basic Embridge):**
- The document metadata block is OPTIONAL.

**Canonical output (tooling export/rewrite guidance, round-trip-safe output):**
- Tooling SHOULD include this block for lossless round-trips between tools.
- Tooling SHOULD write this block at the end of the file, after all list content. If tooling imports a file with document metadata at the top and rewrites/normalizes the file, it MAY move the block back to the end.
- For round-trip-safe output, tooling MUST include `title:` (document title) and `format:` (format descriptor).
- Tooling MAY include `lists:` to give list headings stable identifiers.
- Tooling SHOULD include `sync:` (last sync timestamp).
- Tooling SHOULD include `uuid:` (UUIDv7 recommended) to match documents across renames/moves.
- Tooling MAY include `syntax:` to store parser/agent syntax hints in document metadata.
- If `syntax:` is present, tooling SHOULD include a `mode` key.
- Tooling SHOULD omit `syntax:` when using default marker mode and no additional syntax hints.
- Tooling SHOULD write metadata fields in this recommended order for stable diffs: `title` → `sync` → `uuid` → `lists` → `fields` → `syntax` → `format`.

**If the document metadata block is present, each property MUST be on its own line.** This allows values to contain spaces without quoting (e.g., `title: My Project title`).

**Block terminator:** Parsers MUST recognize the block terminator as a line whose trimmed contents are exactly `-->`. A `-->` occurring mid-line inside a value (e.g., `title: Migration --> Phase 2`) does not terminate the block. Tools writing metadata SHOULD avoid emitting a value whose own trimmed line contents would be exactly `-->`.

```markdown
<!--
title: My Project title
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "Backlog" a1b2c3d, "In Progress" d4e5f6a, "Done" g7h8i9b
fields: note, sprint, client
format: Embridge v0.2.0, github.com/embridge-foundation/embridge
-->
```

| Field | Description |
|-------|-------------|
| `title` | Document title (required for round-trip-safe output). Tooling MUST generate and maintain this field; if missing, generate a default (e.g., derived from filename/repo) and write it back. Humans are not expected to manually edit document metadata; apps/parsers/AI agents SHOULD keep it up to date. |
| `sync` | ISO 8601 timestamp of last sync |
| `uuid` | Unique document identifier (UUIDv7 recommended) for sync matching across renames/moves |
| `lists` | Optional list registry: `lists: "{List Title}" {id}, "{Title}" {id} ...`. Apps MAY use this to give list headings stable identifiers. If the same list also has an inline section `id:`, this registry ID is canonical and wins on conflict. Registry entries are matched to headings by list title, so the registry is unambiguous only when titles are unique; if multiple lists share a title, parsers SHOULD pair registry entries with same-titled headings in document order, and where that remains ambiguous SHOULD fall back to each list's inline section `id:` rather than forcing a registry ID. |
| `syntax` | Optional syntax hints for parsing/export behavior. The key `mode` selects parsing behavior (e.g., `syntax: mode: marker` or `syntax: mode: blank-lines`) |
| `fields` | Optional comma-separated list of custom metadata key names. Declares additional keys that parsers recognize as valid item metadata (e.g., `fields: note, sprint, client` or `fields: due-date, start-time`). See "Standard Fields" for the built-in known keys. |
| `format` | Format descriptor (required for round-trip-safe output), e.g. `Embridge v0.2.0, github.com/embridge-foundation/embridge`. The version number MUST follow the `v{major}.{minor}.{patch}` format (e.g., `v0.2.0`). See [Versioning](#versioning) for parser behavior when version differences are encountered. |

**Reader tolerance (parser/import guidance):**
- Parsers MUST parse known document metadata fields by key name (case-insensitively) and MUST NOT rely on field order.
- Parsers SHOULD recognize document metadata blocks at either the end or the top of the file. If both a full multi-line metadata block and an inline format tag are present, the full block's `format:` field takes precedence.
- Parsers MUST match the format identifier value case-insensitively (e.g. `Embridge` and `embridge` are equivalent in the `format:` field and in inline format tags).
- Parsers SHOULD ignore unknown document metadata fields.

**Syntax hints (`syntax:`)**
- `syntax:` is an optional document-level parser/agent hint field.
- Recommended inline format: comma-separated key/value pairs inside the `syntax:` value.
- `mode` is the primary syntax key:
  - `syntax: mode: marker` (default behavior; marker-based item boundaries)
  - `syntax: mode: blank-lines` (optional extension; blank lines delimit item/subitem blocks)
- Parsers SHOULD ignore unknown syntax keys and SHOULD keep reading the document even if `syntax:` is malformed.
- Parsers SHOULD default to `mode: marker` when `syntax:` is missing, invalid, or has an unknown `mode`.
- Tooling SHOULD preserve `syntax:` on rewrite, and MAY apply supported keys when generating output.
- Exporters/tooling SHOULD NOT emit `syntax: mode: marker` by default; omit `syntax:` unless non-default behavior (for example `mode: blank-lines`) needs to be signaled.
- Basic Embridge validity remains marker-based; `mode: blank-lines` is an optional parsing extension for cooperative tooling/parsers.

**Inline Format Tag (compact alternative)**

A single-line HTML comment containing only `format:` may be used as a lightweight format identifier:

```markdown
<!-- format: Embridge v0.2.0 -->
```

Parsers MUST also tolerate a shorter form that omits the `format:` key, using just the format value:

```markdown
<!-- Embridge v0.2.0 -->
```

The shorter form (`<!-- Embridge v0.2.0 -->`) is only valid as a standalone single-line inline tag. It MUST NOT be used inside a multi-line metadata block.

**Validity (Basic Embridge):**
- The inline format tag is OPTIONAL.
- It contains only the `format:` field. Other document metadata fields (e.g. `title:`, `sync:`) are not supported in the inline form — use the full multi-line metadata block for those.

**Format value:**
- The `format:` value follows the same rules as in the full metadata block (see the `format` field in the table above).
- The repository URL portion is optional: both `Embridge v0.2.0` and `Embridge v0.2.0, github.com/embridge-foundation/embridge` are valid.

**Coexistence with the full metadata block:**
- A file MAY contain both an inline format tag and a full multi-line metadata block.
- When both are present, the `format:` field in the full metadata block takes precedence.
- The inline format tag SHOULD appear at the end of the file, after all items/content.

**When to use:**
- The inline format tag is intended for human-authored files that need minimal format identification without sync metadata.
- Tooling producing round-trip-safe output SHOULD use the full multi-line metadata block instead.

---

## Parsing

This section separates **reading/importing** (parsing) from **writing/exporting** (normalization). A Basic Embridge file can be read without any modifications; normalization is a tooling concern.

### Bootstrap (mode selection)

Before running the main body parser:

1. Parse leading and trailing HTML comment(s) (lightweight pre-pass) to read document metadata keys.
   - Recognize multi-line metadata blocks, inline format tags (`<!-- format: ... -->` or shorter `<!-- embridge v... -->`), or both.
   - Parse keys and the format identifier case-insensitively. If both forms are present, the full block's `format:` takes precedence.
2. Read `fields:` (if present) and add declared keys to the set of known item metadata keys.
3. Read `syntax:` (if present) and parse `mode`.
4. If `mode: blank-lines` is recognized and supported by the parser, use the blank-lines reader.
5. Otherwise, use marker mode (`mode: marker` default).

This bootstrap behavior is critical because syntax mode can change boundary detection rules.

### Reader (import / parse-only) — marker mode

```
1. Split file into sections by H1 headings (`# `)
2. For each section:
   a. Section name = list title
   b. Process lines sequentially (maintain "inside_quote" state, initially false):
      i.   If inside_quote is true:
           - Append line to current description buffer
           - If line contains closing `"` → Extract description up to `"`, parse remaining text after `",` as metadata fields, set inside_quote = false
      ii.  Before the first item/comment in a section, consecutive lines that are
           metadata field lines (`key: value`, comma-separated) or quoted
           description shorthand are section metadata; attach them to the list/section.
           Section metadata fields do not require a known key; preserve unknown
           fields/values for forward compatibility. Stop section metadata at the
           first item, comment, blank line, or non-metadata line.
      iii. Line starts with (spaces +) `- ` OR (spaces +) `{number}. ` → New item/task
           - `{number}` is `0` or a base-10 integer without leading zeros; lines like `01. Item` do not match this pattern and are not recognized as items
           - Count leading spaces to determine nesting depth (0=top, 2=sub, 4=sub-sub, ...)
           - Detect marker type: `-` = bullet, `{number}.` = ordered
           - If ordered: extract `{number}` for round-trip preservation (decorative only — not used for ordering)
           - Parse checkbox state and title
      iv.  Line after a `- ` or `{number}. ` line, does NOT start with `- `, `{number}. `, or `>` → Metadata for item above
           - Only the **first** metadata-like line after an item is parsed as metadata. If the item already has a metadata block, ignore the line and emit a warning.
           - If line starts with `"` and contains closing `"` → Single-line description shorthand
           - If line starts with `"` but no closing `"` → Begin multiline description, set inside_quote = true
           - Otherwise → Parse comma-separated `key: value` pairs
           - Lines not matching `key: value` pattern or description shorthand are non-conformant (ignore or warn)
      v.   Line starts with (more spaces +) `- ` OR (more spaces +) `{number}. ` → New nested item (child of nearest shallower item)
           - Same parsing as step ii
           - Nesting depth determined by leading space count
      vi.  Line starts with optional spaces + `>` → Comment for item above
           - Count leading spaces to determine parent item depth (0=top-level, 2=subitem, 4=sub-subitem)
           - Count `>` characters to determine reply depth (1=top, 2=reply, 3=reply-to-reply)
           - Parse optional `@author` and `[timestamp]` prefix
           - Remaining text is comment content
           - Continue collecting `>` lines until non-`>` line encountered
           - Continuation lines (no author/timestamp) are part of the previous comment's text
3. Parse HTML comment(s) for document metadata (if present) — recognize both multi-line metadata blocks and inline format tags at the top or end of the file
```

Note: A metadata field line or quoted description shorthand appearing immediately after a list heading (before the first item/comment, and clearly not itself a list item) is **section metadata** and attaches to the list/section, not an item (see "List Sections (H1 Headings)"). Consecutive section metadata field lines are preserved, including unknown fields. It is tolerated reader input; tooling SHOULD NOT emit new inline section metadata.

### Blank-Lines Mode (optional syntax extension)

Blank-lines mode allows items/subitems to be separated by blank lines instead of requiring list markers (`- ` or `{number}. `). It is a **superset** of marker mode: marker syntax is always recognized and takes precedence. The mode is activated by setting `syntax: mode: blank-lines` in document metadata.

Hard rules for `syntax: mode: blank-lines`:

1. **List titles** still use H1 headings (`# ` at column 0).
2. **Marker precedence:** A line starting with (optional leading spaces +) `- ` or (optional leading spaces +) `{number}. ` is ALWAYS parsed as a marker item, using the same rules as marker mode (reader steps ii/iv). Markers take precedence over blank-line boundary detection. Files in blank-lines mode MAY freely mix marker items and blank-line-separated items.
3. **Blank-line boundaries:** For non-marker lines, item/subitem boundaries are determined by blank lines (one or more consecutive empty lines) when `inside_quote` is false.
4. **Section preamble:** Section/list metadata, when present in blank-lines mode, MUST begin on the line directly below the section heading (`# `), with no intervening blank line or preamble text, and may continue only through consecutive section metadata field lines and/or quoted description shorthand. Once a non-empty non-metadata line appears after the heading, section metadata eligibility for that section is closed; later `key: value` lines in the same preamble are preamble text, not section metadata. Preamble text is preserved for round-tripping but MUST NOT be parsed as items. Preamble ends at the first blank line or marker line after the heading. If the implicit first section has no heading, there is no preamble — the first non-empty line starts normal item detection.
5. **Block start:** Each non-marker item/subitem block starts at the first non-empty, non-heading line after a blank-line boundary (outside preamble). The first line of the block is the item/subitem title.
6. **Nesting depth** is determined by leading spaces on the title line: a title is a child of the nearest earlier title with strictly fewer leading spaces. Blank-lines mode has no marker, so writers SHOULD indent children by 2 spaces per level (the marker-width rule does not apply when no marker is present).
7. **Checkboxes (optional):** A blank-line-delimited item title MAY begin with a checkbox (`[ ] `, `[x] `, or `[X] `). When present at the start of the title line (after leading spaces), it is parsed as the item's completion state — the same semantics as a checkbox after a marker in marker mode. The checkbox is not part of the title text. Parsers/apps MAY choose whether to support checkbox detection on non-marker items; if unsupported, the checkbox characters are included in the title as-is.
8. **Metadata and comment attachment:** Metadata and comment lines belong to the current block and MUST NOT be separated from their parent item title by a blank line:
   - Metadata lines follow the same `key: value` and quoted-description rules as marker mode.
   - Comment lines (`>`) attach to the current block.
   - A `>` line or metadata-like line that appears after a blank-line boundary with no preceding item in the current block is non-conformant. Parsers SHOULD ignore it and emit a warning.
9. **Multiline description** ownership is quote-scoped:
   - If a description starts with `"` and has no closing quote on that line, parser enters `inside_quote = true`.
   - While `inside_quote = true`, blank lines are part of the description and MUST NOT terminate the block.
   - Block termination by blank line is only allowed when `inside_quote = false`.
10. Only the **first** metadata-like line after a title is parsed as metadata. Additional metadata-like lines MUST be ignored and parsers SHOULD emit a warning.
11. **Non-conformant lines:** Free-form lines after a title that do not match metadata, comment, or marker patterns are non-conformant (ignore or warn, implementation-defined).

#### Reader (import / parse-only) — blank-lines mode

```
1. Split file into sections by H1 headings (`# `)
2. For each section:
   a. Section name = list title (from heading, if any)
   b. Collect section metadata and preamble (only when section has an explicit
      heading): starting from the line directly below the heading, first read
      consecutive section metadata syntax (`key: value` field lines or quoted
      description shorthand), if any, and attach it to the list/section. If the
      first non-empty line below the heading is not section metadata, or once a
      non-metadata preamble line has appeared, treat later non-marker lines as
      preamble text even if they look like `key: value`. Preserve preamble but
      do not parse it as items. Stop at the first blank line or marker line. If
      the section has no heading (implicit first section), skip this step (no
      preamble).
   c. Process remaining lines sequentially (maintain "inside_quote" state, initially
      false; maintain "current_block" state, initially null):
      i.   If inside_quote is true:
           - Append line to current description buffer
           - If line contains closing `"` → Extract description up to `"`,
             parse remaining text after `",` as metadata fields,
             set inside_quote = false
      ii.  Line starts with (spaces +) `- ` OR (spaces +) `{number}. ` → New marker item
           - Parse using the same rules as marker mode (checkbox, title, nesting depth)
           - Set current_block to this item
      iii. Line is empty → If inside_quote is false, set current_block = null
           (block boundary)
      iv.  current_block is not null AND line starts with optional spaces + `>`
           → Comment for current block
           - Parse as comment (same rules as marker mode step v)
      v.   current_block is null AND line starts with optional spaces + `>`
           → Orphaned comment (non-conformant: ignore and emit a warning)
      vi.  current_block is not null AND line does not start with `>` AND line
           is non-empty → Potential metadata for current block
           - Only the first metadata-like line after a title is parsed
           - If current block already has metadata, ignore and emit a warning
           - Same parsing rules as marker mode (key: value pairs, description
             shorthand, multiline description detection)
      vii. current_block is null AND line is non-empty → New blank-line-delimited item
           - Count leading spaces for nesting depth (0 = top, 2 = sub, 4 = sub-sub)
           - Optionally detect checkbox at start of title: `[ ] `, `[x] `, `[X] `
           - Remaining text (after spaces and optional checkbox) is the item title
           - Set current_block to this item
3. Parse HTML comment(s) for document metadata (if present) — recognize both multi-line metadata blocks and inline format tags at the top or end of the file
```

Notes:
- Blank-lines mode is a superset of marker mode: `- ` and `{number}. ` markers are always recognized and take precedence over blank-line boundary detection.
- A parser that does not support blank-lines mode SHOULD fall back to marker mode.
- The `syntax: mode: blank-lines` metadata is critical for parsers to correctly interpret files that use blank-line boundaries.
- Cooperative apps/tools MAY emit blank-lines mode output when explicitly configured, and SHOULD write `syntax: mode: blank-lines`.

### Tooling export/rewrite normalization (optional, recommended for round-trip-safe output)

When exporting/rewriting, tooling MAY normalize files to improve interoperability and round-tripping:

1. If the document metadata block is present or the tooling is producing round-trip-safe output:
   - If `title:` is missing → generate a default and write it back
   - If `format:` is missing → write canonical format descriptor
   - If `syntax:` is present → parse supported syntax keys as output hints; ignore unknown keys
   - If `syntax.mode` is missing/invalid/unknown → default to `mode: marker`
   - If selected mode is `marker` and there are no additional syntax hints → omit `syntax:` from emitted metadata
   - Write metadata fields in recommended order for stable diffs: `title` → `sync` → `uuid` → `lists` → `fields` → `syntax` → `format`
2. For items/tasks:
   - If `id` is missing → generate an ID and write it back (recommended for syncing)
   - If checkbox is missing → add `[ ]` (or `[x]` if completed), if the tooling chooses to normalize checkboxes
   - Preserve the original marker style (bullet or ordered) and the ordered number when round-tripping

**Inline format tag handling:**
- Tooling producing round-trip-safe output SHOULD use the full multi-line metadata block (not the inline format tag alone).
- The inline format tag is suitable for human-authored files or minimal Embridge format identification.
- If tooling encounters only an inline format tag and needs to add more metadata fields (e.g. `title:`, `sync:`), it SHOULD add a full multi-line metadata block and MAY keep or remove the existing inline tag.

**Key insight:** The marker indentation determines hierarchy. Metadata lines belong to the most recent item above. Multiline descriptions require stateful parsing to track open quotes.

### Regex Patterns

**Item/Task line (with nesting depth) — supports bullet and ordered markers:**
```regex
^( *)(?:- |((?:0|[1-9]\d*))\. )(?:\[([ xX])\] )?(.+)$
```
- Capture group 1: leading spaces (length ÷ 2 = nesting depth)
- Capture group 2: number (if ordered list), or absent/empty (if bullet)
- Capture group 3: checkbox state (space, x, X, or absent)
- Capture group 4: item title

Note: If you want to enforce 1–9 digits for ordered markers at parse-time, use `((?:0|[1-9]\d{0,8}))` instead of `((?:0|[1-9]\d*))`.

**Blank-line item title (blank-lines mode only — no marker, optional checkbox):**
```regex
^( *)(?:\[([ xX])\] )?(.+)$
```
- Capture group 1: leading spaces (length ÷ 2 = nesting depth)
- Capture group 2: checkbox state (space, x, X, or absent)
- Capture group 3: item title

Note: This regex is only used in blank-lines mode (reader step vii) for lines that did not match the marker item regex. Apply the marker item regex first; only fall through to this pattern for non-marker lines after a blank-line boundary.

**Metadata pair (comma-separated, optional space after colon):**
```regex
([a-zA-Z][a-zA-Z0-9-]*):\s*(?:"((?:[^"]|"")*)"|([^,]+))
```
Note: Apply this regex to each metadata line individually (not to the raw multi-line input). The unquoted branch `([^,]+)` will match to end-of-line for the last value on a line — this is expected; trim whitespace from all unquoted captures. For quoted values, unescape by replacing `""` with `"` after capture.

**Description shorthand — single-line (quoted string at line start):**
```regex
^\s*"((?:[^"]|"")*)"\s*(?:,\s*(.*))?$
```
- Capture group 1: description value (unescape `""` → `"`)
- Capture group 2: remaining metadata (if present, parse as `key: value` pairs)

**Description shorthand — multiline detection (opening quote without closing):**
```regex
^\s*"((?:[^"]|"")*)$
```
- If this matches (line starts with `"` but doesn't end with `"`), begin multiline mode
- Capture group 1: first line of description (partial)
- Continue accumulating lines until a line contains `"` followed by optional `, metadata`
- Multiline descriptions require stateful parsing; regex alone cannot handle the full case

**List heading:**
```regex
^# (.+)$
```

Note: All document metadata key regexes below SHOULD be applied case-insensitively (e.g. `format:` and `Format:` are equivalent).

**List registry line (document metadata):**
```regex
^lists:(.*)$
```

**Fields line (document metadata):**
```regex
^fields:(.*)$
```
Note: Split the captured value on `,` and trim whitespace from each entry to get the list of custom key names.

**Syntax line (document metadata):**
```regex
^syntax:(.*)$
```

**Syntax mode key (within `syntax:` value):**
```regex
(?:^|,\s*)mode:\s*(marker|blank-lines)\s*(?:,|$)
```

**Title line (document metadata):**
```regex
^title:(.*)$
```

**Format line (document metadata):**
```regex
^format:(.*)$
```

**Version extraction (from `format:` value):**
```regex
v(\d+)\.(\d+)\.(\d+)
```
- Group 1: major version
- Group 2: minor version
- Group 3: patch version

**List registry pair (within `lists:` value):**
```regex
"((?:[^"]|"")*)" \s*([^\s,]+)
```
- Group 1: list title (unescape `""` → `"`)
- Group 2: list ID

**Document metadata (multi-line block):**
```regex
<!--\s*([\s\S]*?)\s*-->
```
Note: This regex matches both the full multi-line metadata block and the inline format tag.

**Inline format tag (with `format:` key):**
```regex
^<!--\s*format:\s*(.+?)\s*-->$
```
- Capture group 1: format value (e.g. `Embridge v0.2.0`)

**Inline format tag (shorter form, no key):**
```regex
^<!--\s*(embridge\s+v\d+\.\d+\.\d+(?:,\s*.+?)?)\s*-->$
```
- Capture group 1: format value (e.g. `embridge v0.2.0`)

Use these regexes for fast-matching inline format tags specifically. The general document metadata regex above also matches inline tags.

**Comment line (flexible — author and timestamp optional):**
```regex
^( *)(>+)\s*(?:(?:@([^\[\s:]+)\s*)?(?:\[([^\]]+)\]\s*)?:\s*)?(.*)$
```
- Capture group 1: leading spaces (length ÷ 2 = parent item nesting depth; 0 = top-level item, 2 = subitem, etc.)
- Capture group 2: `>` characters (length = reply depth)
- Capture group 3: author (optional; `@` prefix required for detection, captured without it)
- Capture group 4: timestamp (optional, without brackets)
- Capture group 5: comment text

Examples:
- `> just a note` → depth=1, text="just a note"
- `> @alice: check this` → depth=1, author="alice", text="check this"
- `> [2025-01-20]: note` → depth=1, timestamp="2025-01-20", text="note"
- `> @alice [2025-01-20]: full form` → depth=1, author="alice", timestamp="2025-01-20", text="full form"
- `>> reply here` → depth=2, text="reply here"

---

## Synchronisation

### App → Markdown (export logic from apps)

When the application writes to the `.md` file:

**Tooling export/rewrite guidance:**
1. Tooling SHOULD preserve existing structure and formatting where possible, including marker style (bullet vs ordered).
2. Tooling SHOULD write metadata fields in canonical order: `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `on` → `due` → `id` (see "Standard Fields (Non-exhaustive)"); tooling SHOULD prefer description shorthand (`"..."`) over explicit `description:` when rewriting.
3. For round-trip-safe output, tooling MUST ensure `title:` exists in document metadata (generate if missing).
4. For round-trip-safe output, tooling MUST ensure `format:` exists in document metadata (generate if missing). Note: an inline format tag (`<!-- format: ... -->`) satisfies the `format:` requirement for output that is not round-trip-safe, but round-trip-safe output SHOULD use the full multi-line metadata block.
5. If `syntax:` is present, tooling MAY apply supported syntax hints during rewrite/export. Tooling SHOULD treat `mode` as parse-critical.
6. Tooling MAY emit blank-lines mode output when explicitly configured (`syntax: mode: blank-lines`), but SHOULD default to marker mode for maximum interoperability.
7. In default marker mode, tooling SHOULD omit `syntax:` from metadata unless non-default syntax behavior must be signaled.
8. Tooling SHOULD update `sync:` in document metadata when a sync/export is performed.
9. Tooling SHOULD write document metadata fields in this recommended order for stable diffs: `title` → `sync` → `uuid` → `lists` → `fields` → `syntax` → `format`.
10. Tooling MUST NOT write app-only data (colors, UI state) to markdown.
11. Tooling SHOULD add an `id` field to any item/task missing one when stable syncing is a goal (attachment subitems MAY be excluded; see "Attachments (Convention)").
12. For round-trip-safe output, tooling MUST ensure item `id` values are unique within the document before export. Duplicate imported IDs SHOULD be repaired by assigning new IDs to later duplicates rather than dropping items.
13. Tooling MAY add checkboxes (`[ ]` or `[x]`) to items/subitems that don't have one as a normalization step (recommended for consistent rendering), but SHOULD NOT add checkboxes to attachment items (see "Attachments (Convention)").
14. When rewriting items, tooling SHOULD preserve the original marker style. If an item was authored with `1.`, export as `1.` (not `-`). Tooling MUST NOT emit leading zeros (e.g., write `1.` not `01.`).
15. When generating or rewriting Embridge, tools MUST NOT place list IDs directly below headings. List IDs belong in document metadata via `lists:`. Inline section metadata is reader-tolerance only and should be preserved only when importing existing files for lossless round-trips. Normalize other list-level data into the document metadata block where a canonical destination exists (e.g. the `lists:` registry). Imported unknown or unsupported section/list fields SHOULD be preserved for lossless round-trips rather than dropped.
16. Tooling SHOULD use the document metadata `lists:` registry as the canonical source for list IDs. If an imported inline section `id:` conflicts with the registry ID for the same list, the registry ID wins and the inline value SHOULD be dropped or rewritten on export.

**Renumbering (optional):**
- Ordered marker numbers are purely decorative (see "Ordered marker constraints"). Item order is always determined by position in the file.
- Tools MAY renumber ordered markers for display consistency (e.g., sequential `1.`, `2.`, `3.`) but this is cosmetic only and MUST NOT alter item semantics or ordering.
- **Recommendation:** Preserve original numbers by default; offer renumber as an optional formatting action.

### Markdown → App (import logic into apps)

When the application reads the `.md` file:

**Parser/import guidance:**
1. Parse known document metadata fields by key name (case-insensitively) (`title`, `sync`, `uuid`, `lists`, `syntax`, `fields`, `format`) and do not depend on field order. If `fields:` is present, add its entries to the set of known item metadata keys.
2. Determine syntax mode from `syntax.mode`; if missing/invalid/unknown, default to `mode: marker`.
3. Use bootstrap behavior: parse metadata first, then parse body using the selected mode (`marker` or `blank-lines`).
4. If present, use the `title:` field as the document title; otherwise derive a fallback title (e.g., filename) without requiring a write.
5. Match lists by heading title and, when present, use the document metadata `lists:` registry as canonical list identity. If inline section metadata also provides a list `id:`, tolerate it, but the registry ID wins on conflict when the title match is unambiguous (see the `lists` field for duplicate-title handling). Preserve unknown inline section/list fields and values for forward compatibility.
6. Build an item-ID index and detect duplicate item `id` values (do not assume humans/AI authored unique IDs). List/section IDs are separate from item IDs and MUST NOT be added to the item-ID index.
7. Resolve duplicate item IDs using implementation-defined parser policy (recommended default: keep first occurrence, auto-assign new IDs to later duplicates, warn).
8. Match items/tasks by `id` when present (after duplicate-resolution policy is applied).
9. Items/tasks with new or missing IDs → create in database (and optionally generate IDs later on export).
10. Items/tasks with known IDs → update database from markdown (markdown wins for content fields).
11. If several items appear to share a group-level identifier, parsers SHOULD treat the shared value as duplicate item IDs unless it is stored in a separate grouping field. Apps MAY preserve or interpret custom grouping fields, but `id` remains item identity.
12. Items/tasks in database but missing from markdown → delete from database (or mark archived, implementation-defined).
13. Apply default values for missing fields.
14. Preserve marker style (where present) and ordered number (decorative) for later export.

### Conflict Resolution

The `.md` file wins for content fields. The application database wins for UI-only fields.

| Field Type | Source of Truth |
|------------|-----------------|
| Document title (`title:` field) | `.md` file |
| Item fields (`title`, `status`, `prio`, `on`, `due`, `tags`, `descr`) | `.md` file |
| List colors, sort order, UI preferences | App database |

---

## Examples

### Minimal Basic Embridge File

```markdown
- Buy apples
- Charge battery
```

List headings are recommended but not required:

```markdown
# To-do
- Buy apples
- Charge battery
```

### Minimal Format Tag (Inline Metadata)

```markdown
- Buy apples
- Charge battery

<!-- format: Embridge v0.2.0 -->
```

The shorter form (without the `format:` key) is also valid:

```markdown
- Buy apples
- Charge battery

<!-- embridge v0.2.0 -->
```

### Minimal Blank-Lines Mode File (Syntax Extension)

```markdown
apples

oranges

pears
"fresh batch"

  golden pears

  green pears

<!--
syntax: mode: blank-lines
-->
```

### Blank-Lines Mode with Mixed Markers

Demonstrates marker precedence — marker items and blank-line-delimited items coexist in the same file:

```markdown
# Tasks
- [ ] Buy apples
prio: high, id: abc123d

oranges
id: ora456b

- [ ] Buy bananas
id: ban789c

<!--
syntax: mode: blank-lines
-->
```

Parser output:
- `Buy apples` — marker item (`- [ ]`), metadata: `prio: high, id: abc123d`
- `oranges` — blank-line-delimited item, metadata: `id: ora456b`
- `Buy bananas` — marker item (`- [ ]`), metadata: `id: ban789c`

### Blank-Lines Mode with Section Preamble

Lines between a heading and the next blank line (that are not markers) are section preamble — preserved but not parsed as items:

```markdown
# Weekly Groceries
Items to pick up this weekend.
Check the pantry before going.

apples

oranges

<!--
syntax: mode: blank-lines
-->
```

Parser output:
- Section preamble (preserved, not items): "Items to pick up this weekend.", "Check the pantry before going."
- `apples` — item
- `oranges` — item

### Blank-Lines Mode with Comments

Comments and metadata attach to the current block — they must not be separated from their parent item by a blank line:

```markdown
Buy apples
"Get the organic ones"
> @alice [2026-01-20]: Check the farmer's market

Buy oranges
prio: low

<!--
syntax: mode: blank-lines
-->
```

Parser output:
- `Buy apples` — item with description `"Get the organic ones"` and comment by alice
- `Buy oranges` — item with metadata `prio: low`

### Blank-Lines Mode with Checkboxes (No Markers)

Blank-line items may optionally begin with a checkbox:

```markdown
[ ] apples

[x] oranges

[X] bananas

pears

<!--
syntax: mode: blank-lines
-->
```

Parser output:
- `apples` — item, checkbox: unchecked
- `oranges` — item, checkbox: checked
- `bananas` — item, checkbox: checked
- `pears` — item, no checkbox

### Blank-Lines Mode: Non-conformant Patterns (Warning Cases)

```markdown
Buy apples

> orphaned comment

Buy oranges
prio: high
status: open

<!--
syntax: mode: blank-lines
-->
```

Parser output:
- `Buy apples` — item
- `> orphaned comment` — **warning:** comment after blank-line boundary with no parent item in current block (non-conformant, ignored)
- `Buy oranges` — item, metadata: `prio: high`
- `status: open` — **warning:** second metadata line (ignored)

### Minimal Numbered List

```markdown
1. Buy apples
2. Buy oranges
3. Buy bananas
```

### Numbered List with Metadata

```markdown
# Shopping
1. [ ] Buy apples
prio: high, id: abc123d
2. [ ] Buy oranges
tags: fruit, id: def456a
3. [x] Buy bananas
status: done, id: ghi789a
```

### Nested Numbered Items

```markdown
1. [ ] Set up development environment
"Install all required tools and dependencies", id: setup01a
  1. [ ] Install Node.js
  id: node01b
  2. [ ] Install Docker
  id: dockr01
  3. [ ] Clone repository
  id: clone01c

2. [ ] Implement feature
id: impl01d
  1. [ ] Write unit tests
  id: test01e
  2. [ ] Write implementation
  id: code01f
  3. [ ] Update documentation
  id: docs01g
```

### Numbered Items with Comments

```markdown
1. [ ] Fix login bug
prio: high, id: logn01h
> @alice [2026-01-29]: Found the root cause
>> @bob [2026-01-29]: Can you share details?

2. [ ] Optimize database queries
id: db01abc
> check the slow query log
```

### Minimal Round-Trip-Safe File

```markdown
# To-do
- Buy apples
- Charge battery

<!--
title: Items/Tasks
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "To-do" a1b2c3d
format: Embridge v0.2.0, github.com/embridge-foundation/embridge
-->
```

### Full-Featured File

```markdown
# Backlog
- [ ] Research caching strategies
status: ideas, prio: high, tags: "research, backend", due: 2025-02-01, id: a1b2c3d
  - [ ] Evaluate Redis
  "Test Redis for session storage", id: s1t2u3f
  - [ ] Evaluate Memcached
  id: v4w5x6g

- Explore new auth library
tags: research, id: b2c3d4h

# To-do
- [ ] Fix pagination bug
"Users report that page 2 shows
duplicate items from page 1.
Check offset calculation.", prio: high, due: 2025-01-20, id: c3d4e5i

- [ ] Update dependencies
created: 2025-01-15, id: d4e5f6a

# In Progress
- [ ] Refactor user service
status: doing, prio: med, id: e5f6g7j

# Done
- [x] Write API documentation
status: done, created: 2025-01-10, id: f6g7h8k

- [x] Set up CI pipeline
id: g7h8i9b

<!--
title: Project Demo
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "Backlog" k3m9p2a, "To-do" q7w2e1b, "In Progress" z8x4c3d, "Done" r5t6y7e
format: Embridge v0.2.0, github.com/embridge-foundation/embridge
-->
```

## Rendering Compatibility (Appendix)

Embridge uses Markdown-inspired syntax but deviates from [CommonMark](https://commonmark.org/) in several deliberate ways to prioritize human ergonomics. These deviations mean that Embridge files rendered in a standard Markdown viewer (GitHub, VS Code preview, etc.) will not display with perfect fidelity. This appendix documents the known differences.

### 1. Marker-width nesting indentation (legacy 2-space files)

Conforming Embridge writers indent each child to its parent's content column (`- ` → +2, `1. ` → +3, `10. ` → +4), which matches CommonMark — so newly-written Embridge files render nesting correctly in standard Markdown viewers. Parsers also accept any deeper indent, so legacy files written under the older flat 2-space rule remain valid input. Those legacy files may, however, render nesting incorrectly in CommonMark viewers when an ordered parent has a multi-digit marker:

```markdown
10. [ ] Parent task
  1. [ ] Subtask  ← legacy 2-space child; CommonMark needs 4 spaces here
```

| Viewer | Interpretation |
|---|---|
| **Embridge** | `Subtask` is a child of `Parent task` (deeper indent → child) |
| **CommonMark** | `Subtask` starts a new separate list (needs 4 spaces to be a child of a `10. ` marker) |

**Impact:** Files produced by conforming tooling are CommonMark-compatible for nesting. Only legacy files with multi-digit ordered parents at insufficient indent may render nesting incorrectly.

### 2. Non-indented metadata breaks list continuation

Embridge metadata lines (e.g., `prio: high, id: abc123d`) follow an item line without requiring indentation. In CommonMark, continuation content must be indented to the content column to remain part of the list item. A bare, non-indented line breaks the list.

```markdown
- [ ] Fix the login bug
prio: high, id: abc123d
- [ ] Next task
```

| Viewer | Interpretation |
|---|---|
| **Embridge** | `prio: high, id: abc123d` is metadata belonging to `Fix the login bug` |
| **CommonMark** | `prio: high, id: abc123d` is a paragraph that terminates the list; `Next task` starts a new list |

**Impact:** Metadata lines render as free-standing paragraphs that visually break lists in Markdown viewers. The data is still visible, but the list structure is interrupted.

### 3. `>` repurposed from blockquotes to comments

Embridge uses `>` lines as item-level comments (with optional author, timestamp, and threading). In standard Markdown, `>` denotes a blockquote.

```markdown
- [ ] Refactor auth module
id: abc123d
> @alice [2025-01-20]: Starting refactor today
>> @bob [2025-01-21]: Use the new OAuth library
```

| Viewer | Interpretation |
|---|---|
| **Embridge** | Two comments: a top-level comment by alice and a threaded reply by bob |
| **CommonMark / GitHub** | A blockquote containing `@alice [2025-01-20]: Starting refactor today` and a nested blockquote containing `@bob [2025-01-21]: Use the new OAuth library` |

**Impact:** Comments render as blockquotes in Markdown viewers. Content is readable but loses its semantic meaning as item-attached discussion. Threading via `>>` renders as nested blockquotes, which is visually similar but semantically different.

---

## References

- [CommonMark Spec](https://spec.commonmark.org/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Minimal to-do](https://github.com/xpiu/minimal-to-do)

---

## License

This specification is released under the [MIT License](LICENSE).

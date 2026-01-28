# Specifications for Embridge: an open source item/task list format

**Version:** 0.0.6
**Last Updated:** 2026-01-27
**Example output:** `embridge_output_demo_v0_0_6.md`
**Author:** xpiu
**Github:** Repo URL will be made available soon ...
**Project website:** https://embridge.net

---

## Contents

- [Overview](#overview)
- [Conformance](#conformance)
- [Project goals](#project-goals)
- [Bridge Philosophy](#bridge-philosophy)
- [File Structure](#file-structure)
- [Syntax Reference](#syntax-reference)
- [Parsing Algorithm](#parsing-algorithm)
- [Sync Behavior](#sync-behavior)
- [Examples](#examples)
- [References](#references)
- [License](#license)

---

## Overview

This specification defines a markdown-based format for storing item/task lists that serves as a **bridge** between human editors, AI agents, and application GUIs. The format prioritizes legibility and flexibility while remaining parseable by machines. Embridge is an edited abbreviation of the words 'item' and 'bridge'.

---

## Project goals

- Offer an item and list format that humans like to use (human-friendly first). Easy to learn, read and edit. With some editing flexibility.
- Be AI-friendly. Easy for AI to pick up, read and edit.
- Provide guidance on usage in apps 
- Remain Markdown-compliant
- Support reliable automation - e.g. stable per-item `id`, simple `key: value` metadata
- Stay merge- and diff-friendly for git workflows
- Remain tool- and vendor-agnostic (portable across editors/apps/forges)
- Preserve forward compatibility (ignore/preserve unknown fields)

---

## Bridge Philosophy

This format exists to solve a fundamental tension in item/task management:

```
Strict formats        ←────────────→        No format
(JSON, YAML)             THIS FORMAT            (prose)

Humans often think JSON/YAML is too complex to edit, but machines love it.
Machines struggle with interpretation if the text isn't formatted.
The Embridge format aims to find middle ground.
```

## Design Principles

1. **Developers won't fight it, AI can still parse it.**
   The format is loose enough for quick hand-editing, structured enough for reliable parsing.

2. **Structure without strictness.**
   The format defines structure (lists, indentation), not validation. Field values are interpreted liberally.

3. **At the item/task level, everything is optional.**
   A valid item/task can be a single line. Metadata is added only when needed. For reliable syncing and round-tripping, exporting/rewriting tools typically add stable IDs and document metadata, but Basic Embridge validity does not require them.

4. **The `.md` file is the source of truth for content.**
   Application databases store supplementary data (UI preferences, colors). The markdown file owns the items/tasks.

## Integration Model

```
┌─────────────────────────────────────────────────────────────┐
│             .md file (GitHub or other repo provider)        │
│                   Source of truth for content               │
└─────────────────────┬───────────────────────┬───────────────┘
                      │                       │
                      ▼                       ▼
              ┌───────────────┐       ┌───────────────┐
              │  AI Agents    │       │  Human Devs   │
              │  (read/write) │       │  (hand-edit)  │
              └───────────────┘       └───────────────┘
                      │                       │
                      ▼                       ▼
              ┌─────────────────────────────────────┐
              │         Application GUI             │
              │  (sync, enhance with UI metadata)   │
              └─────────────────────────────────────┘
```

**Sync behavior:**
- App reads `.md`, creates/updates local database
- App writes `.md` on local changes
- Missing fields in `.md` → App fills defaults
- Missing IDs → App generates and writes back
- Item deleted from `.md` → App removes from database
- UI-only data (colors, sort preferences) → App database only

---

## Conformance

This spec uses the keywords **MUST**, **SHOULD**, **MAY**, and **MUST NOT** in the RFC 2119 sense.

Embridge intentionally separates:

- **Validity (Basic Embridge):** the minimum required for a document to be considered valid Embridge and parseable as lists/items.
- **Tooling export/rewrite guidance:** recommendations and requirements for apps/parsers/AI agents when exporting, rewriting, or normalizing Embridge (especially for diff-friendly output and reliable round-trips).
- **Parser/import guidance:** recommendations and requirements for readers to be tolerant (accept common human variations, preserve unknown fields, avoid data loss).
- **Notes:** tips, rationale, and practical implementation advice.

When this spec says something is “required”, it is either:

- required for **Basic Embridge validity**, or
- required for **sync-ready output** (round-trip syncing between tools), even if a human-authored file without it is still valid Basic Embridge.

---

## File Structure

```markdown
# {List Title}
- [ ] {Item/Task title}
{metadata line with key: value pairs, comma-separated}

- {Item/Task without checkbox}
{metadata line}

# {Another List Title}
- [x] {Completed item/task}
{metadata line}

<!--
embridge:{version}
project:{Project title}
sync:{ISO 8601 timestamp}
uuid:{document identifier, UUIDv7 recommended}
lists:{list_id}:"{List Title}" {list_id}:"{Another List Title}"
-->
```

Note: Metadata lines do not require indentation. The parser knows they belong to the item/task directly above. Descriptions use the `description:` field (or shorthand: a quoted string at line start).

**Validity (Basic Embridge):**
- List headings are OPTIONAL; items/tasks MAY appear without a preceding `# ` heading.
- If present, list headings MUST be headings that start with `# ` at column 0.
- Items/Tasks MUST be Markdown list items that start with `-` (optionally with a checkbox).
- A metadata line MAY follow an item/task; if present it MUST be either:
  - comma-separated `key: value` pairs, or
  - a quoted description shorthand (`"..."`, single-line or multiline), or
  - empty.
- The document metadata HTML comment block is OPTIONAL for basic Embridge validity.

**Tooling export/rewrite guidance (apps/parsers/AI agents):**
- Tooling SHOULD preserve existing formatting where practical, but SHOULD emit a canonical, diff-friendly style when rewriting.
- For sync-ready output, tooling SHOULD include and maintain the document metadata block (see "Document Metadata"), including `embridge:`, `project:`, and `lists:`.
- When exporting items that have no list heading, tooling SHOULD add a default list title (e.g., "Items" or "Tasks").

**Parser/import guidance:**
- Parsers SHOULD tolerate missing metadata lines and missing document metadata and apply reasonable defaults.
- Parsers SHOULD NOT require humans to keep the document metadata block in perfect shape; apps/agents can normalize on write.
- Parsers SHOULD accept items without a preceding list heading and assign them to a default/unnamed list.

### Project title

The Project title is stored in the document metadata's `project:` field.

**Tooling export/rewrite guidance:** Tooling MUST generate and maintain `project:` when producing sync-ready output. If missing, generate a default (e.g., derived from filename/repo) and write it back.

Humans are not expected to manually edit document metadata; apps/parsers/AI agents SHOULD keep it up to date.

---

## Syntax Reference

### Items/Tasks

An item/task is a markdown list item. All of the following are valid:

```markdown
- [ ] Item/Task with unchecked checkbox
- [x] Item/Task with checked checkbox (lowercase)
- [X] Item/Task with checked checkbox (uppercase)
- Item/Task without checkbox
```

**Validity (Basic Embridge):**
- An item/task line MUST start with `-` (optionally preceded by indentation spaces for subitems).
- The checkbox, if present, MUST use the Markdown task syntax `- [ ]`, `- [x]`, or `- [X]`.
- The remainder of the line (after checkbox, if present) is the item/task title.

**Tooling export/rewrite guidance (apps/parsers/AI agents):**
- Tooling SHOULD emit checkboxes for interoperability and consistent rendering.
- Tooling SHOULD prefer `- [ ]` for incomplete and `- [x]` for complete (readers still accept `- [X]`).

**Parser/import guidance:**
- Parsers SHOULD accept items without checkboxes and treat their completion state as “unknown” (`completed: null`) until an app assigns a default.

**Parsing rules:**
- `- [ ]` → `completed: false`
- `- [x]` or `- [X]` → `completed: true`
- `-` (no checkbox) → `completed: null` (app decides default)

**Checkbox behavior:**
- **For humans:** Checkboxes are optional. You can write `- Buy milk` without a checkbox — it's valid and convenient for quick entry.
- **For parsers/apps:** When writing items back to the file, parsers SHOULD add checkboxes (`[ ]` or `[x]`) to items and subitems that don't have them. This normalizes the format for consistent rendering and interoperability.
- Items without checkboxes are treated as `completed: null` (unchecked by default when a parser adds the checkbox).

### Metadata Line

The line immediately following an item/task contains metadata as `key: value` pairs separated by commas. **Metadata does not require indentation** — the parser knows it belongs to the item/task directly above it.

```markdown
- [ ] Example item/task
status: todo, prio: high, tags: "backend, api", due: 2025-01-15, id: a1b2c3
```

Indented metadata is also valid (for visual preference):

```markdown
- [ ] Example item/task
  status: todo, prio: high, tags: "backend, api", due: 2025-01-15, id: a1b2c3
```

**Conformance:**

**Validity (Basic Embridge):**
- **Comma separates field pairs:** `key: value, key: value`
- **Keys use lowercase letters:** `key` SHOULD match `[a-z]+` (unknown keys are allowed as long as they follow the same `key: value` shape)
- **Space after colon is optional:** `key: value` and `key:value` are both valid
- **Quoting:** Any value containing a comma MUST be quoted with `"` so it stays a single value
- **Escaping quotes:** Inside a quoted value, a literal `"` is written as `""`
- All fields are optional
- Metadata indentation is optional — parsers accept both indented and non-indented
- Trailing comma is allowed but not required: `prio: high, due: 2025-01-15,` (valid)

**Tooling export/rewrite guidance (apps/parsers/AI agents):**
- Tooling SHOULD use `key: value` (with a single space after `:`) for readability.
- Tooling SHOULD NOT output a space before the colon (`key : value`).
- Tooling SHOULD quote values that contain commas, leading/trailing spaces, or `"` characters.

**Parser/import guidance:**
- Parsers SHOULD be tolerant about whitespace and MAY accept `key : value` (treat as non-canonical and warn if possible).
- Parsers SHOULD trim surrounding whitespace from unquoted values.

**Parser note — quoting values with commas:**

Since commas separate field pairs, any value containing a comma MUST be quoted. Parsers importing/exporting Embridge data must handle this:

| Example | Valid? | Reason |
|---------|--------|--------|
| `tags: apples, created: 2025-01-15` | ✓ | Single tag, no ambiguity |
| `tags: apples, oranges, created: 2025-01-15` | ✗ | Parser sees `oranges` as a key |
| `tags: "apples, oranges", created: 2025-01-15` | ✓ | Quoted value, comma is protected |

Parsers SHOULD automatically quote values containing commas when writing, and MUST handle quoted values when reading.

**Parser note — escaping quotes in quoted values:**

Inside a quoted value, a literal double quote is represented as two double quotes (`""`). Parsers MUST unescape `""` to `"` when reading quoted values, and parsers writing quoted values SHOULD escape `"` as `""`.

### Tags Field

Tags have special syntax to support both single and multiple values:

**Single tag (no quotes needed):**
```markdown
tags: backend
tags:backend
```

**Multiple tags (quoted, comma-separated):**
```markdown
tags: "backend, api, urgent"
tags: "backend,api,urgent"
```

The space after the comma inside quotes is recommended for readability but optional. Both `"backend, api"` and `"backend,api"` are valid.

### Defined Fields

| Field | Aliases | Description | Example Values |
|-------|---------|-------------|----------------|
| `description` | `descr` | Short description | `"Fix the login bug"` |
| `status` | | Workflow status | `todo`, `doing`, `done`, `backlog`, `ideas` |
| `prio` | `priority` | Priority level | `high`, `med`, `low`, `1`, `2`, `3` |
| `tags` | `keywords` | Labels (single or quoted list) | `backend` or `"backend, api, urgent"` |
| `assignee` | `owner`, `assigned` | Who's responsible | `@alice`, `team-backend` |
| `created` | `date`, `createddate` | Created/reference date | `2025-01-15` |
| `updated` | `modified`, `mod` | Last modified date | `2025-01-18` |
| `due` | `duedate` | Due date | `2025-01-15`, `tomorrow`, `next-week` |
| `id` | | Stable identifier (recommended) | `a1b2c3`, `x7y8z9` |

**Canonical Field Order:** The table above defines the canonical order for fields when exporting/writing. Parsers and apps SHOULD output fields in this order: `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `due` → `id`. When importing/reading, field order does not matter — accept any order. This ensures consistent, diff-friendly output while remaining flexible for human editing.

**ID conformance (recommended for sync-ready output):**
- If an `id` field is present, it MUST be unique within the file (across all items and subitems).
- Tooling SHOULD generate lowercase alphanumeric IDs and SHOULD default to 6 characters (`[a-z0-9]{6}`) for readability and interoperability.
- Parsers SHOULD accept longer IDs and MAY accept non-canonical casing/characters, but tooling SHOULD normalize to the canonical form when rewriting.

**Why 6-character IDs?** Using 6-character lowercase alphanumeric IDs (a-z, 0-9 — 36 ASCII characters, not UTF-8 extended), you get 36^6 ≈ 2.18 billion unique combinations. Due to the birthday paradox, collision probability reaches 1% at around 6,500 items and 50% at around 50,000 items. For a personal or small-team todo app where users realistically create hundreds to a few thousand items over their lifetime, the collision probability is effectively negligible (<0.1%). This format is also URL-safe, case-insensitive friendly, and easily readable/typeable by humans when needed.

**Field Aliases:** Parsers SHOULD accept both the canonical field name and its aliases. When writing, prefer the canonical form.

**Extensibility:** Parsers SHOULD accept and preserve any `key: value` pair, even if not defined above. This allows app-specific fields.

### Descriptions

Descriptions use the `description:` metadata field (or its alias `descr:`) with a quoted value:

```markdown
- [ ] Complex item/task
description: "This explains the item/task in detail", prio: high, due: 2025-01-15, id: a1b2c3
```

**Shorthand syntax:** Since descriptions are common and always come first in canonical field order, a quoted string at the start of a metadata line is treated as an implicit `description:` value:

```markdown
- [ ] Complex item/task
"This explains the item/task in detail", prio: high, due: 2025-01-15, id: a1b2c3
```

Both forms are equivalent. The shorthand can also stand alone:

```markdown
- [ ] Simple item with just a description
"More details about this item"
```

**Shorthand rules:**
- Applies only when `"` is the first non-whitespace character on the metadata line
- The quoted value is parsed as `description:` (same escaping rules: `""` → `"`)
- Can be followed by other fields after a comma: `"My description", prio: high, id: abc123`
- If both shorthand and explicit `description:` appear, parsers SHOULD treat this as an error (or use last-wins)
- When exporting, parsers SHOULD prefer the shorthand form for brevity (explicit `description:` or `descr:` are also valid)

**Multiline descriptions:** The shorthand syntax supports descriptions spanning multiple lines. The description starts with `"` on the first metadata line and continues until the closing `"` is found:

```markdown
- [ ] Complex item/task
"This is a longer description
that spans multiple lines.
It can include detailed notes.", prio: high, id: a1b2c3
```

**Multiline rules:**
- The opening `"` must be the first non-whitespace character on the metadata line (same as single-line shorthand)
- All lines until the closing `"` are part of the description value
- Newlines are preserved literally in the parsed description
- Escaped quotes (`""`) work the same: `""` → `"`
- Other metadata fields follow after the closing `"` and a comma (on the same line as the closing quote)
- Parsers track "inside open quote" state across lines until the closing `"` is found

```markdown
- [ ] Item with multiline description and metadata
"First line of description.
Second line with more detail.
Third line wrapping up.", status: todo, prio: high, id: x1y2z3
```

**Important (Validity):** Free-form text immediately after an item/task is **non-conformant** Embridge. The line after a `- ` item must contain valid `key: value` pairs, a quoted description (single or multiline), or be empty/another item.

**Tooling export/rewrite guidance:** If you want to attach human notes, convert them into either:
- a description (`"..."` shorthand, including multiline), or
- a custom field (e.g., `note: "..."`) that still follows `key: value`.

**Parser/import guidance:** Parsers MAY choose to treat non-conformant free-form lines as a best-effort description during import (to avoid data loss), but tooling SHOULD NOT emit that form.

```markdown
- [ ] Call the client
Note: they prefer mornings     ← NOT VALID (not a key: value pair)

- [ ] Call the client
note: "they prefer mornings"   ← VALID (proper key: value syntax)

- [ ] Call the client
"they prefer mornings"         ← VALID (description shorthand)
```

### Subitems/Subtasks

Items/Tasks can contain nested subitems/subtasks. **Hierarchy is determined solely by the indentation of the dash (`-`) character.** Metadata lines do not require indentation.

```markdown
- [ ] Parent item/task
prio: high, id: a1b2c3
  - [ ] Subitem/Subtask one
  status: todo, id: d4e5f6
  - Subitem/Subtask two (no checkbox)
  "Subitems/Subtasks can omit things like checkboxes and id"
    - [ ] Sub-subitem/subtask
    id: nested123
```

**The core principle:**

1. **Spaces before the dash determine hierarchy level:**
   - `- ` (0 spaces) → top-level item
   - `  - ` (2 spaces) → subitem (child of nearest item above with fewer spaces)
   - `    - ` (4 spaces) → sub-subitem
   - And so on...

2. **The line after any `- ` line is metadata for that item** (valid `key: value` pairs or description shorthand). The parser associates it with the item/task directly above. Metadata for a subitem does NOT need to be indented to match its parent dash:

   ```markdown
   - [ ] Parent item
   prio: high, id: abc123
     - [ ] Subitem
   status: todo, id: def456      ← no indentation needed, still belongs to subitem above
   ```

3. **A line starting with spaces + dash starts a new item** at the corresponding nesting level.

**Indentation rules (for the dash only):**

| Spaces before `-` | Meaning |
|-------------------|---------|
| 0 | Top-level item/task |
| 2 | Subitem/Subtask (level 1) |
| 4 | Sub-subitem/subtask (level 2) |
| 6 | Level 3, etc. |

**Validity (Basic Embridge):**
- Indentation before the dash SHOULD be in multiples of 2 spaces; odd indentation (1, 3, 5, … spaces) is non-conformant.

**Tooling export/rewrite guidance:**
- Tooling MUST NOT generate odd indentation because it makes hierarchy ambiguous across implementations.

**Parser/import guidance:**
- Parsers SHOULD treat odd indentation as non-conformant and MAY either reject the line, warn, or round down to the nearest even depth.

**Parsing rules:**
- Count leading spaces before `-` to determine nesting depth
- The line immediately after a `- ` line (that doesn't start with `-`) is metadata for that item (must be valid `key: value` pairs)
- When a new `- ` line appears, it starts a new item at the depth indicated by its indentation
- Subitems/Subtasks follow the same syntax as items/tasks (optional checkbox, optional metadata)
- Nesting depth is unlimited but 2 levels is typical

### Lists (Sections)

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

**Tooling export/rewrite guidance:**
- List titles are arbitrary (not predefined statuses).
- List titles SHOULD be unique within a file (to avoid ambiguity when matching without `lists:` IDs).
- When exporting, tooling SHOULD add a list heading for items that lack one.

**Parser/import guidance:**
- Parsers SHOULD tolerate duplicate list titles, but SHOULD prefer `lists:` IDs (when present) to disambiguate.
- Parsers SHOULD accept items without a preceding list heading.
- The `status` field is independent of list membership.

### Document Metadata

An HTML comment at the end of the file can contain document-level metadata.

**Validity (Basic Embridge):**
- The document metadata block is OPTIONAL.

**Tooling export/rewrite guidance (sync-ready output):**
- Tooling SHOULD include this block for round-trip syncing between tools.
- If the block is present, tooling MUST include `embridge:` (spec version) and `project:` (project title).
- Tooling SHOULD include `lists:` to give list headings stable IDs across renames and reorderings.
- Tooling SHOULD include `uuid:` (UUIDv7 recommended) to match documents across renames/moves.

**If the document metadata block is present, each property MUST be on its own line.** This allows values to contain spaces without quoting (e.g., `project:My Project title`).

```markdown
<!--
embridge:0.0.6
project:My Project title
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:a1b2c3:"Backlog" d4e5f6:"In Progress" g7h8i9:"Done"
-->
```

| Field | Description |
|-------|-------------|
| `embridge` | Format version (semver) — enables parsers to detect compatibility |
| `project` | Project title (required for sync-ready output) |
| `lists` | List registry (recommended for sync-ready output): `lists:{6-char id}:"{List Title}" {id}:"{Title}" ...` |
| `sync` | ISO 8601 timestamp of last sync |
| `uuid` | Unique document identifier (UUIDv7 recommended) for sync matching across renames/moves |

**List IDs (`lists:`)**
- The `lists:` line is app-managed metadata used to give lists stable identifiers without requiring humans to edit IDs in headings.
- List IDs MUST be 6 characters of lowercase alphanumeric (`[a-z0-9]{6}`) and MUST be unique within the file.
- List ID generation is implementation-defined (e.g. random, hash-based, sequential) as long as it is collision-resistant within the file.
- List titles in the `lists:` line SHOULD be quoted; list titles containing spaces MUST be quoted.
- List IDs are separate from item/task `id` values (they live in document metadata, not item metadata).

**Tooling export/rewrite guidance:**
- Ensure every `# {List Title}` heading has a corresponding `{id}:"{List Title}"` entry in the `lists:` line (generate missing IDs using an implementation-defined strategy).
- Remove or ignore `lists:` entries whose titles no longer exist in the file.
- Write the `lists:` line as the last line inside the document metadata comment to keep diffs stable.
- Preserve list-pair ordering and other unknown metadata where possible to keep diffs stable.

**Parser/import guidance:**
- Parsers SHOULD accept missing `lists:` and fall back to matching lists by title.
- Parsers SHOULD treat `lists:` as app-managed and SHOULD NOT require humans to keep it perfectly up to date.

---

## Parsing Algorithm

This section separates **reading/importing** (parsing) from **writing/exporting** (normalization). A Basic Embridge file can be read without any modifications; normalization is a tooling concern.

### Reader (import / parse-only)

```
1. Split file into sections by H1 headings (`# `)
2. For each section:
   a. Section name = list title
   b. Process lines sequentially (maintain "inside_quote" state, initially false):
      i.   If inside_quote is true:
           - Append line to current description buffer
           - If line contains closing `"` → Extract description up to `"`, parse remaining text after `",` as metadata fields, set inside_quote = false
      ii.  Line starts with (spaces +) `-` → New item/task
           - Count leading spaces to determine nesting depth (0=top, 2=sub, 4=sub-sub, ...)
           - Parse checkbox state and title
      iii. Line after a `-` line, does NOT start with `-` → Metadata for item above
           - If line starts with `"` and contains closing `"` → Single-line description shorthand
           - If line starts with `"` but no closing `"` → Begin multiline description, set inside_quote = true
           - Otherwise → Parse comma-separated `key: value` pairs
           - Lines not matching `key: value` pattern or description shorthand are non-conformant (ignore or warn)
      iv.  Line starts with (more spaces +) `-` → New nested item (child of nearest shallower item)
3. Parse HTML comment for document metadata (if present)
```

### Tooling export/rewrite normalization (optional, recommended for sync-ready output)

When exporting/rewriting, tooling MAY normalize files to improve interoperability and round-tripping:

1. If the document metadata block is present or the tooling is producing sync-ready output:
   - If `project:` is missing → generate a default and write it back
   - Ensure the `lists:` line exists and contains an entry for each list heading (generate missing 6-char IDs using an implementation-defined strategy)
2. For items/tasks:
   - If `id` is missing → generate an ID and write it back (recommended for syncing)
   - If checkbox is missing → add `[ ]` (or `[x]` if completed), if the tooling chooses to normalize checkboxes

**Key insight:** The dash indentation determines hierarchy. Metadata lines belong to the most recent item above. Multiline descriptions require stateful parsing to track open quotes.

### Regex Patterns

**Item/Task line (with nesting depth):**
```regex
^( *)- (?:\[([ xX])\] )?(.+)$
```
- Capture group 1: leading spaces (length ÷ 2 = nesting depth)
- Capture group 2: checkbox state (space, x, X, or absent)
- Capture group 3: item title

**Metadata pair (comma-separated, optional space after colon):**
```regex
([a-z]+):\s*(?:"((?:[^"]|"")*)"|([^,]+))
```
Note: Apply globally, then trim whitespace from unquoted values. For quoted values, unescape by replacing `""` with `"` after capture.

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

**List registry line (document metadata):**
```regex
^lists:(.*)$
```

**List registry pair (within `lists:` value):**
```regex
([a-z0-9]{6}):(?:"((?:[^"]|"")*)"|([^\s]+))
```
Note: For quoted list titles, unescape by replacing `""` with `"` after capture.

**Document metadata:**
```regex
<!--\s*([\s\S]*?)\s*-->
```

---

## Sync Behavior

### App → Markdown (export logic from apps)

When the application writes to the `.md` file:

**Tooling export/rewrite guidance:**
1. Tooling SHOULD preserve existing structure and formatting where possible.
2. Tooling SHOULD write metadata fields in canonical order: `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `due` → `id` (see “Defined Fields”); tooling SHOULD prefer description shorthand (`"..."`) over explicit `description:` when rewriting.
3. For sync-ready output, tooling MUST ensure `project:` exists in document metadata (generate if missing).
4. For sync-ready output, tooling SHOULD ensure the `lists:` line exists, contains an entry for each list heading (generate if missing), and is written as the last line in the metadata comment.
5. Tooling SHOULD update `sync:` in document metadata when a sync/export is performed.
6. Tooling MUST NOT write app-only data (colors, UI state) to markdown.
7. Tooling SHOULD add an `id` field to any item/task missing one when stable syncing is a goal.
8. Tooling MAY add checkboxes (`[ ]` or `[x]`) to items/subitems that don't have one as a normalization step (recommended for consistent rendering).

### Markdown → App (import logic into apps)

When the application reads the `.md` file:

**Parser/import guidance:**
1. If present, use the `project:` field as the project title; otherwise derive a fallback title (e.g., filename) without requiring a write.
2. Match lists by `lists:` IDs when available (by matching list titles to `{id}:"{List Title}"` entries within the `lists:` line); otherwise match lists by heading title.
3. Match items/tasks by `id` when present.
4. Items/tasks with new or missing IDs → create in database (and optionally generate IDs later on export).
5. Items/tasks with known IDs → update database from markdown (markdown wins for content fields).
6. Items/tasks in database but missing from markdown → delete from database (or mark archived, implementation-defined).
7. Apply default values for missing fields.

### Conflict Resolution

The `.md` file wins for content fields. The application database wins for UI-only fields.

| Field Type | Source of Truth |
|------------|-----------------|
| Project title (`project:` field) | `.md` file |
| title, status, prio, due, tags, descr | `.md` file |
| list IDs (`lists:` line) | `.md` file |
| list colors, sort order, UI preferences | App database |

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

### Minimal Sync-Ready File

```markdown
# To-do
- Buy apples
- Charge battery

<!--
embridge:0.0.6
project:Items/Tasks
lists:a1b2c3:"To-do"
-->
```

### Full-Featured File

```markdown
# Backlog
- [ ] Research caching strategies
status: ideas, prio: high, tags: "research, backend", due: 2025-02-01, id: a1b2c3
  - [ ] Evaluate Redis
  "Test Redis for session storage", id: s1t2u3
  - [ ] Evaluate Memcached
  id: v4w5x6

- Explore new auth library
tags: research, id: b2c3d4

# To-do
- [ ] Fix pagination bug
"Users report that page 2 shows
duplicate items from page 1.
Check offset calculation.", prio: high, due: 2025-01-20, id: c3d4e5

- [ ] Update dependencies
created: 2025-01-15, id: d4e5f6

# In Progress
- [ ] Refactor user service
status: doing, prio: med, id: e5f6g7

# Done
- [x] Write API documentation
status: done, created: 2025-01-10, id: f6g7h8

- [x] Set up CI pipeline
id: g7h8i9

<!--
embridge:0.0.6
project:Project Demo
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:k3m9p2:"Backlog" q7w2e1:"To-do" z8x4c3:"In Progress" r5t6y7:"Done"
-->
```

---

## References

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [CommonMark Spec](https://commonmark.org/)

---

## License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

To the extent possible under law, the author has waived all copyright and related
rights to this work. You may copy, modify, distribute, and use for any purpose,
including commercial, without attribution or permission.

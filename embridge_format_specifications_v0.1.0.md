# Specifications for Embridge: an open source item/task list format

- **Version:** 0.1.0  
- **Last Updated:** 2026-02-14  
- **Example output:** `embridge_output_demo_v0.1.0.md`  
- **Authors:** xpiu  
- **Github:** https://github.com/embridge-foundation/embridge  
- **Project website:** https://embridge.net  

---

## Table of contents

- Overview
- Project goals
- Bridge Philosophy
- Format architecture and design principles
- On conformance
- Syntax and File Structure
  - File Shape (Non-normative)
  - Quick Reference (Non-normative)
  - Document Model (Non-normative)
  - Lexical Conventions
  - Item Lines
  - Nesting (Subitems/Subtasks)
  - Item Metadata (Optional Line)
  - Standard Fields (Non-exhaustive)
  - Comments (Optional)
  - Attachments (Convention)
  - List Sections (H1 Headings)
  - Document Metadata (HTML Comment)
- Parsing
  - Bootstrap (mode selection)
  - Reader (import / parse-only) — marker mode
  - Blank-Lines Mode (optional syntax extension)
  - Tooling export/rewrite normalization (optional, recommended for sync-ready output)
  - Regex Patterns
- Synchronisation
  - App → Markdown (export logic from apps)
  - Markdown → App (import logic into apps)
  - Conflict Resolution
- Examples
  - Minimal Basic Embridge File
  - Minimal Blank-Lines Mode File (Syntax Extension)
  - Minimal Numbered List
  - Numbered List with Metadata
  - Nested Numbered Items
  - Numbered Items with Comments
  - Minimal Sync-Ready File
  - Full-Featured File
- Integration Ideas
- Rendering Compatibility (Appendix)
- References
- License

---

## Overview

This specification defines a markdown-based format for storing item/task lists that serves as a **bridge** between human editors, AI agents, and application GUIs. The format prioritizes legibility and flexibility while remaining parseable by machines. Embridge is an edited abbreviation of the words 'item' and 'bridge'.

---

## Project goals

- **Primary goal:** Offer an item and list format that humans like to use (human-friendly first). Easy to learn, read and edit. With some editing flexibility.
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

This spec uses the keywords **MUST**, **SHOULD**, **MAY**, and **MUST NOT** in the RFC 2119 sense.

Embridge intentionally separates:

- **Validity (Basic Embridge):** the minimum required for a document to be considered valid Embridge and parseable as lists/items.
- **Tooling export/rewrite guidance:** recommendations and requirements for apps/parsers/AI agents when exporting, rewriting, or normalizing Embridge (especially for diff-friendly output and reliable round-trips).
- **Parser/import guidance:** recommendations and requirements for readers to be tolerant (accept common human variations, preserve unknown fields, avoid data loss).
- **Notes:** tips, rationale, and practical implementation advice.

When this spec says something is "required", it is either:

- required for **Basic Embridge validity**, or
- required for **sync-ready output** (round-trip syncing between tools), even if a human-authored file without it is still valid Basic Embridge.

---

## Syntax and File Structure

### File Shape (Non-normative)

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
format: Embridge v0.1.0, github.com/embridge-foundation/embridge
-->
```

Notes:
- Item metadata does not require indentation; parsers associate it with the item/task directly above.
- Descriptions use the `description:` field or the shorthand `"..."` when the first non-whitespace character on the metadata line is `"`.

The subsections below define the full validity, canonical output guidance, and reader tolerance rules for each element.

### Quick Reference (Non-normative)

- **Lists:** H1 headings (`# `) define list sections (optional).
- **Items:** Markdown list items using either `- ` or `{number}. ` markers (a space after the marker is required).
- **Completion:** An optional checkbox follows the marker: `[ ]` (incomplete) or `[x]` / `[X]` (complete). Items without checkboxes are valid and have an "unknown" completion state (`completed: null`).
- **Item metadata (optional):** One metadata block may appear immediately after an item. It is either:
  - a single metadata line of comma-separated `key: value` pairs, or
  - a quoted description shorthand (`"..."`), which MAY span multiple lines until the closing `"`.
- **Comments (optional):** Lines starting with `>` attach to the item/subitem above and MAY be threaded via `>>`, `>>>`, etc.
- **Document metadata (optional):** An HTML comment at the end of the file stores document-level fields for sync-ready output.

### Document Model (Non-normative)

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

The role of a line is determined by its first non-whitespace characters:

- `# ` → list heading (section)
- `- ` or `{number}. ` (optionally preceded by indentation spaces) → item/subitem line
- `>` (optionally preceded by spaces) → comment line (belongs to the item/subitem above; detected before metadata parsing)
- Otherwise, a non-empty line immediately following an item line is interpreted as that item's metadata (if it matches metadata/description rules); free-form text is non-conformant (see "Item metadata").

**Indentation (marker only):** hierarchy is determined solely by the indentation spaces before the marker. Metadata indentation does not affect ownership.

| Spaces before marker | Meaning |
|----------------------|---------|
| 0 | Top-level item/task |
| 2 | Subitem/Subtask (level 1) |
| 4 | Sub-subitem/subtask (level 2) |
| 6 | Level 3, etc. |

**Validity (Basic Embridge):**
- Indentation before the marker SHOULD be in multiples of 2 spaces; odd indentation (1, 3, 5, … spaces) is non-conformant.

**Tooling export/rewrite guidance:**
- Tooling MUST NOT generate odd indentation because it makes hierarchy ambiguous across implementations.

**Parser/import guidance:**
- Parsers SHOULD treat odd indentation as non-conformant and MAY either reject the line, warn, or round down to the nearest even depth.

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
- Parsers MUST NOT validate or enforce number ordering (numbers do not need to be sequential or start at 1).
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

Ordered subitems follow the same indentation rules:

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
- Count leading spaces before the marker to determine nesting depth (0=top, 2=sub, 4=sub-sub, ...).
- A new marker line starts a new item at the depth indicated by its indentation.
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
- Keys SHOULD match `[a-z]+` (unknown keys are allowed as long as they follow the same `key: value` shape).
- Space after colon is optional: `key: value` and `key:value` are both valid.
- Since commas separate field pairs, any value containing a comma MUST be quoted with `"` so it stays a single value.
- Inside a quoted value, a literal `"` is written as `""`.
- Trailing comma is allowed but not required: `prio: high, due: 2025-01-15,` (valid).
- Metadata indentation is optional — parsers accept both indented and non-indented.

**Canonical output (tooling export/rewrite guidance):**
- Tooling SHOULD use `key: value` (with a single space after `:`) for readability.
- Tooling SHOULD NOT output a space before the colon (`key : value`).
- Tooling SHOULD quote values that contain commas, leading/trailing spaces, or `"` characters.

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

Descriptions use the `description:` field (or its alias `descr:`) with a quoted value:

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
- When exporting, tooling SHOULD prefer the shorthand form for brevity (explicit `description:` / `descr:` are also valid).

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
- Escaped quotes (`""`) work the same: `""` → `"`.
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
- a custom field (e.g., `note: "..."`) that still follows `key: value`.

**Reader tolerance guidance:** Readers MAY choose to treat non-conformant free-form lines as a best-effort description during import (to avoid data loss), but tooling SHOULD NOT emit that form.

```markdown
- [ ] Call the client
Note: they prefer mornings     ← NOT VALID (not a key: value pair)

- [ ] Call the client
note: "they prefer mornings"   ← VALID (proper key: value syntax)

- [ ] Call the client
"they prefer mornings"         ← VALID (description shorthand)
```

### Standard Fields (Non-exhaustive)

Embridge is intentionally extensible: parsers SHOULD accept and preserve any `key: value` pair, even if not defined below. The fields listed here are **well-known keys** intended to improve interoperability across tools.

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
  `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `due` → `id`.
- Tooling SHOULD write canonical field names (not aliases).

**Reader tolerance (parser/import guidance):**
- Field order does not matter when importing/reading — accept any order.
- Parsers SHOULD accept both the canonical field name and its aliases.

**`id` conformance (recommended for sync-ready output):**
- If an `id` field is present, it MUST be unique within the file (across all items and subitems).
- The Embridge format does not impose requirements on the shape, casing, or character set of `id` values — the format of IDs is chosen by the user, app, or AI agent generating them.
- When generating IDs, tooling SHOULD use at least 7 characters for collision resistance. Lowercase alphanumeric IDs (e.g. `[a-z0-9]`) are a sensible default, but other schemes (UUIDs, hashes, sequential IDs, etc.) are equally valid.
- Parsers MUST accept any non-empty `id` value and MUST NOT reject items based on ID length, casing, or character set.

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
- Comment lines MUST contain one or more `>` characters as the first non-whitespace content. Leading spaces MAY be used to visually align with the parent item/subitem and can help parsers determine ownership.
- Author and timestamp are OPTIONAL
- If present, author format: `@username` or `username`
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
- Parsers MAY use leading whitespace to match comments to their parent item/subitem (e.g., 0 spaces = top-level item, 2 spaces = level 1 subitem). If indentation is absent or ambiguous, parsers SHOULD attach the comment to the most recent item/subitem above.

**Notes (parsing):**
- **Precedence:** Comment lines (`>`) MUST be detected before checking for metadata patterns. Lines like `> @alice: text` contain substrings matching `key: value` syntax, but the leading `>` takes precedence.
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
- An item/subitem MAY be interpreted as an attachment if its entire title is **exactly one** Markdown link (`[...](...)`) or image (`![...](...)`).
- If an attachment item includes a checkbox, parsers/apps SHOULD still treat it as an attachment (not a subtask) and SHOULD ignore checkbox state for task completion; tooling SHOULD emit attachment items without checkboxes and SHOULD NOT add checkboxes to attachment items during normalization.

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
- The `status` field is independent of list membership.

### Document Metadata (HTML Comment)

An HTML comment at the end of the file can contain document-level metadata.

**Validity (Basic Embridge):**
- The document metadata block is OPTIONAL.

**Canonical output (tooling export/rewrite guidance, sync-ready output):**
- Tooling SHOULD include this block for round-trip syncing between tools.
- For sync-ready output, tooling MUST include `title:` (document title) and `format:` (format descriptor).
- Tooling MAY include `lists:` to give list headings stable identifiers.
- Tooling SHOULD include `sync:` (last sync timestamp).
- Tooling SHOULD include `uuid:` (UUIDv7 recommended) to match documents across renames/moves.
- Tooling MAY include `syntax:` to store parser/agent syntax hints in document metadata.
- If `syntax:` is present, tooling SHOULD include a `mode` key.
- Tooling SHOULD omit `syntax:` when using default marker mode and no additional syntax hints.
- Tooling SHOULD write metadata fields in this recommended order for stable diffs: `title` → `sync` → `uuid` → `syntax` → `format`.

**If the document metadata block is present, each property MUST be on its own line.** This allows values to contain spaces without quoting (e.g., `title: My Project title`).

```markdown
<!--
title: My Project title
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: a1b2c3d: "Backlog", d4e5f6a: "In Progress", g7h8i9b: "Done"
format: Embridge v0.1.0, github.com/embridge-foundation/embridge
-->
```

| Field | Description |
|-------|-------------|
| `title` | Document title (required for sync-ready output). Tooling MUST generate and maintain this field; if missing, generate a default (e.g., derived from filename/repo) and write it back. Humans are not expected to manually edit document metadata; apps/parsers/AI agents SHOULD keep it up to date. |
| `sync` | ISO 8601 timestamp of last sync |
| `uuid` | Unique document identifier (UUIDv7 recommended) for sync matching across renames/moves |
| `lists` | Optional list registry: `lists:{id}: "{List Title}", {id}: "{Title}" ...`. Apps MAY use this to give list headings stable identifiers. |
| `syntax` | Optional syntax hints for parsing/export behavior. The key `mode` selects parsing behavior (e.g., `syntax: mode: marker` or `syntax: mode: blank-lines`) |
| `format` | Format descriptor (required for sync-ready output), e.g. `Embridge v0.1.0, github.com/embridge-foundation/embridge` |

**Reader tolerance (parser/import guidance):**
- Parsers MUST parse known document metadata fields by key name and MUST NOT rely on field order.
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

---

## Parsing

This section separates **reading/importing** (parsing) from **writing/exporting** (normalization). A Basic Embridge file can be read without any modifications; normalization is a tooling concern.

### Bootstrap (mode selection)

Before running the main body parser:

1. Parse the trailing HTML metadata comment (lightweight pre-pass) to read document metadata keys.
2. Read `syntax:` (if present) and parse `mode`.
3. If `mode: blank-lines` is recognized and supported by the parser, use the blank-lines reader.
4. Otherwise, use marker mode (`mode: marker` default).

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
      ii.  Line starts with (spaces +) `- ` OR (spaces +) `{number}. ` → New item/task
           - `{number}` is `0` or a base-10 integer without leading zeros; lines like `01. Item` do not match this pattern and are not recognized as items
           - Count leading spaces to determine nesting depth (0=top, 2=sub, 4=sub-sub, ...)
           - Detect marker type: `-` = bullet, `{number}.` = ordered
           - If ordered: extract `{number}` as a numeric display hint
           - Parse checkbox state and title
      iii. Line after a `- ` or `{number}. ` line, does NOT start with `- `, `{number}. `, or `>` → Metadata for item above
           - If line starts with `"` and contains closing `"` → Single-line description shorthand
           - If line starts with `"` but no closing `"` → Begin multiline description, set inside_quote = true
           - Otherwise → Parse comma-separated `key: value` pairs
           - Lines not matching `key: value` pattern or description shorthand are non-conformant (ignore or warn)
      iv.  Line starts with (more spaces +) `- ` OR (more spaces +) `{number}. ` → New nested item (child of nearest shallower item)
           - Same parsing as step ii
           - Nesting depth determined by leading space count
      v.   Line starts with optional spaces + `>` → Comment for item above
           - Count leading spaces to determine parent item depth (0=top-level, 2=subitem, 4=sub-subitem)
           - Count `>` characters to determine reply depth (1=top, 2=reply, 3=reply-to-reply)
           - Parse optional `@author` and `[timestamp]` prefix
           - Remaining text is comment content
           - Continue collecting `>` lines until non-`>` line encountered
           - Continuation lines (no author/timestamp) are part of the previous comment's text
3. Parse HTML comment for document metadata (if present)
```

### Blank-Lines Mode (optional syntax extension)

Hard rules for `syntax: mode: blank-lines`:

1. List titles still use H1 headings (`# ` at column 0).
2. Item/subitem boundaries are determined by blank lines (one or more empty lines) when not inside an open quoted description.
3. Each item/subitem block starts at the first non-empty, non-heading line after a heading or blank-line boundary.
4. The first line of a block is the item/subitem title.
5. Nesting depth is determined by leading spaces on the title line (0 = top-level, 2 = subitem, 4 = sub-subitem, ...). Indentation SHOULD be multiples of 2.
6. Metadata and comments belong to the current block:
   - Metadata lines follow the same `key: value` and quoted-description rules as marker mode.
   - Comment lines start with `>` and attach to the current block.
7. Multiline description ownership is quote-scoped:
   - If a description starts with `"` and has no closing quote on that line, parser enters `inside_quote = true`.
   - While `inside_quote = true`, blank lines are part of the description and MUST NOT terminate the block.
   - Block termination by blank line is only allowed when `inside_quote = false`.
8. Free-form non-metadata lines after the title are non-conformant (ignore or warn, implementation-defined).

Notes:
- In blank-lines mode, `- ` and `{number}. ` markers are not required to detect item/subitem boundaries.
- A parser that does not support blank-lines mode SHOULD fall back to marker mode.
- The "mode: blank-lines" metadata for the meta field `syntax` is critical for parsers to deal with content that aims to be both Embridge-compliant and separate its list titles/items/subitems with blank lines.
- Cooperative apps/tools MAY also emit blank-lines mode output when explicitly configured, and SHOULD write `syntax: mode: blank-lines`.

### Tooling export/rewrite normalization (optional, recommended for sync-ready output)

When exporting/rewriting, tooling MAY normalize files to improve interoperability and round-tripping:

1. If the document metadata block is present or the tooling is producing sync-ready output:
   - If `title:` is missing → generate a default and write it back
   - If `format:` is missing → write canonical format descriptor
   - If `syntax:` is present → parse supported syntax keys as output hints; ignore unknown keys
   - If `syntax.mode` is missing/invalid/unknown → default to `mode: marker`
   - If selected mode is `marker` and there are no additional syntax hints → omit `syntax:` from emitted metadata
   - Write metadata fields in recommended order for stable diffs: `title` → `sync` → `uuid` → `syntax` → `format`
2. For items/tasks:
   - If `id` is missing → generate an ID and write it back (recommended for syncing)
   - If checkbox is missing → add `[ ]` (or `[x]` if completed), if the tooling chooses to normalize checkboxes
   - Preserve the original marker style (bullet or ordered) and the ordered number when round-tripping

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

**List registry pair (within `lists:` value):**
```regex
([^\s:]+):(?:"((?:[^"]|"")*)"|([^\s,]+))
```
Note: For quoted list titles, unescape by replacing `""` with `"` after capture.

**Document metadata:**
```regex
<!--\s*([\s\S]*?)\s*-->
```

**Comment line (flexible — author and timestamp optional):**
```regex
^( *)(>+)\s*(?:(?:@?([^\[\s:]+)\s*)?(?:\[([^\]]+)\]\s*)?:\s*)?(.*)$
```
- Capture group 1: leading spaces (length ÷ 2 = parent item nesting depth; 0 = top-level item, 2 = subitem, etc.)
- Capture group 2: `>` characters (length = reply depth)
- Capture group 3: author (optional, without `@` prefix)
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
2. Tooling SHOULD write metadata fields in canonical order: `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `due` → `id` (see "Standard Fields (Non-exhaustive)"); tooling SHOULD prefer description shorthand (`"..."`) over explicit `description:` when rewriting.
3. For sync-ready output, tooling MUST ensure `title:` exists in document metadata (generate if missing).
4. For sync-ready output, tooling MUST ensure `format:` exists in document metadata (generate if missing).
5. If `syntax:` is present, tooling MAY apply supported syntax hints during rewrite/export. Tooling SHOULD treat `mode` as parse-critical.
6. Tooling MAY emit blank-lines mode output when explicitly configured (`syntax: mode: blank-lines`), but SHOULD default to marker mode for maximum interoperability.
7. In default marker mode, tooling SHOULD omit `syntax:` from metadata unless non-default syntax behavior must be signaled.
8. Tooling SHOULD update `sync:` in document metadata when a sync/export is performed.
9. Tooling SHOULD write document metadata fields in this recommended order for stable diffs: `title` → `sync` → `uuid` → `syntax` → `format`.
10. Tooling MUST NOT write app-only data (colors, UI state) to markdown.
11. Tooling SHOULD add an `id` field to any item/task missing one when stable syncing is a goal (attachment subitems MAY be excluded; see "Attachments (Convention)").
12. Tooling MAY add checkboxes (`[ ]` or `[x]`) to items/subitems that don't have one as a normalization step (recommended for consistent rendering), but SHOULD NOT add checkboxes to attachment items (see "Attachments (Convention)").
13. When rewriting items, tooling SHOULD preserve the original marker style. If an item was authored with `1.`, export as `1.` (not `-`). Tooling MUST NOT emit leading zeros (e.g., write `1.` not `01.`).

**Renumbering (optional):**
- When items are reordered in an app, tooling MAY renumber to maintain sequential order.
- Renumbering is OPTIONAL — apps MAY also preserve original numbers as hints.
- **Recommendation:** Preserve by default, offer renumber option.

### Markdown → App (import logic into apps)

When the application reads the `.md` file:

**Parser/import guidance:**
1. Parse known document metadata fields by key name (`title`, `sync`, `uuid`, `syntax`, `format`) and do not depend on field order.
2. Determine syntax mode from `syntax.mode`; if missing/invalid/unknown, default to `mode: marker`.
3. Use bootstrap behavior: parse metadata first, then parse body using the selected mode (`marker` or `blank-lines`).
4. If present, use the `title:` field as the document title; otherwise derive a fallback title (e.g., filename) without requiring a write.
5. Match lists by heading title.
6. Build an item-ID index and detect duplicate item `id` values (do not assume humans/AI authored unique IDs).
7. Resolve duplicate item IDs using implementation-defined parser policy (recommended default: keep first occurrence, auto-assign new IDs to later duplicates, warn).
8. Match items/tasks by `id` when present (after duplicate-resolution policy is applied).
9. Items/tasks with new or missing IDs → create in database (and optionally generate IDs later on export).
10. Items/tasks with known IDs → update database from markdown (markdown wins for content fields).
11. Items/tasks in database but missing from markdown → delete from database (or mark archived, implementation-defined).
12. Apply default values for missing fields.
13. Preserve marker style (where present) and ordered number for later export.

### Conflict Resolution

The `.md` file wins for content fields. The application database wins for UI-only fields.

| Field Type | Source of Truth |
|------------|-----------------|
| Document title (`title:` field) | `.md` file |
| Item fields (`title`, `status`, `prio`, `due`, `tags`, `descr`) | `.md` file |
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

### Minimal Sync-Ready File

```markdown
# To-do
- Buy apples
- Charge battery

<!--
title: Items/Tasks
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: a1b2c3d: "To-do"
format: Embridge v0.1.0, github.com/embridge-foundation/embridge
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
lists: k3m9p2a: "Backlog", q7w2e1b: "To-do", z8x4c3d: "In Progress", r5t6y7e: "Done"
format: Embridge v0.1.0, github.com/embridge-foundation/embridge
-->
```

---

## Integration Ideas

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
---

## Rendering Compatibility (Appendix)

Embridge uses Markdown-inspired syntax but deviates from [CommonMark](https://commonmark.org/) in several deliberate ways to prioritize human ergonomics. These deviations mean that Embridge files rendered in a standard Markdown viewer (GitHub, VS Code preview, etc.) will not display with perfect fidelity. This appendix documents the known differences.

### 1. Fixed 2-space nesting vs. CommonMark marker-width indentation

Embridge determines hierarchy by counting leading spaces before the marker in fixed 2-space increments (0 = top, 2 = sub, 4 = sub-sub). CommonMark determines child-list indentation based on the marker width (`- ` = 2 chars, `10. ` = 4 chars).

For unordered lists (`- `), the two systems agree. For ordered lists with multi-digit numbers, they diverge:

```markdown
10. [ ] Parent task
  1. [ ] Subtask
```

| Viewer | Interpretation |
|---|---|
| **Embridge** | `Subtask` is a child of `Parent task` (2 spaces = depth 1) |
| **CommonMark** | `Subtask` starts a new separate list (needs 4 spaces to be a child of a `10. ` marker) |

**Impact:** Ordered lists with multi-digit markers (10+) will render nesting incorrectly in CommonMark viewers. Single-digit ordered markers and all unordered markers render correctly.

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

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [CommonMark Spec](https://commonmark.org/)
- [CommonMark Spec - List Items](https://spec.commonmark.org/0.31.2/#list-items)
- [Minimal to-do](https://github.com/xpiu/minimal-to-do)

---

## License

This specification is released under the [MIT License](LICENSE).

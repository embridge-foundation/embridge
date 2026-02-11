# Specifications for Embridge: an open source item/task list format

**Version:** 0.0.8
**Last Updated:** 2026-01-29
**Example output:** `embridge_output_demo_v0.0.8.md`
**Author:** xpiu
**Github:** Repo URL will be made available soon ...
**Project website:** https://embridge.net

---

## Table of contents

- Overview
- Project goals
- Bridge Philosophy
- Format architecture and design principles
- On conformance
- Syntax & File Structure
  - Marker Forms
  - Items/Tasks
  - Metadata Line
  - Tags Field
  - Defined Fields
  - Descriptions
  - Comments (Optional)
  - Subitems/Subtasks
  - Attachments (Convention)
  - Lists (Sections)
  - Document Metadata
- Parsing
  - Reader (import / parse-only)
  - Tooling export/rewrite normalization (optional, recommended for sync-ready output)
  - Regex Patterns
- Synchronisation
  - App → Markdown (export logic from apps)
  - Markdown → App (import logic into apps)
  - Conflict Resolution
- Examples
  - Minimal Basic Embridge File
  - Minimal Numbered List
  - Numbered List with Metadata
  - Nested Numbered Items
  - Numbered Items with Comments
  - Minimal Sync-Ready File
  - Full-Featured File
- References
- License
- Integration Ideas

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

## Syntax & File Structure

An Embridge file follows this general shape:

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

The subsections below define the full validity, tooling, and parser rules for each element.

### Marker Forms

Embridge recognizes item/subitem markers as one of:

- **Bullet marker:** `- ` (dash followed by a single space)
- **Ordered marker:** `{number}. ` where `{number}` is either `0` or a base-10 integer without leading zeros (e.g. `0`, `1`, `2`, `10`, `999`)

This specification intentionally excludes `1)` markers to keep the format minimal.

**Number semantics:**
- The number is a display hint only (tooling/apps MAY show it, but it does not define sort order)
- Numbers do NOT need to be sequential or start at 1
- Parsers MUST NOT validate or enforce number ordering
- Apps MAY use the number for display but SHOULD allow reordering

**Ordered marker digit count (interoperability guidance):**
- Tooling SHOULD emit ordered markers with 1–9 digits (e.g. `1. ` … `999999999. `) to maximize compatibility with common Markdown renderers
- Parsers MAY accept more than 9 digits, but tooling that rewrites files SHOULD avoid emitting >9-digit ordered markers unless explicitly requested

### Items/Tasks

An item/task is a markdown list item. All of the following are valid:

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
  - `{number}. ` where `{number}` is either `0` or does not start with `0` (ordered marker followed by a single space)
- A space MUST follow the marker — `1.Item` and `-Item` are invalid
- Both markers MAY be preceded by indentation spaces for subitems
- The checkbox, if present, MUST follow the marker with the same syntax: `- [ ]` or `1. [ ]`
- The remainder of the line (after checkbox, if present) is the item/task title

**Tooling export/rewrite guidance (apps/parsers/AI agents):**
- Tooling SHOULD emit checkboxes for interoperability and consistent rendering.
- Tooling SHOULD prefer `- [ ]` or `1. [ ]` for incomplete and `- [x]` or `1. [x]` for complete (readers still accept uppercase `X`).
- Tooling SHOULD preserve the original marker style when rewriting items (if an item was authored with `1.`, export as `1.`, not `-`).
- Tooling MUST NOT emit leading zeros in ordered markers (e.g., write `1.` not `01.`).

**Parser/import guidance:**
- Parsers SHOULD accept items without checkboxes and treat their completion state as "unknown" (`completed: null`) until an app assigns a default.

**Parsing rules:**
- `- [ ]` or `1. [ ]` → `completed: false`
- `- [x]`, `- [X]`, `1. [x]`, or `1. [X]` → `completed: true`
- `-` or `1.` (no checkbox) → `completed: null` (app decides default)

**Checkbox behavior:**
- **For humans:** Checkboxes are optional. You can write `- Buy milk` or `1. Buy milk` without a checkbox — it's valid and convenient for quick entry.
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

Ordered markers work the same way:

```markdown
1. [ ] Example item/task
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

Since commas separate field pairs, any value containing a comma MUST be quoted. Parsers importing/exporting Embridge data MUST handle this:

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
- The opening `"` MUST be the first non-whitespace character on the metadata line (same as single-line shorthand)
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

**Important (Validity):** Free-form text immediately after an item/task is **non-conformant** Embridge. The line after a marker line MUST contain valid `key: value` pairs, a quoted description (single or multiline), or be empty/another item.

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

### Comments (Optional)

Comments attach notes to items/subitems. Unlike descriptions (which are a single explanatory text), comments are multiple entries that accumulate over time. Like other metadata, author and timestamp are optional.

**Syntax (all valid):**

```markdown
> comment text
> @author: comment text
> [timestamp]: comment text
> @author [timestamp]: comment text
```

**Example:**

```markdown
- [ ] Fix pagination bug
prio: high, id: abc123
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
id: abc123
> @alice [2025-01-20]: Starting refactor today
>> @bob [2025-01-21]: Use the new OAuth library
>> @alice [2025-01-22]: Good idea, will do
> @charlie [2025-01-23]: Ready for review
```

**Multiline comments:**
Continuation lines use the same `>` prefix without author/timestamp:

```markdown
- [ ] Complex feature
id: def456
> @alice [2025-01-20]: This needs careful review.
> The API changed since v2.0 and we need to
> handle backwards compatibility.
```

**Comments on subitems:**

```markdown
- [ ] Main task
prio: high, id: a1b2c3
> starting today
  - [ ] Subtask one
  id: x1y2z3
  > @bob: I'll handle this
```

**Tooling export/rewrite guidance (apps/parsers/AI agents):**
- Tooling MAY add author/timestamp when context is available (e.g., current user, current date)
- Tooling SHOULD preserve existing comment formatting and content
- Tooling SHOULD output comments after the metadata line (if any), before the next item

**Parser/import guidance:**
- Parsers SHOULD accept comments with or without author/timestamp
- Parsers SHOULD preserve the threading depth (count of `>` characters)
- Parsers SHOULD treat continuation lines (no author/timestamp) as part of the previous comment
- Parsers MAY use leading whitespace to match comments to their parent item/subitem (e.g., 0 spaces = top-level item, 2 spaces = level 1 subitem). If indentation is absent or ambiguous, parsers SHOULD attach the comment to the most recent item/subitem above.

**Parser notes:**
- **Precedence:** Comment lines (`>`) MUST be detected before checking for metadata patterns. Lines like `> @alice: text` contain substrings matching `key: value` syntax, but the leading `>` takes precedence.
- **Colon requirement:** The colon (`:`) before content is required when author or timestamp is present. Without it, the entire text is treated as content: `> @alice: comment` → author="alice", but `> @alice comment` → content="@alice comment" (no author parsed).

### Subitems/Subtasks

Items/Tasks can contain nested subitems/subtasks. **Hierarchy is determined solely by the indentation of the marker (bullet or ordered).** Metadata lines do not require indentation.

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

Ordered subitems follow the same indentation rules:

```markdown
1. [ ] Parent item
prio: high, id: a1b2c3
  1. [ ] Subitem one
  id: d4e5f6
  2. [ ] Subitem two
  id: g7h8i9
    1. [ ] Sub-subitem
    id: j0k1l2
```

**The core principle:**

1. **Spaces before the marker determine hierarchy level:**
   - `- ` or `1. ` (0 spaces) → top-level item
   - `  - ` or `  1. ` (2 spaces) → subitem (child of nearest item above with fewer spaces)
   - `    - ` or `    1. ` (4 spaces) → sub-subitem
   - And so on...

2. **The line after any marker line is metadata for that item** (valid `key: value` pairs or description shorthand). The parser associates it with the item/task directly above. Metadata for a subitem does NOT need to be indented to match its parent marker:

   ```markdown
   - [ ] Parent item
   prio: high, id: abc123
     - [ ] Subitem
   status: todo, id: def456      ← no indentation needed, still belongs to subitem above
   ```

3. **A line starting with spaces + marker starts a new item** at the corresponding nesting level.

**Indentation rules (for the marker only):**

| Spaces before marker | Meaning |
|----------------------|---------|
| 0 | Top-level item/task |
| 2 | Subitem/Subtask (level 1) |
| 4 | Sub-subitem/subtask (level 2) |
| 6 | Level 3, etc. |

**Mixed styles (guidance, not enforced):**
- Within the same section and indentation level, authors SHOULD prefer a consistent marker style for readability
- Parent and children MAY use different styles (valid but not recommended)
- Example (valid but not recommended):
  ```markdown
  1. [ ] Numbered parent
  id: abc123
    - [ ] Bullet subitem
    id: def456
  ```

**Validity (Basic Embridge):**
- Indentation before the marker SHOULD be in multiples of 2 spaces; odd indentation (1, 3, 5, … spaces) is non-conformant.

**Tooling export/rewrite guidance:**
- Tooling MUST NOT generate odd indentation because it makes hierarchy ambiguous across implementations.

**Parser/import guidance:**
- Parsers SHOULD treat odd indentation as non-conformant and MAY either reject the line, warn, or round down to the nearest even depth.

**Parsing rules:**
- Count leading spaces before the marker to determine nesting depth
- The line immediately after a marker line (that doesn't start with a marker) is metadata for that item (MUST be valid `key: value` pairs)
- When a new marker line appears, it starts a new item at the depth indicated by its indentation
- Subitems/Subtasks follow the same syntax as items/tasks (optional checkbox, optional metadata)
- Nesting depth is unlimited but 2 levels is typical

### Attachments (Convention)

Embridge does not introduce a separate syntax for attachments. Instead, **attachments are represented as subitems** using standard Markdown link and image syntax.

This is intentionally a *convention* (how apps/UIs interpret content), not a special Embridge token. Attachment lines are still valid list items.

**Recommended attachment forms (as subitems):**

```markdown
- [ ] Parent item/task
id: abc123
  - [Design spec](docs/spec.pdf)
  - [Demo video](media/demo.mp4)
  - [Installer](dist/app.exe)
  - ![Screenshot](assets/login.png)
```

Notes:
- `- [title](path)` MAY be used for **any** attachment type (including images). This keeps the format flexible for humans.
- `- ![alt](path)` is recommended for images because many Markdown renderers display the image inline.

**Distinguishing attachments from subtasks (recommended UI interpretation):**
- Checkboxes are optional in valid Embridge, so apps/tools SHOULD NOT rely on presence/absence of a checkbox to classify attachments.
- An item/subitem MAY be interpreted as an attachment if its entire title is **exactly one** Markdown link (`[...](...)`) or image (`![...](...)`).
- If an attachment item includes a checkbox, parsers/apps SHOULD still treat it as an attachment (not a subtask) and SHOULD ignore checkbox state for task completion; tooling SHOULD emit attachment items without checkboxes and SHOULD NOT add checkboxes to attachment items during normalization.

**Important: bare paths are just titles**

This is valid Embridge, but it is simply an item title (not an attachment signal):

```markdown
  - assets/login.png
```

**Tooling/export guidance (attachments):**
- Tooling SHOULD treat attachment subitems as content, but SHOULD NOT require attachment items to have an `id`.
- When stable syncing is a goal, tooling MAY still assign IDs to attachment subitems, but this is not required; apps MAY instead treat the attachment path/URL as the identifier.

**Parser/import guidance (attachments):**
- Parsers MAY detect attachments using the "link-only / image-only title" rule above.
- If an app wants to show previews, it MAY infer media type from the link destination (e.g., `.png`, `.jpg`, `.gif`, `.mp4`) when an extension is present; if not, treat as a generic file/link.

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
embridge:0.0.8
project:My Project title
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:a1b2c3:"Backlog" d4e5f6:"In Progress" g7h8i9:"Done"
-->
```

| Field | Description |
|-------|-------------|
| `embridge` | Format version (semver) — enables parsers to detect compatibility |
| `project` | Project title (required for sync-ready output). Tooling MUST generate and maintain this field; if missing, generate a default (e.g., derived from filename/repo) and write it back. Humans are not expected to manually edit document metadata; apps/parsers/AI agents SHOULD keep it up to date. |
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

## Parsing

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

### Tooling export/rewrite normalization (optional, recommended for sync-ready output)

When exporting/rewriting, tooling MAY normalize files to improve interoperability and round-tripping:

1. If the document metadata block is present or the tooling is producing sync-ready output:
   - If `project:` is missing → generate a default and write it back
   - Ensure the `lists:` line exists and contains an entry for each list heading (generate missing 6-char IDs using an implementation-defined strategy)
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

**List registry pair (within `lists:` value):**
```regex
([a-z0-9]{6}):(?:"((?:[^"]|"")*)"|([^\s]+))
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
2. Tooling SHOULD write metadata fields in canonical order: `description` → `status` → `prio` → `tags` → `assignee` → `created` → `updated` → `due` → `id` (see "Defined Fields"); tooling SHOULD prefer description shorthand (`"..."`) over explicit `description:` when rewriting.
3. For sync-ready output, tooling MUST ensure `project:` exists in document metadata (generate if missing).
4. For sync-ready output, tooling SHOULD ensure the `lists:` line exists, contains an entry for each list heading (generate if missing), and is written as the last line in the metadata comment.
5. Tooling SHOULD update `sync:` in document metadata when a sync/export is performed.
6. Tooling MUST NOT write app-only data (colors, UI state) to markdown.
7. Tooling SHOULD add an `id` field to any item/task missing one when stable syncing is a goal (attachment subitems MAY be excluded; see "Attachments (Convention)").
8. Tooling MAY add checkboxes (`[ ]` or `[x]`) to items/subitems that don't have one as a normalization step (recommended for consistent rendering), but SHOULD NOT add checkboxes to attachment items (see "Attachments (Convention)").
9. When rewriting items, tooling SHOULD preserve the original marker style. If an item was authored with `1.`, export as `1.` (not `-`). Tooling MUST NOT emit leading zeros (e.g., write `1.` not `01.`).

**Renumbering (optional):**
- When items are reordered in an app, tooling MAY renumber to maintain sequential order.
- Renumbering is OPTIONAL — apps MAY also preserve original numbers as hints.
- **Recommendation:** Preserve by default, offer renumber option.

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
8. Preserve the marker style (bullet vs ordered) and ordered number for later export.

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
prio: high, id: abc123
2. [ ] Buy oranges
tags: fruit, id: def456
3. [x] Buy bananas
status: done, id: ghi789
```

### Nested Numbered Items

```markdown
1. [ ] Set up development environment
"Install all required tools and dependencies", id: setup01
  1. [ ] Install Node.js
  id: node01
  2. [ ] Install Docker
  id: docker01
  3. [ ] Clone repository
  id: clone01

2. [ ] Implement feature
id: impl01
  1. [ ] Write unit tests
  id: test01
  2. [ ] Write implementation
  id: code01
  3. [ ] Update documentation
  id: docs01
```

### Numbered Items with Comments

```markdown
1. [ ] Fix login bug
prio: high, id: login01
> @alice [2026-01-29]: Found the root cause
>> @bob [2026-01-29]: Can you share details?

2. [ ] Optimize database queries
id: db01
> check the slow query log
```

### Minimal Sync-Ready File

```markdown
# To-do
- Buy apples
- Charge battery

<!--
embridge:0.0.8
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
embridge:0.0.8
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
- [CommonMark Spec - List Items](https://spec.commonmark.org/0.31.2/#list-items)

---

## License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

To the extent possible under law, the author has waived all copyright and related
rights to this work. You may copy, modify, distribute, and use for any purpose,
including commercial, without attribution or permission.

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

**Sync behavior:**
- Apps MUST read the `.md` file as the source of truth and create/update their local database accordingly.
- Apps MUST write changes back to the `.md` file when local changes occur.
- When fields are missing in the `.md` file, apps SHOULD fill in defaults (e.g., generate IDs, set timestamps).
- When items are missing IDs, apps SHOULD generate and write them back for stable syncing.
- When an item is deleted from the `.md` file, apps SHOULD remove it from their local database.
- UI-only data (colors, sort preferences) MUST NOT be written to the `.md` file; apps MUST store these in their own database.

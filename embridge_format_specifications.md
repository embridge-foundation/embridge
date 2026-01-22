# Specifications for Embridge: an open source item/task list format

**Version:** 0.0.4
**Last Updated:** 2026-01-22
**Example of output** in `embridge_output_demo_v0_0_4.md`
**Author** xpiu

---

## Overview

This specification defines a markdown-based format for storing item/task lists that serves as a **bridge** between human editors, AI agents, and application GUIs. The format prioritizes legibility and flexibility while remaining parseable by machines. Embridge is an edited abbreviation of the words 'item' and 'bridge'.

---

## Project goals

- create a Markdown-compliant format for items/tasks in lists
- be human-friendly: easy to learn, read and edit, with some editing flexibility
- be AI-friendly: easy to learn, read and edit
- enable reliable automation - e.g. stable per-item `id`, simple `key:value` metadata
- stay merge- and diff-friendly for git workflows
- remain tool- and vendor-agnostic (portable across editors/apps/forges)
- preserve forward compatibility (ignore/preserve unknown fields)

---

## Bridge Philosophy

This format exists to solve a fundamental tension in item/task management:

```
Strict formats        ←────────────→        No format
(JSON, YAML)             THIS FORMAT            (prose)

• Machines love it       • Humans write it
• Humans hate it         • Machines parse it
                         • Git tracks it
```

### Design Principles

1. **Developers won't fight it, AI can still parse it.**
   The format is loose enough for quick hand-editing, structured enough for reliable parsing.

2. **Structure without strictness.**
   The format defines structure (lists, indentation), not validation. Field values are interpreted liberally.

3. **Everything is optional.**
   A valid item/task can be a single line. Metadata is added only when needed.

4. **The `.md` file is the source of truth for content.**
   Application databases store supplementary data (UI preferences, colors). The markdown file owns the items/tasks.

### Integration Model

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

## File Structure

```markdown
# {List Title}
- [ ] {Item/Task title}
{metadata line}
{optional description line}

- {Item/Task without checkbox}
{metadata line}

# {Another List Title}
- [x] {Completed item/task}
{metadata line}

<!--
embridge:{version}
project:{Project Name}
sync:{ISO 8601 timestamp}
uuid:{document identifier, UUIDv7 recommended}
lists:{list_id}:"{List Title}" {list_id}:"{Another List Title}"
-->
```

Note: Metadata lines do not require indentation. The parser knows they belong to the item/task directly above.

### Project Name

The project name is stored in the document metadata's `project:` field. Parsers MUST always generate and maintain this field.

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

**Parsing rules:**
- `- [ ]` → `completed: false`
- `- [x]` or `- [X]` → `completed: true`
- `-` (no checkbox) → `completed: null` (app decides default)

**Checkbox behavior:**
- Checkboxes are optional — parsers MUST NOT add checkboxes to items that don't have them
- The choice to include a checkbox is arbitrary and may be made by human, AI agent, or app setting
- Items without checkboxes are equally valid and should be preserved as-is

### Metadata Line

The line immediately following an item/task contains metadata as `key:value` pairs separated by spaces. **Metadata does not require indentation** — the parser knows it belongs to the item/task directly above it.

```markdown
- [ ] Example item/task
status:todo prio:high tags:backend,api due:2025-01-15 id:a1b2c3
```

Indented metadata is also valid (for visual preference):

```markdown
- [ ] Example item/task
  status:todo prio:high tags:backend,api due:2025-01-15 id:a1b2c3
```

**Rules:**
- No space before or after the colon in `key:value`
- Values containing spaces must be quoted: `descr:"my long description"`
- Multiple values use commas without spaces: `tags:one,two,three`
- Order of fields does not matter
- All fields are optional
- Metadata indentation is optional — parsers accept both indented and non-indented

### Defined Fields

| Field | Aliases | Description | Example Values |
|-------|---------|-------------|----------------|
| `descr` | `description` | Short description | `"Fix the login bug"` |
| `status` | | Workflow status | `todo`, `doing`, `done`, `backlog`, `ideas` |
| `prio` | `priority` | Priority level | `high`, `med`, `low`, `1`, `2`, `3` |
| `tags` | `keywords` | Comma-separated labels | `backend,api,urgent` |
| `assignee` | `owner`, `assigned` | Who's responsible | `@alice`, `team-backend` |
| `created` | `date`, `createddate` | Created/reference date | `2025-01-15` |
| `updated` | `modified`, `mod` | Last modified date | `2025-01-18` |
| `due` | `duedate` | Due date | `2025-01-15`, `tomorrow`, `next-week` |
| `id` | | Unique identifier (6+ alphanumeric) | `a1b2c3`, `x7y8z9` |

**Field Aliases:** Parsers SHOULD accept both the canonical field name and its aliases. When writing, prefer the canonical form.

**Extensibility:** Parsers SHOULD accept and preserve any `key:value` pair, even if not defined above. This allows app-specific fields.

### Description Line

An optional second line can contain a longer description (indentation optional):

```markdown
- [ ] Complex item/task
prio:high due:2025-01-15 id:a1b2c3
descr:"This is a longer description that explains the item/task in detail"
```

Or as a plain line (parser infers it's a description if it doesn't match `key:value` pattern):

```markdown
- [ ] Complex item/task
prio:high id:a1b2c3
This is the description without a key prefix
```

### Subitems/Subtasks

Items/Tasks can contain nested subitems/subtasks. **Hierarchy is determined solely by the indentation of the dash (`-`) character.** Metadata lines do not require indentation.

```markdown
- [ ] Parent item/task
prio:high id:a1b2c3
  - [ ] Subitem/Subtask one
  status:todo id:d4e5f6
  - Subitem/Subtask two (no checkbox)
  descr:"Subitems/Subtasks can omit things like checkboxes and id"
    - [ ] Sub-subitem/subtask
    id:nested123
```

**The core principle:**

1. **Spaces before the dash determine hierarchy level:**
   - `- ` (0 spaces) → top-level item
   - `  - ` (2 spaces) → subitem (child of nearest item above with fewer spaces)
   - `    - ` (4 spaces) → sub-subitem
   - And so on...

2. **The line after any `- ` line is metadata for that item** — regardless of indentation. The parser associates it with the item/task directly above. This means metadata for a subitem does NOT need to be indented to match its parent dash:

   ```markdown
   - [ ] Parent item
   prio:high id:abc123
     - [ ] Subitem
   status:todo id:def456      ← no indentation needed, still belongs to subitem above
   ```

3. **A line starting with spaces + dash starts a new item** at the corresponding nesting level.

**Indentation rules (for the dash only):**

| Spaces before `-` | Meaning |
|-------------------|---------|
| 0 | Top-level item/task |
| 2 | Subitem/Subtask (level 1) |
| 4 | Sub-subitem/subtask (level 2) |
| 6 | Level 3, etc. |

**Parsing rules:**
- Count leading spaces before `-` to determine nesting depth
- The line immediately after a `- ` line (that doesn't start with `-`) is metadata/description for that item
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

**Rules:**
- List titles are arbitrary (not predefined statuses)
- List headers MUST start with `# ` (a hash and a space) at column 0
- List titles SHOULD be unique within a file
- An item/task's list membership is determined by which section it's under
- The `status` field is independent of list membership

### Document Metadata

An HTML comment at the end of the file contains document-level metadata. The `project` field is required; other fields are optional but recommended for reliable syncing between applications.

```markdown
<!--
embridge:0.0.4
project:My Project Name
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:a1b2c3:"Backlog" d4e5f6:"In Progress" g7h8i9:"Done"
-->
```

| Field | Description |
|-------|-------------|
| `embridge` | Format version (semver) — enables parsers to detect compatibility |
| `project` | Project name (required — parsers must generate this field) |
| `lists` | Optional list registry (single line): `lists:{6-char id}:"{List Title}" {id}:"{Title}" ...` |
| `sync` | ISO 8601 timestamp of last sync |
| `uuid` | Unique document identifier (UUIDv7 recommended) for sync matching across renames/moves |

**List IDs (`lists:`)**
- The `lists:` line is app-managed metadata used to give lists stable identifiers without requiring humans to edit IDs in headings.
- List IDs MUST be 6 characters of lowercase alphanumeric (`[a-z0-9]{6}`) and MUST be unique within the file.
- List ID generation is implementation-defined (e.g. random, hash-based, sequential) as long as it is collision-resistant within the file.
- List titles in the `lists:` line SHOULD be quoted; list titles containing spaces MUST be quoted.
- List IDs are separate from item/task `id` values (they live in document metadata, not item metadata).
- Parsers SHOULD:
  - Ensure every `# {List Title}` heading has a corresponding `{id}:"{List Title}"` entry in the `lists:` line (generate missing IDs using an implementation-defined strategy)
  - Remove or ignore `lists:` entries whose titles no longer exist in the file
  - Write the `lists:` line as the last line inside the document metadata comment to keep diffs stable
  - Preserve list-pair ordering and other unknown metadata where possible to keep diffs stable

---

## Parsing Algorithm

```
1. Split file into sections by H1 headings (`# `)
2. For each section:
   a. Section name = list title
   b. Process lines sequentially:
      i.   Line starts with (spaces +) `-` → New item/task
           - Count leading spaces to determine nesting depth (0=top, 2=sub, 4=sub-sub, ...)
           - Parse checkbox state and title
      ii.  Line after a `-` line, does NOT start with `-` → Metadata/description for item above
           - If matches `key:value` pattern → Parse as metadata
           - Otherwise → Treat as description text
      iii. Line starts with (more spaces +) `-` → New nested item (child of nearest shallower item)
3. Parse HTML comment for document metadata
4. If `project:` field missing → Generate default, mark file as modified
5. Ensure the `lists:` line exists and contains an entry for each list heading (generate missing 6-char IDs using an implementation-defined strategy), mark file as modified
6. Items without `id` field → Generate ID, mark file as modified
```

**Key insight:** The dash indentation determines hierarchy. Everything else (metadata, descriptions) just "belongs to" the most recent item above it.

### Regex Patterns

**Item/Task line (with nesting depth):**
```regex
^( *)- (?:\[([ xX])\] )?(.+)$
```
- Capture group 1: leading spaces (length ÷ 2 = nesting depth)
- Capture group 2: checkbox state (space, x, X, or absent)
- Capture group 3: item title

**Metadata pair:**
```regex
([a-z]+):(?:"([^"]+)"|([^\s]+))
```

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
([a-z0-9]{6}):(?:"([^"]+)"|([^\s]+))
```

**Document metadata:**
```regex
<!--\s*([\s\S]*?)\s*-->
```

---

## Sync Behavior

### App → Markdown

When the application writes to the `.md` file:

1. Preserve existing structure and formatting where possible
2. Add `id` field to any item/task missing one
3. Ensure `project:` field exists in document metadata (generate if missing)
4. Ensure the `lists:` line exists and contains an entry for each list heading (generate if missing) and write it as the last line in the metadata comment
5. Update `sync` timestamp in document metadata
6. Do NOT write app-only data (colors, UI state) to markdown

### Markdown → App

When the application reads the `.md` file:

1. Use `project:` field as the project title
2. Match lists by `lists:` IDs when available (by matching list titles to `{id}:"{List Title}"` entries within the `lists:` line)
3. Match items/tasks by `id` field
4. Items/Tasks with new IDs → Create in database
5. Items/Tasks with known IDs → Update database from markdown (markdown wins)
6. Items/Tasks in database but missing from markdown → Delete from database
7. Apply default values for missing fields

### Conflict Resolution

The `.md` file wins for content fields. The application database wins for UI-only fields.

| Field Type | Source of Truth |
|------------|-----------------|
| project name (`project:` field) | `.md` file |
| title, status, prio, due, tags, descr | `.md` file |
| list IDs (`lists:` line) | `.md` file |
| list colors, sort order, UI preferences | App database |

---

## Integration with External SaaS GUIs

This format enables a decoupled architecture where:

1. **GitHub** hosts the `.md` file (version control, collaboration)
2. **AI agents** read/write via GitHub API (automation, bulk operations)
3. **Web/mobile apps** sync bidirectionally (rich UI, notifications)
4. **CLI tools** parse locally (developer workflows)

### SaaS Integration Pattern

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SaaS GUI   │────▶│   GitHub    │◀────│  AI Agent   │
│  (App)    │◀────│   (.md)     │────▶│  (AI)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  App DB     │     │  Git History│
│  (UI state) │     │  (audit log)│
└─────────────┘     └─────────────┘
```

**Benefits:**
- No vendor lock-in (data is plain markdown)
- AI agents can manage items/tasks without API integration (!)
- Full audit trail via git history
- Offline editing supported
- Multiple GUIs can share the same data source

### Webhook Integration

SaaS applications SHOULD support:
- GitHub webhook on `.md` file changes → Trigger sync
- Periodic polling as fallback
- Manual sync trigger in UI

---

## Examples

### Minimal Valid File

```markdown
# To-do
- Buy milk
- [ ] Call mom

<!--
embridge:0.0.4
project:Items/Tasks
lists:a1b2c3:"To-do"
-->
```

### Full-Featured File

```markdown
# Backlog
- [ ] Research caching strategies
status:ideas prio:high tags:research,backend due:2025-02-01 id:a1b2c3
  - [ ] Evaluate Redis
  descr:"Test Redis for session storage" id:s1t2u3
  - [ ] Evaluate Memcached
  id:v4w5x6

- Explore new auth library
tags:research id:b2c3d4

# To-do
- [ ] Fix pagination bug
prio:high due:2025-01-20 id:c3d4e5

- [ ] Update dependencies
created:2025-01-15 id:d4e5f6

# In Progress
- [ ] Refactor user service
status:doing prio:med id:e5f6g7

# Done
- [x] Write API documentation
status:done created:2025-01-10 id:f6g7h8

- [x] Set up CI pipeline
id:g7h8i9

<!--
embridge:0.0.4
project:Project Demo
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:k3m9p2:"Backlog" q7w2e1:"To-do" z8x4c3:"In Progress" r5t6y7:"Done"
-->
```

---

## Versioning

This specification follows semantic versioning:
- **Major:** Breaking changes to parsing rules
- **Minor:** New optional fields or features
- **Patch:** Clarifications and typo fixes

Parsers SHOULD include the spec version they implement and handle unknown fields gracefully.

---

## References

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [CommonMark Spec](https://commonmark.org/)
- Bridge philosophy: See `README.md` in this repository

---

## License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

To the extent possible under law, the author has waived all copyright and related
rights to this work. You may copy, modify, distribute, and use for any purpose,
including commercial, without attribution or permission.

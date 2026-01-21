# Embridge

**Version** 0.0.1
**Summary** A markdown-based format for item/task lists that work for humans and AI agents.

## Why Embridge?

Item/Task management tools lock your data in proprietary formats. Embridge is different:

- **Human-readable** - It's just markdown. Edit in any text editor.
- **AI-friendly** - Structured enough for agents to parse and modify reliably.
- **Git-native** - Track changes, review diffs, collaborate with PRs.
- **No lock-in** - Your data stays yours. Plain text forever.

## Value propositions

- **Portable across git forges (no lock-in)** - Works the same on GitHub, GitLab, Bitbucket, or self-hosted git because the repo is the backend.
- **Human-friendly by default** - Plain Markdown you can read and edit in any text editor, even without special tooling.
- **Agent-friendly automation** - Stable per-item `id` plus `key:value` metadata lets agents reliably find, update, and move items.
- **Merge- and diff-friendly** - Stable IDs reduce duplicates and ambiguity during refactors, rebases, and conflict resolution.
- **Reviewable collaboration** - All changes are transparent diffs in PRs (audit trail, approvals, code review workflows).
- **Extensible and forward-compatible** - Tools preserve unknown `key:value` pairs so different apps can add fields without breaking others.
- **Offline-first** - Edit anywhere; sync later. No SaaS or API required to use your data.
- **Interoperable building block** - A shared interchange format for CLIs, editors, and apps to operate on the same task list.

## USP

- **“Just Markdown” + stable IDs**: standard Markdown lists with per-item `id` for safe automation, syncing, and merge-friendly updates.
- **Loose structure, predictable parsing**: minimal rules (dash indentation for hierarchy, `key:value` on the next line) designed for robust machine parsing without forcing strict schemas.
- **Extensible by default**: tools preserve unknown `key:value` pairs so apps can add fields without breaking other tools.
- **Source-of-truth clarity**: the `.md` file owns content; apps can keep UI-only state elsewhere without rewriting your data model.

## SWOT

### Strengths

- Familiar Markdown editing; low onboarding friction
- Git-native history, auditing, and collaboration
- AI-friendly structure with stable `id` fields
- Provider-agnostic: not tied to any repo SaaS or API

### Weaknesses

- Metadata can look "noisy" in typical Markdown renderers
- Dash-indentation hierarchy requires consistent spacing (2 spaces per level)
- Ecosystem risk: without reference tooling, implementations may diverge

### Opportunities

- Reference parser/writer + formatter to guarantee lossless round-trips and stable diffs
- CLI workflows (`add`, `done`, `move`, `dedupe`, `lint`) for everyday use
- Editor plugins (VS Code/Obsidian) for field completion and validation hints
- Optional integrations for multiple forges (not just one) without making them required

### Threats

- “Good enough” alternatives: plain Markdown checklists, Org-mode, `todo.txt`, Taskwarrior
- Competing conventions inside note apps (Obsidian/Logseq task metadata patterns)
- If the spec grows too strict/complex, it loses the “just Markdown” advantage

## Quick Example

```markdown
## To-do
- [ ] Fix login timeout bug
prio:high due:2025-01-20 id:abc123
- [ ] Add unit tests for auth module
tags:testing,backend id:def456

## Done
- [x] Set up CI pipeline
id:ghi789

<!--
embridge:0.0.1
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
-->
```

## How It Works

1. **Lists** are H2 headings (`## To-do`, `## In Progress`, `## Done`)
2. **Items/tasks** are markdown list items (`- [ ]`, `- [x]`, or just `-`)
3. **Metadata** sits on the line below (indentation optional): `prio:high due:2025-01-20 id:abc123`
4. **Subitems/subtasks** use indented dashes (`  - ` for level 1, `    - ` for level 2, etc.)
5. **Document metadata** lives in an HTML comment at the end

## Embridge compared to todo.txt format

Embridge has some similarities to [todo.txt](https://github.com/todotxt/todo.txt): both are plain-text, human-editable, and git-friendly. The difference is focus:

- **List-oriented** - Embridge organizes items into named sections (`## To-do`, `## Done`) and supports subitems via indentation. todo.txt is a flat file.
- **Self-describing metadata** - Embridge uses `key:value` pairs (`prio:high`, `due:2025-01-20`). todo.txt relies on positional rules and symbols: `(A)` for priority, `+project` for projects, `@context` for contexts. You need to memorize what each symbol means.
- **Markdown-native** - Embridge files render reasonably in any Markdown viewer. todo.txt is its own format.

Embridge has its own quirks—the `- [ ]` checkbox syntax comes from GitHub-flavored Markdown, and metadata on a separate line takes getting used to. But if you already write Markdown, the learning curve is minimal.

## Documentation

- [Full Specification](20260111_embridge_format_specifications.md) - Complete format reference
- [Example File](20260111_embridge_output_demo_v0_0_1.md) - A working demo

## License

CC0 1.0 Universal - Public domain. Use it however you want.

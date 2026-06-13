# Embridge

**Version:** 0.2.1  
**Git repo:** https://github.com/embridge-foundation/embridge  
**Project website:** https://embridge.net  
**Summary:** A markdown-based format for item/task lists for humans and AI agents.  
**Author:** xpiu  
**Licence:** MIT  

## Contents

- [What is Embridge?](#what-is-embridge)
- [Project goals](#project-goals)
- [Features & value proposition of the Embridge format](#features--value-proposition-of-the-embridge-format)
- [Examples](#examples)
  - [Example 1: a simple list](#example-1-a-simple-list)
  - [Example 2: dash markers](#example-2-dash-markers)
  - [Example 3: numbered markers](#example-3-numbered-markers)
  - [Example 4: a simple list, in explicitly defined 'blank-lines' mode](#example-4-a-simple-list-in-explicitly-defined-blank-lines-mode)
- [SWOT](#swot)
  - [Strengths](#strengths)
  - [Weaknesses](#weaknesses)
  - [Opportunities](#opportunities)
  - [Threats](#threats)
- [How It Works](#how-it-works)
- [Embridge compared to todo.txt format](#embridge-compared-to-todotxt-format)
- [Try it out](#try-it-out)
- [About the core contributor](#about-the-core-contributor)
- [How to contribute](#how-to-contribute)
- [Documentation](#documentation)
- [References](#references)
- [License](#license)

## What is Embridge?

Embridge is a markdown-based format for storing items, tasks and lists, designed to act as a **bridge** between human editors, AI agents, and application GUIs. It keeps lists readable and editable by hand while remaining consistently parseable by machines. The name is a blend of the words 'item' and 'bridge'.

## Project goals

1. **Primary goal:** Offer an item and list text format that humans like to use (human-friendly first). Easy to learn, read and edit, with some editing flexibility.
2. Be AI-friendly. Easy for AI to read, understand and edit.
3. Provide guidance on usage in apps
4. Stay merge- and diff-friendly for git workflows
5. Remain tool- and vendor-agnostic (portable across editors/apps/forges)
6. Preserve forward compatibility (ignore/preserve unknown fields)

## Features & value proposition of the Embridge format

Embridge is a strong fit for teams/people who already live in **git + Markdown** and want tasks to be **portable across editors/apps** without committing to a vendor or a database.

- **Plain Markdown** - Edit in any text editor, render on any git forge
- **Stable IDs** - Per-item `id` enables reliable automation, syncing, and merge conflict resolution
- **Loose structure, predictable parsing** - Minimal rules (dash indentation, `key: value` metadata) without strict schemas
- **Extensible** - Unknown fields preserved; apps can add custom metadata without breaking others
- **Offline-first** - Edit anywhere, sync later; no SaaS required
- **Source-of-truth clarity** - The `.md` file owns content; apps keep UI-only state elsewhere
- **Interoperability is the differentiator** - A reference parser/formatter and clear “round-trip-safe” rules are what make this more than “just another Markdown task convention”

## Examples

### Example 1: a simple list
```markdown
- apples
- pears
- oranges
```

### Example 2: dash markers

```markdown
# To-do
- [ ] Fix login timeout bug
"a description", prio: high, due: 2025-01-20, id: abc123d
- [ ] Add unit tests for auth module
tags: "testing, backend", id: def456a

# Done
- [x] Set up CI pipeline
id: ghi789a

<!--
title: Example Project
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "To-do" l1st01a, "Done" l1st02b
format: Embridge v0.2.1, github.com/embridge-foundation/embridge
-->
```

### Example 3: numbered markers

```markdown
# Setup steps
1. [ ] Install dependencies
prio: high, id: abc123d
2. [ ] Configure environment
id: def456a
3. [x] Run tests
id: ghi789a
```

### Example 4: a simple list, in explicitly defined 'blank-lines' mode
```markdown
apples

pears

oranges

<!--
syntax: mode: blank-lines
-->
```

## SWOT

### Strengths

- High format flexibility for human users 
- Familiar Markdown editing; low onboarding friction
- Git-native history, auditing, and collaboration
- AI-friendly structure with stable `id` fields
- Provider-agnostic: not tied to any repo SaaS or API

### Weaknesses

- Metadata can look "noisy" in typical Markdown renderers
- Dash-indentation hierarchy requires consistent spacing
- Ecosystem risk: without reference tooling, implementations may diverge

### Opportunities

- Reference parser/writer + formatter to guarantee lossless round-trips and stable diffs
- CLI workflows (`add`, `done`, `move`, `dedupe`, `lint`) for everyday use
- Editor plugins (VS Code/Obsidian) for field completion and validation hints
- Optional integrations for multiple forges (not just one) without making them required

### Threats

- “Good enough” alternatives
- Competing conventions inside note apps (Obsidian/Logseq task metadata patterns)
- If the spec grows too strict/complex

## How It Works

1. **Lists** are optional H1 headings (`# To-do`, `# In Progress`, `# Done`)
2. **Items/tasks** are markdown list items using either bullet (`- [ ]`, `- [x]`, or just `-`) or ordered (`1. [ ]`, `2. [x]`, or just `1.`) markers
3. **Item metadata** sits on the line below an item as comma-separated `key: value` pairs; keys may be standard, declared, or custom: `prio: high, due: 2025-01-20, id: abc123d`
4. **Subitems/subtasks** use deeper-indented markers; writers indent children to the parent marker width
5. **Attachments** are represented as subitems whose title is a Markdown link/image (`  - [Spec](docs/spec.pdf)`, `  - ![Screenshot](assets/login.png)`)
6. **Document metadata** lives in an HTML comment at the end; parsers tolerate it at the top, but tooling SHOULD NOT emit it there
   - Apps/agents maintain fields like `title:`, `lists:`, and `format:` there (humans usually don't)
   - When generating or rewriting Embridge, tools MUST NOT place list IDs directly below headings. List IDs belong in document metadata via `lists:`. Inline section metadata is reader-tolerance only and should be preserved only when importing existing files for lossless round-trips.

**Note for parsers:** Values containing commas must be quoted. For example, `tags: "apples, oranges"` is valid, but `tags: apples, oranges` would be parsed incorrectly (the parser would see `oranges` as a new key).

## Embridge compared to todo.txt format

Embridge has some similarities to [todo.txt](https://github.com/todotxt/todo.txt): both are plain-text, human-editable, and git-friendly. The difference is focus:

- **List-oriented** - Embridge organizes items into named sections (`# To-do`, `# Done`) and supports subitems via indentation. todo.txt is a flat file.
- **Self-describing metadata** - Embridge uses `key: value` pairs (`prio: high`, `due: 2025-01-20`). todo.txt relies on positional rules and symbols: `(A)` for priority, `+project` for projects, `@context` for contexts. You need to memorize what each symbol means.
- **Markdown-native** - Embridge files render reasonably in any Markdown viewer. todo.txt is its own format.

Embridge has its own quirks—the `- [ ]` checkbox syntax comes from GitHub-flavored Markdown, and metadata on a separate line takes getting used to. But if you already write Markdown, the learning curve is minimal.

## Try it out

You can play around with an interactive [Embridge editor and validator](https://embridge.net/#try-it) at embridge.net. It has +10 demos/examples.

## About the core contributor

- Flo (xpiu) works on Embridge in his spare time. He is also working on a to-do app called `Todoi`. You can support him by having a look at [todoi.com](https://todoi.com).

## How to contribute

- Open an [issue](https://github.com/embridge-foundation/embridge/issues) for bugs or ideas.
- Submit a PR for spec or doc changes; keep edits aligned with the format requirements.

## Documentation

- [Full Specification](https://github.com/embridge-foundation/embridge/blob/main/embridge_format_specifications_v0.2.1.md) - Complete format reference
- [Example File](https://github.com/embridge-foundation/embridge/blob/main/embridge_output_demo_v0.2.1.md) 

## References

- [CommonMark Spec](https://spec.commonmark.org/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Minimal to-do](https://github.com/xpiu/minimal-to-do)

## License

This project is licensed under the [MIT License](LICENSE).

# Embridge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Version:** 0.2.2  
**Git repo:** https://github.com/embridge-foundation/embridge  
**Project website:** https://embridge.net  
**Summary:** A markdown-based format for item/task lists for humans and AI agents.  
**Author:** xpiu  

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
- [Embridge compared to other formats](#embridge-compared-to-other-formats)
  - [Embridge compared to GitHub Flavored Markdown with YAML frontmatter](#embridge-compared-to-github-flavored-markdown-with-yaml-frontmatter)
  - [Embridge compared to todo.txt](#embridge-compared-to-todotxt)
  - [Embridge compared to the Open Knowledge Format (OKF)](#embridge-compared-to-the-open-knowledge-format-okf)
- [Try it out](#try-it-out)
- [About the core contributor](#about-the-core-contributor)
- [How to contribute](#how-to-contribute)
  - [Contributor workflow](#contributor-workflow)
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
format: Embridge v0.2.2, github.com/embridge-foundation/embridge
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
3. **Item metadata** sits directly below an item as comma-separated `key: value` pairs; one line is canonical, and consecutive metadata-like lines are valid reader input
4. **Subitems/subtasks** use deeper-indented markers; writers indent children to the parent marker width
5. **Attachments** are represented as subitems whose title is a Markdown link/image (`  - [Spec](docs/spec.pdf)`, `  - ![Screenshot](assets/login.png)`)
6. **Document metadata** lives in an HTML comment at the end; parsers tolerate it at the top, but tooling SHOULD NOT emit it there
   - Apps/agents maintain fields like `title:`, `lists:`, and `format:` there (humans usually don't)
   - When generating or rewriting Embridge, tools MUST NOT place list IDs directly below headings. List IDs belong in document metadata via `lists:`. Inline section metadata is valid but non-canonical and should be preserved only when importing existing files for lossless round-trips.

**Note for parsers:** Values containing commas must be quoted. For example, `tags: "apples, oranges"` is valid, but `tags: apples, oranges` would be parsed incorrectly (the parser would see `oranges` as a new key).

## Embridge compared to other formats

Embridge has a unique focus : **support natural, human-written lists - be reliably machine-parseable - be git-friendly**. If you already have a workflow that works, keep it. The comparisons below clarify Embridge's unique advantages.

### Embridge compared to GitHub Flavored Markdown with YAML frontmatter

GFM checkboxes (`- [ ]`, `- [x]`) are familiar and render well on GitHub, and YAML front matter covers document-level fields like `title` or `tags`. For simple lists that live in one app or pipeline, that stack is enough.

Embridge uses the same Markdown surface, but treats **task lists as a portable interchange format**:

1. **List first, metadata last** - YAML front matter expects general info at the top of the file. But humans start a list by just listing stuff; the meta and general info come later, as an afterthought. Embridge matches that flow: the file opens with items, and document fields (`title:`, `lists:`, `format:`) live in an HTML comment at the end.
2. **Per-item metadata and IDs** - `key: value` fields directly under each item (`prio: high`, `due: 2025-01-20`, `id: abc123d`). GFM has no standard place for these, so teams invent editor-specific conventions.
3. **Standard fields** - `status`, `prio`, `tags`, `assignee`, `due`, `id`, etc. have defined semantics; unknown custom fields are preserved.
4. **Per-item comments** - `>` lines with optional `@author [timestamp]` and `>>` replies. GFM/YAML have no item-level equivalent.
5. **Named lists** - `# To-do`, `# In Progress`, `# Done` sections are first-class; no YAML arrays or file-per-column.
6. **Nesting and attachments** - Subitems via ordinary indentation; attachments as link/image subitems, with shared round-trip rules.
7. **A spec and reference tooling** - One defined format with writer rules, lossless round-trips, and validation - not a stack of conventions.

GFM + YAML is lighter for notes with a few tasks. Choose Embridge when the `.md` file is the **source of truth for tasks across humans, agents, and apps**.

### Embridge compared to todo.txt

Both [todo.txt](https://github.com/todotxt/todo.txt) and Embridge are plain-text, human-editable, and git-friendly. The difference is focus:

1. **List-oriented** - Named sections (`# To-do`, `# Done`) and nested subitems. todo.txt is a flat file, one task per line.
2. **Self-describing metadata** - `key: value` pairs (`prio: high`, `due: 2025-01-20`) instead of memorized symbols (`(A)`, `+project`, `@context`).
3. **Stable IDs** - `id` fields let tools track an item across edits and merges. todo.txt identifies tasks only by text and line position.
4. **Done tasks stay in the file** - Checked off or moved to `# Done`. todo.txt archives completed tasks to a separate `done.txt`.
5. **Comments and attachments** - Per-item comments (`> @alice [2025-01-20]: ...`) and link/image subitems. todo.txt has no equivalent.
6. **Markdown-native** - Renders in any Markdown viewer or git forge. todo.txt is its own format.

### Embridge compared to the Open Knowledge Format (OKF)

The [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) (Google Cloud, 2026) organizes a **directory of Markdown files** into a knowledge base for AI agents: one concept per file, YAML frontmatter with a required `type` field, and cross-links that form a graph. Both formats are plain Markdown, git-friendly, and preserve unknown fields - but they solve different problems:

1. **Metadata placement** - OKF follows the frontmatter-at-top convention; Embridge opens with items or a list. Documenting metadata is lower priority.
2. **Task semantics** - Checkboxes, `status`, `prio`, `due`, stable IDs, and per-item comments are core to Embridge. OKF has no task or item constructs.
3. **Items vs. concepts** - Embridge structures the *inside* of one file into lists of items/tasks. OKF structures a *directory* of files, one concept per file.
4. **Per-item vs. per-document metadata** - Embridge attaches `key: value` fields to every item; OKF metadata lives only in each file's frontmatter.

The two are complementary rather than competing: an Embridge task file can live inside an OKF bundle as a concept, giving agents both curated context (OKF) and actionable task lists (Embridge).

## Try it out

You can play around with an interactive [Embridge editor and validator](https://embridge.net/#try-it) at embridge.net. It has +10 demos/examples.

You can also validate files from the command line with the reference parser CLI:

```sh
npx embridge validate file.md
npx embridge to-json file.md
npx embridge from-json file.json
npm install --save-dev embridge
```

## About the core contributor

- Flo (xpiu) works on Embridge in his spare time. He is also working on a to-do app called `Todoi`. You can support him by having a look at [todoi.com](https://todoi.com).

## How to contribute

- Open an [issue](https://github.com/embridge-foundation/embridge/issues) for bugs or ideas.
- Submit a PR for spec or doc changes; keep edits aligned with the format requirements.

### Contributor workflow

Use short-lived branches for normal work. Branch names should describe the change, for example:

```bash
git checkout -b docs/metadata-clarity
```

Merge to `main` when each change is coherent, reviewed enough to be public, and still aligned with the format goals.

Keep upcoming release notes in `CHANGELOG.md` under `## [Unreleased]` on `main`, following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) pattern:

```markdown
# Changelog

## [Unreleased]

### Changed
- Clarified metadata block parsing.

## [0.2.2] - 2026-06-23
...
```

During normal work, a feature branch adds its note under `## [Unreleased]`. After the branch is merged, `main` shows what has changed since the last tagged release.

For release prep:

1. Convert the current `## [Unreleased]` notes into the new version section, dated with the release date.
2. Add a fresh empty `## [Unreleased]` section above the new version section.
3. Update the README, specification, parser, and other current version markers only when the release version is final.
4. Tag the release commit:

```bash
git tag v0.2.3
git push origin v0.2.3
```

Use a `release/v0.2.3` branch only when a short freeze or stabilization period is needed. In that case, do the changelog conversion on the release branch, merge it back to `main`, and tag the merged release commit.

## Documentation

- [Full Specification](https://github.com/embridge-foundation/embridge/blob/main/embridge_format_specifications_v0.2.2.md) - Complete format reference
- [Example File](https://github.com/embridge-foundation/embridge/blob/main/embridge_output_demo_v0.2.2.md)

## References

- [CommonMark Spec](https://spec.commonmark.org/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Open Knowledge Format Spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
- [Minimal to-do](https://github.com/xpiu/minimal-to-do)

## License

This project is licensed under the [MIT License](LICENSE).

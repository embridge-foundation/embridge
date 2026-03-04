# Embridge

**Version:** 0.1.0  
**Author:** xpiu
**Git repo:** https://github.com/embridge-foundation/embridge  
**Project website:** https://embridge.net  
**Summary:** A markdown-based format for item/task lists for humans and AI agents.
**Licence:** MIT  

## Contents

- [Project goals](#project-goals)
- [Value proposition of the Embridge format](#value-proposition-of-the-embridge-format)
- [SWOT](#swot)
- [Example 1](#example-1)
- [Example 2 (bullet markers)](#example-2-bullet-markers)
- [Example 3 (ordered markers)](#example-3-ordered-markers)
- [How It Works](#how-it-works)
- [Embridge compared to todo.txt format](#embridge-compared-to-todotxt-format)
- [How to contribute](#how-to-contribute)
- [Documentation](#documentation)
- [License](#license)

## Project goals

1. **Primary goal:** Offer an item and list format that humans like to use (human-friendly first). Easy to learn, read and edit. With some editing flexibility.
2. Be AI-friendly. Easy for AI to read, understand and edit.
3. Provide guidance on usage in apps
4. Stay merge- and diff-friendly for git workflows
5. Remain tool- and vendor-agnostic (portable across editors/apps/forges)
6. Preserve forward compatibility (ignore/preserve unknown fields)
7. Use Markdown-inspired syntax (designed to degrade gracefully in Markdown renderers; see [Rendering Compatibility](#rendering-compatibility-appendix))

```

Four-way venn-diagram in ASCII:

                  .-----------.
               .-'             '-.
             .'      HUMANS       '.
            /  (Flexible editing)   \
         .-+-------------------------+-.
       .'  |                         |  '.
      /    |                         |    \
     :  AI |                         | APPS :
     |AGENTS        EMBRIDGE         |(GUI) |
     :     |                         |      :
      \    |                         |    /
       '.  |                         |  .'
         '-+-------------------------+-'
            \          GIT          /
             '. (version control) .'
               '-.             .-'
                  '-----------'

 *Embridge is where all four overlap

```

## Value proposition of the Embridge format

Embridge is a strong fit for teams/people who already live in **git + Markdown** and want tasks to be **portable across editors/apps** without committing to a vendor or a database.

- **Plain Markdown** - Edit in any text editor, render on any git forge
- **Stable IDs** - Per-item `id` enables reliable automation, syncing, and merge conflict resolution
- **Loose structure, predictable parsing** - Minimal rules (dash indentation, `key: value` metadata) without strict schemas
- **Extensible** - Unknown fields preserved; apps can add custom metadata without breaking others
- **Offline-first** - Edit anywhere, sync later; no SaaS required
- **Source-of-truth clarity** - The `.md` file owns content; apps keep UI-only state elsewhere
- **Interoperability is the differentiator** - A reference parser/formatter and clear “sync-ready” rules are what make this more than “just another Markdown task convention”

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

## Example 1:
```markdown
- apples
- pears
```

## Example 2 (bullet markers):

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
embridge:0.1.0
project:Example Project
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
lists:l1st01a:"To-do" l1st02b:"Done"
-->
```

## Example 3 (ordered markers):

```markdown
# Setup steps
1. [ ] Install dependencies
prio: high, id: abc123d
2. [ ] Configure environment
id: def456a
3. [x] Run tests
id: ghi789a
```

## How It Works

1. **Lists** are H1 headings (`# To-do`, `# In Progress`, `# Done`)
2. **Items/tasks** are markdown list items using either bullet (`- [ ]`, `- [x]`, or just `-`) or ordered (`1. [ ]`, `2. [x]`, or just `1.`) markers
3. **Metadata** sits on the line below, comma-separated: `prio: high, due: 2025-01-20, id: abc123d`
4. **Subitems/subtasks** use indented markers (`  - ` or `  1. ` for level 1, `    - ` or `    1. ` for level 2, etc.)
5. **Attachments** are represented as subitems whose title is a Markdown link/image (`  - [Spec](docs/spec.pdf)`, `  - ![Screenshot](assets/login.png)`)
6. **Document metadata** lives in an HTML comment at the end
   - Apps/agents maintain `project:` and `lists:` there (humans usually don't)

**Note for parsers:** Values containing commas must be quoted. For example, `tags: "apples, oranges"` is valid, but `tags: apples, oranges` would be parsed incorrectly (the parser would see `oranges` as a new key).

## Embridge compared to todo.txt format

Embridge has some similarities to [todo.txt](https://github.com/todotxt/todo.txt): both are plain-text, human-editable, and git-friendly. The difference is focus:

- **List-oriented** - Embridge organizes items into named sections (`# To-do`, `# Done`) and supports subitems via indentation. todo.txt is a flat file.
- **Self-describing metadata** - Embridge uses `key: value` pairs (`prio: high`, `due: 2025-01-20`). todo.txt relies on positional rules and symbols: `(A)` for priority, `+project` for projects, `@context` for contexts. You need to memorize what each symbol means.
- **Markdown-native** - Embridge files render reasonably in any Markdown viewer. todo.txt is its own format.

Embridge has its own quirks—the `- [ ]` checkbox syntax comes from GitHub-flavored Markdown, and metadata on a separate line takes getting used to. But if you already write Markdown, the learning curve is minimal.

## About the core contributor

- Flo (xpiu) is happy to work on Embridge in his spare time. He works on the to-do app `Todoi` to make a living. You can support him by visiting https://todoi.com and considering the app for your to-do lists.

## How to contribute

- Open an [issue](https://github.com/embridge-foundation/embridge/issues) for bugs or ideas.
- Submit a PR for spec or doc changes; keep edits aligned with the format requirements.

## Documentation

- [Full Specification](https://github.com/embridge-foundation/embridge/blob/main/embridge_format_specifications_v0.1.0.md) - Complete format reference
- [Example File](https://github.com/embridge-foundation/embridge/blob/main/embridge_output_demo_v0.1.0.md) 

## License

This project is licensed under the [MIT License](LICENSE).

# Embridge

A markdown-based format for item/task lists that work for humans and AI agents.

## Why Embridge?

Item/Task management tools lock your data in proprietary formats. Embridge is different:

- **Human-readable** - It's just markdown. Edit in any text editor.
- **AI-friendly** - Structured enough for agents to parse and modify reliably.
- **Git-native** - Track changes, review diffs, collaborate with PRs.
- **No lock-in** - Your data stays yours. Plain text forever.

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
2. **Items or tasks** are markdown dashes (`- [ ]` or `- [x]`)
3. **Metadata** sits on the indented line below: `prio:high due:2025-01-20 id:abc123`
4. **Document metadata** lives in an HTML comment at the end

## Documentation

- [Full Specification](20260111_embridge_format_specifications.md) - Complete format reference
- [Example File](20260111_embridge_output_demo_v0_0_1.md) - A working demo

## License

CC0 1.0 Universal - Public domain. Use it however you want.

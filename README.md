# Item Bridge

**Summary:** A markdown-based format for item/task lists that bridges humans, AI agents, and app GUIs.
**Version:** 0.0.1
**Licence:** CC0, Open Source

## Project requirements

- Humans can read and edit it naturally
- Humans can edit it in simple interfaces, like a CLI
- AI can edit and read it quickly
- Git can track changes
- No vendor lock-in (Open Source)

## Format

```markdown
## To-do
- [ ] An item title
  descr:"This is an item" prio:high tags:api,backend due:2025-01-20 id:abc123
  - [ ] Subtask
    descr:"This is a subitem" id:def456

## Done
- [x] A completed item
  id:ghi789

<!--
itembridge:0.0.1
sync:2025-01-15T09:00:00-05:00
uuid:0188b200-0000-7000-8000-000000000000
-->
```

## Spec

See [20260111_item_list_format_specification.md](20260111_item_list_format_specification.md) for the full specification and [20260111_markdown_spec_demo_v0_0_1.md](20260111_markdown_spec_demo_v0_0_1.md) for a working example.

## License

CC0 1.0 Universal

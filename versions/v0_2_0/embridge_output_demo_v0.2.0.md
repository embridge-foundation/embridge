# In progress
- Refactor user service
created: 2025-01-15

# To-do
- [ ] Fix pagination bug
"Users report that page 2 shows
duplicate items from page 1.
Check offset calculation.", created: 2025-01-15, id: f8g9h0q
> @alice [2025-01-16]: Found the issue in paginate.js line 42
>> @bob [2025-01-16]: Can you push a fix today?
>> @alice [2025-01-17]: Done, see commit abc123
> verified fix works
  - [Bug screenshot](assets/pagination-page2.png)
  - [Repro video](media/pagination-bug.mp4)
  - ![Offset calculation notes](assets/pagination-offset.png)
- Update dependencies
status: todo, created: 2025-01-15
> waiting for security audit to complete
> @charlie: I can help with this next week

# Backlog
- Research caching strategies
"lorem ipsum", status: ideas, prio: high, tags: "research, tech", assignee: @alice, created: 2025-01-15, updated: 2025-01-18, due: 2025-01-20, id: a1b2c3d
> Consider Redis vs Memcached tradeoffs
> @alice [2025-01-17]: Good point, will evaluate both
  - An example of a subitem/subtask, visibly separated by the two spaces prior to its dash symbol
  "subtask description text ....", id: 3b2k1op
  > quick note on this subtask
  - Another subitem/subtask
  "another subitem/subtask, but now without checkbox or id, flexibly possible to drop these"
- Explore new auth library
"example of item without id or checkbox, which an online parser might have to add"
> check if it supports OAuth 2.1

# Done
- [X] Write API documentation
status: done, created: 2025-01-15

<!--
title: Project title
sync: 2025-01-15T09:00:00-05:00
uuid: 0188b200-0000-7000-8000-000000000000
lists: "In progress" z8c4r6d, "To-do" w7q2e1b, "Backlog" p3k9x2a, "Done" t5y6u7e
format: Embridge v0.2.0, github.com/embridge-foundation/embridge
-->
- [ ] Build reference parser
"A reference parser would serve as the canonical interpretation of the spec."
ref: ".tmp/spec-review.md, issue 2"
prio: high

- [ ] Repeated scalar fields
prio: low
prio: high
id: old123a
id: new456a

- Parent
ref: A
  note: B
  - Child
  ref: C
    - Grandchild
    ref: D

- Parent attachment
ref: A
  - [Spec](spec.pdf)
  caption: "API review notes"

- Comment closes metadata
prio: before
> comment
status: after-comment

- Free-form closes metadata
prio: before
They prefer mornings
also: after-free-form

- Marker boundary
prio: before
- [ ] Next item
status: next

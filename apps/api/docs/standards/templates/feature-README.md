---
status: "Draft"
owner: "<team/lead>"
reviewers:
  - "<roles>"
last_updated: "YYYY-MM-DD"
---

# <Feature> — <one-line description>

<!-- Template: the orientation page for a product feature or engineering area.
     Copy to product/<feature>/README.md or engineering/<area>/README.md. Delete these comments. -->

One paragraph: what this is, who it's for, and the single job it does.

## Reading order

<!-- Only for a multi-chapter spec. A small module deletes this section. -->
1. `001-…` — …
2. `002-…` — …

## Key facts

- **Where it lives:** backend `internal/modules/<x>/`, frontend `src/…`.
- **Status / where it runs:** shipped? live? behind a flag?
- **Related:** [links to sibling docs, ADRs].

## Working rules

- Read this doc (and the relevant `product/` spec) before implementing.
- If docs and code conflict, fix the docs first.
- Keep `STATUS.md` current per change (see the Definition of Done).

# Documentation Naming & Formatting Conventions

> **Status:** Approved · **Owner:** Backend Team Lead · **Last updated:** 2026-07-21

The mechanical rules for writing docs in this repository. The *why* behind the
structure is in [`../process/DOCUMENTATION_ARCHITECTURE.md`](../process/DOCUMENTATION_ARCHITECTURE.md).

## Files & folders

- **Case:** `kebab-case` for files and folders — `technical-design.md`,
  `engineering/security/`. Two fixed exceptions kept for convention: `README.md` and
  `STATUS.md` (uppercase), and `DOCUMENTATION_ARCHITECTURE.md`.
- **Folder entry point:** every folder's overview is its `README.md` — not
  `overview.md`, not `index.md`.
- **Numbered chapters:** only a genuinely ordered, multi-chapter spec uses the
  `NNN-topic.md` prefix (`001-product-overview.md`), zero-padded to three digits,
  ordered by reading sequence. A single-file doc **never** carries a number
  (no orphan "001 — …" titles on a lone file).

## Language

- **English only.** PRDs, API, architecture, AI prompts, Frontend/Mobile docs — all
  English, so any contributor can read any document. Team chat may be Russian or
  Armenian; the written record is English.

## Every document header

The first lines of every document, so a reader knows its trust level and who owns it:

```markdown
# Title

> **Status:** Draft | Review | Approved | Deprecated | Archived
> **Owner:** <role/team> · **Reviewers:** <roles/teams> · **Last updated:** YYYY-MM-DD
```

- **Status** — see the lifecycle in the architecture doc §8. A `Deprecated` doc links
  to its replacement; nothing is silently deleted.
- **Owner** — the one role/team accountable for keeping it accurate.
- **Last updated** — bump on every substantive change.

## Writing style

- Lead with the answer; keep prose tight. Prefer tables and short sections over long
  narration.
- Reference code as `path:line` where useful; link sibling docs by relative path.
- `STATUS.md` is a **snapshot** (TL;DR · done · open · how-to-continue), not an
  append-only changelog — long history goes to a `CHANGELOG.md`.
- Cross-link generously; a full-stack feature is specced **once** in
  `product/<feature>/` and linked from elsewhere, never copied.

## Templates

Start every new document from the matching template in
[`templates/`](templates/) so structure and headers stay consistent.

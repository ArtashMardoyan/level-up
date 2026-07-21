---
status: "Approved"
owner: "Backend Team Lead"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Naming & Formatting Conventions

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

## Source of truth

- **Markdown in this repository is the single source of truth.** Artifacts — Claude
  Artifacts, generated HTML/PDF, the published docs website — are temporary review copies
  or build outputs. They are **never** authoritative and are never edited as the master.
- **Document lifecycle:** `Artifact → Review → Approved → Markdown → Git → Docs website`.
  A draft may be shaped in an artifact for review, but it becomes real only once it lands
  as Markdown in Git.

## Every document header

Metadata lives in **YAML front matter** at the very top of every document — machine-
readable, so the documentation portal surfaces it consistently on each page (the reader
never sees it duplicated in the body):

```yaml
---
status: Draft | Review | Approved | Deprecated | Archived
owner: <role/team>
reviewers: [<role>, ...]              # optional
last_updated: YYYY-MM-DD
version: <string>                     # optional
visibility: public | internal | private
---
# Title
```

- **status** — see the lifecycle in the architecture doc §8. A `Deprecated` doc links
  to its replacement; nothing is silently deleted.
- **owner** — the one role/team accountable for keeping it accurate.
- **last_updated** — bump on every substantive change.
- **visibility** — which audience the doc is published to (portal build filtering):
  `public` (public site), `internal` (auth-gated site), or `private` (excluded from both
  by default). **Defaults to `internal`** when omitted — nothing is public by accident.
- ADRs use `status`, `date`, and `deciders` instead of owner/reviewers/last_updated.

The portal generates a small metadata banner from these fields; do not restate them in
the body.

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

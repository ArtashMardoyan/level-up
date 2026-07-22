---
status: "Approved"
owner: "Backend Team Lead"
reviewers:
  - "Frontend"
  - "Mobile"
  - "Product"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Architecture

This is the permanent reference for how Level Up's documentation is organized and
maintained. A new engineer — Backend, Frontend, Mobile, or AI — should be able to
open this file and understand **why** the docs are shaped the way they are, and
**how** to add, grow, and move documentation without breaking the system.

It is deliberately a repository document (not a throwaway artifact): the reasoning
behind the structure must survive long after the people who set it up.

---

## 1. Purpose & scope

This document defines the information architecture, principles, and rules that all
Level Up documentation follows as the platform grows across Backend, Frontend,
Mobile, and AI. The goal is not tidier files — it is a **navigable system**:
predictable placement, one source of truth per topic, clear ownership, and
documents that stay honest because the process keeps them so.

---

## 2. Philosophy

A documentation set is judged not by how good each file is, but by whether the
*right* document is where its reader expects it. One test governs every decision:

> **The ten-minute onboarding test.** A new Backend, Frontend, Mobile, or AI
> engineer joins in a year. In their first ten minutes, unaided, can they find: the
> **product** spec for a feature, the **engineering** conventions for their stack,
> the **architectural decisions** and their rationale, how we **write and ship**
> docs, and the **current state** of any feature?

Three beliefs follow: documentation **serves a reader** (organized by audience, not
by how the system is built); documentation **evolves with the system** (structure
grows only when the subject does); and documentation **earns its place** (nothing
exists merely to fill a slot).

---

## 3. Principles

**P1 — Organize by audience & stability, not by topic-as-it-appeared.**
Docs fall into four kinds with different readers and change-rates: *product* (what &
why), *engineering* (how, per stack), *decisions* (why we chose), and
*standards/process* (how we document & ship). The top level encodes that split.

**P2 — The backend repository is the single source of truth for documentation.**
Product documentation lives inside `level-up-backend`. Web, Mobile, and future
clients **consume** it from there rather than keeping their own copies. A separate
documentation repository may be introduced if the project grows significantly, but
it is **intentionally out of scope now**.

**P3 — English is the canonical language for all documentation.**
PRDs, API references, architecture, AI prompts, Frontend and Mobile docs — all in
English, so any contributor can read any document. Team conversation may be in
Russian or Armenian; the written record is English.

**P4 — Documentation depth is determined by complexity, risk, and business impact —
not by module size.** A small, self-evident module needs little; a small but
security-critical or business-critical one needs a lot. `caching` is small and
simple (one README). `auth` is also small, but high-risk — it warrants architecture,
flows, and security notes. `learning` may be code-light but high business impact —
it warrants a full PRD. Depth tracks difficulty and stakes, never line count.

**P5 — Documentation is never created just to satisfy the structure.**
No `STATUS.md` exists only to exist; no two-line README fills a folder for symmetry.
Every document is present because it adds something a reader needs. An empty slot is
better than a hollow file — hollow files erode trust in all the others.

**P6 — Documentation evolves with the system.**
A module starts with the minimum useful doc and gains structure only as it earns it.
Recognizing that growth and proposing the expansion is part of every review.

**P7 — Every document has an owner.**
Ownership is explicit (§7). A document with no owner has no one accountable for its
accuracy, and it rots. Orphaned documents are an anti-pattern (§12).

**P8 — Every document has a status.**
A reader must know how much to trust a document at a glance: `Draft` → `Review` →
`Approved` → `Deprecated` → `Archived` (§8).

**P9 — The repository is the source of truth; artifacts are temporary.**
Markdown in this repository is authoritative. Artifacts — Claude Artifacts, generated
HTML/PDF, the future docs website — are review copies or build outputs, **never** the
source, and are never edited as the master. The document lifecycle is:
**Artifact → Review → Approved → Markdown → Git → Docs website.**

---

## 4. Information architecture

One `docs/` tree inside the backend repository. Five top-level entries — so the root
itself reads as the site map.

```
level-up-backend/docs/
  README.md                 # the map — "start here", by role
  standards/                # how we WRITE docs — naming, templates
    templates/              # PRD · tech-design · roadmap · ADR · STATUS · UX
  process/                  # how we BUILD & ship — lifecycle, DoD, review, ownership
    DOCUMENTATION_ARCHITECTURE.md   # ← this document
  product/                  # WHAT & WHY — full-stack, per domain
    interview/  ai-chat/  dictionary/  profile/
    learning/  notifications/  content/
  engineering/              # HOW it's built — per stack & concern
    architecture/  backend/  frontend/  mobile/
    data/  security/  deployment/  caching/  observability/
  decisions/                # ADRs — WHY we chose (immutable record)
```

The frontend repo keeps a thin `docs/` that links here for anything repo-specific
(e.g. the Pages base-path quirk); it never forks a product spec. Web and Mobile read
product docs from this tree.

---

## 5. What each level is for — and why it's separate

| Level | Answers | Audience | Cadence |
|---|---|---|---|
| `product/` | What & why we build it | Everyone incl. PM & AI | Business-paced |
| `engineering/` | How it's built, per stack | That stack's engineers | Tech-paced |
| `decisions/` | Why we chose this way | All engineers, historical | Append-only |
| `standards/` | How we write docs | Everyone, at onboarding | Rare |
| `process/` | How we ship | Everyone | Rare |

**Why `product/` is top-level, not under `backend/`.** Product describes *behavior*,
which is full-stack and outlives any implementation. Its readers are everyone. If the
interview spec lived under `backend/`, the Mobile, Frontend, and AI engineers would
never look there — and it would falsely imply "interview is a backend thing."

**Why `engineering/` is separate from `product/`.** Stack conventions have a narrow
audience (one stack) and a fast clock. A backend engineer wants all their conventions
in one place; a frontend engineer must be able to ignore `engineering/backend/`.

**Why `backend/` sits under `engineering/`, not at the root.** Keeping the root to
five legible entries is itself a feature — the root is the map. `backend`,
`frontend`, `mobile` are siblings of one kind, so they group.

**Why `process/` is separate from `standards/`.** `standards/` is *how to write a
document*; `process/` is *how we ship*. Bundling them hides the delivery process
inside "doc formatting," where no engineer would look.

**Why the PRD does not live next to the API reference.** A **PRD** is intent
(problem, scope, success), read by everyone, changes rarely. An **API reference** is
the delivered contract, read by integrators, changes on every endpoint edit. Put a
stable "why" doc next to a volatile "how" doc and the PRD gets buried in churn. So the
PRD lives in `product/<feature>/`; the API contract lives with the code and is linked
from the feature's technical design.

**Why `decisions/` (ADRs) is its own top-level.** An ADR answers **Why?**, not
**How?** — and no one will remember the *why* in two years unless it is recorded as
immutable history. `STATUS` is mutable present truth; mixing the two is why one STATUS
file grew to 325 lines with its rationale buried inside. Example ADRs for Level Up:

```
ADR-0001  Product documentation lives in the backend repository
ADR-0002  English is the canonical documentation language
ADR-0003  SSE for text streaming; WebSocket reserved for voice/realtime
ADR-0004  Sentinel-delimited format for streamed AI generation
```

---

## 6. Document types & required depth

Required depth follows **complexity, risk, and business impact** (P4) — the ladder
below is guidance and examples, not a rigid gate:

| Signal | Typical documents | Example |
|---|---|---|
| Simple, stable, self-evident | `README.md` | caching |
| Non-obvious flows or lifecycle | + `architecture.md` | notifications |
| Security / privacy / compliance surface | + flows + `security-notes.md` | auth |
| High business impact / multi-phase | + `prd.md` + `roadmap.md` + `STATUS.md` | learning, ai-chat |
| Full product domain | `README` + `STATUS` + numbered `NNN-*.md` chapters | interview |

Each type has a template in `standards/templates/`. `STATUS.md` is a **snapshot**
(TL;DR · done · open · how-to-continue), not an append-only log — history goes to an
optional `CHANGELOG.md`.

**Every document carries YAML front matter** that models P3/P7/P8 (machine-readable; the
portal surfaces it on every page — see `standards/naming-conventions.md`):

```yaml
---
status: Draft | Review | Approved | Deprecated | Archived
owner: <role/team>
reviewers: [<role>, ...]     # optional
last_updated: YYYY-MM-DD
---
```

---

## 7. Documentation ownership

Every document (or folder) names an **owner** — accountable for its accuracy — and
its **reviewers**. Recorded in the document header, or in the folder `README.md` for
a multi-file area. Without this, no one keeps the doc honest and it rots.

| Document | Owner | Reviewers |
|---|---|---|
| Product spec (e.g. Interview, Learning) | Product / feature lead | Backend, Frontend, Mobile |
| Backend API & conventions | Backend | — |
| Frontend architecture | Frontend | — |
| Mobile architecture | Mobile | Backend |
| ADRs | Author of the decision | All engineers |
| This document & standards | Backend Team Lead | Frontend, Mobile, Product |

The owner is responsible for keeping the document's `STATUS` and content current as
the system changes; reviewers approve changes that affect their surface.

---

## 8. Documentation status & versioning

Every document declares a status so a reader knows how much to trust it:

```
Draft       → being written; not yet reliable
Review      → complete, under review
Approved    → the current source of truth
Deprecated  → superseded; kept for reference, points to its replacement
Archived    → no longer relevant; retained for history
```

Status lives in the document header (§6). A `Deprecated` doc must link to what
replaced it; nothing is silently deleted.

---

## 9. Rules for adding a new module

Documentation appears **before** implementation, not after.

1. **Classify it.** Product (user-facing behavior — what & why) → `product/`.
   Cross-cutting technique or stack concern (how) → `engineering/`.
2. **Decide documentation depth.** Use the complexity/risk/impact ladder (§6) to
   choose which documents this module needs — before writing any.
3. **Create the documentation.** Write the chosen docs (at minimum a `README.md`;
   a PRD for anything high-impact) *before* building. This is where scope and intent
   are agreed.
4. **Implement.** Build against the agreed docs; update `STATUS.md` per phase.
5. **Keep documentation updated.** Docs and code change together; on conflict, fix
   the docs first. The Definition of Done (§13) enforces this.

Write English, kebab-case files; use numbered `NNN-*.md` only for a genuinely ordered
multi-chapter set. Name an owner (§7) and set a status (§8). A full-stack feature is
specced once in `product/<x>/`; other repos link to it and never copy it (P2).

---

## 10. Rules for evolving documentation as the system grows

Structure is earned, not front-loaded (P6). A module's docs expand in step with its
real complexity, risk, and impact:

```
README.md
   ↓  (non-obvious internals appear)
README.md + architecture.md
   ↓  (design decisions & contracts accumulate)
README.md + architecture.md + technical-design.md
   ↓  (it becomes a full product domain)
README.md + STATUS.md + numbered NNN-*.md chapters
```

Concrete example — `engineering/caching/` starts as one README (a single ETag +
content-version trick). When it grows into Redis, CDN, browser, and API-cache layers,
it graduates to `README` (overview) + `architecture.md` (layers, invalidation) +
`technical-design.md` / `implementation.md` + `roadmap.md`. The docs grew because the
*system* grew — not because a rule demanded files.

**Reviewer duty:** when a change makes a module materially more complex or raises its
risk/impact, flag that its documentation should graduate, and propose the expansion in
the same review.

---

## 11. Rules for migrating existing documentation

Migration is docs-only and behavior-preserving. Three rules are absolute:

- **No information may be lost during migration.** Content is moved and improved,
  never dropped. If something is obsolete it is marked `Deprecated`/`Archived` (§8),
  not deleted.
- **Every moved document preserves Git history whenever possible** — use `git mv`
  (never delete-and-recreate), so `git log`/`blame` still trace each doc's evolution.
- **Improve organization, not content.** The goal is structure and standards, not
  rewriting. Only rewrite a document when it is **outdated, duplicated, inconsistent,
  or incorrect**; otherwise move good content as-is. Documentation quality must not
  regress during migration.

Each existing document maps to exactly one place in the new tree:

| Today | New home | Also do |
|---|---|---|
| `docs/interview/` | `product/interview/` | trim STATUS to snapshot + CHANGELOG |
| `docs/ai-chat/` | `product/ai-chat/` | seed ADRs from its decisions |
| `docs/notifications/` | `product/notifications/` | fix contradictions; add `badge_earned` |
| `docs/audio/overview.md` | `product/content/` | **commit it — currently untracked** |
| `docs/auth/overview.md` | `engineering/security/` | RU→EN; expand (flows + security notes) |
| `docs/caching/overview.md` | `engineering/caching/README.md` | keep to one page (P4) |
| `docs/deployment/overview.md` | `engineering/deployment/` | RU→EN; drop orphan "001 —" title |
| `CLAUDE.md` / `README.md` | seed `engineering/{architecture,backend}/` | fix stale README (missing modules) |
| frontend `docs/dictionary`, `/profile` | `product/dictionary/`, `product/profile/` | thin the frontend docs to links |

Order: (1) normalize language to English; (2) repair truth (stale README, notifications
contradictions); (3) `git add` the untracked audio doc; (4) `git mv` into the new tree;
(5) leave a one-line redirect stub where an old path was widely linked; (6) run a link
check. No code and no behavior changes.

---

## 12. Anti-patterns

The system is designed to make these impossible or obvious:

- ❌ **Duplicate documentation** — the same topic maintained in two places.
- ❌ **Multiple sources of truth** — no single authoritative doc for a topic.
- ❌ **Platform-specific details inside product documentation** — Go/React specifics
  polluting a product spec that Mobile also reads.
- ❌ **Product behavior inside backend implementation docs** — "what the feature does"
  buried in a Go module note where Frontend/Mobile won't find it.
- ❌ **Outdated documentation** — docs that no longer match the system (no owner, no
  DoD enforcing updates).
- ❌ **Documentation that exists only to satisfy the structure** — hollow README/STATUS
  files (P5).
- ❌ **Orphaned documents with no clear ownership** — no one accountable (P7).
- ❌ **Depth by size** — heavy docs for a big-but-simple module, thin docs for a
  small-but-critical one (P4).
- ❌ **Mixed languages / orphan numbering / STATUS-as-changelog** — the current
  cosmetic inconsistencies.

---

## 13. Lifecycle & Definition of Done

Documentation is part of building, at the start **and** the end:

```
Idea → Discovery → PRD → UX → Design → Technical Design →
Implementation Plan → Implementation → Documentation Update → Review → Done
```

- Docs are created up front (PRD/UX/design) and updated again after implementation,
  then reviewed before Done.
- **Definition of Done** for any change: code + tests + lint pass **and** the relevant
  docs are updated, `STATUS.md` is bumped, an ADR is added if a decision was made, and
  Postman is synced if routes changed.
- **Review:** doc changes are reviewed like code; a behavior or route change with no
  doc update is not approvable.
- **On conflict, fix the docs first.**

---

## 14. Non-goals (this stage)

- A standalone `level-up-docs` repository or monorepo `/docs` — out of scope now (P2);
  revisit only if the project grows significantly.
- A generated API reference — later, not now.
- Mobile documentation — a placeholder folder only until Mobile work begins.

---

## 15. Next steps

1. **This document** — reviewed and approved (moves to `Status: Approved`).
2. **M1 — Foundation** — update `CLAUDE.md`, create `standards/` + templates, stand up
   the tree, and migrate existing documentation into it (§11).
3. **New modules** — Learning, AI Chat, and beyond follow this system from day one.

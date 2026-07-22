# Documentation Migration Map — backend/frontend repos → future monorepo

- **Status:** Approved (map/analysis only — no docs moved yet)
- **Date:** 2026-07-22
- **Scope:** `level-up-backend/docs/**` + `level-up/docs/**` → future `level-up/docs/**` and `.ai/**`
- **Feeds:** ADR-0007 (OpenAPI contracts) — the contracts gap below is what it fills

---

## Why this map exists

Level Up already has a **mature documentation set** in `level-up-backend/docs/`, governed by an
Approved constitution (`docs/process/DOCUMENTATION_ARCHITECTURE.md`) that *already* uses the target
IA (`product / engineering / decisions / standards / process`). We must **reuse** it, not redesign
from scratch. This map decides, per document: new home / into `.ai/` / unchanged / merge / split /
deprecate — and lists the **gaps** still to write.

Two facts shape everything:
1. Backend docs already match the target IA → the bulk is a **lift-and-shift** (`git mv`,
   history preserved — constitution §11).
2. The constitution's **P2** ("backend repo is the single source of truth for docs") and **§14**
   ("monorepo /docs out of scope now") are *exactly what the monorepo supersedes*. Recorded via
   ADR-0006 (repo architecture) + deprecating the existing ADR-0001.

**Reused rules (not reinvented):** no information lost; `git mv` to preserve history; improve
organization, not content; `product`=what/why, `engineering`=how/per-stack, `decisions`=why,
`standards`=how-we-write, `process`=how-we-ship; depth by risk/impact; docs-first; EN canonical.

---

## A. Backend `docs/**` → monorepo root `level-up/docs/**` (lift-and-shift, unchanged)

| Existing (backend) | Monorepo home | Action |
|---|---|---|
| `docs/product/interview/**` (001–016 + README + STATUS) | `docs/product/interview/**` | `git mv`, intact (cohesive — do NOT split; see §Mixed) |
| `docs/product/ai-chat/**` (001–014 + README + STATUS) | `docs/product/ai-chat/**` | `git mv`, intact (owner Backend; see §Mixed) |
| `docs/product/notifications/**`, `content/**`, `website/architecture.md` | same under `docs/product/` | `git mv` (website doc is Draft — flag) |
| `docs/product/{PRODUCT_MODEL, README, vision, philosophy, principles, audience, feature-map, roadmap, user-journey}.md` | `docs/product/` | `git mv` **as one bundle** — all "Derived from PRODUCT_MODEL" |
| `docs/engineering/{architecture,backend,caching,deployment,security}/` | `docs/engineering/**` | `git mv`, unchanged (backend-specific; stay in root `engineering/`) |
| `docs/decisions/0001–0005` | `docs/decisions/` | `git mv`; numbering reconciled (see §ADR) |
| `docs/standards/**` (README, naming-conventions, templates/) | `docs/standards/**` | `git mv`; templates referenced by `.ai/` (see C) |
| `docs/process/**` | `docs/process/**` | `git mv`; portal cluster consolidated (see D) |
| `docs/README.md` | `docs/README.md` | keep; light update so the "map" reflects monorepo scope |

## B. Frontend `level-up/docs/**` → reclassify into the shared tree

Frontend docs **lack YAML front-matter** — add `status/owner/last_updated/visibility` on move.

| Existing (frontend) | Monorepo home | Action |
|---|---|---|
| `docs/dictionary/overview.md` | `docs/product/dictionary/` | move (product-behavior) |
| `docs/dictionary/code.md` | `docs/engineering/frontend/dictionary.md` | move (FE eng ref) — **seeds new `engineering/frontend/`** |
| `docs/profile/overview.md` | `docs/product/profile/` | move; **RU→EN** |
| `docs/auth/overview.md` | **merge into** `docs/engineering/security/` | merge (FE half of auth); **RU→EN**; add front-matter |
| `docs/caching/overview.md` | **merge into** `docs/engineering/caching/` | merge (FE half of caching); single source |
| `docs/redesign/status.md` + `handoff/**` (+ assets) | `apps/web/docs/redesign/` | move; web-app design archive ("reference only, not shipped") |

## C. `.ai/` — reference, do NOT duplicate

`.ai/` holds only AI-execution assets and **points at** the docs; it never forks them.

| Existing doc | `.ai/` treatment |
|---|---|
| `docs/standards/templates/{adr,prd,technical-design,ux-spec,roadmap,STATUS,feature-README}.md` | **Stay** in `docs/standards/templates/`; `.ai/templates/` *references* them + adds AI-only ones (`pr.md`, `changeset.md`, `review-report.md`) |
| `docs/standards/naming-conventions.md` | Source for `.ai/checklists/naming.md` (P1 `level-up-ai`) — reference, don't copy |
| `docs/engineering/{backend,architecture,caching,security,deployment}/README.md` | Distilled into `.ai/knowledge/` packs (pointers + `last_verified`); docs stay source of truth |
| `docs/product/PRODUCT_MODEL.md` + `feature-map.md` | Source for `.ai/knowledge/domain-glossary.md` |
| `docs/process/DOCUMENTATION_ARCHITECTURE.md` (+ DoD §13) | Referenced by `.ai/harnesses/documentation.md` as the rule set |

## D. Merge / deprecate (confirmed)

- **Portal cluster** (staged pipeline over one subject, M3→M4):
  - **Keep:** `decisions/0005-documentation-portal-platform.md` (durable decision) and
    `process/documentation-portal-hosting.md` (only *live/operational* doc). Target = **`apps/docs`**.
  - **Deprecate** (mark `Deprecated`, keep for history — do not delete):
    `process/documentation-portal-requirements.md` + `documentation-portal-implementation-plan.md`
    — design-only; decisions now in ADR-0005, reality in the hosting doc.
- **`process/documentation-visibility-classification.md`** — keep; *elevate* — it's the mechanism
  for the temporary public repo (see §Visibility).
- **Frontend `auth`/`caching` overviews** — merge into their backend engineering counterparts (§B).

## E. Stay unchanged
Numbered product sets (interview/ai-chat) move intact; standards templates; Accepted ADRs 0001–0004;
all `docs/engineering/**` READMEs; the PRODUCT_MODEL bundle.

---

## Cross-cutting

### ADR numbering — DECIDED: one sequence, continue at 0006
Keep existing `0001–0005` (never renumber an Accepted ADR). Platform ADRs continue the sequence:
- repo & platform architecture → **ADR-0006** (rename current `ADR-0001-...md` at monorepo creation)
- OpenAPI contract workflow → **ADR-0007** (drafted next)
- `.ai/` workspace architecture → **ADR-0008**

Add a note superseding existing **ADR-0001** ("product docs in backend repo") → `Deprecated →
superseded by ADR-0006`.

### Visibility metadata is an asset
Backend docs already carry `visibility: public | internal | private`; strategy files (vision,
philosophy, principles, audience, user-journey) are `public`. This is the **publish filter** for
the temporary public repo — expose only `visibility: public`; gate the rest. Frontend docs need the
field added.

### Mixed product/engineering chapters — do NOT split now
`ai-chat` (002/003/006/008) and `interview` (010/012/013) hold engineering/how content inside
`product/`. Move the sets **intact** (cohesive, narrative-ordered; "don't rewrite" is binding). Use
the engineering chapters as *source material for `.ai/knowledge` packs*; extract later only if a
chapter churns.

### Russian normalization — only 2 files
`level-up/docs/auth/overview.md` and `level-up/docs/profile/overview.md` → EN on migration.
(Interview MVP is bilingual as a *product feature*; its *docs* are already EN.)

---

## Gaps to document (new — do not exist yet)
- **`docs/engineering/frontend/`** — first-class FE hub (today scattered in `level-up/docs`); seeded by `dictionary/code.md`.
- **`docs/engineering/contracts/` (OpenAPI)** — subject of ADR-0007; absent today.
- **`docs/engineering/monorepo/`** — Turborepo/pnpm workspace, task graph, polyglot Go-island boundary.
- **`docs/engineering/ci-cd/`** — GitHub Actions, contract drift-guard, release/rollback.
- **Platform ADRs** — 0006 (architecture), 0007 (contracts), 0008 (`.ai/`) + supersession of ADR-0001.
- **Frontend-doc front-matter** — `status/owner/last_updated/visibility` on all migrated FE docs.
- Constitution's own named gaps: `learning` PRD, mobile placeholder, generated API reference.
- Interview open item: language selector missing in the delivered design (`.dc.html`).

## Stale / at-risk (carry the flag, don't fix during migration)
`product/website/architecture.md` (only Draft in product set); `interview/STATUS.md` (1 day behind,
describes shipped work); portal requirements + implementation-plan (→ Deprecated); interview
`007-learning-profile` / `008-dictionary-engine` (DEFERRED post-MVP — keep, marked deferred).

---

## Completeness check
- Every doc in both `docs/` trees appears **exactly once** above (no orphans) —
  verify: `find level-up*/docs -name '*.md'` against §A–E.
- Each row states new home + action ∈ {move, merge, reference, deprecate, unchanged}.
- No "rewrite" except the 2 RU files + already-flagged stale docs.

## Next
Draft **ADR-0007 — OpenAPI contract workflow** (the "ADR-0002" you asked for, renumbered per the
decision above). The contracts gap feeds directly into it.

---
status: "Approved"
owner: "Backend Team Lead"
last_updated: "2026-07-21"
visibility: "internal"
---

# Level Up — Documentation

The single entry point for all Level Up documentation. Product, engineering, and
architectural knowledge live here, at the root of the **monorepo** (`level-up`) — the
frontend (`apps/web`) and backend (`apps/api`) apps both read from this one tree rather
than keeping their own copies. New here? This page is the map; the reasoning behind the
shape is in [`process/DOCUMENTATION_ARCHITECTURE.md`](process/DOCUMENTATION_ARCHITECTURE.md).

## Start here by role

| You are a… | Start with |
|---|---|
| **Backend** engineer | [`engineering/backend/`](engineering/backend/) · [`engineering/architecture/`](engineering/architecture/) · then the feature in [`product/`](product/) |
| **Frontend** engineer | the feature's `ux-flow` in [`product/`](product/) · [`engineering/frontend/`](engineering/frontend/) |
| **Mobile** engineer | [`product/`](product/) (specs are platform-independent) · `engineering/mobile/` *(planned)* |
| **AI** engineer | [`product/ai-chat/`](product/ai-chat/) · [`product/interview/`](product/interview/) · [`decisions/`](decisions/) |
| **Anyone** | this page, then [`decisions/`](decisions/) for *why* things are the way they are |

## The map

| Folder | Holds | Answers |
|---|---|---|
| [`product/`](product/) | Full-stack, platform-independent feature specs | **What & why** we build |
| [`engineering/`](engineering/) | Stack & cross-cutting technical docs | **How** it's built |
| [`decisions/`](decisions/) | Architecture Decision Records (ADRs) | **Why** we chose it |
| [`standards/`](standards/) | How we write docs + reusable templates | How to **write** a doc |
| [`process/`](process/) | Documentation architecture, lifecycle, Definition of Done | How we **ship** |

### What exists today

```
docs/
  README.md                      ← you are here
  process/
    DOCUMENTATION_ARCHITECTURE.md ← the philosophy, principles & rules
  standards/
    naming-conventions.md
    templates/                    ← PRD · tech-design · roadmap · ADR · STATUS · UX · feature-README
  product/
    interview/                    ← full spec (README + STATUS + 001–016)
    ai-chat/                      ← streaming migration (README + STATUS + 001–014)
    notifications/                ← feed + engagement plan
    content/                      ← course content & audio pipeline
    dictionary/                   ← Interview Dictionary (from frontend)
    profile/                      ← Profile screen (from frontend)
  engineering/
    architecture/                 ← system shape: modules, layering, dependency rules
    backend/                      ← Go/Gin/GORM engineering hub
    frontend/                     ← React/Vite engineering hub (from frontend)
    security/                     ← auth, JWT, CORS (+ frontend-auth)
    caching/                      ← content caching (ETag + version) (+ frontend-caching)
    deployment/                   ← AWS App Runner + RDS
  standards/
    harness-framework.md          ← AI harness interface spec
  decisions/
    0001 … 0005                   ← backend ADRs (0001 deprecated → 0006)
    0006 … 0008                   ← platform ADRs (repo arch · contracts · AI workspace)
    architecture-review.md · documentation-migration-map.md · archive/
```

Folders are created **when their first real content lands** — never empty, to
satisfy symmetry (see principle P5). The frontend docs (`dictionary`, `profile`,
`engineering/frontend`) consolidated here from the frontend during the monorepo
migration; the app-specific redesign handoff lives with the app at
`apps/web/docs/redesign/`. Still planned: `engineering/{mobile,data,observability}`
and `product/learning`.

## Finding & adding documentation

- **Find** a feature's behavior → `product/<feature>/`; a stack convention →
  `engineering/<area>/`; why a choice was made → `decisions/`.
- **Add** a module → follow §9 of
  [`process/DOCUMENTATION_ARCHITECTURE.md`](process/DOCUMENTATION_ARCHITECTURE.md)
  (classify → decide depth → **write docs before building** → implement → keep
  updated) and copy the matching [`standards/templates/`](standards/templates/).
- **Depth** follows complexity, risk, and business impact — not module size (P4).
- **Language** is English; **naming** is in [`standards/naming-conventions.md`](standards/naming-conventions.md).

## Document status legend

`Draft` → being written · `Review` → under review · `Approved` → current source of
truth · `Deprecated` → superseded (links to its replacement) · `Archived` → kept for
history. Every document carries a header with its status, owner, and last-updated date.

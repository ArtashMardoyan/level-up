# ADR-0006 — Repository & Engineering Platform Architecture for Level Up

> Renumbered from the pre-monorepo draft "ADR-0001" to **ADR-0006** on migration into the monorepo
> `docs/decisions/` (the existing backend ADRs 0001–0005 keep their numbers).

- **Status:** Proposed (design-only — nothing implemented)
- **Date:** 2026-07-22
- **Revision:** 3 — **the backend stays Go.** All NestJS/TypeScript-migration content from
  Rev 1–2 is removed. The platform is a **polyglot monorepo**; API contracts are shared via
  **OpenAPI code generation**, not shared TypeScript packages. See §21 for the change log.
- **Deciders:** Level Up engineering (owner: Artash)
- **Horizon:** 5+ years / full ecosystem, optimized for an **all-private** end state
- **Supersedes:** the current two-repo split (`level-up`, `level-up-backend`)

---

## 1. Context

Level Up is a pre-production, actively developed product. Today it is two repositories:

- `level-up` — React + Vite SPA (currently JavaScript; **public**, deployed to GitHub Pages)
- `level-up-backend` — **Go + Gin + GORM + Goose** REST API (private, App Runner + RDS)

The vision is an ecosystem: web app, backend API, mobile app, dashboard, admin portal,
landing site, docs site, AI services, internal tools — with **many shared libraries** on the
TypeScript side. Claude Code is a first-class engineering tool; the AI workspace is part of
the platform. We are at the cheapest possible moment to set the foundation.

**Repository visibility.** The frontend is public **temporarily** (early-stage showcase +
imminent Vercel deploy); the platform is expected to go **fully private** as it matures.
Visibility does not affect the monorepo structure — the same layout serves public and private.

### 1.1 Final architectural decisions (the constraints this ADR is built on)

1. **The backend is Go and stays Go.** Gin + GORM + PostgreSQL + Goose. **No migration to
   NestJS/TypeScript is recommended or planned.** Any future backend discussion assumes Go.
   *(This reverses the exploratory NestJS target of Rev 1–2, per an explicit owner decision.)*
2. **The platform is a polyglot monorepo.** One repository holds a **TypeScript workspace**
   (frontend apps + shared packages, under pnpm + Turborepo) and a **Go service** (`apps/api`,
   its own toolchain). They are peers in the same repo, not one graph.
3. **OpenAPI is the single source of truth for API contracts.** Go and TypeScript do **not**
   share code via `workspace:*`. They share only the **generated contract**: one OpenAPI spec
   generates TS types/client and Go server types.
4. **End state is a single private Turborepo monorepo.** The temporary public phase is a
   disposable bridge, engineered around as little as possible.

---

## 2. Decision drivers

| # | Driver | Weight |
|---|--------|--------|
| D1 | Keep the working **Go** backend; zero rewrite risk | Must |
| D2 | **Ship the frontend to Vercel** soon with minimal change | Must (now) |
| D3 | Frictionless **code sharing on the TS side** across many apps over 5 years | High |
| D4 | A **safe, versioned API contract** shared between Go and TS | High |
| D5 | **AI-native**: one coherent CLAUDE.md / harness / knowledge surface | High |
| D6 | **Atomic cross-cutting changes** within a stack, one repo for the whole platform | High |
| D7 | Production-grade **CI/CD** with preview envs, releases, rollback | High |
| D8 | **Minimal complexity now**; evolve only on real need | High (now) |

---

## 3. Options considered

- **Option A — Modern monorepo** (one repo: TS workspace via Turborepo + pnpm, Go as a
  toolchain island; contracts via OpenAPI codegen).
- **Option B — Multiple repositories** (polyrepo: one repo per app + shared-lib repos).
- **Chosen shape — Option A as the *target*, reached via a minimal 2-repo *bridge*** (§5).

---

## 4. Option A vs Option B — comparison (5-year, all-private end state)

| Dimension | A — Monorepo | B — Multi-repo |
|---|---|---|
| **Scalability** | ✅ Turborepo task graph + cache for TS; Go builds via its own toolchain, orchestrated by one CI | ⚠️ Coordination cost grows super-linearly (N repos × M pipelines) |
| **Maintainability** | ✅ One lint/tsconfig/CI convention for TS; one place for Go tooling | ❌ Version drift; N CI configs to sync |
| **Developer experience** | ✅ One clone, one `pnpm i`; Go + web + contracts in one working tree | ❌ Multi-repo checkout; regenerate-and-publish loop to test a contract change |
| **CI/CD** | ✅ Single pipeline; `--filter` for affected TS, `go test`/`make` for the Go module | ⚠️ Simpler per-repo but no global view |
| **AI workflows** | ✅ One `.ai/` surface spanning Go + TS (current P1 pain was exactly cross-repo `.ai/`) | ❌ `.ai/` duplicated/subtree'd per repo |
| **Claude Code** | ✅ Full context: an API change edits the OpenAPI spec + Go handler + TS client in one tree | ⚠️ Cross-repo change is multi-session |
| **Code sharing (TS)** | ✅ `workspace:*` — instant, unversioned, atomic | ❌ Registry + semver dance for every shared line |
| **Contract sharing (Go↔TS)** | ✅ One OpenAPI spec in-repo → regenerate both sides atomically in one PR | ❌ Spec lives in one repo, consumers lag; drift risk |
| **Deployment** | ✅ Independent per-app deploys via filters/triggers | ✅ Naturally independent |
| **GitHub visibility** | ✅ Trivial once private — one repo, one setting | ✅ Per-repo (only matters while mixed public/private) |
| **Security** | ⚠️ One blast radius → CODEOWNERS + path guards + env-scoped secrets | ✅ Hard repo boundary |
| **Long-term maintenance** | ✅ One place to upgrade tooling/deps/standards | ❌ Upgrade fatigue × N repos |

**Reading.** Option A wins everything that compounds over 5 years. The polyglot nature does
**not** weaken the monorepo case — the Go service simply lives as a toolchain island, and the
in-repo OpenAPI spec makes contract changes *more* atomic than any multi-repo setup. Option B's
only real wins (visibility, blast radius) vanish or shrink in an all-private end state.

---

## 5. Decision

> **Target state:** a single **PRIVATE** Turborepo + pnpm **polyglot monorepo** (`level-up`):
> a TypeScript workspace (frontend apps + shared packages) **plus** the Go backend (`apps/api`)
> as its own toolchain island, with **OpenAPI code generation** as the contract bridge.
>
> **Bridge (now):** keep the current **two repos essentially as they are** — deploy the
> frontend to **Vercel**, add no new machinery — and **converge into the monorepo** when the
> product goes private.

Rationale: the Go decision removes the only large risk that Rev 1–2 carried (a backend
rewrite). The monorepo remains the right long-term structure — for one AI surface, one CI, one
place to maintain standards, atomic within-stack change, and (crucially) an **in-repo OpenAPI
contract** that keeps Go and TS in lockstep. This honors D1 (no rewrite), D2 (ship now), and
D8 (minimal complexity now).

**What we explicitly do NOT do:**
- ❌ No backend migration to NestJS/TypeScript.
- ❌ No attempt to consume `packages/*` from the Go service.
- ❌ No public mirror / public npm publishing / permanent public-private code boundary
  (dropped in Rev 2; the public phase is a disposable bridge).

### 6. Alternatives rejected

- **Rewrite backend to NestJS to unify the language** (Rev 1–2 target). Rejected by explicit
  decision: the Go backend works, is deployed, and a rewrite is pure risk. Polyglot + OpenAPI
  gives 90% of the cross-stack benefit (type-safe contracts) at ~0% of the rewrite cost.
- **Single monorepo *now*.** Premature — forces privatization before the product is ready.
- **Pure polyrepo as the end state.** Loses D3/D5/D6; the P1 pain of sharing `.ai/` across
  repos is direct evidence against it.

---

## 7. Deliverable 1 — Repository strategy

**Now (bridge):** `level-up` (public, → Vercel) + `level-up-backend` (Go, private). Unchanged.

**Target (on privatization):** one private repo `level-up` — the polyglot monorepo. Convergence
is a *merge + visibility flip* (history preserved), not a rewrite (§16). The existing `level-up`
frontend repo evolves into this monorepo (frontend → `apps/web`), so no new repository is created.

---

## 8. Deliverable 2 — Folder structure (target `level-up` monorepo)

```
level-up/
├── apps/
│   ├── web/                 # React + Vite + TS + Tailwind (pnpm workspace)
│   ├── api/                 # Go + Gin + GORM + Goose  ← toolchain island (NOT in pnpm graph)
│   │   ├── cmd/  internal/{modules,shared,infrastructure,config}
│   │   ├── migrations/      # goose
│   │   ├── Makefile  go.mod  go.sum
│   ├── ai-services/         # AI orchestration (Go service or separate) — LLM, SSE streaming
│   ├── admin/ dashboard/    # TS apps (pnpm workspace)
│   ├── landing/ docs/       # TS apps (Astro/Next; docs site built from Markdown)
│   └── mobile/              # Expo / React Native (later)
├── packages/                # TypeScript-only shared libraries (workspace:*)
│   ├── contracts/           # OpenAPI spec (source of truth) + generated TS types
│   │   └── openapi/         # ← canonical API spec (spec-first)
│   ├── api-client/          # typed TS client generated from OpenAPI
│   ├── ui/                  # design system (React + tokens + Tailwind preset)
│   ├── config/              # tsconfig / eslint / prettier / tailwind presets
│   └── utils/               # framework-agnostic TS helpers
├── .ai/                     # AI workspace (Deliverable 4) — UNCHANGED by this revision
├── docs/                    # product / engineering / decisions(ADRs) / standards / process
├── tooling/                 # shared TS tooling (eslint-config, tsconfig, scripts)
├── .github/                 # workflows, CODEOWNERS, templates
├── .changeset/              # versioning + changelog (TS packages)
├── turbo.json  pnpm-workspace.yaml  package.json  tsconfig.base.json  .nvmrc
└── CLAUDE.md                # root AI router (polyglot-aware)
```

**Two toolchains, one repo:** pnpm + Turborepo govern everything under `packages/*` and the TS
`apps/*`; `apps/api` is built/tested/linted/migrated by Go's own tools (Makefile, `go test`,
golangci-lint, goose). CI orchestrates both; Turbo may wrap the Go tasks for a unified graph,
but the Go build itself is `go build`/`make`.

---

## 9. Deliverable 3 — Package & contract-sharing model (the polyglot core)

- **TS manager:** pnpm workspaces; **orchestrator:** Turborepo (task graph, cache, `--filter`).
- **TS internal refs:** `"@level-up/ui": "workspace:*"` — no publish step (npm scope aligned to the
  canonical name; scope is technically independent of the repo name and revisable at scaffold time).
- **TS versioning:** Changesets → semver + changelog + tags (internal; no public registry
  needed while private).
- **Go:** standard modules; `apps/api` has its own `go.mod`, is **not** a pnpm package, and
  does **not** import `packages/*`.
- **The contract bridge (OpenAPI, spec-first):**
  1. The canonical **OpenAPI spec** lives in `packages/contracts/openapi/` and is the contract
     of record. **API changes start here.**
  2. Generate **TypeScript**: types into `packages/contracts`, a typed client into
     `packages/api-client` (e.g. `openapi-typescript` / `orval`).
  3. Generate **Go**: server request/response types / interfaces for `apps/api` where
     appropriate (e.g. `oapi-codegen`); Gin handlers implement the generated interfaces.
  4. A `contracts:generate` task regenerates both; CI fails if generated output is stale
     (drift guard). One PR changes spec + both generated sides + both implementations.

This preserves "one source of truth for the API" — the original goal of the Rev 1–2 shared-TS
approach — **without** a Go rewrite and without pretending Go can consume npm packages.

---

## 10. Deliverable 4 — AI workspace architecture (UNCHANGED)

Rooted at `.ai/` in the monorepo; the P1 `level-up-ai` conventions repo survives as the
`.ai/shared` subtree. Structure is unchanged from the prior revision:

```
.ai/
├── config.yml      # monorepo map: apps (TS + Go), packages, stack-specific commands
├── harnesses/      # feature, bug-fix, refactoring, backend-api(Go), frontend-ui(TS),
│                   #   package(TS), migration(goose), documentation, code-review, release
├── agents/         # Planner, Architect, Backend(Go), Frontend(TS), Reviewer, Testing,
│                   #   Security, Performance, Docs → Claude Code subagents
├── workflows/  prompts/  checklists/  templates/  reviews/  hooks/  mcp/
├── knowledge/      # domain-glossary + per-app + per-package packs
└── shared/         # git subtree of level-up-ai
```

The only polyglot-specific detail: **harness `validate:` commands are stack-specific** — Go
harnesses run `go test ./...` / `golangci-lint run` / goose; TS harnesses run
`turbo run lint test build --filter=…`. Everything else (context engineering, agent
orchestration, hooks, MCP reservation) is as previously designed.

---

## 11. Deliverable 5 — Documentation architecture (unchanged)

`docs/` is the source of truth: `product/`, `engineering/`, `decisions/` (ADRs — this is
ADR-0001), `standards/`, `process/`. App-specific docs live with the app. `apps/docs` builds
the published site from Markdown. **Docs + code change in the same PR; docs-first.** The
**OpenAPI spec** is itself a first-class doc artifact and must stay in sync with the API.

---

## 12. Deliverable 6 — CI/CD architecture (GitHub Actions + Turborepo, polyglot)

**Now (bridge, `level-up` public):** Vercel Git integration provides preview + production
deploys for free; keep the existing lint gate. Backend CI in `level-up-backend` stays as-is.

**Target (monorepo) PR pipeline** — stack-aware, affected-only:
```
setup (pnpm + turbo remote cache; Go toolchain)
 ├─ TS:  turbo run lint typecheck test build --filter=...[origin/main]
 ├─ Go:  gofmt check · golangci-lint run · go test ./... · go build   (path-filtered to apps/api)
 ├─ contract drift guard: contracts:generate → fail if git diff not clean
 ├─ security: CodeQL (JS+Go) · secret scan · pnpm audit · govulncheck
 └─ preview deploy per affected app → sticky PR comment with URLs
```
- **Preview envs:** web/landing/docs → Vercel; api → per-PR ephemeral App Runner (short-lived
  image + scratch DB schema), torn down on close.
- **Merge → main:** build affected → publish images (ECR for `api`) → auto-deploy **staging** →
  Changesets version/tag/changelog for TS packages.
- **Release & versioning:** Conventional Commits + Changesets → semver, automated CHANGELOG,
  release tags; production deploy gated on a GitHub Release + manual approval (protected env).
- **Rollback:** immutable image tags (re-point service, no rebuild) for `api`; Vercel instant
  rollback for web; **goose expand→contract** so the prior API version always boots on the new
  schema; feature flags for risky behavior; previous good tag recorded in `.ai/reviews/`.

---

## 13. Deliverable 7 — Deployment strategy

| Surface | Target | Notes |
|---|---|---|
| Web app | **Vercel** (now, from `level-up`) | Replaces GitHub Pages; free preview envs |
| Landing / Docs | Vercel | Later, in the monorepo |
| API (Go) | AWS App Runner → RDS Postgres (us-east-2, existing) | goose expand→contract migrations |
| AI services | App Runner or Lambda | SSE streaming; scales independently |
| Dashboard / Admin | Vercel (private project) or CloudFront behind auth | Private |
| Mobile | Expo EAS | OTA updates; gated store releases |

Each surface deploys independently via Turbo `--filter` (TS) or path/tag triggers (Go).

---

## 14. Deliverable 8 — GitHub strategy

**Now:** on `level-up` — branch protection on `master`, required lint check, ≥1 review, connect
Vercel; keep secrets out of the repo (Vercel env vars).

**Target (monorepo):** branch protection (required TS checks + Go checks + contract-drift +
security, ≥1 review, 2 for `packages/*` and `apps/api`, linear history, signed commits);
**CODEOWNERS** per path (Go owners on `apps/api`, TS owners on `packages/*`); **environments**
`preview`/`staging`/`production` (production = manual approval + scoped secrets);
Conventional-Commit PR titles; **Changesets** required for TS package changes; **Renovate**
(one config, covers npm + Go modules); internal `@level-up/*` via GitHub Packages (private).

---

## 15. Deliverable 9 — Development workflow (target)

1. `git clone level-up && pnpm install` (TS); Go builds via `apps/api` Makefile.
2. Branch off `main`; for non-trivial work, Planner agent + a harness from `.ai/`.
3. **API change?** Edit `packages/contracts/openapi/` → `contracts:generate` → implement Go
   handler + TS client. **UI/lib change?** `turbo run dev --filter=<app>...`.
4. Pre-commit hook runs stack-specific checks on affected code (TS via turbo, Go via make).
5. PR → CI runs affected TS + Go checks + contract-drift + preview envs; Reviewer/Security
   agents comment.
6. Add a changeset if a TS package changed; merge on green + approval.
7. Merge → staging auto-deploy. Cut a release tag → production (manual gate).

---

## 16. Deliverable 10 — Migration plan (current → target)

Incremental, reversible, no big-bang. **No backend rewrite** — the Go service moves in as-is.

- **Phase 0 — Ship now (days).** Deploy `level-up` to **Vercel** (repo stays public), point
  `VITE_API_URL` at the App Runner API. No restructuring.
- **Phase 1 — Decide.** Ratify: polyglot monorepo target + the privatization trigger
  (what "mature enough" means).
- **Phase 2 — Go private + scaffold the monorepo shell.** Flip `level-up` to private (or create
  private `level-up`). Stand up pnpm + Turborepo, `packages/config`, root `CLAUDE.md`, `.ai/`
  (subtree the existing `level-up-ai` — P1 carries over verbatim).
- **Phase 3 — Absorb both apps (history preserved).** Import the web app as `apps/web` and the
  Go backend as `apps/api` via `git subtree`/`git filter-repo`. The Go service keeps its
  Makefile/go.mod/goose untouched.
- **Phase 4 — TS hardening.** Migrate `apps/web` JS→TS incrementally; introduce Tailwind;
  extract `packages/ui`, `packages/config`, `packages/utils`.
- **Phase 5 — Contract-first bridge.** Author the canonical **OpenAPI spec** in
  `packages/contracts/openapi/` describing the current Go API; wire `contracts:generate` to emit
  TS types + `api-client` and Go server types; migrate `apps/web` onto the generated client;
  add the CI drift guard.
- **Phase 6 — CI/CD hardening + grow the ecosystem.** Turbo remote cache, stack-aware pipelines,
  Changesets, environments, rollback runbooks; then add `landing`, `docs`, `dashboard`,
  `admin`, `ai-services`, `mobile` as folders, not repos.

---

## 17. Risks, tradeoffs & mitigations

| ID | Risk / tradeoff | Severity | Mitigation |
|----|-----------------|----------|------------|
| R1 | **Polyglot tooling overhead** (two toolchains, two CI paths) | Med | Stack-scoped harnesses + one CI that fans out; Turbo wraps Go tasks for a unified graph; `.ai/` templates. |
| R2 | **OpenAPI drift** between spec, Go, and TS | Med | Spec-first is mandatory; CI **drift guard** fails if regenerated output differs; API changes must start from the spec. |
| R3 | **Backend/secret leak into the public repo** during the bridge | Med | The Go backend stays in its **own private repo** until privatization; nothing private enters `level-up` while public; secrets in Vercel env. |
| R4 | **Privatization keeps slipping**, prolonging the bridge | Low | Define the trigger in Phase 1; the bridge is just today's 2-repo state + Vercel — safe indefinitely. |
| R5 | **Monorepo blast radius** (future) | Med | CODEOWNERS + path-scoped reviews; env-scoped secrets; boundaries lint (TS). |
| R6 | **History loss** when merging repos | Low | `git subtree`/`filter-repo` in Phase 3. |
| R7 | **Lock-in** (Turborepo/Vercel) | Low | pnpm + plain tasks portable; remote cache self-hostable on S3; Go is fully portable; deploys movable to CloudFront/ECS. |

**Note:** the single largest risk of prior revisions — a NestJS backend rewrite — **is gone**.

---

## 18. Consequences

- **Positive:** zero backend rewrite; the Go service is preserved intact; the monorepo gives one
  AI surface, one CI, one place for standards, atomic within-stack change, and an **in-repo
  OpenAPI contract** that keeps Go and TS type-safe and in lockstep; P1 AI-workspace work reused;
  ships to Vercel now with minimal effort.
- **Negative:** two toolchains to run (polyglot CI); OpenAPI spec-first discipline required
  (mitigated by the CI drift guard); monorepo benefits arrive at privatization, not before.
- **Optionality preserved:** the `.ai/` architecture is unchanged and portable; the OpenAPI
  contract makes adding more clients (mobile, internal tools) cheap.

---

## 19. Why this architecture for the next 5+ years

1. **It matches reality, not fashion.** Go is a proven fit for the API and already in
   production-shaped deployment; forcing language uniformity via a rewrite would trade working
   software for risk. Polyglot-by-design is the honest long-term choice.
2. **The contract, not the language, is what must be shared** — and OpenAPI shares it better
   than a same-language package would across process boundaries: versioned, language-neutral,
   and consumable by *any* future client (web, mobile, internal tools, third parties).
3. **One repository compounds.** As the ecosystem grows to many TS apps, a single Turborepo +
   pnpm workspace keeps sharing, tooling upgrades, and standards in one place; the Go island
   sits comfortably alongside without polluting the TS graph.
4. **AI-native leverage.** A single `.ai/` surface lets Claude Code reason across the whole
   platform — an API change spans the OpenAPI spec, the Go handler, and the TS client in one
   working tree, executed through one harness with stack-specific validation.
5. **Reversible and incremental.** Every phase ships value and is abortable; privatization is a
   natural checkpoint, not a disruption; no step bets the product on a rewrite.

---

## 20. Final recommendation (one line)

**Keep the Go backend, ship the frontend to Vercel now, and converge — at privatization —
into a single private Turborepo polyglot monorepo where the TypeScript workspace and the Go
service coexist and share one OpenAPI-generated contract; optimize for the next five years, not
today's two repos.**

---

## 21. Change log

- **Rev 3 (this):** Backend fixed as **Go** by owner decision. Removed all NestJS/TypeScript
  backend-migration content. Replaced the "shared TypeScript contracts via workspace" rationale
  with a **polyglot + OpenAPI codegen** model (§1.1, §9, §12, §16, §19). Kept the single private
  Turborepo monorepo recommendation and the `.ai/` architecture **unchanged**. Reframed the
  5-year rationale around polyglot + contract-first.
- **Rev 2:** Made the public phase temporary; dropped the public mirror / public npm / permanent
  public-private boundary.
- **Rev 1:** Original — private monorepo + permanent public mirror + NestJS migration target.

*Design only. Nothing has been implemented. On ratification, Phase 0 (Vercel deploy) is first.*

# CLAUDE.md — Level Up (monorepo router)

This repository is the single source of truth for the Level Up platform. Your job is not merely to
generate code: understand the task, choose the right workflow, load only the context you need,
implement safely, validate with **stack-specific** checks, and keep documentation consistent.

This file is the **model-agnostic router** into the AI workspace. Per-app conventions live in
`apps/*/CLAUDE.md`.

---

## Technology stack (polyglot monorepo)

A TypeScript workspace and a Go service coexist in one repo, each with its own toolchain.

- **Frontend & shared libs (TypeScript/JS):** React + Vite in `apps/web` (pnpm + Turborepo).
  *(JSX today; TS/Tailwind adoption is later work.)*
- **Backend (Go):** Gin + GORM + PostgreSQL + Goose in `apps/api` — **stays Go**; its own toolchain
  (`go.mod` module `level-up-backend`, Makefile, goose), **not** a pnpm/Turborepo member.
  **Do NOT propose migrating the backend to NestJS/TypeScript.**
- **API contract (target):** OpenAPI is the single source of truth; Go server types and the TS client
  are generated from one spec (see `docs/decisions/0007-openapi-contract-workflow.md`). Go and TS
  **never share runtime code** — only the generated contract.

---

## AI workflow (every task)

1. Understand the request.
2. Select the correct harness (`.ai/harnesses/`).
3. Load only the required knowledge (`.ai/knowledge/` + `docs/`).
4. Choose the needed agent role(s).
5. Implement.
6. Run **stack-specific** validation.
7. Update documentation if needed.

Never skip validation. Never claim success without it.

## Harness selection (`.ai/harnesses/`)
- Backend endpoint (Go) → `backend-api` · Frontend UI (TS) → `frontend-ui` · Bug fix → `bug-fix`.
- The harness **interface** is `docs/standards/harness-framework.md`.
- ⚠️ The current harnesses are **legacy / pre-framework** (P1 pilot) — bring them to framework
  conformance before running them as governed harnesses.

## Knowledge loading (keep context small)
Never load the whole repo. Priority: (1) relevant ADR in `docs/decisions/` → (2) engineering docs in
`docs/engineering/` → (3) knowledge pack in `.ai/knowledge/` → (4) target app (`apps/web` | `apps/api`)
→ (5) the one sibling file you're changing. Prefer pointers over pasted content.

## Agents
Planner · Architect · Backend (Go) · Frontend (TS) · Reviewer · Testing · Documentation · Security ·
Performance. Use only what the task needs; advisory roles produce findings, they don't edit.

---

## Validation — STACK-SPECIFIC

Implementation isn't done until the checks for the touched stack pass. "green is executed, not claimed."

- **Go (`apps/api`):** `make fmt` · `make lint` (golangci-lint) · `make test` (`go test ./...`) ·
  `make build`; goose up/down on a scratch DB for migrations.
- **TypeScript (`apps/web`):** `pnpm --filter ./apps/web lint` · `… build`; verify behavior via the
  DOM in the running app (no test runner yet).
- **Contract change:** regenerate from OpenAPI and confirm both generated sides compile.

## Documentation
`docs/` is the source of truth (`product/ engineering/ decisions/ standards/ process/`). When
behavior or architecture changes: update the relevant docs (and an ADR if a decision was made) in the
same change. Docs-first; on conflict, fix the docs.

## Repository rules
- `apps/` deployable apps (TS apps + the Go `api`); `packages/` reusable TS libs (as they appear);
  `.ai/` the AI workspace; `docs/` the source of truth.
- TS apps/packages form a pnpm + Turborepo workspace: dependencies flow **apps → packages**.
- **`apps/api` (Go) is a toolchain island — it does NOT consume `packages/*`.** Go and TS share only
  the OpenAPI-generated contract, never `workspace:*`.
- Avoid circular dependencies.

## Git
**Never commit or push without explicit instruction.** Not after a fix, not after validation passes.
Note: a push to `master` auto-deploys `apps/web` to GitHub Pages.

## Mission
Evolve Level Up as a high-quality, maintainable platform. Optimize for correctness, maintainability,
consistency, and long-term scalability — not merely for producing code quickly. Prefer simple over
clever; reuse before creating; explain trade-offs when they matter.

> Architecture is frozen as v1 (ADR-0006/0007/0008 + the Harness Framework). Architecture now follows
> implementation: propose changes only when real work exposes a real problem, backed by evidence.

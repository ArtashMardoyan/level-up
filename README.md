# Level Up

A polyglot monorepo: a TypeScript workspace (pnpm + Turborepo) and a Go service, in one repo.
The only external dependencies are **services** (GitHub, AWS/RDS/S3, OpenAI) provided via environment
variables — no second repository is needed to contribute.

```
apps/
  web/    React + Vite frontend        → GitHub Pages (/level-up/)
  api/    Go + Gin + GORM + Goose API   → AWS App Runner + RDS Postgres
packages/
  config/ shared ESLint/Prettier preset (@level-up/config, workspace:*)
docs/     product · engineering · decisions (ADRs) · standards · process
.ai/      AI workspace (harnesses · checklists · knowledge)   — see CLAUDE.md
```

## Prerequisites
- **Node** (see `.nvmrc`) + **pnpm** ≥ 9 — TypeScript workspace (`apps/web`, `packages/*`).
- **Go** 1.26 + **Docker** — the Go service (`apps/api`) and its local Postgres.

## Bootstrap (clone → env → run)

```bash
# 1. clone
git clone git@github.com:ArtashMardoyan/level-up.git && cd level-up

# 2. install the TypeScript workspace (root)
pnpm install

# 3. environment — copy the examples and fill in values (no secrets are committed)
cp apps/web/.env.example apps/web/.env      # VITE_API_URL, VITE_S3_BUCKET_URL, feature flags
cp apps/api/.env.example apps/api/.env      # JWT_SECRET, DB_*, S3_*, OPENAI_API_KEY
```

### Run the backend (`apps/api`) — Go + Postgres
```bash
cd apps/api
make docker-up        # builds the api image + starts Postgres (goose migrations run on boot)
#   → API on http://localhost:3000  (GET /ping, /ready)
# or run the server against your own Postgres:  make run
```

### Run the frontend (`apps/web`) — Vite
```bash
pnpm --filter ./apps/web dev      # Vite dev server; point VITE_API_URL at the api
```

## Common commands
| | Frontend (`apps/web`, TS) | Backend (`apps/api`, Go) |
|---|---|---|
| dev | `pnpm --filter ./apps/web dev` | `cd apps/api && make run` |
| build | `pnpm --filter ./apps/web build` | `cd apps/api && make build` |
| lint | `pnpm --filter ./apps/web lint` | `cd apps/api && make lint` |
| test | (DOM-verified; no runner yet) | `cd apps/api && make test` |

> `apps/api` (Go) is its own toolchain island — **not** a pnpm/Turborepo member; internal TS packages
> are consumed via `workspace:*` (no registry). Go and TS share only the API contract.

## More
- **AI workspace & conventions:** [`CLAUDE.md`](CLAUDE.md) (router) + [`.ai/`](.ai/).
- **Docs (source of truth):** [`docs/`](docs/) — architecture decisions in
  [`docs/decisions/`](docs/decisions/).
- **App-specific:** [`apps/web/README.md`](apps/web/README.md), [`apps/api/README.md`](apps/api/README.md).

> **Never commit or push without explicit instruction.** A push to `master` auto-deploys `apps/web`
> to GitHub Pages.

# level-up-backend

REST API backend for the **Level Up** project. Go 1.26 · Gin · GORM · PostgreSQL.

Same architecture and conventions as `go-first-api`: feature modules under
`internal/modules/`, a thin `cmd/server` that only wires things together, and a
`shared` package for response/pagination helpers.

## Requirements

- Go 1.26+
- Docker (for local Postgres via docker-compose)
- `golangci-lint` v2 (for linting)

## Getting started

```bash
cp .env.example .env        # adjust if needed

# Option A — everything in Docker (api + postgres):
make docker-up              # http://localhost:3000

# Option B — run the API locally against the compose Postgres:
docker compose up db -d
make run                    # go run ./cmd/server
```

Check it is alive:

```bash
curl localhost:3000/ping    # {"data":"pong"}   liveness
curl localhost:3000/ready   # {"data":"ready"}  readiness (pings the DB)
```

## API

Response envelope: success → `{ "data": ... }`, error → `{ "error": "..." }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ping` | — | liveness |
| GET | `/ready` | — | readiness (pings DB) |
| POST | `/users` | — | register a user |
| POST | `/auth/login` | — | log in, returns `accessToken` + user |
| GET | `/auth/me` | Bearer | current user |
| POST | `/auth/logout` | Bearer | revoke the current token (server-side denylist) |
| GET | `/users` | Bearer | list users (paginated: `?page=&limit=`) |
| GET | `/users/:id` | Bearer | get user by id |
| PATCH | `/users` | Bearer | update the caller |
| DELETE | `/users` | Bearer | delete the caller |

Auth is a JWT (`Authorization: Bearer <token>`), 24h TTL. `logout` stores the
token's `jti` in `revoked_tokens` until it expires, so the middleware rejects it
immediately — a real server-side logout, not just client-side token disposal.

## Commands

```bash
make run          # start the server (needs a reachable Postgres)
make build        # compile to ./bin/server
make test         # go test ./...
make lint         # golangci-lint run
make fmt          # golangci-lint fmt (gofumpt + goimports)
make tidy         # go mod tidy
make docker-up    # build + start api and postgres
make docker-down  # stop local containers
make deploy       # build -> ECR -> App Runner redeploy
```

## Project structure

```
cmd/server/main.go            wiring only: load config, run migrations, start server
internal/
  config/config.go            all env vars in one place (config.Load())
  infrastructure/
    database/db.go            Connect(*config.DBConfig) (*gorm.DB, error)
    middleware/auth.go        JWT middleware: verify token, check denylist, load user
  modules/                    feature modules — new features go here
    health/                   /ping (liveness) and /ready (DB readiness)
    user/                     entity, dto, status, repository (+gorm), service, handler
    auth/                     login / logout / me; JWT + revoked-token denylist
  shared/                     response helpers, pagination, context keys, gorm Base
migrations/                   goose SQL migrations, applied automatically on startup
```

## Adding a feature module

Mirror the `go-first-api` pattern — create `internal/modules/<name>/` with
`entity.go`, `dto.go`, `repository.go` (interface), `repository_gorm.go`,
`service.go`, `handler.go`, then in `cmd/server/main.go`:

1. connect GORM (already available as `db`)
2. wire `repo -> service -> handler`
3. call `handler.RegisterRoutes(r, ...)`
4. add a migration under `migrations/`

Auth/JWT is not wired yet — it lands with the first protected module, following
the `go-first-api` `internal/modules/auth` + `infrastructure/middleware` pattern.

## API documentation (Postman)

`postman/` holds the importable collection and environments:

- `level-up-backend.postman_collection.json` — requests grouped by module (Auth, Health, Users). Collection-level Bearer `{{accessToken}}`; public routes set `noauth`. The chain **Create User → Login → …→ Logout** populates env vars via test scripts.
- `level-up-backend.local.postman_environment.json` / `.prod.postman_environment.json` — `API_URL` + `accessToken` / `userId` / `userEmail` / `userName`.

Import the collection once in Postman, then push updates with:

```bash
POSTMAN_API_KEY=PMAK-... POSTMAN_COLLECTION_UID=<uid> ./scripts/sync-postman.sh
```

Both values are also read from `.env`. Keep the collection current whenever routes change.

## Deployment

Container image → **AWS ECR** → **App Runner**, talking to **RDS PostgreSQL**.
goose migrations run automatically on container start. See
[`docs/deployment/overview.md`](docs/deployment/overview.md).

```bash
aws sso login --profile vyb-dev
make deploy
```

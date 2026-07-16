# level-up-backend

Gin + GORM + PostgreSQL REST API for the Level Up project. Go 1.26.
Architecture and conventions mirror the sibling project `go-first-api`.

## Critical workflow rules

**NEVER commit or push without explicit user instruction.** Wait for the user to say "commit" or "commit and push" before running any `git commit` or `git push`. No exceptions.

**Large tasks require a plan first.** For any new feature, refactor, or cross-cutting change: describe the approach and list files to change, then wait for approval before writing code.

**Run `golangci-lint run` before finishing a change** and fix what it reports (`golangci-lint fmt` handles formatting).

**Keep the Postman collection in sync.** Whenever you add, remove, or change a route (method, path, body, or query params), update `postman/level-up-backend.postman_collection.json` in the same change. Folders are ordered alphabetically (Auth, Health, Users); requests within a folder by method GET → POST → PATCH → DELETE.

## Commands

```bash
make run          # go run ./cmd/server (needs a reachable Postgres)
make build        # compile to ./bin/server
make test         # go test ./...
make lint         # golangci-lint run
make fmt          # golangci-lint fmt (gofumpt + goimports)
make docker-up    # build + start api and postgres via docker-compose
make deploy       # ./scripts/deploy.sh — build -> ECR -> App Runner
```

## Architecture

```
cmd/server/main.go           wiring only: load config, run migrations, start server
internal/
  config/config.go           all env vars in one place (config.Load())
  infrastructure/
    database/db.go           Connect(*config.DBConfig) (*gorm.DB, error)
    middleware/auth.go       JWT middleware: verify, check denylist, load user
  modules/                   feature modules; new features go here
    health/                  /ping (liveness), /ready (DB readiness)
    user/                    entity, dto, status, repository (+gorm), service, handler
    auth/                    login / logout / me; JWT + revoked-token denylist
  shared/                    response helpers, pagination, context keys, gorm Base
migrations/                  goose SQL migrations, applied on startup
```

## Auth

JWT bearer tokens (HS256, 24h TTL, `JWT_SECRET` required). `logout` is server-side:
the token's `jti` is stored in `revoked_tokens` (until expiry) and the middleware
rejects any revoked jti. The middleware sets `shared.ContextUserKey` (user.User),
`shared.ContextJTIKey`, and `shared.ContextExpiryKey` on the gin context.

## Adding a new module

1. Create `internal/modules/<name>/` with: `entity.go`, `dto.go`, `repository.go` (interface), `repository_gorm.go`, `service.go`, `handler.go`
2. Add a goose migration under `migrations/`
3. Wire repo → service → handler in `cmd/server/main.go`, then `handler.RegisterRoutes(r, jwtMiddleware)`

## Content & audio pipeline

Course content is bundled JSON in `internal/seed/data/` (`courses.json` + `<course>/{en,ru}.json`) — the single source of truth. `cmd/seed` loads it into the DB with deterministic UUIDv5 ids (same content → same ids in every env). Question `audio` is a single S3 object key; MP3s live in S3, not git.

Content read endpoints support version-based client caching (`GET /courses/version` + ETag/304 on `/courses/full`) — see `docs/content-caching.md`.

Node tooling in `scripts/` (built-in modules only — no `npm install`; reads `.env`):
- `validate-translations.mjs [course ...]` — check each `<course>/ru.json` against `en.json`.
- `generate-audio.mjs [--lang en,ru] [--force] [course ...]` — OpenAI TTS → MP3s in `audio/` (gitignored staging). Needs `OPENAI_API_KEY`.
- `upload-audio.mjs [course ...]` — sync `audio/` → S3 (`S3_BUCKET`/`S3_REGION`/`AWS_PROFILE`) and stamp keys into the seed JSON. Re-run `cmd/seed` afterward to load new keys.

## Code style

Separate logical steps inside functions with a blank line (validate → build → persist → return). `gofumpt` forbids blank lines at the start/end of a block but allows them in the middle.

## Key conventions

- **Errors**: sentinel vars (`var ErrNotFound = errors.New(...)`) in the owning package; compare with `errors.Is`, never `err.Error() == "..."`
- **Context**: thread `ctx context.Context` through repo and service methods
- **Response format**: always use `shared.OK` / `shared.Created` / `shared.NoContent` / `shared.Error`
- **Pagination**: bind `shared.PaginationQuery`, call `.Normalize()`, return `shared.PaginatedResult[T]`
- **Auth**: JWT user stored in `shared.ContextUserKey`; retrieve with two-value assertion `u, ok := val.(T)` — never one-value (panics)
- **Repository**: interface in `repository.go`, GORM impl (unexported struct) in `repository_gorm.go`
- **Config**: read `os.Getenv` only inside `config/config.go`; never store secrets in globals — pass via constructor
- **Imports**: 3 groups separated by blank lines — stdlib / external / internal (`level-up-backend/...`) — enforced by goimports

## Response format

```json
// success (200 / 201)
{ "data": {} }
// error (4xx / 5xx)
{ "error": "..." }
// paginated
{ "data": { "items": [], "meta": { "page": 1, "limit": 10, "total": 100 } } }
```

`shared.NoContent` returns 204 with an empty body (used by DELETE).

## Environment variables

```
JWT_SECRET   — required, server refuses to start without it
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
DB_SSLMODE   — "disable" locally, "require" on AWS RDS (default: disable)
```

## Deployment

Container → ECR → App Runner → RDS PostgreSQL (region us-east-2, AWS profile vyb-dev). goose migrations run on container start. See `docs/001-deploy-aws-apprunner-rds.md`. Deploy with `make deploy` after `aws sso login --profile vyb-dev`.

## Dependency direction

```
handler → service → repository interface → gorm repository → database
```

Services depend only on interfaces. No global variables. No circular dependencies.

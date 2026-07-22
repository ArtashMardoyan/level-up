# Knowledge Pack: Backend Architecture (level-up-backend)

Distilled context for agents. Load this + the one sibling module you're changing —
not the whole repo. Authoritative detail lives in `CLAUDE.md`; this is the map.

`last_verified: 2026-07-22`

## Shape
Modular monolith. Gin + GORM + Postgres, Go 1.26.

```
cmd/server/main.go        wiring only: load config, run goose migrations, start server
cmd/seed/main.go          load bundled course JSON into DB (deterministic UUIDv5 ids)
internal/
  config/config.go        all env vars (config.Load()) — the ONLY place os.Getenv is read
  infrastructure/
    database/             Connect(*config.DBConfig) -> *gorm.DB
    middleware/           JWT auth: verify, check revoked-jti denylist, load user into ctx
  modules/                one folder per feature (see below)
  shared/                 base.go (gorm Base), response.go, pagination.go, keys.go (ctx keys)
  seed/                   bundled course content JSON
migrations/               goose SQL, applied on startup
```

## Modules (the unit of feature work)
`auth · badge · course · health · interview · notification · user`

Each module is a fixed file set:
```
entity.go            GORM model
dto.go               request/response shapes
repository.go        interface (what the service depends on)
repository_gorm.go   unexported GORM implementation
service.go           business logic (ctx-threaded, sentinel errors)
handler.go           Gin handlers: validate, auth, map errors, RegisterRoutes(...)
*_test.go            table-driven tests (badge, course, health have them)
```

## Dependency direction (never violate)
```
handler -> service -> repository interface -> gorm repository -> database
```
Services depend only on interfaces. No globals. No circular deps.

## Load-bearing conventions (full list in CLAUDE.md)
- **Responses:** `shared.OK` / `Created` / `NoContent` / `Error`. Never hand-roll JSON.
- **Errors:** package-level `var Err... = errors.New(...)`; compare with `errors.Is`.
- **Context:** thread `ctx context.Context` through repo + service.
- **Auth:** JWT (HS256, 24h). User in `shared.ContextUserKey` — read with `u, ok := val.(T)`.
  Logout stores `jti` in `revoked_tokens`; middleware rejects revoked jti.
- **Pagination:** bind `shared.PaginationQuery`, `.Normalize()`, return `shared.PaginatedResult[T]`.
- **Config:** secrets via constructor, never globals; `os.Getenv` only in `config/config.go`.
- **Imports:** stdlib / external / internal (`level-up-backend/...`), goimports-enforced.

## Adding a module (recipe)
1. `internal/modules/<name>/` with the fixed file set above.
2. goose migration under `migrations/`.
3. Wire repo → service → handler in `cmd/server/main.go`; `handler.RegisterRoutes(r, jwtMiddleware)`.
4. Update Postman collection + tests + docs.

## Content pipeline
Course content = bundled JSON in `internal/seed/data/` (single source of truth).
`cmd/seed [slug ...]` loads it with UUIDv5 ids. MP3 audio lives in S3 (key stored on the
question), not git. Node scripts in `scripts/` (stdlib only) validate translations / generate
TTS / upload audio.

## Definition of Done (this repo)
Code + tests + `make lint` pass, docs updated, feature `STATUS.md` bumped, ADR if a decision
was made, Postman synced if routes changed. **Never commit/push without explicit instruction.**

## Gotchas
- goose migrations run on **startup** — a bad migration blocks boot.
- Deploy is manual: `make deploy` after `aws sso login --profile vyb-dev` (us-east-2).

> Bump `last_verified` and flag stale references when you edit this file.

---
status: "Approved"
owner: "Backend"
last_updated: "2026-07-21"
visibility: "internal"
---

# Backend Engineering

The hub for backend (Go · Gin · GORM · PostgreSQL) engineering. This page **routes**;
it deliberately does not restate the enforced conventions (that would duplicate
`CLAUDE.md`).

## Sources of truth

| For… | See |
|---|---|
| **Enforced conventions** (formatting, imports, error style, response helpers, code style) | root `CLAUDE.md` |
| **Setup & commands** (run, build, test, lint, deploy) | root `README.md` |
| **System shape** (modules, layering, dependency direction, request lifecycle) | [`../architecture/`](../architecture/) |
| **Auth / JWT / CORS** | [`../security/`](../security/) |
| **Content caching** | [`../caching/`](../caching/) |
| **Deployment** (App Runner + RDS) | [`../deployment/`](../deployment/) |
| **Why key choices were made** | [`../../decisions/`](../../decisions/) |

## Adding a feature module (recipe)

1. Create `internal/modules/<name>/` with `entity.go`, `dto.go`, `repository.go`
   (interface), `repository_gorm.go`, `service.go`, `handler.go`.
2. Add a goose migration under `migrations/`.
3. Wire `repo → service → handler` in `cmd/server/main.go`, then
   `handler.RegisterRoutes(r, jwtMiddleware)`.
4. Keep the Postman collection in sync (see `CLAUDE.md`).
5. Document it: follow the documentation lifecycle — a product feature gets a spec in
   `product/<name>/` **before** implementation; a cross-cutting technical concern gets
   a doc here in `engineering/`. Depth follows complexity, risk, and business impact
   (see [`../../process/DOCUMENTATION_ARCHITECTURE.md`](../../process/DOCUMENTATION_ARCHITECTURE.md)).

## Conventions at a glance

The full, enforced list is in `CLAUDE.md`. The essentials a new backend engineer
should internalize on day one:

- **Errors:** sentinel `var Err… = errors.New(...)` in the owning package; compare with
  `errors.Is`.
- **Context:** thread `ctx context.Context` through service and repository methods.
- **Responses:** always `shared.OK` / `shared.Created` / `shared.NoContent` / `shared.Error`.
- **Repository:** interface in `repository.go`, unexported GORM impl in `repository_gorm.go`.
- **Config:** read env only in `config/config.go`; pass values via constructors, never globals.

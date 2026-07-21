# System Architecture

> **Status:** Approved · **Owner:** Backend Team Lead · **Last updated:** 2026-07-21

The shape of the Level Up backend: how the code is organized and how the pieces
depend on each other. For the *enforced* coding rules (formatting, imports, error
style) see the root `CLAUDE.md`; this doc is the *why and where*.

## Shape

```
Browser / clients ──HTTP (JSON, Bearer JWT)──▶ Gin server (App Runner)
                                                  │  CORS → body-limit → JWT middleware
                                                  ▼
                                          feature module handler
                                                  ▼  handler → service → repository
                                          GORM ──▶ PostgreSQL (RDS)
```

Single Gin process. `cmd/server/main.go` only wires things together (load config, run
goose migrations, build repos → services → handlers, register routes).

## Layout

```
cmd/server/main.go       wiring only
internal/
  config/                all env vars in one place (config.Load())
  infrastructure/
    database/            GORM connection
    middleware/          JWT: verify, denylist, load user → context
  modules/               feature modules — one folder each
    <feature>/           entity · dto · repository (+ _gorm) · service · handler
  shared/                response envelope, pagination, context keys, gorm Base
migrations/              goose SQL, applied on startup
```

## Dependency direction

```
handler → service → repository (interface) → gorm repository → database
```

- Services depend only on **interfaces**, never concrete repositories.
- Cross-module needs go through a **small interface the consumer declares** (e.g.
  `interview` reads the course bank via a `ContentReader` it defines; modules emit
  events via a `Notifier`/`Awarder` interface the producer owns). This keeps the
  dependency graph acyclic and modules independently testable.
- No global state; no circular dependencies.

## Request lifecycle

1. CORS → request-body limit → JWT middleware (verify token, reject revoked `jti`,
   load `user.User` into the context).
2. Handler binds the DTO, calls the service.
3. Service runs business logic against repository interfaces.
4. Response via the shared envelope: `{ "data": … }` (2xx) or `{ "error": … }` (4xx/5xx).

## Where to go next

- Backend conventions & how to add a module → [`../backend/`](../backend/)
- Auth / JWT / CORS → [`../security/`](../security/)
- Content caching → [`../caching/`](../caching/) · Deployment → [`../deployment/`](../deployment/)
- Why key choices were made → [`../../decisions/`](../../decisions/)

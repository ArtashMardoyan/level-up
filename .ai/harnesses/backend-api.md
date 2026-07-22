---
status: legacy-pre-framework   # P1 pilot; predates docs/standards/harness-framework.md — bring to conformance before governed use
id: backend-api
title: Backend API Endpoint
applies_to: [level-up-backend]
checklists: [naming, security, testing]
---

# Harness: Backend API Endpoint

## Objective
Add or modify a Gin endpoint in `level-up-backend` following the
`handler → service → repository interface → gorm repository` dependency direction,
with tests, docs, and Postman kept in sync.

## Inputs
- Endpoint spec: method, path, request body / query params, response shape.
- Auth requirement: public or JWT-protected.
- Owning module (existing under `internal/modules/`, or a new one).
- Whether a schema change (goose migration) is needed.

## Required Context
- `.ai/knowledge/backend-architecture.md` (local pack).
- `CLAUDE.md` (module recipe, response format, key conventions).
- The nearest sibling module in `internal/modules/` to pattern-match (e.g. `course`, `auth`).
- `migrations/` if the schema changes.

## Execution Steps
1. Define request/response DTOs in the module's `dto.go`.
2. If new persistence: add fields to `entity.go`, extend `repository.go` (interface) and
   `repository_gorm.go` (impl), and write a goose migration under `migrations/`.
3. Implement business logic in `service.go` (thread `ctx`, use sentinel errors).
4. Implement the `handler.go` method: validate input, enforce auth, map errors to
   `shared.Error`, return via `shared.OK` / `Created` / `NoContent`.
5. Wire repo → service → handler in `cmd/server/main.go` and register the route.
6. Add table-driven tests (`*_test.go`) covering happy + error + auth cases.
7. Update `postman/level-up-backend.postman_collection.json` (folder & method ordering).
8. Update docs per `CLAUDE.md` doc policy if behavior/API changed.

## Validation
- `make test` and `make lint` pass; `make fmt` applied.
- Checklists `naming`, `security`, `testing` pass.
- Auth is deliberate; SQL parameterized; response envelope consistent.
- Postman collection reflects the route.

## Expected Outputs
- Endpoint (DTO + handler + service + repo), migration if needed, tests,
  updated Postman collection, doc updates.

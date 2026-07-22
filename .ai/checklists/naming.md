# Checklist: Naming & Conventions

Atomic pass/fail gates. Consistency with the existing repo beats personal preference.

## Both apps
- [ ] Names reveal intent; no single-letter or misleading names outside tight loops.
- [ ] New files/dirs follow the sibling pattern already in that folder.
- [ ] No dead code, commented-out blocks, or leftover debug logging.

## Backend (`level-up-backend`)
- [ ] New module follows the file set: `entity.go`, `dto.go`, `repository.go` (interface),
      `repository_gorm.go`, `service.go`, `handler.go`.
- [ ] Sentinel errors are package-level `var Err... = errors.New(...)`, compared with `errors.Is`.
- [ ] `ctx context.Context` is threaded through repo and service methods.
- [ ] Imports are the 3 groups (stdlib / external / internal `level-up-backend/...`) — goimports clean.
- [ ] Responses use `shared.OK` / `Created` / `NoContent` / `Error`; pagination via `shared.PaginationQuery`.
- [ ] `make fmt` (`golangci-lint fmt`) applied; `make lint` clean.

## Frontend (`level-up`)
- [ ] Components are `PascalCase.jsx` in `src/components/`; hooks are `useX.js`.
- [ ] Imports and object keys satisfy the `perfectionist` sort rules (line-length ordering).
- [ ] No semicolons, single quotes, 2-space indent, width 120 (Prettier-as-ESLint).
- [ ] State is not synced from props via `useEffect`; adjust during render behind a `prev !== next` guard.
- [ ] `npm run lint` clean (prefer fixing code over disabling a rule).

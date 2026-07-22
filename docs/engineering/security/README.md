---
status: "Approved"
owner: "Backend"
reviewers:
  - "Frontend"
last_updated: "2026-07-21"
visibility: "internal"
---

# Security — Auth, Users & CORS

How authentication, the user account, and cross-origin access work — the security
surface the web frontend logs in through. Small module, high risk: read this before
touching auth.

## `user` module (`internal/modules/user`)

User CRUD, following the standard module layout (entity / dto / status / repository
(+gorm) / service / handler):

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | — | register (public) |
| GET | `/users` | Bearer | list (paginated `?page=&limit=`) |
| GET | `/users/:id` | Bearer | by id |
| PATCH | `/users` | Bearer | update self (id from token) |
| DELETE | `/users` | Bearer | delete self |

- Password is hashed with `bcrypt` and never serialized (`json:"-"`).
- **`age` is optional** (`binding:"omitempty,min=1"`) — the sign-up form sends only
  name/email/password; a missing `age` stores `0`.
- Validation via gin binding: `name` min 2, `email`, `password` min 8.

## `auth` module (`internal/modules/auth`)

JWT authentication with **server-side logout** (a denylist):

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | log in, returns `{ accessToken, user }` |
| GET | `/auth/me` | Bearer | current user |
| POST | `/auth/logout` | Bearer | revoke the token (204) |

- Token: HS256, 24h TTL, `jti` (uuid) in the claims. `JWT_SECRET` is required — the
  server refuses to start without it.
- **Logout** writes the `jti` to `revoked_tokens` (migration `00002`). The middleware
  checks the denylist on every request and rejects a revoked token
  (`401 token has been revoked`).
- Middleware `internal/infrastructure/middleware/auth.go` puts `shared.ContextUserKey`
  (`user.User`), `ContextJTIKey`, and `ContextExpiryKey` on the gin context.

## CORS (`internal/config` + `cmd/server/main.go`)

The browser frontend makes cross-origin requests, so `github.com/gin-contrib/cors`
is wired in:

- Origins come from `CORS_ORIGINS` (comma-separated); the default is
  `http://localhost:5173`, `http://localhost:4173`, `https://artashmardoyan.github.io`.
- Methods `GET,POST,PATCH,DELETE,OPTIONS`; headers `Authorization, Content-Type`;
  credentials allowed; 12h preflight cache.
- Registered as the **first** middleware in `main.go` (before routes).

## Security notes

- **Token storage:** the JWT lives in the browser's `localStorage` and is sent as a
  Bearer header. Keep it out of URLs (never a query-string token) — any streaming or
  WebSocket auth must preserve header-based auth or use a short-lived ticket. See
  [ADR-0003](../../decisions/0003-sse-for-text-streaming.md).
- **Credentialed CORS + wildcard origins** widen the origin surface; keep the allowed
  list as tight as production requires.
- **Deleting a user** cascades to their data (`ON DELETE CASCADE`) — sessions,
  results, notifications, badges all go with the account.

## Response format

```
success → { "data": ... }        error → { "error": "..." }
204 (DELETE / logout) — no body
```

## Verified

Locally (`docker compose up` or `go run ./cmd/server`) the full flow was confirmed:
sign-up without `age` → 201, login → token, `/auth/me` → 200, logout → 204, re-`/auth/me`
with the same token → `401 token has been revoked`, CORS preflight → 204 with
`Access-Control-Allow-Origin`.

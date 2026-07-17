# Notifications

Per-user notification feed. Each notification is owned by a user and carries a
**type + JSON params** — the client maps the type to an icon/accent and renders a
localized title/body, interpolating params. Wording never lives on the server, so
notifications stay language-agnostic.

## Module (`internal/modules/notification/`)

Standard module layout (entity / params / repository (+gorm) / service / handler).

- **`Notification`** (`entity.go`): `{ id, userId, type, params, read, createdAt, updatedAt }`.
  `id` is a UUID assigned in `BeforeCreate`.
- **`Params`** (`params.go`): `map[string]any` with `Scan`/`Value`, stored in a `jsonb`
  column and returned to the client as a JSON object. No extra dependency.
- **`Type`**: `welcome`, `review_milestone` (more reserved for later:
  streak / daily / new_questions).

Table: `migrations/00008_create_notifications.sql` — `notifications` with a
`("userId","createdAt" DESC)` index and `userId → users(id) ON DELETE CASCADE`
(deleting an account removes its notifications).

## Endpoints (JWT-protected, scoped to the caller)

| Method | Path | Result |
|---|---|---|
| GET | `/notifications?page&limit` | Paginated feed, newest first (`{ data: { items, meta } }`) |
| GET | `/notifications/unread-count` | `{ data: { count } }` — cheap badge fetch |
| PATCH | `/notifications/read` | Mark all read (204) |
| PATCH | `/notifications/:id/read` | Mark one read (204; **404** if missing or another user's) |

## Generators (event-driven, best-effort)

Notifications are created by real events. Both hooks are **best-effort** — a failure
never breaks the parent operation, and the dependency is inverted (the producing
module declares its own tiny `Notifier` interface; `notification.Service` satisfies it,
wired in `cmd/server/main.go`). A `nil` notifier is a no-op, so tests pass `nil`.

- **`welcome`** — `user.Service.Create` (sign-up) → one welcome notification. Accounts that
  predate the feature are covered by a one-time backfill migration
  (`00009_backfill_welcome_notifications.sql`), which inserts a welcome for every user without
  one, dated to their account-creation time. So **every** user has a welcome, old or new.
- **`review_milestone`** — `course.Service.UpsertProgress`, on a not-reviewed →
  reviewed transition, counts the user's total reviewed and fires when it lands
  exactly on `10 / 25 / 50 / 100` (params `{ count }`). The bulk-migrate path does not
  fire, so importing local progress on first sign-in never spams.

## Frontend

Wired in the `level-up` repo (2026-07-17): `NotificationBell` reads the badge from
`unread-count`, the list from `GET /notifications`, and marks read via the PATCH routes.
The client maps `type` → icon/accent/localized text (params interpolated) and formats time
with `Intl.RelativeTimeFormat`. See that repo's `docs/redesign/handoff/README.md` → Notifications.

## Not yet built (deferred)

- Generators that need global fan-out (new questions on reseed) or a scheduler
  (daily challenge, streak) — reserved types exist; no producers yet.

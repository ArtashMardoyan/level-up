---
status: "Approved"
owner: "Backend"
reviewers:
  - "Frontend"
last_updated: "2026-07-21"
---

# Notifications

Per-user notification feed. Each notification is owned by a user and carries a
**type + JSON params** — the client maps the type to an icon/accent and renders a
localized title/body, interpolating params. Wording never lives on the server, so
notifications stay language-agnostic.

## Module (`internal/modules/notification/`)

Standard module layout (entity / params / repository (+gorm) / service / handler).

- **`Notification`** (`entity.go`): `{ id, userId, type, params, seen, read, createdAt, updatedAt }`.
  `id` is a UUID assigned in `BeforeCreate`.
- **Two states (Facebook-style):** `seen` = surfaced to the user (opening the list clears the
  badge); `read` = acted on (clicking a row or "mark all read"). **Reading implies seen** — the
  read paths set both. The badge counts **unseen**; the per-row "new" dot is driven by **unread**.
- **`Params`** (`params.go`): `map[string]any` with `Scan`/`Value`, stored in a `jsonb`
  column and returned to the client as a JSON object. No extra dependency.

### Types

- **Active:** `welcome`, `daily`, `badge_earned`.
- **Reserved:** `new_questions` (the constant exists; no producer yet — needs reseed fan-out).
- **Legacy:** `review_milestone`, `streak` — no longer emitted (superseded by achievement
  **badges**, see the `badge` module). The constants are retained only to classify existing
  users' historical notifications.

Table: `migrations/00008_create_notifications.sql` — `notifications` with a
`("userId","createdAt" DESC)` index and `userId → users(id) ON DELETE CASCADE`
(deleting an account removes its notifications). `migrations/00010_add_seen_to_notifications.sql`
adds the `seen` column (backfilling `seen = read` for existing rows).

## Endpoints (JWT-protected, scoped to the caller)

| Method | Path | Result |
|---|---|---|
| GET | `/notifications?page&limit` | Paginated feed, newest first (`{ data: { items, meta } }`) |
| GET | `/notifications/unseen-count` | `{ data: { count } }` — badge (unseen) |
| PATCH | `/notifications/seen` | Mark all **seen** — clears the badge, does not touch read (204) |
| PATCH | `/notifications/read` | Mark all **read** (and seen) (204) |
| PATCH | `/notifications/:id/read` | Mark one read (and seen) (204; **404** if missing or another user's) |

## Generators (event-driven, best-effort)

Notifications are created by real events. Hooks are **best-effort** — a failure never
breaks the parent operation, and the dependency is inverted (the producing module
declares its own tiny `Notifier` interface; `notification.Service` satisfies it, wired
in `cmd/server/main.go`). A `nil` notifier is a no-op, so tests pass `nil`.

- **`welcome`** — `user.Service.Create` (sign-up) → one welcome notification. Accounts that
  predate the feature are covered by a one-time backfill migration
  (`00009_backfill_welcome_notifications.sql`). So **every** user has a welcome, old or new.
- **`badge_earned`** — `badge.Service`, when an achievement badge is first earned (interview
  completion, streak, reviewed-count). This **replaced** the old `review_milestone` / `streak`
  notification emitters — those milestones are durable badges now.
- **`daily`** — `user.Service` (lazy), the daily-challenge nudge.

## Frontend

Wired in the `level-up` repo: `NotificationBell` reads the badge from
`/notifications/unseen-count`, the list from `GET /notifications`, and marks read via the
PATCH routes. The client maps `type` → icon/accent/localized text (params interpolated) and
formats time with `Intl.RelativeTimeFormat`. See that repo's
`docs/redesign/handoff/README.md` → Notifications.

## Status & TODO

Live today: `welcome`, `badge_earned`, `daily` (lazy). The deferred piece is the
**scheduled daily push** and its prerequisite (persisted per-user timezone); `new_questions`
(global fan-out on reseed) is reserved with no producer yet. See the authoritative checklist
in [`engagement-plan.md`](engagement-plan.md) → **TODO / remaining**.

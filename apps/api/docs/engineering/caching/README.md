---
status: "Approved"
owner: "Backend"
last_updated: "2026-07-21"
visibility: "internal"
---

# Content caching (server side)

Course content (`courses` + `questions` + `question_translations`) is served
read-only and changes only on a reseed. The API exposes a cheap **content
version** and an **ETag** so clients can cache the heavy payload and revalidate
almost for free. The client half is documented in the frontend repo at
`level-up/docs/caching/overview.md`.

## Content version

`ContentVersion` (`internal/modules/course/repository_gorm.go`) is a single query:

```sql
SELECT COALESCE(to_char(max(m), 'YYYYMMDDHH24MISSUS'), '') FROM (
  SELECT max("updatedAt") AS m FROM courses
  UNION ALL SELECT max("updatedAt") FROM questions
  UNION ALL SELECT max("updatedAt") FROM question_translations
) t
```

It's an opaque token that changes whenever any course/question/translation row is
updated (the seeder bumps `updatedAt` on every upsert). Same content → same token.

## Endpoints

- **`GET /courses/version`** → `{ "data": { "version": "<token>" } }`, `Cache-Control: no-cache`.
  A few bytes; clients gate their cached content on it.
- **`GET /courses/full?lang=`** — sets:
  - `ETag: W/"<version>-<lang>"` (weak; depends on content version **and** language)
  - `Cache-Control: public, max-age=0, must-revalidate`

  If the request carries a matching `If-None-Match`, the handler returns
  **`304 Not Modified`** with an empty body and **skips building** the ~0.5–0.9 MB
  payload. Otherwise it returns `200` with the full body. See
  `internal/modules/course/handler.go` (`ListCoursesFull`, `ContentVersion`).

## Why version-based (not TTL)

Freshness is tied to real data changes, so a reseed is picked up immediately while
unchanged content is never re-downloaded. No stale window, no needless refetch.

## Not cached

Per-user progress (`/courses/:id/progress`, `/questions/:id/progress`,
`/progress/*`) is mutable and always served/written fresh — never cached.

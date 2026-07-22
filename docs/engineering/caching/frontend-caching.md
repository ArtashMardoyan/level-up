# Course content caching

## Why

Course content is served by the backend (`GET /courses/full`) and is sizeable —
~486 KB (en) / ~868 KB (ru) raw, ~150–214 KB gzip. It changes rarely (only when
the backend is reseeded). Re-downloading it on every page load / language view is
wasteful and makes reloads feel slow, so the client caches it and revalidates
cheaply. Per-user progress is **not** cached (see [Non-goals](#non-goals)).

The design principle: **invalidate by content version, not by a timer.** A dumb
TTL would either serve stale content after a reseed or refetch needlessly; a
version token tied to the actual data avoids both.

## How it works

Two layers cooperate. The backend side (version endpoint + ETag) is documented
in `level-up-backend/docs/content-caching.md`; this file covers the client.

### Client — `src/hooks/useCourses.js` (stale-while-revalidate)

Cache is **per language**, two-tier:
- **in-memory `Map`** — avoids re-parsing/refetching within a session.
- **`localStorage`** (`interviewPrepCourses:<lang>`) — survives reloads. Stored
  value is `{ version, courses }`.

Flow:
1. **Render** — `resolve(language)` reads the cache (memory → localStorage). If a
   copy exists it renders **instantly** (`status: 'ready'`, no skeleton).
2. **Background revalidate** (`sync()` in an effect):
   - **Have a cached copy** → call the tiny `GET /courses/version`. Same version
     → keep the cache, download nothing. Different version → fetch
     `GET /courses/full`, update cache + state.
   - **Cold (no cache)** → the [loading skeleton](../redesign/handoff/README.md)
     shows while `GET /courses/full` loads; then store it with its version.
3. `reload()` clears both cache tiers and refetches (used by the error retry).

The version check is **best-effort**: if `/courses/version` is unreachable (e.g.
an older backend), it's treated as "unknown" and the cached copy is kept — content
still loads on a cold start.

### Scenarios

| Scenario | What happens | Network |
|---|---|---|
| First visit | skeleton → `GET /courses/full` → render + save | full payload once |
| Reload / return | instant render from localStorage → background `GET /courses/version` | a few bytes |
| After a reseed | version differs → refetch `/courses/full` → update | full payload once |
| Language switch | separate per-language cache | full payload once per language |

## Non-goals

- **Progress is never cached.** It's per-user and mutable: `GET /courses/:id/progress`
  is always fetched fresh and writes (`PATCH /questions/:id/progress`,
  `POST /progress/bulk`) go straight to the backend. Only static course *content*
  is cached.
- No service worker / offline mode.

## Files
- `src/hooks/useCourses.js` — the cache + SWR logic.
- `src/data/courses.js` — `fetchCourses(lang)` (calls `GET /courses/full`, normalizes).
- `src/services/endpoints.js` — `coursesFull`, `coursesVersion`.
- Backend: `level-up-backend/docs/content-caching.md`.

# Knowledge Pack: Domain Glossary (shared)

Cross-cutting vocabulary shared by both apps. Keep terms here only if both the frontend
and backend need the same meaning. App-internal terms live in that app's architecture pack.

`last_verified: 2026-07-22`

## Product
- **Level Up** — interview-prep platform: practice Q&A across course tracks, with an
  AI Interview Coach experience layered on top.
- **Course / track** — a subject (Go, React, Node.js, DevOps, QA, Backend, Frontend, Next.js).
  A course's public **id is its `slug`** (e.g. `go`).
- **Question** — a single Q&A item. Its public **id is its `ref`** (e.g. `q1`); the backend
  UUID rides along as `uuid` for progress calls. Shape: `{ id(ref), uuid, module, question, answer, bonus?, audio? }`.
- **Module** (content sense) — a grouping of questions inside a course. Distinct from a
  backend Go *module*.
- **Progress** — per-user reviewed/favorite state. Signed-in → backend API; anonymous → `localStorage`,
  migrated to the backend on first sign-in.
- **Badge** — earned achievement (backend `badge` module).
- **Interview Coach** — AI experience: paraphrases questions and writes natural, score-free
  chat reactions; chat responses stream over SSE.
- **Audio** — a question may carry a single S3 object key; present → pre-generated MP3,
  absent → browser speech synthesis.

## The `ref ↔ uuid` boundary
The UI speaks human ids (`slug`, `ref`); the backend speaks UUIDs. Mapping happens **at the
API boundary** — the frontend `data/courses.js` normalization and progress calls. Keep this
mapping at the edge; don't leak UUIDs into UI logic or refs into DB logic.

## Contract & deploy facts both sides rely on
- **Response envelope:** success `{ "data": ... }`; error `{ "error": "..." }`;
  paginated `{ "data": { "items": [], "meta": { page, limit, total } } }`.
- **Auth:** JWT bearer (HS256, 24h). Logout revokes the token's `jti` server-side.
- **API base:** frontend uses `VITE_API_URL`; backend runs on App Runner (us-east-2, `vyb-dev`).
- **Content caching:** `GET /courses/version` gates client cache; `/courses/full` supports ETag/304.

> Update `last_verified` when you touch this file; flag any term whose referenced file/route no longer exists.

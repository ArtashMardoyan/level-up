# 013 - Technical Architecture

## Goal

A scalable architecture for the AI Interview Coach that fits the **existing** Level Up stack.

## Backend (this repo)

- **Go + Gin + GORM + PostgreSQL**, goose migrations on startup.
- New module `internal/modules/interview` following the repo layout: `entity.go`, `dto.go`,
  `repository.go` (interface), `repository_gorm.go`, `service.go`, `handler.go`; wired in
  `cmd/server/main.go`; routes protected by the JWT middleware (`shared.ContextUserKey`).
- Responses via `shared.OK` / `shared.Error`; pagination via `shared.PaginationQuery`.
- Depends on existing modules through small interfaces (like `course` → `notification`): it reads
  the question bank and emits a notification when a report is ready.

## AI layer (server-side only)

- **OpenAI**, called **from the Go backend** (never the browser). `OPENAI_API_KEY` read only in
  `internal/config`, passed to the interview service via constructor.
- Structured JSON output validated against `006`; **retry once**, then degrade per `006`.
- **One AI call per answer, on submit** (`004`/`005`) — feedback returns in the submit response and
  renders in the chat. `complete` calls no AI; it only aggregates. A per-call timeout backs the chat
  "thinking" state. (The repo already uses OpenAI for TTS tooling — same provider, now server-side
  in Go.)
- Scores are **0–100** on the rubric Correctness / Depth / Communication / Structure (`006`).

## Frontend (existing app)

- **React 19 + Vite, JSX** (not TypeScript), **hash routing** (`useHashRoute`) — not React Router.
- API via `src/services/endpoints.js` wrappers over the `{data}`/`{error}` envelope; i18n en+ru;
  CSS tokens; `lucide-react`.
- No business logic in the UI — it mirrors backend state (`012`).

## HTTP endpoint contract

All under `/interviews`, JWT-protected, scoped to the caller:

| Method | Path | Purpose |
|---|---|---|
| POST | `/interviews` | Start a session (`courseSlug`, `difficulty` `easy`\|`medium`\|`hard`, `language` `en`\|`ru`, `questionCount`) → session + first question |
| GET | `/interviews/:id` | Fetch a session for resume (questions + stored answers/feedback so far) |
| POST | `/interviews/:id/answers/:questionId` | Submit one answer (`{answer, skipped?}`) → evaluates it, returns `006` (score + rubric + feedback) |
| POST | `/interviews/:id/complete` | Aggregate results → build + return the final report (`010`) |
| GET | `/interviews/:id/report` | Final report (overall score /100 + rubric + strengths/weaknesses + recommendations) |
| GET | `/interviews?page&limit` | Interview history (paginated) |

Post-MVP (English coaching, `007`/`008`): `/learning-profile`, `/recommendations`,
`/recommendations/:id`.

Keep the Postman collection in sync (CLAUDE.md).

## Principles

- Independent services; typed contracts (Go structs + the JSON schema in `006`).
- Backend is the source of truth; the frontend syncs.
- Reuse existing auth/courses/progress/notifications rather than reinventing.

## Future

- Auth already exists; later: cloud analytics, multi-model AI, streaming evaluation.

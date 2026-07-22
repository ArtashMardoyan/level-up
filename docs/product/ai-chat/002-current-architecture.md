# 002 - Current Architecture

Everything here is read from the real code. File references are `path:line` and clickable.

## System shape

```
Browser (React 19 SPA, GitHub Pages)
  │  fetch() with Bearer JWT, JSON  (src/services/api.js)
  ▼
Gin HTTP server (Go, App Runner)
  │  CORS → body-limit → JWT middleware → interview handler
  ▼
interview.Service  ──►  OpenAI (openai-go, blocking)      # generate + evaluate + whisper
  │
  ▼
GORM ──► PostgreSQL (RDS)   interview_sessions / question_results / final_reports
```

Single Gin process; no message broker, no cache, no WebSocket, no streaming. Request in → JSON out.

## Frontend architecture

**Stack:** React 19 + Vite, JSX (not TypeScript), no state library, hash routing, plain CSS tokens
in `src/index.css`. Deployed to GitHub Pages (`base: '/level-up/'`).

**Routing.** Hash-based via `src/hooks/useHashRoute.js` — the hash is `#<courseId>/<questionId>`.
`App.jsx:109` treats `courseId === null || 'interview'` as the interview section and renders
`<InterviewCoach sessionId={jumpToId} …>` (`App.jsx:132`). So `#interview/<id>` opens session `<id>`;
`#interview/new` = Setup, `#interview/history` = History, bare `#interview` = Home.

**Component tree for the chat:**

| Component | File | Responsibility |
|---|---|---|
| `InterviewCoach` | `src/components/InterviewCoach.jsx` | Router/container. Maps the hash segment to Home / Setup / History / `SessionRunner`. Guests get `InterviewHome`. |
| `SessionRunner` | same file, `:14` | Loads one session via `interviewGet(id)` in an effect, then shows `InterviewChat` (in-progress) or `InterviewResults` (completed). Mounted with `key={sessionId}` for fresh state. |
| `InterviewChat` | `src/components/InterviewChat.jsx` | **The chat itself** — message list, composer, submit, voice record, "thinking" state, complete button. |
| `InterviewResults` / `InterviewHistory` / `InterviewSetup` / `InterviewHome` | `src/components/Interview*.jsx` | Results/review, history list, setup form, landing dashboard. |

**Chat state (`InterviewChat.jsx:52`)** — all local `useState`, no store:
- `messages` — the rendered transcript, seeded from the resume payload by `initialMessages(initial)`
  (`:16`). Each message is `{ id, text, kind: 'question'|'answer', role: 'ai'|'user', skipped }`.
- `current` — the current unanswered `QuestionView`; `finished` — end reached.
- `answer` — composer text; `thinking` — round-trip in flight; `completing`, `error`.
- `recording` / `transcribing` / `elapsed` — voice-answer capture (`MediaRecorder` + Web Audio meter).

**Transport client (`src/services/api.js`).** One `request(method, path, {json|formData})` helper:
attaches `Authorization: Bearer <token>` from `authToken.js` (localStorage key
`interviewPrepAuthToken`), sends/parses JSON, unwraps `{data}`, throws `ApiError(status, msg)` on
non-2xx (and status `0` on network failure). `apiGet/apiPost/apiUpload` wrap it. **This is a
one-shot request/response client — it has no concept of a stream, a partial body, or a live
connection.**

**Endpoint wrappers (`src/services/endpoints.js:37`).** Thin per-route functions:
`interviewsCreate`, `interviewGet`, `interviewSubmitAnswer`, `interviewComplete`, `interviewReport`,
`interviewsList`, `interviewsSummary`, `interviewTranscribe`.

## Backend architecture

**Stack:** Go 1.26, Gin + GORM + PostgreSQL, goose migrations run on startup (`cmd/server/main.go:38`).
Module layout mirrors the rest of the repo: `entity / dto / repository (+gorm) / service / handler`.

**Wiring (`cmd/server/main.go:58`).**
```go
interviewAI := interview.NewAI(cfg.OpenAI.APIKey, cfg.OpenAI.Model, cfg.OpenAI.Timeout)
interviewService := interview.NewService(interviewRepo, courseRepo, interviewAI, badgeService)
interviewHandler := interview.NewHandler(interviewService)
...
interviewHandler.RegisterRoutes(r, jwtMiddleware)
```
`courseRepo` is passed as the `ContentReader` (the question bank); `badgeService` as the
`BadgeAwarder`. `NewAI` returns `nil` when `OPENAI_API_KEY` is empty, and the service degrades.

**Global middleware (`main.go:71`), in order:**
1. `gin.Default()` — logger + recovery.
2. **CORS** (`main.go:72`) — allowed origins from `cfg.CORS.Origins` (localhost + Pages + `*.vercel.app`),
   methods `GET/POST/PATCH/DELETE/OPTIONS`, headers `Authorization, Content-Type`, `AllowCredentials: true`.
3. **Body-size cap** (`main.go:80`) — `http.MaxBytesReader`, **1 MB default**, **25 MB for
   `/interviews/transcribe`** (Whisper's file limit). *This cap is relevant to streaming: it is a
   per-request read limit on the request body, not the response.*
4. Per-module routes registered after.

**JWT middleware (`internal/infrastructure/middleware/auth.go:27`).** Requires `Authorization:
Bearer <jwt>`; parses HS256 claims; rejects revoked `jti` (denylist via `revoked.IsRevoked`); loads
the `user.User` and sets it on `shared.ContextUserKey` (+ jti + expiry). Every `/interviews` route
runs behind this (`handler.go:22` — `r.Group("/interviews", auth)`).

**Handler (`internal/modules/interview/handler.go`).** Routes (`:21`):

| Method | Path | Handler | Purpose |
|---|---|---|---|
| POST | `/interviews` | `Create` | Start a session → first question |
| GET | `/interviews` | `List` | Paginated history |
| POST | `/interviews/transcribe` | `Transcribe` | Whisper voice-answer → text |
| GET | `/interviews/summary` | `Summary` | Profile aggregates |
| GET | `/interviews/:id` | `Get` | Resume payload |
| POST | `/interviews/:id/answers/:questionId` | `SubmitAnswer` | Submit + evaluate + return next question |
| POST | `/interviews/:id/complete` | `Complete` | Aggregate the final report |
| GET | `/interviews/:id/report` | `Report` | Fetch a completed report |

Each handler: pull `contextUser` (`:222`), bind the DTO, call the service, respond with `shared.OK`
/ `shared.Created`, and map sentinel errors to HTTP status via `writeError` (`:199`).

**Service (`internal/modules/interview/service.go`).** The engine. Key methods:
- `Start` (`:51`) — reject if an active session exists, pick questions, create the session, generate
  the **first** question (one OpenAI call), return `SessionView`.
- `SubmitAnswer` (`:140`) — load + ownership check, evaluate the answer (one OpenAI call), upsert the
  result, advance `currentIndex`, then **generate the next question** (a second OpenAI call), return
  `SubmitAnswerResponse{Result, Next}`.
- `Get` (`:101`) — rebuild the resume payload (answered turns + current question) from stored data.
- `Complete` (`:246`) — aggregate results into a `FinalReport` (**no AI**), award badges (best-effort).
- `Transcribe` (`:357`) — pass audio to Whisper.
- `ensureGenerated` (`:428`) — generate-and-cache a slot's AI paraphrase; already-cached slots are a
  pure read. Persists the cache by `UpdateSession` (full-row `Save`).

**AI layer (`internal/modules/interview/ai.go`).** `AI` interface = `Evaluator + Generator +
Transcriber`, backed by `openAIClient` (`:103`). All calls are **blocking** `.New(ctx, params)` with
a per-call `context.WithTimeout(ctx, timeout)`; JSON-object `ResponseFormat`; one retry on
transport/parse failure. `Generate` (temp 0.7) writes `{reaction, question, modelAnswer}`; `Evaluate`
(temp 0.2) writes the rubric JSON; `Transcribe` uses Whisper-1. See `008` for what changes here.

**Persistence (`repository_gorm.go`, migrations `00013`/`00014`).**
- `interview_sessions` — the session; `questionIds` jsonb snapshot; `generatedQuestions` jsonb cache;
  `currentIndex`; partial unique index enforcing **one active session per user**.
- `question_results` — one row per answered question, unique `(interviewId, questionId)` (upsert).
- `final_reports` — 1:1 with the session.
- Full entity/column detail is in `docs/product/interview/010-data-model.md` — not repeated here.

## What the architecture does NOT have (the migration's job)

- No streaming transport (SSE/chunked/WebSocket) — every response is a complete JSON body.
- No persistent connection or connection registry — each request is independent and stateless.
- No OpenAI streaming — `openai-go` is called with the blocking method only.
- No cancellation channel from the client — only the server-side timeout ends a call.
- No token/partial-message concept anywhere in the frontend render path.

These absences are exactly the surface the migration adds, incrementally, in `004`–`012`.

# 003 - Current HTTP Flow

The exact request/response lifecycle **as it runs today** — the behavior the streaming migration
replaces. This is the "before" picture; `010` shows the "after".

## The blocking round-trip (submit an answer)

This is the hot path — what happens on every answer the user sends. Traced from
`InterviewChat.jsx:138` (`submit`) through `service.go:140` (`SubmitAnswer`).

```
User types answer, presses Enter  (InterviewChat.jsx:167 onKeyDown → submit(false))
  │
  1. Optimistic UI: append the user's answer bubble, clear composer, set thinking=true
  │    (InterviewChat.jsx:145-148)   ← the ONLY thing that feels instant today
  │
  2. fetch POST /interviews/:id/answers/:questionId   { answer, skipped }
  │    (endpoints.js:50 interviewSubmitAnswer → api.js request)
  │    Bearer JWT attached; single connection held open for the whole call
  ▼
Gin: CORS → 1MB body limit → JWT middleware (load user)
  ▼
handler.SubmitAnswer (handler.go:71): bind DTO, call service
  ▼
service.SubmitAnswer (service.go:140):
  a. load session + ownership check                        (DB read)
  b. ensureGenerated(current)  → cached, pure read         (no AI — already shown)
  c. evaluateAnswer → ai.Evaluate(...)     ★ BLOCKING OpenAI call #1  (~1–4 s)
  d. UpsertResult                                          (DB write)
  e. advance currentIndex, UpdateSession                  (DB write)
  f. ensureGenerated(next) → ai.Generate(...) ★ BLOCKING OpenAI call #2 (~1–4 s)
     └─ UpdateSession again to cache the new slot          (DB write)
  ▼
handler: shared.OK({ result, next })   (one complete JSON body)
  ▼
Browser: promise resolves with the WHOLE message at once
  │    (InterviewChat.jsx:151 .then)
  3. append the next-question bubble, set current=next, thinking=false
       (the "thinking" dots disappear; the full AI message appears instantly)
```

**Key property:** the browser sees **nothing** between step 2 and step 3 except the animated
"thinking" dots (`InterviewChat.jsx:294`). The perceived latency is **two sequential OpenAI calls
plus three DB writes**, all inside one HTTP request. There is no partial output — it's all-or-nothing.

## The other lifecycle calls

**Start a session** (`InterviewSetup` → `interviewsCreate` → `handler.Create` → `service.Start`,
`service.go:51`): reject if the user has an active session (409), pick questions, create the session,
**generate the first question** (one blocking OpenAI call — the greeting + question 1), return the
`SessionView` with `Current` set. `Created` (201). Same blocking shape, one AI call.

**Resume** (`SessionRunner` mount → `interviewGet` → `handler.Get` → `service.Get`, `service.go:101`):
pure DB reads. Rebuilds `history` (answered turns with their stored `feedback`/scores) + `current`
(the next unanswered question) from `questionIds` + cached `generatedQuestions` + `question_results`.
**No AI.** This is the recovery primitive the whole system leans on — and the reason streaming is a
safe transport change (`009`).

**Complete** (`seeResults` → `interviewComplete` → `handler.Complete` → `service.Complete`,
`service.go:246`): aggregate `question_results` into a `FinalReport` (`report.go` `aggregate`).
**No AI.** Idempotent — re-completing returns the existing report. Awards badges best-effort.

**Voice answer** (`startRecording`/`stopRecording` → `interviewTranscribe` → `handler.Transcribe` →
`service.Transcribe`, `service.go:357`): `MediaRecorder` captures webm/opus, POSTs multipart to
`/interviews/transcribe` (25 MB body cap), Whisper returns text, the text **fills the composer** for
the user to edit before a normal submit. Grading stays text-based; audio is discarded (not persisted).

## Request/response envelope

- Success: `{ "data": <payload> }` with 200 (`shared.OK`) or 201 (`shared.Created`).
- Error: `{ "error": "<message>" }` with a mapped status (`shared.Error`, `writeError` at
  `handler.go:199`): 404 not-found, 409 active-session / not-editable, 422 no-questions/no-results,
  503 voice-unavailable, 500 otherwise.
- The frontend unwraps `data` and throws `ApiError(status, error)` on non-2xx (`api.js:47`).

## Timeouts and failure today

- **Per-OpenAI-call timeout:** `context.WithTimeout(ctx, cfg.OpenAI.Timeout)` — default **30 s**,
  `OPENAI_TIMEOUT_SECONDS` override (`config.go:110`, applied in `ai.go:139`/`:251`/`:323`).
- **Retry:** each AI call retries **once** on transport/parse failure (`ai.go:169`).
- **Degrade:** if evaluation fails, the answer still counts with placeholder feedback
  (`report.go` `degraded`); if generation fails, the chat falls back to the **raw bank text**
  (`service.go:448` — `Generate` error leaves `view.Question` = bank text). A nil AI client degrades
  the same way. **The chat never hard-fails on an AI error** — a critical invariant to preserve when
  streaming (`011`).
- **No client cancellation:** if the user navigates away mid-submit, the browser drops the response
  but the server finishes the work (both AI calls + writes). There is a `beforeunload` warning
  (`InterviewChat.jsx:105`) but no `AbortController` on the fetch.

## Why this flow is the thing we're replacing

1. **All-or-nothing latency.** The user waits out two serial model calls with zero feedback beyond a
   spinner. Streaming turns that into first-token-in-~500ms.
2. **Two AI calls serialized per turn.** Evaluate-then-generate are independent but run in sequence
   inside one request (`003` step c → f). Streaming + reordering (generate first, evaluate in the
   background) can cut perceived latency roughly in half (`008`/`010`).
3. **No cancellation.** A user who changes their mind can't stop generation; the server bills the
   full call anyway.
4. **The transport can't express "in progress".** A one-shot JSON body has no vocabulary for "token
   arrived", "still thinking", "done", "error mid-stream" — which the streaming transport adds (`005`).

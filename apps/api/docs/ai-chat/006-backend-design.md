# 006 - Backend Design

How the Go backend gains streaming **without breaking the existing module** or its contracts. This
is a design proposal for future phases — nothing here is implemented yet (`STATUS`).

## Principle: extend the module, don't fork it

The streaming path lives **inside `internal/modules/interview/`**, reusing the same `Service`,
`Repository`, entities, sentinel errors, and degrade policy. We add:
- new **handler methods** (streaming endpoints) beside the existing ones,
- new **service methods** that stream deltas while producing the same persisted result,
- a small **transport abstraction** so the service doesn't hard-code SSE vs WebSocket,
- a streaming variant of the **AI `Generator`** (`008`).

Everything additive. The current `SubmitAnswer`/`Start` stay exactly as they are (`012` keeps them
until a phase retires them).

## New endpoints (proposed)

Registered in `handler.go` `RegisterRoutes`, same `/interviews` group, same JWT middleware:

| Method | Path | Purpose | Transport |
|---|---|---|---|
| POST | `/interviews/:id/answers/:questionId/stream` | Submit an answer; **stream the next question**; evaluate in the background | SSE |
| POST | `/interviews/stream` *(optional)* | Start a session and **stream the first question** | SSE |
| POST | `/interviews/:id/cancel` | Cancel the in-flight generation for this session | JSON |
| GET (WS) | `/interviews/:id/voice` *(Phase 6+)* | Bidirectional voice channel | WebSocket |

The non-stream `POST /interviews/:id/answers/:questionId` remains the fallback and the contract of
record until Phase 5 (`012`).

## Transport abstraction

Introduce a tiny sink so the service streams without knowing the wire format:

```go
// StreamSink receives generation deltas + a terminal event. Implemented by an
// SSE writer today and a WebSocket writer later — the service depends only on this.
type StreamSink interface {
    Delta(text string) error            // one token/chunk of question prose
    Done(v QuestionView) error          // terminal: the canonical, persisted turn
    Fail(err error, recoverable bool) error
}
```

- **SSE implementation** wraps `gin.Context` / `http.ResponseWriter` + `Flusher`, writing
  `event:`/`data:` frames and flushing after each delta (`005`).
- **WebSocket implementation** (Phase 6+) writes message frames on the duplex conn.

The handler builds the right sink from the request and hands it to the service; the service logic is
transport-agnostic.

## Streaming service method (shape)

A streaming sibling of `SubmitAnswer` (`service.go:140`). Same ownership check, same persistence,
new output path:

```
SubmitAnswerStream(ctx, userID, id, questionID, req, sink StreamSink):
  1. load + ownership check + "in progress" check      (unchanged)
  2. persist the user's answer + advance currentIndex   (unchanged bookkeeping)
  3. kick off Evaluate in the background (goroutine):    ← was step (c) inline; now concurrent
        eval := ai.Evaluate(...); UpsertResult(eval)     (persist when it lands; degrade on error)
  4. stream the NEXT question:                           ← the user-visible win
        ai.GenerateStream(ctx, in, func(delta){ sink.Delta(delta) })
        on completion: assemble QuestionView, cache it (UpdateSession), sink.Done(view)
  5. on ctx cancel (client cancel / disconnect): stop the stream, persist what's safe, sink.Fail
```

Notes:
- **Ordering flip.** Today Evaluate runs before Generate (`003` c→f). Here Generate streams first
  and Evaluate runs concurrently, because the chat bubble doesn't depend on the score (`004`/`010`).
- **Persistence unchanged.** The generated turn is still cached in `generatedQuestions` and the
  evaluation still upserts `question_results` — the streaming path writes the **same rows** the
  blocking path does, so `GET /interviews/:id` reconstructs an identical session either way (`009`).
- **`Done` carries the canonical turn.** The client reconciles its token-assembled bubble against
  `Done`'s authoritative `reaction`/`question` (in case of any delta loss — `010`).

## Reusing the degrade policy

The invariant "the chat never hard-fails on an AI error" (`011`) is preserved:
- If `GenerateStream` errors before any token, emit the **raw bank text** as a single `Done` (exactly
  today's fallback at `service.go:448`), not an error the user sees.
- If it errors mid-stream, emit `Fail(recoverable:true)`; the client falls back to `GET
  /interviews/:id` and shows the persisted/fallback text.
- A nil AI client (no `OPENAI_API_KEY`) streams nothing and immediately `Done`s the bank text.

## Cancellation

- `POST /interviews/:id/cancel` (or the client simply closing the SSE connection) triggers the
  request `ctx` cancel. The service passes that `ctx` straight into `openai-go`'s streaming call, so
  cancelling the context stops the OpenAI stream and the billing.
- A per-session **cancel registry** (map `sessionID → context.CancelFunc`, mutex-guarded) lets an
  out-of-band `cancel` request abort a stream started by a different request (`009`).
- On cancel, persist the safe state (the answer + `currentIndex` are already written in step 2); do
  **not** cache a partial generated question — leave the slot ungenerated so a later resume
  regenerates cleanly.

## Middleware interactions to get right

- **Body-size cap (`main.go:80`).** The 1 MB default applies to the **request body** — fine for the
  small answer JSON. The streaming happens on the **response**, which the cap doesn't touch. No
  change needed for text streaming. (Voice-over-WebSocket has its own framing, out of this cap.)
- **CORS (`main.go:72`).** Already allows the origins + `Authorization` header + credentials; SSE
  over `fetch` needs nothing more. Confirm `text/event-stream` isn't stripped.
- **Gin logger/recovery.** `gin.Default()`'s logger measures full-request duration; a long-lived
  stream will log a long duration — cosmetic, but note it. Recovery must still wrap the streaming
  goroutine (panic in a delta callback must not kill the process).

## Config

Reuse `OpenAIConfig` (`config.go:53`). A streaming call may want a **longer** timeout than 30 s (the
stream can legitimately run longer than a single blocking completion) — add
`OPENAI_STREAM_TIMEOUT_SECONDS` if needed, read only in `config/config.go` per repo rules. No secrets
in globals; pass via constructor (unchanged pattern).

## What stays identical

Routing group, JWT, ownership checks, `shared.OK/Error` for non-stream endpoints, sentinel-error
mapping, the entities/tables, the one-active-session rule, and the Postman-sync obligation
(new routes get added to the collection — `CLAUDE.md`).

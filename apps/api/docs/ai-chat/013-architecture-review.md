# 013 - Architecture Review

Issues, tech debt, scalability and security risks found while reading the code for Phase 1. **Per the
brief, these are documented, not fixed.** Each entry: what it is, why it matters, a possible future
solution. Most are pre-existing (not caused by the migration) but shape or are amplified by it.

## A. Concurrency / correctness

### A1. `generatedQuestions` cache is a full-row read-modify-write
- **What:** `ensureGenerated` appends one slot then persists the whole session via `UpdateSession`
  (`Save`) (`service.go:472`). `Save` writes every column from the in-memory struct.
- **Why it matters:** two near-simultaneous requests for the same session (e.g. a double-submit, or a
  resume racing a submit) can clobber each other's `currentIndex`/`generatedQuestions` with a
  last-writer-wins full-row overwrite. Streaming makes overlapping requests per session more likely
  (a slow stream + a retry/reconnect).
- **Possible future solution:** column-scoped updates (`Select("generatedQuestions","currentIndex").
  Updates(...)`), optimistic concurrency (a version column), or an append that re-reads within a
  transaction. Decide during Phase 2 when the streaming path touches this cache.

### A2. Two independent AI calls serialized per turn
- **What:** `SubmitAnswer` runs `Evaluate` then `Generate` in sequence (`service.go:164`→`:181`).
- **Why it matters:** doubles perceived latency for no dependency reason — the chat bubble doesn't
  need the score. (This is the migration's core opportunity, not a defect per se — `004`/`010`.)
- **Possible future solution:** concurrent eval + streamed generation (Phase 2/4). Noted here so the
  serialization isn't mistaken for a required ordering.

### A3. No client cancellation today
- **What:** a navigate-away drops the response but the server completes both AI calls + writes
  (`003`); only the 30 s timeout bounds it.
- **Why it matters:** wasted OpenAI spend + DB writes for abandoned turns; worse under streaming
  where turns are longer-lived.
- **Possible future solution:** context-cancel on disconnect + `/cancel` (`006`/`009`).

## B. Scalability

### B1. App Runner streaming/WebSocket behavior unverified
- **What:** the platform's buffering, idle timeouts, and connection limits for `text/event-stream`
  and WebSocket are **unknown/untested** in this project.
- **Why it matters:** the entire streaming plan assumes streams flush promptly and connections live
  long enough. If App Runner buffers responses or caps connection duration, streaming degrades or
  breaks.
- **Possible future solution:** the Phase 2 gating experiment (`012`) — a spike endpoint that streams
  timed tokens and is measured on the real service. Fallback is the blocking endpoint.

### B2. Connection budget under streaming
- **What:** each active streamed turn holds a connection to one instance for its duration.
- **Why it matters:** raises per-instance concurrency; changes autoscaling/timeout math; a burst of
  slow generations could exhaust connections.
- **Possible future solution:** load-test (Phase 5); tune App Runner concurrency; keep blocking
  fallback; consider generation timeouts tuned for streaming (`008`).

### B3. Per-instance cancel registry doesn't cross instances
- **What:** an out-of-band `/cancel` may hit a different instance than the one holding the stream
  (`009`).
- **Why it matters:** out-of-band cancel is best-effort without shared coordination.
- **Possible future solution:** rely on connection-close cancel for the text phases; add
  Postgres `LISTEN/NOTIFY` or pub/sub only if a guaranteed cross-instance cancel is required.

## C. Security

### C1. JWT in `localStorage`
- **What:** the token lives in `localStorage` (`authToken.js`, key `interviewPrepAuthToken`) and is
  attached as a Bearer header (`api.js:20`).
- **Why it matters:** `localStorage` tokens are readable by any XSS; not a new issue, but any
  streaming-transport auth choice inherits it. Notably, **do not** move the token into a query string
  for SSE/WebSocket (URLs get logged) — a reason to prefer SSE-over-`fetch` (header auth) and
  short-lived WS tickets (`005`/`009`).
- **Possible future solution:** out of scope for the migration, but if revisited: httpOnly cookie +
  CSRF strategy, or keep header auth and never put tokens in URLs. **Migration constraint: keep the
  token out of URLs.**

### C2. CORS `AllowCredentials: true` with wildcard patterns
- **What:** CORS allows credentials and uses `AllowWildcard` with `https://*.vercel.app`
  (`main.go:72`, `config.go:66`).
- **Why it matters:** credentialed CORS with broad wildcards widens the origin surface; relevant if
  streaming endpoints are added under the same CORS (they will be).
- **Possible future solution:** tighten allowed origins to the exact production frontends; audit
  whether `AllowCredentials` is actually needed (the app uses header-bearer auth, not cookies).

### C3. Whisper transcript trust + audio not persisted
- **What:** transcripts fill the composer (`003`); raw audio is intentionally discarded
  (`docs/interview/STATUS.md`).
- **Why it matters:** fine today; realtime voice (Phase 7) will handle live audio server-side and
  must keep the OpenAI key server-side (it already is) and re-affirm "no client-side key".
- **Possible future solution:** the broker design in `008` keeps the key server-side by construction.

## D. Maintainability

### D1. Two response envelopes if streaming is added naively
- **What:** non-stream endpoints use `{data}`/`{error}` (`shared.OK/Error`); a stream uses
  `event:`/`data:` frames.
- **Why it matters:** two shapes to keep coherent; error semantics must map cleanly between them
  (`011`).
- **Possible future solution:** a documented mapping (sentinel error → `error` frame vs. HTTP status)
  and a single client-side error type (`ApiError`) reused across both readers (`007`).

### D2. Prompt/format coupling for streaming
- **What:** generation uses JSON-object mode returning `{reaction,question,modelAnswer}` (`ai.go:247`);
  streaming prose out of a JSON object is awkward (`008`).
- **Why it matters:** Phase 4 must change the prompt/format, which risks paraphrase-quality
  regressions the interview team spent several sessions tuning (`docs/interview/STATUS.md`).
- **Possible future solution:** stream the prose field only (or plain prose + a separate
  `modelAnswer`); bump `SchemaVersion`; re-run the live paraphrase-quality checks.

### D3. Duration logging on long streams
- **What:** `gin.Default()` logs full-request duration; streams log long durations (cosmetic).
- **Possible future solution:** a streaming-aware log line (first-token latency, token count) instead
  of relying on the default access log (`011` observability).

## Severity snapshot

| Item | Severity | Amplified by migration? |
|---|---|---|
| A1 full-row cache write | Medium | Yes |
| B1 App Runner streaming unverified | **High (gating)** | Yes (blocks the plan) |
| C1 token in localStorage | Medium (pre-existing) | Constrains transport auth |
| C2 credentialed wildcard CORS | Medium | Inherited by new endpoints |
| A2/A3 serial calls / no cancel | Low–Med (opportunity) | Addressed by migration |
| D2 prompt/format for streaming | Medium | Yes (quality risk) |

None of these block **Phase 1**. **B1 must be resolved early in Phase 2** before the streaming plan
is committed. The rest are addressed within their relevant phases (`012`).

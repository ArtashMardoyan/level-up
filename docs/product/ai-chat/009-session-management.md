# 009 - Session Management

Sessions, live connections, reconnection, cancellation, and scaling for the streaming era. The
**data-layer session model is already solid and unchanged**; this doc adds the *connection* layer on
top of it.

## Two distinct notions of "session"

1. **Interview session (persistent, exists today).** A row in `interview_sessions` — the
   conversation's durable state: chosen questions, `currentIndex`, cached generated turns,
   per-answer results, status. Owned by one user; **at most one active** per user (partial unique
   index, `migrations/00013`). This is the source of truth and does not change.
2. **Streaming connection (transient, new).** A live SSE/WebSocket connection carrying tokens for one
   in-flight turn. Ephemeral, tied to a single request/turn, keyed by `(userID, sessionID)`. If it
   drops, the interview session is unaffected — you re-fetch and continue.

Keeping these separate is the core idea: **the connection is disposable; the session is durable.**

## Reconnection — already solved at the data layer

The chat rebuilds from `GET /interviews/:id` on every load (`service.Get`, `service.go:101`;
`SessionRunner` at `InterviewCoach.jsx:22`). So the reconnection algorithm is simply:

```
stream drops → GET /interviews/:id → rebuild transcript (initialMessages) → continue
```

This works **today** and needs no new infrastructure. The streaming layer may add a *nicer* resume
(continue mid-token via an SSE `Last-Event-ID` cursor), but that is an optimization — the guaranteed
fallback is the full re-fetch, which is why streaming is a safe transport change (`004`).

**Idempotency that makes reconnection safe:**
- Answer submit is idempotent per `(interviewId, questionId)` — re-submit upserts (`repository_gorm.go:62`).
- `complete` is idempotent — re-completing returns the existing report (`service.go:265`).
- Generated turns are cached once per slot (`ensureGenerated`, `service.go:428`) — a resume shows the
  exact text, never a re-roll. **Caveat:** a partial/cancelled generation must **not** be cached
  (leave the slot ungenerated so resume regenerates cleanly — `006`/`011`).

## Cancellation

- **Client-initiated:** the frontend aborts the `fetch`/`EventSource` (an `AbortController`, `007`)
  and optionally POSTs `/interviews/:id/cancel` (`006`). Closing the connection cancels the request
  `ctx`, which cancels the `openai-go` stream (stops generation + billing).
- **Out-of-band cancel** (cancel a stream started by another request/tab): a per-instance **cancel
  registry** — `map[sessionID]context.CancelFunc`, mutex-guarded — lets the `/cancel` handler abort
  the running stream. Registered when a stream starts, removed when it ends.
- **Post-cancel state:** the answer + `currentIndex` are persisted before generation begins (`006`
  step 2), so cancelling loses only the un-generated next-question text, which resume regenerates.

## Multiple conversations

- **Historical:** already supported — the History list (`interviewsList`) shows all past sessions;
  opening one re-fetches it. Streaming doesn't change this.
- **Concurrent active:** blocked today by the one-active-session rule. If the product ever wants
  parallel live interviews per user, that rule (and the connection registry keying) must be relaxed
  — an explicit product+infra decision (`014`), out of scope for the text-streaming phases.

## Scaling considerations

**Instance-local connections.** Each SSE stream (and each WebSocket) is a connection to **one** App
Runner instance. Because a stream is a single HTTP request served start-to-finish by one instance, an
SSE turn needs **no sticky sessions** — the browser opens a new stream per turn, and any instance can
serve it (it reads/writes the shared DB). This keeps horizontal scaling simple for the text phases.

**The cancel registry is per-instance.** A `/cancel` request must reach the instance holding the
stream. Options, in increasing complexity:
- Accept best-effort: if `/cancel` lands on another instance, it no-ops and the client abort +
  request-context cancel (from closing the connection) still stops generation. **Recommended for the
  text phases** — closing the SSE connection is the reliable cancel; `/cancel` is a helper.
- If a guaranteed out-of-band cancel is required later, add a shared coordination channel (e.g.
  Postgres `LISTEN/NOTIFY` or a small pub/sub) — deferred until a phase needs it (`014`).

**Connection budget.** Streaming raises concurrent-open-connections per instance (each active turn
holds one). Combined with App Runner's per-instance connection/timeout limits, this changes
autoscaling math — **must be load-tested on the real service before Phase 2** (`013`, `014`).

**WebSocket (voice) affinity.** A long-lived voice WebSocket *does* bind a user to one instance for
the call's duration. That's acceptable for a single duplex call (no fan-out), but any multi-party or
server-push-to-arbitrary-user feature would need a shared connection layer — a voice-phase concern.

## Auth for connections

- **SSE over `fetch`:** the normal `Authorization: Bearer` header carries through (`005`/`007`);
  ownership is checked in the service exactly as today (`service.load`, `service.go:398`).
- **WebSocket (voice):** the handshake can't send the header, so mint a **short-lived, single-use
  ticket** via an authed `POST`, pass it in the WS URL, validate + burn it on upgrade, then bind the
  connection to the authenticated user (`005`, `014`). The JWT revocation denylist
  (`middleware/auth.go:54`) should also gate ticket issuance.

## Invariants preserved

- One active interview session per user (unless explicitly relaxed).
- Session ownership enforced server-side on every streaming and non-streaming call.
- The connection is never the source of truth — a lost connection never loses committed conversation
  state, because every committed turn is a DB row re-fetchable via `GET /interviews/:id`.

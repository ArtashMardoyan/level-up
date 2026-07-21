# 004 - Target Architecture

The end-state the migration builds toward, and the incremental shape that gets us there without
breaking the live chat. Concrete transport mechanics are in `005`–`008`; this doc is the map.

## Design goals (from the brief)

Support, incrementally and without breaking today's chat:
- Streaming responses + token-by-token rendering
- A persistent, real-time channel (WebSocket where bidirectional is required)
- Future Voice Chat and a future Realtime AI Interview
- Session management, multiple conversations, streaming cancellation, reconnection
- Scalability and error recovery

## The layered target

```
┌─────────────────────────────────────────────────────────────┐
│ React SPA                                                     │
│  InterviewChat (unchanged UX, new render path)               │
│   ├─ transport client:  fetch (today) │ SSE │ WebSocket      │  ← pluggable
│   ├─ token reducer: appends deltas to the streaming bubble   │
│   └─ recovery: on drop → GET /interviews/:id (already works) │
└───────────────▲──────────────────────────────┬──────────────┘
                │ stream of events              │ control (cancel, start)
┌───────────────┴──────────────────────────────▼──────────────┐
│ Gin backend                                                   │
│  streaming handler (SSE/WS) ── AND ── existing JSON handler   │  ← both live
│   └─ interview.Service (source of truth, unchanged contract)  │
│        ├─ stream generation deltas → transport                │
│        ├─ persist the final turn (same tables)                │
│        └─ evaluate answer (background / non-streamed)         │
└───────────────┬──────────────────────────────┬──────────────┘
                │ streamed tokens               │ structured JSON
┌───────────────▼──────────────┐  ┌─────────────▼──────────────┐
│ OpenAI Chat Completions       │  │ OpenAI (eval, structured)  │
│  stream=true (question prose) │  │  JSON-object (scores)       │
└───────────────────────────────┘  └────────────────────────────┘
        (later phases: OpenAI Realtime API for voice — 005)
```

The **service layer and persistence are the stable core**; only the **transport** and the
**OpenAI call mode** change, and they change additively.

## What streams and what doesn't (the central decision)

The chat's only user-visible AI prose is the **next-question bubble** = `reaction` + `question`
(`InterviewChat.jsx:11` `questionText`). Per-answer scores were deliberately removed from the chat
and live only on Results (`docs/interview/STATUS.md`). Therefore:

| AI output | User-visible in chat? | Stream token-by-token? |
|---|---|---|
| `reaction` + `question` (next-question bubble) | **Yes** | **Yes** — the primary streaming target |
| `modelAnswer` (Sample-answer button) | Only on demand | No — fetch when the button is pressed, or send at stream end |
| `feedback` + rubric scores (`Evaluate`) | No (Results screen only) | No — structured JSON, arrives whole (`008`) |
| Whisper transcript | Fills composer | No — short one-shot result |

**Consequence:** token streaming maps onto exactly one call — `Generate`. This is what makes the
migration tractable: we stream one well-defined thing, and the scoring path is untouched.

## Latency re-shaping (independent of transport)

Today `SubmitAnswer` runs Evaluate **then** Generate in series inside one request (`003`). Target:

1. On answer submit, **start streaming the next question immediately** (Generate) — first token in
   ~500 ms instead of after the eval call.
2. Run **Evaluate concurrently / in the background**; its result is needed only for the Results
   screen and for `currentIndex` bookkeeping, not for the chat bubble. Persist it when it lands.

This alone roughly halves perceived turn latency and is possible because the two calls are already
independent (`008`, `010`). It can ship even before full token streaming (see `012` Phase 2 vs 4).

## Transport progression (detail in 005)

- **Text streaming (Phases 2–5): Server-Sent Events (SSE), server→client.** Question generation is
  one-directional (server pushes tokens). SSE needs no new protocol, works through Gin
  (`c.Stream` / flush), survives the existing CORS setup, and reconnects trivially. Recommended
  first transport.
- **Voice / realtime (Phases 6–8): WebSocket** (bidirectional) and/or the **OpenAI Realtime API**.
  Two-way, low-latency audio needs a duplex channel SSE can't provide. Introduced only when voice
  arrives — the text phases don't pay the WebSocket complexity tax.

## Multiple conversations

Sessions are already independent, per-user rows keyed by id, with **one active session per user**
enforced by a partial unique index (`migrations/00013`). The streaming layer keys a live
connection/stream by `(userID, sessionID)`; multiple *historical* conversations already work
(History list). Concurrent *active* streams for one user are out of scope unless the one-active-session
rule is relaxed (`014`).

## Cancellation

The target adds an explicit **cancel** signal (SSE: client closes the `EventSource` + a `DELETE`/abort
endpoint; WS: a `cancel` control message). The server maps it onto `context.CancelFunc` for the
in-flight OpenAI stream, stops billing, and persists whatever partial state is safe (`009`, `011`).

## Reconnection

Because the chat rebuilds from `GET /interviews/:id` (`003`), reconnection is **already solved at the
data layer**: a dropped stream → re-fetch the session → resume rendering. The streaming layer adds a
*nicer* reconnect (resume mid-token via a stream cursor) but never *depends* on it — the fallback is
always the working full-fetch (`009`, `011`).

## Scalability

- Streaming holds a connection open per active turn. On App Runner (single service, autoscaled
  instances) this raises per-instance concurrency and changes timeout math — **must be verified on
  the real service** (`013`, `014`).
- The current full-row `UpdateSession` (`Save`) on the `generatedQuestions` cache is a
  read-modify-write that streaming makes more frequent; documented as a concurrency risk to address
  (`013`).
- No sticky-session requirement for SSE/one-shot streams (each stream is one request to one
  instance). A future WebSocket voice layer may need connection affinity or a shared coordination
  layer if fan-out is added (`009`).

## Non-negotiable invariants carried forward

1. Backend is the source of truth; the chat rebuilds from the server (`009`).
2. The chat never hard-fails on an AI error — degrade to raw bank text / placeholder (`011`).
3. Auth, session ownership checks, and the one-active-session rule are unchanged.
4. The existing JSON endpoints keep working throughout the migration (`012`).

# 005 - WebSocket Strategy

Which real-time transport to use, when, and why. **Recommendation: SSE-first for text streaming,
WebSocket (and/or the OpenAI Realtime API) only when voice/bidirectional arrives.** The evolution
path (`001`) reaches WebSockets at the voice phase, not before.

## The three candidate transports

| | **SSE** (Server-Sent Events) | **Chunked HTTP** (raw `Transfer-Encoding: chunked`) | **WebSocket** |
|---|---|---|---|
| Direction | Server → client only | Server → client only | Full duplex |
| Framing | Built-in `event:`/`data:` frames | You invent the framing | Message frames |
| Reconnect | Built-in (`Last-Event-ID`) | Manual | Manual |
| Browser API | `EventSource` (or `fetch` + `ReadableStream`) | `fetch` + `ReadableStream` | `WebSocket` |
| Auth via header | ✗ `EventSource` can't set headers | ✓ `fetch` sets `Authorization` | ✗ handshake can't set custom headers |
| Gin support | `c.Stream` / `c.SSEvent` + flush | `c.Writer.Write` + `Flusher.Flush` | via `gorilla/websocket` (new dep) |
| Fits current stack | ✓ no new dep, reuses CORS/JWT | ✓ no new dep | adds a dependency + upgrade path |
| Good for | **Token streaming (text chat)** | Token streaming | **Voice / realtime bidirectional** |

## Recommendation by phase

### Phases 2–5 (Streaming Text Chat): SSE — but sent over `fetch`, not `EventSource`

Question generation is **one-directional**: the server pushes tokens, the client only listens. That
is exactly SSE's shape. Use SSE **framing** but deliver it through the **`fetch` + `ReadableStream`**
reader rather than the native `EventSource`, because:

- **Auth.** The app authenticates with an `Authorization: Bearer` header from localStorage
  (`api.js:20`). Native `EventSource` **cannot set headers** — it only sends cookies. `fetch` can set
  the header, so the streaming client reuses the exact same auth the rest of the app uses. (Native
  `EventSource` would force a query-string token or a cookie — both worse; see `013`/`014`.)
- **Same transport client, extended.** `src/services/api.js` already centralizes `fetch` + auth +
  the `{data}`/`{error}` envelope. A streaming variant (`requestStream`) lives right beside it,
  reading the body as a stream and parsing SSE frames, keeping one auth/error story (`007`).
- **No new backend dependency.** Gin streams with `c.Stream(func(w) bool { ... })` or
  `c.Writer.Write` + `c.Writer.Flush()`; the SSE content type is `text/event-stream`. CORS already
  allows the origin and the `Authorization` header (`main.go:72`).
- **Trivial recovery.** A dropped SSE stream → fall back to `GET /interviews/:id` (already the
  reconnect primitive, `009`). SSE's `Last-Event-ID` can later enable mid-stream resume, but the
  full-fetch fallback means we never *need* it.

**Event shape (proposed, `006`/`008`):**
```
event: delta   data: {"text":"Great, "}          ← streamed question tokens
event: delta   data: {"text":"now walk me "}
event: done    data: {"questionId":"…","index":3,"reaction":"…","question":"…"}
event: error   data: {"message":"…","recoverable":true}
```
The terminal `done` frame carries the fully-assembled, canonical turn (so the client's rendered
tokens are reconciled against the authoritative text the server persisted — `010`).

### Phases 6–8 (Voice / Realtime): WebSocket and/or the OpenAI Realtime API

Voice is **bidirectional and continuous** — the client streams mic audio up while the server streams
audio/text down, concurrently. SSE cannot send client→server mid-stream; this needs a duplex channel:

- **WebSocket** (`gorilla/websocket`, a new dep) for a Level-Up-owned duplex channel — the browser
  streams audio frames up, the server relays transcription/response/audio down.
- **OpenAI Realtime API** — OpenAI's own low-latency speech-to-speech WebSocket. The Go backend
  becomes a **relay/broker**: it holds the client WebSocket and a server-side connection to OpenAI
  Realtime, bridging audio both ways while keeping the API key server-side (never in the browser)
  and enforcing auth/session rules. This is the natural end-state for "Realtime AI Interview"
  (`012` Phase 8) and is evaluated then, not now.

WebSocket auth: the handshake can't set an `Authorization` header from the browser either, so use a
**short-lived, single-use ticket** — a normal authed `POST` mints a token, the WS URL carries it as a
query param, the server validates + burns it on upgrade (`009`, `014`).

## Why not WebSocket for the text phase too?

It would work, but it buys nothing the text chat needs and costs real complexity:
- The text chat is one-directional; a duplex channel is overkill.
- WebSocket adds a dependency, an upgrade handshake, a connection registry, heartbeats/ping-pong, and
  its own reconnect/backoff logic — all of which SSE gives for free or doesn't need.
- App Runner + WebSocket needs its own verification (idle timeouts, connection limits) that SSE
  (an ordinary long-lived HTTP response) mostly sidesteps (`013`, `014`).

Adopting WebSocket *later* (for voice) is clean: it's a new endpoint next to the SSE one, and the
text chat keeps using SSE. We don't retrofit the text chat onto WebSocket.

## App Runner reality check (must verify before Phase 2 — `014`)

- Confirm App Runner does not buffer/limit `text/event-stream` responses and that its request/idle
  timeouts accommodate a multi-second (occasionally 30 s) generation stream.
- Confirm WebSocket support + idle-timeout behavior before Phase 6.
- Confirm no intermediate proxy strips `Flush` semantics. If streaming is degraded by the platform,
  the fallback is the existing blocking endpoint (no user-facing breakage — the whole point of the
  additive approach).

## Decision summary

- **Text streaming → SSE framing over `fetch`** (Bearer auth preserved, no new deps, reuses recovery).
- **Voice/realtime → WebSocket**, likely brokering the **OpenAI Realtime API** server-side.
- Both are **additive endpoints** alongside the existing JSON routes; nothing is removed to add them.

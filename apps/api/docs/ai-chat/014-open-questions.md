# 014 - Open Questions

Decisions the team must make before/within the implementation phases. Each has a recommendation
where the analysis supports one; the rest need product or infra input. Ordered by when they block
work.

## Must resolve before Phase 2

### Q1. Does App Runner stream `text/event-stream` (and later WebSocket) acceptably?
- **Why it blocks:** the whole streaming plan assumes prompt flushing + long-lived connections
  (`013` B1).
- **How to answer:** a spike endpoint that emits timed tokens, measured on the real service (idle
  timeout, buffering, connection cap).
- **Recommendation:** treat this as the **Phase 2 gating experiment** — do it first; if it fails,
  resolve the platform issue (config, or an alternative like a streaming-friendly hop) before
  building 3–5.

### Q2. Text-streaming transport: SSE, chunked HTTP, or WebSocket?
- **Recommendation: SSE framing delivered over `fetch` + `ReadableStream`** — preserves Bearer-header
  auth, no new dependency, trivial recovery (`005`). Reserve WebSocket for voice.
- **Open sub-point:** confirm no corporate proxy/CDN in front of Pages↔App Runner strips streaming
  (unlikely given direct App Runner calls, but verify).

### Q3. Where does `Evaluate` run in the streaming turn?
- **Recommendation:** concurrently in a **background goroutine**, persisted when it lands (`006`/`010`)
  — the chat bubble doesn't depend on it.
- **Open sub-point:** if a future product change puts score/feedback back into the chat, this
  decision reverses. Confirm with the interview product owner that scores stay Results-only
  (currently true — `docs/interview/STATUS.md`).

## Must resolve within Phase 4 (OpenAI streaming)

### Q4. How is the generation prompt/format changed to stream prose?
- **Options:** (a) keep JSON-object mode, stream only the `question` value (preserves single-call
  economy, harder to stream cleanly); (b) prompt for **plain prose** and get `modelAnswer` via a
  separate small call or delimited section (simplest to stream, may add a call).
- **Recommendation:** lean (b) for streaming cleanliness unless the extra call's latency/cost is
  unacceptable; bump `SchemaVersion`; **re-run the live paraphrase-quality checks** the interview team
  relied on (`013` D2).
- **Open sub-point:** does streaming keep `modelAnswer` (Sample-answer button) working without an
  extra user-visible delay? (Fetch it lazily on button press if needed — `008`.)

### Q5. Retry/degrade semantics once tokens have flushed.
- **Recommendation:** retry only **before the first delta**; after that, **degrade** (no retry) to
  avoid duplicated/garbled bubbles (`008`/`011`). Confirm this is acceptable product behavior (a rare
  mid-stream failure yields a re-fetch, not a re-typed message).

## Must resolve before the voice phases (6–8)

### Q6. Voice architecture: client STT → text stream, or OpenAI Realtime API broker?
- **Trade-off:** reusing the existing Whisper `transcribe` path (record → text → stream) is far
  simpler and already partly shipped; the **OpenAI Realtime API** gives true low-latency
  speech-to-speech but needs a WebSocket broker, cost analysis, and App Runner WS verification
  (`005`/`008`).
- **Recommendation:** ship Phase 6 on the existing transcribe path; **spike** the Realtime API behind
  a flag in Phase 7 before committing.

### Q7. WebSocket auth mechanism.
- **Recommendation:** short-lived, single-use **ticket** minted by an authed `POST`, passed in the WS
  URL, validated + burned on upgrade, gated by the JWT revocation denylist (`005`/`009`). Confirm
  ticket TTL and storage (in-memory per instance vs. shared).

### Q8. Instance affinity for long voice calls.
- **Open:** a duplex voice WebSocket binds a user to one instance for the call. Acceptable for a
  single call with no fan-out (`009`); confirm App Runner keeps the connection pinned and that
  autoscaling/deploys don't drop active calls (or that the client reconnects gracefully).

## Product / policy questions (owner: interview product, `docs/interview/**`)

### Q9. Do we ever allow concurrent active interviews per user?
- **Current:** one active session per user (partial unique index, `migrations/00013`).
- **Impact:** relaxing it changes the connection-keying and the one-active rule (`009`). Default
  **no** unless the product asks.

### Q10. Cancellation UX expectations.
- **Open:** on Stop, keep the partial question bubble or discard it? (`007`/`011` currently suggest
  discard + re-enable composer.) Product to confirm.

### Q11. Observability/cost budget for streaming + realtime.
- **Open:** what fallback rate is "healthy" (`011`)? What's the cost ceiling for realtime audio
  models (Q6)? Needed to greenlight Phases 7–8 (`012`).

## Answered by this package (recorded so they aren't re-litigated)

- **Which call streams?** The next-question generation (`reaction`+`question`); evaluation stays
  structured/non-streamed (`004`/`008`).
- **Is reconnection a new system?** No — it reuses `GET /interviews/:id` (`009`).
- **Do we rewrite the chat component/module?** No — additive streaming paths beside the existing ones
  (`006`/`007`/`012`).
- **Where do OpenAI calls run?** Server-side only, always (`008`).

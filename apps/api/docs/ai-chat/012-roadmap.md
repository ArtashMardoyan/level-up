# 012 - Roadmap

Phased migration. **Every phase is independently deployable and keeps the live chat working.** Each
lists Goals / Scope / Risks / Dependencies / Success criteria. Backend deploys via `make deploy`
(App Runner); frontend via push to `master` (Pages). Keep Postman + docs in sync (`CLAUDE.md`).

The additive rule throughout: new streaming endpoints/transports land **beside** the existing JSON
ones (`POST /interviews/:id/answers/:questionId` stays until Phase 5 explicitly retires it).

---

## Phase 1 — Architecture Documentation ✅ (this package)

- **Goals:** understand the existing chat; propose the streaming/voice/realtime target; define this
  roadmap; document risks and open questions.
- **Scope:** `docs/ai-chat/**`. No production code.
- **Risks:** none (docs only).
- **Dependencies:** read access to both repos + `docs/interview/**`.
- **Success criteria:** another engineer can implement the migration from these docs; risks and open
  questions are captured (`013`, `014`). **Met.**

---

## Phase 2 — Backend Streaming Foundation

- **Goals:** stand up the streaming transport + concurrency re-shaping server-side, without any
  frontend change and without touching the existing endpoint.
- **Scope:**
  - `StreamSink` abstraction + SSE writer (`006`).
  - `POST /interviews/:id/answers/:questionId/stream` handler that, for now, may internally reuse the
    **blocking** `Generate` but deliver its result as a single `done` frame (proves the transport
    end-to-end before real token streaming).
  - Move `Evaluate` to a background goroutine; persist parity verified against the blocking path
    (`010`).
  - Cancel plumbing: request-context cancel on disconnect; optional `/interviews/:id/cancel`.
  - **App Runner streaming verification** (the gating experiment — `005`/`013`/`014`).
- **Risks:** App Runner may buffer/limit `text/event-stream` (mitigation: verify first; fallback is
  the blocking endpoint). Background-eval concurrency bugs (mitigation: persistence-parity test).
- **Dependencies:** Phase 1; a decision on SSE vs chunked (`014`, recommended SSE).
- **Success criteria:** an authed client can hit the stream endpoint and receive a `done` frame with
  a correct turn; DB rows are identical to the blocking path; disconnect cancels server work;
  streaming confirmed working on the real App Runner service.

---

## Phase 3 — Frontend Streaming (transport client + render path)

- **Goals:** the UI can consume a streaming endpoint and render a growing bubble, even if tokens
  arrive coarsely.
- **Scope:**
  - `requestStream` beside `api.js` (SSE-over-`fetch`, Bearer auth, `AbortController`) + an
    `interviewSubmitAnswerStream` wrapper (`007`).
  - `InterviewChat` streaming submit path: empty AI bubble + `streaming` flag, `onDelta` append,
    `done` reconcile, error → `interviewGet` fallback (`007`/`011`).
  - Feature-flag streaming vs. the existing blocking `submit` so it can be toggled/rolled back.
- **Risks:** SSE frame parsing edge cases; scroll/jank with rapid `setMessages`. Mitigations:
  reconcile on `done`; reuse the near-bottom scroll effect (`:94`); keep the blocking path as flag-off.
- **Dependencies:** Phase 2 endpoint live.
- **Success criteria:** with the flag on, a turn renders progressively and ends on the canonical
  text; with it off, behavior is byte-identical to today; a dropped stream recovers via re-fetch.

---

## Phase 4 — OpenAI Streaming (real token-by-token)

- **Goals:** replace the "blocking Generate delivered as one `done`" with genuine token streaming
  from OpenAI.
- **Scope:**
  - `GenerateStream` on the AI client via `openai-go` streaming (`008`).
  - Prompt/format decision for streaming prose (JSON-field vs plain prose + separate `modelAnswer`);
    bump `SchemaVersion`; keep deterministic greeting/skip overrides (`008`).
  - Retry-before-first-token-only policy; stream timeout (`008`/`011`).
- **Risks:** partial-JSON rendering if JSON-object mode is kept (mitigation: stream prose, not JSON —
  `008`); model wording regressions from prompt changes (mitigation: the paraphrase-quality work in
  `docs/interview/STATUS.md` must be re-validated live).
- **Dependencies:** Phase 3 render path.
- **Success criteria:** first token typically < ~800 ms; the fully-streamed text equals the persisted
  canonical text; degrade-to-bank-text still works with `OPENAI_API_KEY` unset; interview paraphrase
  quality unchanged vs. today (re-verify per the interview reaction/quality checks).

---

## Phase 5 — Streaming Polish

- **Goals:** make streaming the default and production-grade; retire the interim path if desired.
- **Scope:**
  - Stop indicator/cancel UX (`007`); reconnect UX; "reconnecting" state.
  - Observability: stream lifecycle logs + degrade-cause counters (`011`).
  - Stream the **first question** (`POST /interviews/stream`) too (`006`/`010`).
  - Flip the default to streaming; optionally deprecate (not delete) the blocking submit, or keep it
    as the documented fallback.
  - Load-test concurrent streams on App Runner; tune autoscaling/timeouts (`009`/`013`).
- **Risks:** connection-budget/scaling surprises under real concurrency (mitigation: load test;
  keep the blocking fallback).
- **Dependencies:** Phases 2–4.
- **Success criteria:** streaming is the default for all users, healthy under load, with metrics
  proving low fallback rates; the "Streaming Text Chat" milestone of the evolution path is complete.

---

## Phase 6 — Voice Recording (answer by voice, already partly shipped)

- **Goals:** first-class voice **input** for answers. (A record→transcribe→fill-composer flow already
  ships — `003`; this phase hardens/extends it toward realtime.)
- **Scope:** solidify `MediaRecorder` capture + `/interviews/transcribe` (Whisper) UX; language
  pinning (already done); optional streaming/partial transcription; groundwork for the WS transport.
- **Risks:** browser mic/codec variance; large uploads vs. the 25 MB cap (`main.go:80`).
- **Dependencies:** none hard (independent of text streaming), but best sequenced after Phase 5.
- **Success criteria:** reliable voice-to-text answers across target browsers; the composer flow is
  robust; no regression to text answering.

---

## Phase 7 — Realtime Voice

- **Goals:** low-latency, bidirectional voice — the candidate speaks and hears the interviewer
  without the record→upload→transcribe round-trip.
- **Scope:**
  - WebSocket transport (`005`): `gorilla/websocket` (new dep), ticket-based auth, connection
    registry, heartbeats.
  - Backend **broker** to the **OpenAI Realtime API** (`008`): relay audio/text both ways, key stays
    server-side, session/ownership/degrade rules applied.
  - Frontend voice mode (mic up / audio down) as a third transport beside `request`/`requestStream`.
  - App Runner **WebSocket** verification (idle timeouts, limits — `005`/`013`).
- **Risks:** realtime infra complexity; instance affinity for long calls (`009`); cost of realtime
  audio models; App Runner WS limits. Mitigations: keep text streaming and record-answer flows intact
  as fallbacks; spike the Realtime API behind a flag first.
- **Dependencies:** Phase 6; the WS strategy decisions in `005`/`014`.
- **Success criteria:** a user can hold a spoken exchange with acceptable latency; falls back to text
  streaming on failure; no impact on non-voice users.

---

## Phase 8 — Realtime AI Interview

- **Goals:** the full realtime experience — continuous spoken interview with live reactions, the
  end of the evolution path.
- **Scope:** compose Phases 5+7 into the complete interview flow (spoken questions, spoken answers,
  live scoring behind the scenes feeding the same Results); adaptive follow-ups (product-owned,
  `docs/interview/015`); persistence parity with the text interview so History/Results/Reports work
  identically regardless of modality.
- **Risks:** highest complexity + cost; product/UX questions (barge-in, interruptions, turn-taking);
  grading a spoken interview (reuse the text rubric on transcripts).
- **Dependencies:** all prior phases; product spec from `docs/interview/**`.
- **Success criteria:** a candidate completes an end-to-end realtime spoken interview that produces
  the same durable session/report as a text interview; graceful degradation to text at every layer.

---

## Sequencing notes

- Phases **2→5** deliver the "Streaming Text Chat" milestone and are the highest-value, lowest-risk
  block — do them first and fully.
- Phase **2's App Runner verification is a gate**: if streaming isn't viable on the platform, resolve
  that (config/proxy/alternative) before investing in 3–5.
- Phases **6→8** (voice/realtime) are a larger, costlier program with open product questions (`014`);
  greenlight them after the text streaming milestone proves the transport + persistence model in prod.

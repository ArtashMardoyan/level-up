# AI Chat migration — STATUS / Handoff

> Read this first when continuing the AI Chat migration. It records what this phase produced, the
> state of the underlying chat, and how to continue. The full spec is the other files in this
> folder (`001`–`014`); this file is the live status on top.

_Last updated: 2026-07-21._

## Where we are

- **Phase 1 (Architecture Documentation) — DONE (this package).** The existing AI Chat is fully
  documented from the real code, a target streaming/voice/realtime architecture is proposed, and a
  phased, independently-deployable roadmap is defined (`012`).
- **Phase 2 (Backend Streaming Foundation) — DONE (not deployed).** SSE transport (`StreamSink` +
  `sseSink`), `POST /interviews/:id/answers/:questionId/stream` beside the untouched blocking route,
  answer persisted immediately + evaluation moved to a background goroutine, disconnect cancels via
  request context. Persistence parity with the blocking path verified (unit + live). No `/cancel`
  endpoint (connection-close cancellation suffices).
- **Phase 3 (Frontend Streaming) — DONE (not deployed), branch `feature/streaming-chat`.**
  `requestStream` (SSE-over-`fetch`, Bearer auth, `AbortController`) + `interviewSubmitAnswerStream`;
  `InterviewChat` gained a flag-gated streaming submit path (live bubble + reconcile-on-done +
  re-fetch recovery) beside the unchanged blocking path. Flag `STREAMING_CHAT` (`src/config/features.js`).
- **Phase 4 (OpenAI Streaming) — DONE (not deployed).** `GenerateStream` streams the visible prose
  token-by-token via `openai-go` `NewStreaming`, using a **one-call sentinel-delimited** format
  (`###QUESTION###` / `###ANSWER###`); model answer parsed off the tail, never streamed. Shared
  `questionGuidance` keeps blocking + streaming prompts in sync. Retry only before the first token.
  Verified live against real OpenAI (genuine token deltas, no sentinel leakage, parity on resume).
- **Phase 5 (Streaming Polish) — PARTIAL (not deployed).** Shipped: backend stream **observability**
  (one structured line/turn — TTFT, delta count, outcome; degrade vs. cancel distinguished), a
  visible **reconnecting** state, and the **streaming caret**. **Deferred by decision:** flipping the
  default to streaming (gated on the App Runner SSE check — see below), streaming the **first**
  question (`POST /interviews/stream` — invasive Setup→Chat restructure, low value), and the
  concurrent-stream **load test** (needs a deploy). No Stop button — the streamed content is a short
  next-question, so cancel-mid-generation has weak semantics here; revisit with the voice phases
  where longer streamed content appears.
- **Phases 6–8 — NOT STARTED** (Voice Recording → Realtime Voice → Realtime AI Interview, `012`).

> **Nothing is deployed.** Backend Phases 2/4/5 are uncommitted in the working tree; frontend
> Phases 3/5 are on `feature/streaming-chat`. Streaming ships **off by default** — enable per-env
> (`VITE_STREAMING_CHAT=true`) or per-browser (`localStorage.streamingChat='1'`).

## State of the underlying chat (what we're migrating)

The AI Chat is **shipped and live** as the AI Interview Coach (see `docs/product/interview/STATUS.md`):

- **Backend (live):** App Runner, region `us-east-2`, profile `vyb-dev`. Module
  `internal/modules/interview/`. Routes under `/interviews`, JWT-protected.
- **Frontend (live):** GitHub Pages, `#interview` route. `src/components/Interview*.jsx`.
- **Transport today:** plain JSON request/response over `fetch` (`src/services/api.js`). **No
  streaming, no WebSocket, no SSE anywhere in the codebase** (verified — `002`/`003`).
- **AI today:** `openai-go` v1.12.0, **non-streaming** Chat Completions in JSON-object mode
  (`internal/modules/interview/ai.go`), plus Whisper for voice-answer transcription.

## What this phase established (key findings that shape the migration)

- **The chat's only user-visible AI prose is the next-question bubble** (`reaction` + `question`).
  Per-answer score bubbles were **deliberately removed** from the chat (scores live only on the
  Results screen — `docs/product/interview/STATUS.md`). So token-by-token streaming maps cleanly onto the
  **question generation** call; the structured **evaluation** (scores JSON) does not need to stream
  to the user (`008`, `010`).
- **The submit round-trip runs two sequential blocking OpenAI calls** (Evaluate the answer, then
  Generate the next question) inside one HTTP request — this is the latency the user feels as the
  "thinking" dots (`003`, `service.go:140` `SubmitAnswer`). Streaming the generation call is the
  single highest-leverage change (`008`, `012` Phase 4).
- **The backend is already the source of truth and the chat rebuilds from `GET /interviews/:id`**
  on load (`012` state model / `service.go:101` `Get`). Streaming is a **transport** upgrade on top
  of an already-recoverable model — reconnection is "re-fetch the session", which already works
  (`009`).
- **SSE-first, WebSocket-for-voice** is the recommended transport sequencing (`005`). Text
  streaming is one-way (server→client) and fits Server-Sent Events / chunked HTTP without a
  protocol change; true bidirectional WebSocket (or the OpenAI Realtime API) is only required for
  the voice/realtime phases.

## Decisions made (were open in `014`)

- **Transport = SSE-over-`fetch`** (Bearer auth preserved, no new dep) — implemented in Phases 2–3.
- **Streaming format = one-call, sentinel-delimited** (`014` Q4) — implemented in Phase 4.
- **Evaluation runs in a background goroutine** during the streaming turn (`014` Q3) — Phase 2.

## The remaining blocker before streaming can go live (`013` B1 / `014` Q1)

- **App Runner must be verified to actually stream `text/event-stream`** — no response buffering,
  and request/idle timeouts that tolerate a multi-second (occasionally 30 s) generation. This needs
  a **deploy** + a measured check (the new per-turn TTFT/duration logs make this measurable). Until
  it passes, streaming stays **off by default**; flipping the default (Phase 5's remaining item) is
  blocked on it. The blocking endpoint remains the safe fallback regardless.

## Still open for the voice phases (`014`)

- Whether voice uses **client STT → text stream** (reuse today's Whisper path) or the **OpenAI
  Realtime API** end-to-end (`004`, `005`, `012` Phases 6–8).

## How to continue (for a new session)

- **Spec:** read this folder `001`–`014` **and** the product spec `docs/product/interview/**` (they are
  complementary — product there, transport/migration here).
- **Real code to re-read before Phase 2:** `internal/modules/interview/{handler,service,ai}.go`,
  `cmd/server/main.go` (CORS + body-limit middleware + wiring), `internal/config/config.go`
  (OpenAI), `src/components/Interview{Chat,Coach}.jsx`, `src/services/{api,endpoints}.js`.
- **Run locally:** backend `make run` (needs local Postgres + `.env` incl. `OPENAI_API_KEY`); seed
  with `go run ./cmd/seed`. Frontend `VITE_API_URL=<url> npm run dev`.
- **Do not break the live chat.** Every phase in `012` is additive and independently deployable;
  the existing `POST /interviews/:id/answers/:questionId` path stays until a phase retires it.

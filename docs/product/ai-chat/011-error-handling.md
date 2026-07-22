# 011 - Error Handling

Streaming introduces failure modes a one-shot request doesn't have (partial output, mid-stream drop,
half-open connections). The **governing invariant is unchanged: the chat never hard-fails on an AI
error** — it degrades (`003`, `service.go:448`, `report.go` `degraded`). Streaming must preserve that.

## Failure taxonomy

| Failure | When | Handling |
|---|---|---|
| **No AI client** (`OPENAI_API_KEY` unset) | Always, that deploy | `Generate` degrades to raw bank text; stream emits it as a single `done`. Same as today (`service.go:434` nil-AI branch). |
| **Generate fails before first token** | Transport/parse error at start | Retry once (pre-first-token only, `008`), then emit **bank text** as `done` — user sees a valid question, no error. Mirrors `service.go:448`. |
| **Generate fails mid-stream** | Connection to OpenAI drops after some tokens | Cannot retry (tokens already flushed). Emit `error{recoverable:true}`; client falls back to `GET /interviews/:id` and renders the persisted/fallback text. |
| **Evaluate fails** (background) | Concurrent eval errors | `degraded()` placeholder feedback, answer still counts; **does not affect the chat stream** (it's Results-only). Same as today (`service.go:227`). |
| **Client disconnects mid-stream** | User navigates away / network drop | Request `ctx` cancels → OpenAI stream + goroutines stop. Committed state (answer, index) survives; un-cached next question regenerates on resume. |
| **Timeout** | Generation exceeds the stream timeout | `ctx` deadline fires; if before first token → degrade to bank text; if mid-stream → `error{recoverable:true}` + client re-fetch. |
| **DB write fails** (persist answer/cache) | Rare | Fail the turn with a real error (`shared.Error` on the non-stream fallback, or `error` frame); do **not** proceed to stream a turn whose answer wasn't saved. |
| **App Runner buffers/limits the stream** | Platform | Detected in load-test (`013`); fallback is the existing blocking endpoint — no user breakage (additive design). |

## Never cache a partial generation

If a generation is cancelled or fails mid-stream, the slot in `generatedQuestions` must remain
**empty**, so a later `ensureGenerated` (`service.go:428`) regenerates it cleanly rather than
resuming a truncated question. Only a fully-assembled turn is cached (step 8, `010`).

## Retry policy under streaming

Today: one call + one retry on transport/parse failure (`ai.go:169`). Under streaming:
- **Before the first delta:** retry once (safe — nothing shown yet).
- **After the first delta:** no retry (would duplicate/garble the visible bubble). Degrade instead.

This split is the one genuinely new rule streaming imposes on the AI layer.

## Client-side handling (frontend)

Reuse today's error surface and add stream-specific states:
- **Pre-first-token error / empty stream:** show the returned `done` (bank text) — silent, correct.
- **Mid-stream `error` frame or reader exception:** set a "reconnecting" state, call
  `interviewGet(sessionId)` (the same call `SessionRunner` uses, `InterviewCoach.jsx:22`), rebuild
  via `initialMessages(view)` (`InterviewChat.jsx:16`), continue. On repeated failure, fall back to
  the blocking `interviewSubmitAnswer` path (still deployed) or surface `t('interviewSubmitError')`
  exactly as today (`:163`).
- **Abort (user pressed Stop):** drop the partial bubble, re-enable the composer, no error toast.
- **Network status 0** (offline): the existing `ApiError(0, 'network error')` (`api.js:34`) applies
  to the fallback fetch; show the standard retry affordance.

## Degradation ladder (most-graceful first)

1. **Full streaming** — tokens render live.
2. **Silent bank-text `done`** — AI unavailable/failed early; user sees a valid (un-paraphrased)
   question. Indistinguishable from a slow non-AI turn.
3. **Reconnect via full re-fetch** — mid-stream drop; brief "reconnecting", then the persisted
   transcript.
4. **Blocking-endpoint fallback** — streaming transport itself unavailable (platform/proxy); the
   existing `POST /interviews/:id/answers/:questionId` serves the turn (whole-message, as today).
5. **User-visible error + retry** — only if all of the above fail (e.g. the answer couldn't be
   persisted). Same copy as today.

Levels 2–4 are invisible-to-mildly-degraded; the user keeps interviewing. Level 5 is the current
worst case and is unchanged.

## Observability (recommended, not implemented)

- Log stream lifecycle: opened / first-token-latency / token-count / closed(reason) / cancelled /
  degraded. Distinguish **client-cancel** from **error** (they look similar at the socket).
- Count degrade events by cause (nil-AI, pre-token fail, mid-stream fail, timeout) to know whether
  streaming is actually healthy in prod vs. quietly always falling back.
- These are new signals streaming needs; today's blocking path has almost nothing to observe because
  it either returns JSON or a mapped error.

## What does not change

Sentinel-error → HTTP-status mapping for the non-stream endpoints (`handler.go:199`), the
`{error}` envelope, the 30 s per-call timeout default (`config.go:110`), the one-retry idea, and the
degrade-don't-fail invariant. Streaming layers new states **on top of** this, it does not replace it.

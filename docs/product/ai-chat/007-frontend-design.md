# 007 - Frontend Design

How the React app renders streamed tokens **without changing the chat's UX or breaking the current
render path.** Design proposal for future phases; nothing implemented yet.

## Principle: new render path, same component

`InterviewChat.jsx` already has the right shape for streaming — it just needs one message to grow
over time instead of arriving whole. We do **not** rewrite the component; we add a streaming submit
that appends deltas to a "live" bubble, and keep the existing blocking `submit` as the fallback.

## Transport client (new, beside `api.js`)

Add a streaming reader next to the existing one-shot `request` (`api.js:18`), reusing its auth +
base URL + error conventions:

```js
// requestStream(method, path, { json, onDelta, signal }) — POSTs like request(),
// but reads the response body as a stream, parses SSE frames, and calls onDelta
// per token. Returns the terminal payload (the `done` frame). Same Bearer auth,
// same BASE_URL, same ApiError semantics as request().
```

- Uses `fetch(..., { signal })` + `res.body.getReader()` + a `TextDecoder`, splitting on SSE frame
  boundaries (`\n\n`) and dispatching `delta` / `done` / `error` events (`005`, `008`).
- **Auth is unchanged** — the same `Authorization: Bearer` header from `authToken.js` (this is why
  SSE-over-`fetch` beats native `EventSource`, which can't set headers — `005`).
- **Cancellation** is an `AbortController`; aborting the fetch closes the stream and (with the
  `/cancel` endpoint) stops server generation (`006`).

Add matching wrappers in `endpoints.js`, e.g. `interviewSubmitAnswerStream(id, qid, payload,
{ onDelta, signal })`, mirroring the existing `interviewSubmitAnswer` (`endpoints.js:50`).

## Rendering the streaming bubble

Today `submit` (`InterviewChat.jsx:138`) appends the answer, sets `thinking=true`, awaits the whole
response, then appends the finished question bubble. The streaming version:

1. Append the user's answer bubble (unchanged, optimistic).
2. Append an **empty AI bubble** with a `streaming: true` flag, instead of the `thinking` dots.
3. `onDelta(text)` → append `text` to that bubble's `text` via `setMessages` (a functional update on
   the last message). The existing auto-scroll-when-near-bottom effect (`:94`) already handles
   keeping the growing bubble in view.
4. On `done` → replace the bubble's text with the canonical `questionText(done)` (reconcile against
   the authoritative server text — `010`), set `current = done`, clear `streaming`.
5. On `error`/abort → fall back: call the existing blocking `interviewGet(sessionId)` to re-sync, or
   surface `t('interviewSubmitError')` exactly as today (`:163`).

The message model barely changes — add `streaming: boolean` to the existing `{ id, text, kind, role,
skipped }` shape (`:145`). The "thinking dots" element (`:294`) stays as the pre-first-token
indicator (shown until the first `delta` arrives), then the bubble takes over.

## State management (unchanged philosophy)

Per `docs/product/interview/012` and the repo's React rules:
- **Backend is the source of truth; the frontend mirrors it.** Streaming changes *how* a message
  arrives, not *who owns it*. On any doubt (drop, error, reload), `GET /interviews/:id` rebuilds the
  transcript — the streaming bubble is transient UI on top of an authoritative, re-fetchable state.
- **No `setState` in effects.** All streaming state transitions happen in the fetch/stream callbacks
  (event handlers / async), which the lint rules already permit — same as today's `.then` at `:151`.
- **No new state library.** Local `useState` + `useRef` (for the reader/abort controller) suffice,
  matching the existing recorder/meter refs (`:64`).

## Cancellation UX

Add a **Stop** affordance while streaming (reuse the `Square` icon already imported at `:2` for the
recorder). Pressing it aborts the `AbortController` and, if wired, POSTs `/interviews/:id/cancel`.
The partial bubble stays or is dropped per `011`; the composer re-enables. This mirrors the existing
record/stop toggle pattern (`:354`).

## Reconnection UX

If the stream drops mid-message: show a subtle "reconnecting…" state, call `interviewGet(sessionId)`
(the exact call `SessionRunner` already uses at `InterviewCoach.jsx:22`), rebuild `messages` via the
existing `initialMessages(view)` (`:16`), and continue. Because resume already works, this is a
**re-use, not a new mechanism** (`009`).

## Voice (later phases)

Phase 6 keeps today's flow: `MediaRecorder` → `interviewTranscribe` → fill composer (`:178`), which
already works. Phase 7+ (Realtime Voice) adds a WebSocket client (a third transport beside `request`
and `requestStream`) that streams mic audio up and plays audio down; it reuses the ticket-based auth
from `005`/`009`. The chat component gains a "live voice" mode but the text mode is untouched.

## i18n / styling

- New strings (`interviewStreamStop`, `interviewReconnecting`, …) go in `src/i18n/strings.{en,ru,hy}.js`
  (the per-language files, merged by `strings.js` — `docs/product/interview/STATUS.md`), keeping en/ru/hy in
  sync.
- New styles use the existing `.aic-*` blocks in `src/index.css` (e.g. a `.aic-bubble.streaming`
  cursor/caret). No design-token changes; pull any visual spec from Claude Design per the
  `claude-design-sync-workflow` memory if the streaming bubble needs a defined look.

## What stays identical

The component tree (`InterviewCoach` → `SessionRunner` → `InterviewChat`), hash routing, the
`{data}`/`{error}` unwrap for non-stream calls, the resume-on-load behavior, the voice-transcribe
path, and the composer's Enter-to-send / Skip / Sample-answer / Record controls.

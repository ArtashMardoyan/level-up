# 001 - Overview

## What this is

Level Up has one conversational AI surface: the **AI Interview Coach chat**. The AI opens with a
greeting, asks a paraphrased interview question, the candidate answers (typed or by voice), and the
AI reacts and asks the next question — one at a time — then produces a scored report at the end.

This chat is **built, shipped, and live** (`docs/product/interview/STATUS.md`). It works over **plain
request/response HTTP**: the browser POSTs an answer, the Go backend calls OpenAI (blocking) and
returns the full next message as JSON. The user sees animated "thinking" dots for the entire
round-trip, then the complete message appears at once.

**This package plans the upgrade of that chat to a modern, real-time streaming experience** — the
kind of token-by-token rendering people expect from ChatGPT — and then, in later phases, voice and
a realtime AI interview. **We are upgrading the existing chat, not replacing it.**

## The evolution path

```
Current HTTP Chat  →  Streaming Text Chat  →  Voice Chat  →  Realtime AI Interview
   (today, live)         (tokens stream)       (speak +        (bidirectional,
                                                 hear)           low-latency)
```

Each arrow is one or more independently deployable phases (`012`). Nothing is a big-bang rewrite.

## What already exists (do not rebuild)

Confirmed from the code (`002`):

- **Auth** — JWT bearer, server-side revocation denylist (`internal/infrastructure/middleware/auth.go`).
- **AI Chat** — `internal/modules/interview/` (backend) + `src/components/Interview*.jsx` (frontend).
- **HTTP communication** — `src/services/api.js` (`fetch`, `{data}`/`{error}` envelope, `ApiError`).
- **Conversation persistence** — `interview_sessions` + `question_results` + `final_reports` tables;
  the AI-paraphrased chat text is cached per turn in `generatedQuestions` jsonb.
- **OpenAI integration** — server-side `openai-go` v1.12.0: JSON-object Chat Completions for
  question generation + answer evaluation, Whisper for voice-answer transcription (`ai.go`).
- **Prompt generation** — system + user prompts assembled in `ai.go` (`questionSystemPrompt`,
  `systemPrompt`).
- **Session lifecycle** — start → submit-answer (loop) → complete → report; one active session per
  user; full resume via `GET /interviews/:id`.

## What does NOT exist yet (the migration builds it)

Verified absent from the codebase:

- **No streaming of any kind** — no SSE, no chunked/`Transfer-Encoding: chunked` handlers, no
  `c.Stream`, no OpenAI streaming (`openai-go` is called with the blocking `.New(...)`).
- **No WebSocket** — no `gorilla/websocket`, no `nhooyr/websocket`, no upgrade handler; `go.mod` has
  no WS dependency.
- **No token-by-token rendering** — the frontend renders each message as one finished string.
- **No streaming cancellation** — an in-flight OpenAI call can only be abandoned by the 30s timeout.
- **No connection/reconnection layer** — "reconnect" today means re-run `GET /interviews/:id`.

## Guiding principles for the migration

1. **Never break the live chat.** The current `POST /interviews/:id/answers/:questionId` path is
   the production contract; new streaming transports land **alongside** it and only replace it when
   a phase explicitly says so (`012`).
2. **Additive, independently deployable phases.** Each phase ships on its own and is valuable on its
   own (`012`). A half-migrated system is always in a shippable state.
3. **Backend stays the source of truth.** Streaming is a **transport** change; persistence and
   resume semantics are unchanged (`009`). The chat already rebuilds from the server on load — keep
   that invariant, so a dropped stream degrades to "re-fetch the session".
4. **Reuse, don't reinvent.** Auth, sessions, persistence, the OpenAI client, the degrade-on-failure
   policy, and the `{data}`/`{error}` envelope all stay. We add a streaming path through them.
5. **Stream the prose, not the structure.** The user-visible chat text (the next-question bubble)
   streams token-by-token; the structured scoring JSON does not need to (`008`).
6. **Follow the Interview docs as the standard.** Same layout, depth, and conventions
   (`docs/product/interview/**`). This package is the sibling technical spec, not a competing one.

## Scope boundary

This package covers **transport, streaming, connection, and realtime architecture only**. All
product behavior — the rubric, the paraphrase-then-ask engine, scoring, reports, badges,
bilingual/trilingual support — is owned by `docs/product/interview/**` and is intentionally not re-specified
here. Where a migration decision touches product, this package points to the interview doc and
defers to it.

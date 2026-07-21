# AI Chat — modernization documentation

This folder specifies the **incremental migration of the existing AI Chat** (the AI Interview
Coach's chat) from today's blocking **request/response HTTP** model to a modern **real-time,
streaming** experience — and, in later phases, **voice** and a **realtime AI interview**.

> **Phase 1 is documentation only.** These docs describe the system **as it exists today**
> (grounded in the real code, not assumptions), propose a **target streaming architecture**, and
> lay out a **phase-by-phase migration roadmap**. No code is written, refactored, or modified in
> this phase. Every "current" statement cites the file it came from.

> **The AI Chat _is_ the Interview Coach chat.** There is no separate "AI chat" module in the repo.
> The one conversational AI surface in Level Up is the interview: the AI paraphrases a bank
> question, the candidate answers, the AI reacts and asks the next one. That chat is what we are
> upgrading. Its full product spec is the sibling package `docs/interview/**`; **this package is
> strictly about the technical migration to streaming/voice/realtime** and defers all product
> decisions to `docs/interview`.

> **Evolution path (the migration target).**
> ```
> Current HTTP Chat  →  Streaming Text Chat  →  Voice Chat  →  Realtime AI Interview
> ```
> Each arrow is one or more independently deployable phases (`012`). **Breaking the existing,
> shipped, live chat is not acceptable** — every phase keeps the current chat working.

> **Stack note.** Backend is **Go + Gin + GORM + PostgreSQL** (this repo, `internal/modules/interview/`);
> frontend is **React 19 + Vite, JSX (not TypeScript), hash routing** (`useHashRoute`). All OpenAI
> calls run **server-side** in Go (`openai-go`). Auth is JWT bearer. The chat is deployed and live
> (App Runner backend, GitHub Pages frontend). This package builds on that — it does not propose a
> rewrite.

## Reading order

1. `001-overview.md` — what exists, what we're building, the evolution path, guiding principles
2. `002-current-architecture.md` — the real frontend + backend architecture as built
3. `003-current-http-flow.md` — the exact request/response lifecycle today (the thing we replace)
4. `004-target-architecture.md` — the streaming/voice/realtime end-state, incremental
5. `005-websocket-strategy.md` — SSE-first vs WebSocket vs OpenAI Realtime; when to use which
6. `006-backend-design.md` — Go streaming design (handlers, service, transport) without breaking today
7. `007-frontend-design.md` — React streaming design (token rendering, transport client, state)
8. `008-openai-streaming.md` — streaming the OpenAI calls; what streams, what stays structured
9. `009-session-management.md` — sessions, connections, reconnection, cancellation, scaling
10. `010-message-lifecycle.md` — a message from keystroke to persisted turn, today vs streaming
11. `011-error-handling.md` — timeouts, partial streams, reconnect, degradation, recovery
12. `012-roadmap.md` — the phased migration plan (goals / scope / risks / deps / success criteria)
13. `013-architecture-review.md` — issues, tech debt, scalability & security risks found (documented, not fixed)
14. `014-open-questions.md` — decisions the team must make before implementation

## Working rules

- Before implementing a migration phase, read the relevant doc **and** the matching `docs/interview`
  product doc — this package intentionally does not repeat product behavior.
- If docs and implementation conflict, **fix the docs first**, then write code.
- Follow repo conventions: backend module layout (entity / dto / repository (+gorm) / service /
  handler), `shared.OK/Error`, goose migrations; frontend hash routing + `endpoints.js` wrappers +
  i18n (en/ru/hy) + CSS tokens. Keep the Postman collection in sync (backend `CLAUDE.md`).
- **Additive over destructive.** New streaming endpoints/transports land alongside the existing
  ones; the current `POST /interviews/:id/answers/:questionId` stays until a phase explicitly
  retires it (`012`).

# AI Interview Coach — documentation

This folder specifies the **AI Interview Coach**: a **chat** mock interview where the AI asks one
question at a time, scores each answer **0–100** (Correctness / Depth / Communication / Structure)
with feedback in the chat, then shows a final report and recommendations, and tracks History.

> **These docs are reconciled with the delivered design** `AI Interview Coach.dc.html` (Claude
> Design project "Level up Node.js review"). Screens: **Setup → Interview (chat) → Results → Review →
> History**. The MVP is **bilingual (RU + EN)** — language is chosen at Setup and drives questions,
> model answer, and AI feedback (`004`). **English coaching** (Learning Profile `007` + Dictionary
> `008`) is **deferred to post-MVP** (`014` v2) — those two docs are kept but marked DEFERRED.
> **Voice/audio interviews** and **AI strong/weak analysis** (mining the per-question scores captured
> from day one) are future (`015`); per-question data is persisted in the MVP to enable them.
>
> **Design gap:** the delivered `.dc.html` has **no language selector** yet — it must be added to the
> Setup screen in Claude Design (`011`/`016`).

> **Stack note (important).** These docs target the **real** Level Up codebase, not a generic
> stack. Backend is **Go + Gin + GORM + PostgreSQL** (this repo, `internal/modules/*`); frontend is
> **React 19 + Vite, JSX (not TypeScript), hash routing** (`useHashRoute`). All AI (OpenAI) calls
> run **server-side** through the Go backend. The feature builds on what already exists — JWT auth,
> users, the course/question bank, per-user progress, and the notifications module — not a
> localStorage-only MVP. (The first draft of these docs was written without repo access and named
> NestJS / React Router / TypeScript / localStorage; that has been corrected throughout.)

## Reading order

1. `001-product-overview.md`
2. `002-user-personas.md`
3. `003-user-journey.md`
4. `004-interview-engine.md`
5. `005-ai-prompts.md`
6. `006-ai-response-schema.md`
7. `007-learning-profile.md`
8. `008-dictionary-engine.md`
9. `009-recommendation-engine.md`
10. `010-data-model.md`
11. `011-ui-flow.md`
12. `012-state-management.md`
13. `013-technical-architecture.md` — includes the HTTP endpoint contract
14. `014-release-plan.md`
15. `015-future-ideas.md`
16. `016-design-brief.md` — the delivered design reference (screens/tokens as built in Claude Design)

## Working rules

- Before implementing a feature, read the relevant doc.
- If docs and implementation conflict, fix the docs first, then write code.
- Don't guess requirements — ask when unclear.
- Follow repo conventions: backend module layout (entity / dto / repository (+gorm) / service /
  handler), `shared.OK/Error`, goose migrations; frontend hash routing + `endpoints.js` wrappers +
  i18n (en+ru) + CSS tokens.

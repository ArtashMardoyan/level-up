# AI Interview Coach — documentation

This folder specifies the **AI Interview Coach**: a personalized loop that turns each mock
interview into future learning — interview → AI evaluation → learning profile → dictionary →
recommendations → next interview.

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
16. `016-design-brief.md` — visual brief for mocking up the screens in Claude Design (design-first)

## Working rules

- Before implementing a feature, read the relevant doc.
- If docs and implementation conflict, fix the docs first, then write code.
- Don't guess requirements — ask when unclear.
- Follow repo conventions: backend module layout (entity / dto / repository (+gorm) / service /
  handler), `shared.OK/Error`, goose migrations; frontend hash routing + `endpoints.js` wrappers +
  i18n (en+ru) + CSS tokens.

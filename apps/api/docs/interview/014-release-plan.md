# 014 - Release Plan

Phased, each shippable on its own (backend module + frontend screen), following the repo's
commit → push → deploy flow (Pages for frontend, App Runner for backend; migrations run on start).

## MVP

- `questions.difficulty` migration + seed.
- `interview` backend module: start / submit-answer (with per-answer AI evaluation) / complete
  (aggregate) — `interview_sessions`, `question_results`, `final_reports` migrations.
- **Bilingual (RU + EN)**: `language` on the session; serve the matching `question_translations` and
  evaluate/give feedback in that language.
- Per-question scores persisted for future strong/weak AI analysis (`010`/`015`).
- Server-side AI evaluation (OpenAI via Go), 0–100 rubric (Correctness / Depth / Communication /
  Structure) + response validation (`006`).
- Final report: overall score /100 + rubric averages + strengths/weaknesses + recommendations.
- Frontend (hash routes): Setup (+ confirm modal), Interview **chat**, Results, Review, History.

## Version 1.1

- Notification "report is ready".
- Recommendation quality (dedupe, difficulty ramp); trackable recommendations.
- Progress dashboard (scores over time); richer History filters.
- Performance: caching, tighter timeouts.

## Version 2 — English coaching (the deferred `007`/`008`)

- Learning Profile + personalized Dictionary; grammar/vocabulary rubric axes and feedback.
- Dictionary screen (per-user section on the existing Dictionary).

## Version 3

- **Voice / audio interviews**, speech-to-text + TTS (reuse `question_translations.audio`); AI
  follow-up questions in the chat.
- **Adaptive interviews** — question selection driven by the per-question history / Learning Profile
  (strong/weak targeting, `015`); company-specific tracks.
- Full multilingual support beyond RU/EN.

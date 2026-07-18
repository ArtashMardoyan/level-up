# 014 - Release Plan

Phased, each shippable on its own (backend module + frontend screen), following the repo's
commit → push → deploy flow (Pages for frontend, App Runner for backend; migrations run on start).

## MVP

- `questions.difficulty` migration + seed.
- `interview` backend module: start / save answer / complete, sessions + question results
  (migrations).
- Server-side AI evaluation (OpenAI via Go) + response validation (`006`).
- Final report.
- Interview Setup + Interview + Report screens (frontend, hash routes).
- LearningProfile create/update + Dictionary updates + Recommendations (basic).

## Version 1.1

- Better reports; progress dashboard (topic levels over time).
- Recommendation quality (dedupe, difficulty ramp).
- Notification "report is ready"; interview history screen.
- Performance: concurrent evaluation, timeouts.

## Version 2

- Voice interviews, speech-to-text, AI follow-up questions.

## Version 3

- Adaptive interviews (question selection driven by the Learning Profile), company-specific tracks.

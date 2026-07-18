# 012 - State Management

## Goal

Keep interview state predictable and recoverable. **The backend is the source of truth**; the
frontend holds only transient UI state and mirrors the server (same approach as `useReviewState`,
which persists per-user progress to the API and hydrates on load).

## Server-persisted (authoritative)

- Interview session + chosen questions (`InterviewSession`).
- Each saved answer (`QuestionResult.userAnswer`).
- Evaluation results, final report, learning profile, dictionary, recommendations.

## Frontend state (transient)

- Current question index, in-progress answer text (debounced auto-save to the API).
- Loading / evaluating / error flags per screen.
- Follow the repo's React rules: no `setState` inside effects (adjust during render behind a
  `prev !== next` guard, or set in event handlers / async callbacks — as done across the app).

## Rules

- Auto-save answers to the backend (debounced); retry on network failure.
- Restore an interrupted interview by fetching the session (`GET /interviews/:id`) on load.
- Prevent duplicate submissions / duplicate `complete` calls (guard + server idempotency).
- One active session per user (enforced server-side, `004`).

## Future

- Optimistic UI + background sync; offline draft answers.

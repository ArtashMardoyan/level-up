# 012 - State Management

## Goal

Keep interview state predictable and recoverable. **The backend is the source of truth**; the
frontend holds only transient UI state and mirrors the server (same approach as `useReviewState`,
which persists per-user progress to the API and hydrates on load).

## Server-persisted (authoritative)

- Interview session + chosen questions + `currentIndex` (`InterviewSession`).
- Each submitted answer and its evaluation (`QuestionResult`: score, rubric, feedback).
- Final report (overall score, rubric averages, strengths/weaknesses, recommendations).

## Frontend state (transient)

- The chat transcript is **rebuilt from the server** on load (questions + stored answers/feedback up
  to `currentIndex`), not held only in memory.
- In-progress answer text in the composer; per-screen loading / "thinking" / error flags.
- Follow the repo's React rules: no `setState` inside effects (adjust during render behind a
  `prev !== next` guard, or set in event handlers / async callbacks — as done across the app).

## Rules

- Submit answers to the backend explicitly (Submit button); retry on network failure.
- Restore an interrupted interview by fetching the session (`GET /interviews/:id`) on load and
  replaying its stored questions/answers/feedback into the chat.
- Submit is idempotent per `(interviewId, questionId)` — re-submit upserts the answer + re-evaluates.
- Prevent duplicate `complete` calls (guard + server idempotency).
- One active session per user (enforced server-side, `004`).

## Future

- Optimistic chat bubbles + background sync; offline draft answers.

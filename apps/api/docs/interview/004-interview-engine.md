# 004 - Interview Engine

## Overview

The Interview Engine manages the full interview lifecycle: session creation, question delivery,
answer collection, progress, AI evaluation, and completion. It lives in the Go backend as a new
module `internal/modules/interview` (same layout as `course`/`user`/`notification`).

---

## Goals

- Simulate a real technical interview.
- Keep the experience focused and distraction-free.
- Make interviews predictable and easy to extend.

---

## Where questions come from

Questions come from the **existing question bank** (`questions` + `question_translations`), not from
the AI. Each question gains a **`difficulty`** field (`easy` / `medium` / `hard`) via a goose
migration + seed update (see `010`). Session creation:

- Load the selected course (by slug) and its questions filtered by `difficulty`.
- Randomize and take the requested count (fall back to fewer if the bank is short).
- Snapshot the chosen question ids onto the session so the set is stable across refreshes.
- An `idealAnswer` for evaluation is the question's stored `answer` (English) — passed to the AI as
  reference (see `005`).

---

## Functional requirements

### Initialization (`POST /interviews`)

- Validate the user is authenticated (`shared.ContextUserKey`).
- Reject if the user already has an `in_progress` session (one active at a time).
- Create an `InterviewSession` with `courseId`, `difficulty`, `questionCount`, chosen questions,
  `status = in_progress`.

### During the interview

- Serve one question at a time (frontend controls pacing; backend exposes the ordered set).
- Save each answer to the backend (`PATCH /interviews/:id/answers/:questionId`) — auto-save.
- Track progress (answered / total).
- Allow skipping (empty answer recorded).
- Never lose progress on refresh (state is server-side).

### Completion (`POST /interviews/:id/complete`)

- Move to `evaluating`.
- Evaluate every answered question via the AI layer (`005`/`006`), server-side.
- Build and store the `FinalReport`.
- Update the `LearningProfile` (`007`), personalized `Dictionary` (`008`), and `Recommendations`
  (`009`).
- Emit a notification ("interview report is ready") via the existing notification module.
- Move to `completed`.

---

## Interview state

`not_started` (transient) → `in_progress` → `evaluating` → `completed`, plus `failed`.

- Only one active (`in_progress` / `evaluating`) session per user.
- `failed` is recoverable: evaluation can be retried without losing answers.

---

## Acceptance criteria

- A user can complete an interview start-to-finish.
- Progress is never lost (server-persisted).
- Every answered question is evaluated.
- A final report is always produced (even if some answers failed evaluation — those degrade
  gracefully, see `006` error handling).
- Learning data is updated after completion.

---

## Edge cases

- Browser refresh / re-open → resume from backend.
- Network interruption → answer save retries.
- Empty / skipped answer → allowed.
- AI timeout / invalid JSON → retry once per answer, then mark that answer's evaluation as failed
  and continue; the session is preserved.
- User exits before finishing → session stays `in_progress`.

---

## Future improvements

- AI follow-up questions (hybrid with the bank).
- Voice interviews, live coding, system design, pair-programming simulations.

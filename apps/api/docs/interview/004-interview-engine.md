# 004 - Interview Engine

## Overview

The Interview Engine manages the full interview lifecycle: session creation, question delivery,
per-answer AI evaluation, progress, aggregation, and completion. It lives in the Go backend as a new
module `internal/modules/interview` (same layout as `course`/`user`/`notification`).

> **Reconciled with the delivered design (`AI Interview Coach.dc.html`).** The interview is a
> **chat**: the AI asks one question at a time, the user answers, and the answer is **evaluated
> immediately on submit** so its feedback appears as the AI's next chat bubble. `complete` only
> **aggregates** the per-answer results — no long AI batch at the end.

---

## Goals

- Simulate a real technical interview as a focused chat.
- Give feedback right after each answer (coaching in the moment).
- Keep interviews predictable, resumable, and easy to extend.

---

## Where questions come from

Questions come from the **existing question bank** (`questions` + `question_translations`), not from
the AI. Each question gains a **`difficulty`** field (`easy` / `medium` / `hard`) via a goose
migration + seed update (see `010`). Session creation:

- Load the selected course (by slug) and its questions filtered by `difficulty`.
- Randomize and take the requested count (fall back to fewer if the bank is short).
- Snapshot the chosen question ids onto the session so the set is stable across refreshes.
- Store the chosen **`language`** (`en` | `ru`) on the session (`010`).

### Language (bilingual, RU + EN)

The interview runs in the language chosen at Setup. Everything content-facing resolves from that
language's `question_translations` row (unique `(questionId, lang)`, which holds `question`, `answer`
and `audio`):

- The **question text** shown in the chat = the translation's `question` for the session language.
- The **ideal answer** (reference for the AI, `005`) = the translation's `answer` for that language.
  It is also the **Model answer** in Review and the **Sample answer** in the composer (`011`).
- The AI **evaluates and writes its feedback in the session language** (`005`/`006`).

Full multilingual support (more languages) and **voice/audio** interviews are future (`015`); the
`question_translations.audio` key per language already exists for the voice phase.

---

## Functional requirements

### Initialization (`POST /interviews`)

- Validate the user is authenticated (`shared.ContextUserKey`).
- Reject if the user already has an `in_progress` session (one active at a time).
- Create an `InterviewSession` with `courseId`, `difficulty`, `language` (`en`|`ru`),
  `questionCount`, chosen questions, `currentIndex = 0`, `status = in_progress`. Return the session +
  the first question (in the session language).

### During the interview (chat)

- Serve the ordered question set; the frontend renders one question bubble at a time.
- **Submit one answer** (`POST /interviews/:id/answers/:questionId`): persist the answer, then
  **evaluate it via the AI layer** (`005`/`006`) server-side, store the `QuestionResult`
  (score + rubric + feedback), advance `currentIndex`, and return the evaluation so the chat can show
  it as the AI reply.
- Allow skipping (empty answer recorded, `skipped = true`, score `0`, no AI call).
- Track progress (answered / total). Never lose progress on refresh (state is server-side).

### Completion (`POST /interviews/:id/complete`)

- Require every non-skipped question to have a `QuestionResult` (re-run any `failed` first).
- **Aggregate** (no AI call): compute the session `overallScore` (0–100) and the four rubric
  averages (Correctness / Depth / Communication / Structure) from the per-answer results; roll up
  strengths / weaknesses; derive a `verdict` band.
- Generate `recommendations` (`009`) and build + store the `FinalReport`.
- Emit a notification ("interview report is ready") via the existing notification module (optional in
  MVP).
- Move to `completed`. Return the report.

> MVP does **not** update a Learning Profile or personalized Dictionary here — those are deferred
> (`007`/`008`).

---

## Interview state

`in_progress` → `completed`, plus `failed` (recoverable).

- Only one active (`in_progress`) session per user.
- A single answer's evaluation can fail and be retried (re-submit) without affecting the session.

---

## Acceptance criteria

- A user can complete an interview chat start-to-finish.
- Progress is never lost (server-persisted; resume rebuilds the chat from stored answers/results).
- Every submitted answer gets a score + feedback shown in the chat.
- A final report (overall score 0–100 + rubric + recommendations) is always produced.

---

## Edge cases

- Browser refresh / re-open → resume from backend (rebuild chat from `questionIds` + stored
  `QuestionResult`s up to `currentIndex`).
- Network interruption on submit → retry the submit; the answer + its evaluation are idempotent per
  `(interviewId, questionId)` (upsert).
- Empty / skipped answer → allowed; scored `0`, no AI call.
- AI timeout / invalid JSON → retry once, then mark that answer `failed` with placeholder feedback
  and continue; re-submittable (`006`).
- User exits before finishing → session stays `in_progress`.

---

## Future improvements

- AI follow-up questions in the chat (hybrid with the bank).
- Voice interviews, live coding, system design, pair-programming simulations.
- English-coaching pass + Learning Profile / Dictionary updates on completion (`007`/`008`).

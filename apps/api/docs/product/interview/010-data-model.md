# 010 - Data Model

## Overview

Core entities for the AI Interview Coach. **Source of truth is PostgreSQL** (GORM models + goose
migrations), per authenticated user — consistent with `users` / `courses` / `user_question_progress`
/ `notifications`. (Not localStorage-first; the frontend keeps only transient UI state — see `012`.)

> **Reconciled with the delivered design.** Scores are **0–100**; the rubric is **Correctness /
> Depth / Communication / Structure**; each answer is evaluated on submit and stores its own
> `feedback` for the chat. `LearningProfile`, `TopicProgress`, and `DictionaryEntry` are **deferred
> to post-MVP** (English coaching, `007`/`008`) and are not created in the MVP.

## Design principles

- One source of truth per entity; stable UUID ids (like the rest of the schema).
- Camel-case DB columns need explicit `gorm:"column:..."` tags (repo convention, e.g. `userId`).
- Embed `shared.Base` (`createdAt`/`updatedAt`); FKs to `users(id)` are `ON DELETE CASCADE`.
- Versioned AI payloads (`006`).

---

## Prerequisite change: question difficulty

Add `difficulty` to the existing `questions` table (`easy` | `medium` | `hard`, default `medium`)
via a goose migration + `cmd/seed` update. The interview engine selects by it (`004`). Enum stored
as TEXT.

---

## Entities (new module `interview`) — MVP

### InterviewSession
`id`, `userId` → users, `courseId` (course uuid), `difficulty`, `language` (`en`|`ru` — the
interview language chosen at Setup; picks which `question_translations` row to serve and the language
the AI evaluates/gives feedback in, `004`/`005`), `status`
(`in_progress`|`completed`|`failed`), `questionCount`, `questionIds` (jsonb — the snapshot chosen at
start), `currentIndex` (int — how far through the chat the user is, for resume), `overallScore?`
(int 0–100, set at `complete`), `startedAt`, `completedAt`, `finalReportId?`.

### QuestionResult  (1 InterviewSession → N)
`id`, `interviewId` → session, `questionId` → questions, `userAnswer`, `skipped` (bool),
`score` (int 0–100), `correctness`, `depth`, `communication`, `structure` (ints 0–100),
`confidence?`, `feedback` (text — shown as the AI chat reply), `strengths` (jsonb string[]),
`weaknesses` (jsonb string[]), `evalStatus` (`ok`|`failed`), `evalVersion` (schema version).
Unique `(interviewId, questionId)` — re-submitting an answer upserts.

### FinalReport  (1:1 with session)
`id`, `interviewId`, `overallScore` (int 0–100), `verdict` (text — e.g. "Strong", "Solid",
"Needs work"), rubric averages `correctness`/`depth`/`communication`/`structure` (ints 0–100),
`strengths` (jsonb string[] — rolled up), `weaknesses` (jsonb string[] — rolled up),
`recommendations` (jsonb string[] — the numbered "next steps" on the Results screen, `009`),
`generatedAt`.

> Recommendations are stored as a jsonb list on the report for the MVP (no separate table). A
> dedicated `Recommendation` table returns post-MVP when recommendations become
> trackable/completable (`009`).

> **Per-question data is captured from day one (for future AI analysis).** Even though the Learning
> Profile is deferred (`007`), every `QuestionResult` already stores a per-question `score` + rubric
> tied to its `questionId` — which resolves to the question's `module` / course / difficulty and the
> session `language`. This is the raw data the future engine mines to learn the user's strong/weak
> topics and recommend which questions to ask next. Don't drop or aggregate it away in the MVP.

---

## Deferred entities (post-MVP — English coaching, `007`/`008`)

`LearningProfile` (1 per user), `TopicProgress` (per topic), `DictionaryEntry` (per user), and a
trackable `Recommendation` table. Not created in the MVP; specced in `007`/`008` for later.

---

## Relationships (MVP)

```text
users (1) ── InterviewSession (N) ─┬─ QuestionResult (N)
                                   └─ FinalReport (1:1)
```

---

## Migrations

New goose files after the current latest (`00011_…`): create `interview_sessions` (incl. the
`language` column), `question_results`, `final_reports`; plus the `questions.difficulty` column.
jsonb for array fields (same `Params`-style Scan/Value approach used by notifications). No new
`question_translations` change is needed — it already stores `question`/`answer`/`audio` per `lang`.
Post-MVP migrations add the deferred tables.

---

## Acceptance criteria

- Every entity has a UUID id and the right FKs (cascade from users).
- jsonb fields round-trip cleanly.
- Deleting a user removes all their interview data.
- Every score persisted is an integer in `0–100`.

## Future improvements

- Deferred entities above; entity versioning, analytics events, import/export profile.

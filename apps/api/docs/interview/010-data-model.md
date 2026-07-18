# 010 - Data Model

## Overview

Core entities for the AI Interview Coach. **Source of truth is PostgreSQL** (GORM models + goose
migrations), per authenticated user — consistent with `users` / `courses` / `user_question_progress`
/ `notifications`. (Not localStorage-first; the frontend keeps only transient UI state — see `012`.)

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

## Entities (new module `interview`)

### InterviewSession
`id`, `userId` → users, `courseId` (course uuid), `difficulty`, `status`
(`in_progress`|`evaluating`|`completed`|`failed`), `questionCount`, `questionIds` (jsonb — the
snapshot chosen at start), `startedAt`, `completedAt`, `finalReportId?`.

### QuestionResult  (1 InterviewSession → N)
`id`, `interviewId` → session, `questionId` → questions, `userAnswer`, `skipped` (bool),
`overallScore` (float), `technicalScore`, `englishScore`, `communicationScore` (ints),
`confidence?`, `strengths` (jsonb string[]), `weaknesses` (jsonb), `missingConcepts` (jsonb),
`grammarCorrections` (jsonb `{original,corrected}[]`), `vocabularySuggestions` (jsonb
`{original,better}[]`), `evalStatus` (`ok`|`failed`), `evalVersion` (schema version).

### FinalReport  (1:1 with session)
`id`, `interviewId`, `overallScore`, `technicalSummary`, `englishSummary`, `strongestSkills` (jsonb),
`weakestSkills` (jsonb), `generatedAt`. (Recommendations link via `Recommendation.interviewId`.)

### LearningProfile  (1 per user)  — see `007`
`userId` (PK/unique), `interviewsCompleted`, `avgOverall`, `avgTechnical`, `avgEnglish`,
`grammarLevel`, `vocabularyLevel`, `communicationLevel`, `lastUpdated`.
(Day-streak is **not** duplicated here — it already lives on `users`.)

### TopicProgress  (1 LearningProfile → N)
`id`, `userId` → users, `topic` (course slug or module), `level` (0–100), `confidence`
(`low`|`medium`|`high`), `lastPracticedAt`, `lastImprovedAt`. Unique `(userId, topic)`.

### DictionaryEntry (per-user)  — see `008`
`id`, `userId`, `section` (`vocabulary`|`grammar`|`phrase`|`word_swap`), `payload` (jsonb, shape per
section), `relatedTopic`, `priority`, `repetitionCount`, `sourceInterviewId?`, timestamps.

### Recommendation  — see `009`
`id`, `userId`, `interviewId?`, `type` (`lesson`|`interview`|`dictionary`|`review`), `title`,
`description`, `priority`, `relatedTopic`, `completed` (bool), `createdAt`.

---

## Relationships

```text
users (1) ─┬─ InterviewSession (N) ─┬─ QuestionResult (N)
           │                        └─ FinalReport (1:1)
           ├─ LearningProfile (1) ── TopicProgress (N)
           ├─ DictionaryEntry (N)
           └─ Recommendation (N)
```

---

## Migrations

New goose files after the current latest (`00011_…`): create `interview_sessions`,
`question_results`, `final_reports`, `learning_profiles`, `topic_progress`,
`user_dictionary_entries`, `recommendations`; plus the `questions.difficulty` column. jsonb for
array/object fields (same `Params`-style Scan/Value approach used by notifications).

---

## Acceptance criteria

- Every entity has a UUID id and the right FKs (cascade from users).
- jsonb fields round-trip cleanly.
- Deleting a user removes all their interview data.

## Future improvements

- Entity versioning, analytics events, import/export profile.

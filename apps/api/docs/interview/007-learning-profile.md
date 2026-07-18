# 007 - Learning Profile

## Overview

The Learning Profile is the user's long-term knowledge model — persisted per user in **Postgres**
(GORM), one profile row per user plus child rows for per-topic progress. It remembers progress
across interviews and personalizes future ones.

---

## Goals

- Track technical growth over time.
- Identify strengths and weaknesses.
- Personalize recommendations.
- Adapt future interviews.

---

## Topic taxonomy (reconciled with the real content)

A **topic** maps to a real content unit so the profile stays connected to the question bank:

- **Coarse (MVP):** topic = **course** (`courses.slug`): `backend`, `frontend`, `devops`, `qa`,
  `nodejs`, `go`, `react`, `nextjs`.
- **Fine (later):** topic = a question's **`module`** (e.g. "Streams", "Goroutines") for
  sub-topic granularity.

Evaluation results (`006`) are attributed to the interview's course/module, so scores roll up into
topic progress. (The earlier draft's ad-hoc list like "NestJS/AWS/System Design" is replaced by the
real course slugs.)

---

## Stored information

**Profile** — `userId`, `createdAt`, `lastUpdated`.

**Interview statistics** — interviews completed, average overall / technical / English scores. (The
day-**streak** already lives on the `users` table from the notifications work — reuse it, don't
duplicate.)

**Knowledge map** (one row per topic) — `topic`, `level` (0–100), `confidence`
(`low`/`medium`/`high`), `lastPracticedAt`, `lastImprovedAt`.

**English** — grammar level, vocabulary level, communication level, frequently repeated mistakes.

**Vocabulary** — learned words, recommended words, frequently-used weak words, interview phrases
(this overlaps the Dictionary Engine `008`, which owns the per-user entries; the profile keeps the
rolled-up levels).

---

## Update rules

After every completed interview (in the same completion flow as `004`):

- Update interview statistics.
- Update topic `level`/`confidence` from the answers' scores.
- Record new mistakes and improvements.
- Refresh recommendations (`009`).

The profile evolves **gradually** (e.g. exponential moving average), not a jump after one interview.

---

## Consumers

Recommendation Engine (`009`), Dictionary Engine (`008`), Interview Engine (`004`, to bias question
selection toward weak topics later), and the profile/progress UI.

---

## Acceptance criteria

- Every completed interview updates the profile.
- Historical progress is preserved.
- Recommendations use the latest profile.
- Weak topics gain priority.

---

## Future improvements

- Skill decay over time.
- Confidence trends, weekly AI summaries, personalized goals.

---
status: "Draft"
owner: "Product / feature lead"
reviewers:
  - "Backend"
  - "Frontend"
last_updated: "2026-07-24"
visibility: "internal"
---

# 017 — Onboarding placement assessment (M3)

## Why

Personalization currently starts only after a user has done a few full interviews —
that's what populates their Focus areas (`topic_progress`, `007`/M2). A brand-new user
sees an empty Insights panel. M3 closes that gap: a short, optional **placement** on
signup seeds the topic model so **Insights populate from interview #1**. It's the last
"future" stage of the user journey (Product Model §6).

## What

A placement is a **regular interview, reused** — same engine, same chat UI — with three
differences, all decided by the server:

- **Short & fixed:** `PlacementQuestionCount = 6` (~8 min), never client-tunable.
- **Uniform, non-adaptive pick:** a broad spread across the course's modules (no
  weak-module weighting — there's no history yet to weight by).
- **Marked** `kind = "placement"` on the session (vs `"interview"`).

Completion writes `topic_progress` exactly like any interview (`updateTopicProgress`,
EMA α 0.4), so the user's Focus areas / Insights fill in immediately. No new scoring or
seeding path.

**Scope (MVP):** one course per placement — the user picks a course, the placement seeds
that course's topic level. Multi-course "broad" placement is deferred.

## How it behaves in the product

- **Stats:** placements are **excluded** from "Interview performance" (count / average /
  best) and the "last completed" card — they're calibration, not a graded performance.
  (`SummaryByUser` filters `kind = 'interview'`.)
- **History:** placements **are** shown, labeled "Assessment", so the user sees they took
  one. (`ListByUser` is unfiltered; the row carries `kind`.)
- **Insights & adaptive picking:** placement answers **do** feed Insights and future
  adaptive interviews — that is the whole point (seed the weak/strong picture).
- **Onboarding UX:** a new user (no interviews, empty `topic_progress`) is offered a
  "Take a 6-question placement" CTA on the interview home. **Skippable** ("Later").

## API

No new route. `POST /interviews` gains an optional `kind`:

```json
{ "courseSlug": "backend", "difficulty": "medium", "language": "en", "kind": "placement" }
```

When `kind = "placement"` the server forces length 6 and a non-adaptive pick, so
`questionCount` / `adaptive` in the body are ignored. Default `kind` is `"interview"`,
so all existing callers are unaffected.

## Delivery (split PRs)

- **DB:** migration `00018` — `interview_sessions.kind TEXT NOT NULL DEFAULT 'interview'`.
- **Backend:** `Session.Kind`, `resolveKind` (placement → 6 / uniform), `SummaryByUser`
  excludes placements. Postman synced.
- **Frontend:** onboarding CTA + skippable flow, "Assessment" label in History, route to
  the (now populated) Insights on completion.

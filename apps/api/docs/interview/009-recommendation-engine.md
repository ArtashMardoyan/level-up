# 009 - Recommendation Engine

## Overview

Decides **what the user should do next** after each interview, turning results into a personalized
plan. Runs server-side in the completion flow (`004`) and persists `Recommendation` rows (`010`).

---

## Goals

- Recommend the most valuable next lesson (course/module).
- Recommend the next interview.
- Prioritize weak topics.
- Avoid repetitive recommendations.
- Adapt as the user improves.

---

## Inputs (all real data)

- Learning Profile (`007`) — topic levels/confidence.
- Latest interview report (`006`/`010`).
- Interview history.
- Personalized Dictionary progress (`008`).
- Course progress (existing `/progress/summary` — `byCourse` reviewed/favorites).

---

## Recommendation types

- **Next lesson** — the course/module with the highest learning value (lowest topic level × weight).
  Maps to a real course/question the user can open.
- **Next interview** — same course at the current or next difficulty, biased to weak topics.
- **Dictionary review** — the most-repeated vocab/grammar/phrase entries (`008`).
- **Practice topics** — a ranked list: Critical / Recommended / Optional.

---

## Prioritization

Weighs: weak-topic score (highest), mistake frequency, time since last practice, overall progress,
and previously-completed recommendations (to avoid repeats — dedupe like the notifications module
avoids re-emitting).

---

## Example

Interview result → Redis 4/10, JWT 5/10, Node.js 9/10. Recommendations:

1. Node.js course → Redis/caching module (lesson)
2. Node.js interview, Easy (next interview)
3. Review Redis vocabulary (dictionary)
4. Grammar review (dictionary)

*(Topics resolve to real courses/modules; the strong topic, Node.js overall, is de-prioritized.)*

---

## Acceptance criteria

- Every interview generates recommendations.
- They change as the user improves.
- Strong topics appear less; weak topics dominate.

---

## Delivery

Recommendations show on the Final Report and a "next steps" area; a notification can nudge the user
(reuse the notifications module). 

---

## Future improvements

- AI-generated weekly study plans, calendar goals, interview-readiness score, company-specific prep.

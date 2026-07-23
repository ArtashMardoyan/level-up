# 009 - Recommendation Engine

> **M1 shipped (Progress & Insights).** A read-only aggregation of the per-question scores already
> captured on every interview is now exposed at **`GET /interviews/insights`**: per-course averages
> (weakest first), the overall answer-count-weighted rubric, and the weakest rubric axis. The
> interview home surfaces this as a **"Focus areas"** card. This is the *insight* layer; **acting** on
> it — topic-weighted question selection and trackable, deep-linked recommendations — is M2
> (`TopicProgress`, still deferred here). No new tables were added for M1.

## Overview

Decides **what the user should do next** after an interview, turning results into a short, ranked
"next steps" list. Runs server-side in the `complete` aggregation (`004`) and is stored as the
`recommendations` jsonb list on the `FinalReport` (`010`), shown on the Results screen (`011`).

> **MVP scope.** Recommendations are a generated **string list** on the report — no separate table,
> no completion tracking yet. Richer, trackable recommendations (and inputs from the Learning
> Profile / Dictionary) return post-MVP (`007`/`008`, `014` v1.1+).

---

## Goals

- Point the user to the most valuable next step (weak topic first).
- Suggest a concrete next interview.
- Keep it short and specific (3–5 items).

---

## Inputs (MVP — all from this interview + existing data)

- This interview's per-question results (`010`): which questions scored low (weak areas) vs. high.
- The rubric averages (Correctness / Depth / Communication / Structure) — the lowest axis is a hint.
- Course progress (existing `/progress/summary` — `byCourse` reviewed/favorites), to point at real
  lessons.

(Post-MVP adds Learning Profile topic levels and Dictionary progress as inputs.)

---

## Recommendation types (MVP)

Generated as plain strings for the numbered list, e.g.:

- **Study** — the course/module tied to the lowest-scoring questions ("Revisit the Node.js Streams
  module").
- **Next interview** — same course at the current or next difficulty ("Try a Medium Node.js
  interview").
- **Skill focus** — the weakest rubric axis ("Work on structuring answers: setup → detail →
  conclusion").

---

## Prioritization

Weakest area first (lowest question scores, then lowest rubric axis), then a concrete next-interview
suggestion. Keep the list to 3–5 items; avoid restating the same weak topic twice.

---

## Example

Interview result → Redis question 40/100, JWT 55/100, Node.js basics 90/100. Recommendations:

1. Revisit caching / Redis in the Node.js course.
2. Try another Medium Node.js interview focused on infrastructure.
3. Tighten answer structure — lead with the key point, then details.

*(The strong area, Node.js basics, is not repeated.)*

---

## Acceptance criteria

- Every completed interview produces a non-empty recommendations list on the report.
- Recommendations reflect this interview's weak areas.

---

## Delivery

Recommendations render on the Results screen ("Recommended next steps"). A notification can nudge the
user later (reuse the notifications module, `014` v1.1).

---

## Future improvements (post-MVP)

- Trackable `Recommendation` rows (mark completed), dedupe across interviews, difficulty ramp.
- Inputs from Learning Profile / Dictionary (`007`/`008`); AI-generated weekly study plans;
  interview-readiness score; company-specific prep.

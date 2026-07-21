# 006 - AI Response Schema

## Overview

The JSON contract the AI returns for **one** evaluated answer. The backend validates against this
before persisting it as a `QuestionResult` (`010`); the frontend never parses free-form AI text.
The schema is versioned (`version`) and evolves alongside the prompt (`005`).

> **Reconciled with the delivered design (`AI Interview Coach.dc.html`).** Scores are **0–100**, the
> rubric is **Correctness / Depth / Communication / Structure**, and each answer is evaluated
> **immediately on submit** so its `feedback` can be shown in the chat as an AI reply (`004`/`011`).
> The English-coaching fields (grammar/vocabulary) are **deferred to post-MVP** — see `007`/`008`.

---

## Design goals

- Predictable output, easy validation, version compatibility.
- Human-readable coaching (`feedback`) + machine-readable structure (scores).
- One call per answer → one bubble of feedback in the chat.

---

## Response schema (v2)

```json
{
  "version": "2.0",
  "score": 84,
  "correctness": 88,
  "depth": 80,
  "communication": 82,
  "structure": 85,
  "confidence": "high",
  "feedback": "Solid explanation of the event loop. You covered the call stack and task queue; to go deeper, mention the microtask queue and where promises sit relative to timers.",
  "strengths": ["Explained the call stack and task queue clearly."],
  "weaknesses": ["Did not mention the microtask queue / promise ordering."]
}
```

> Content is illustrative. Questions come from our own bank across all courses
> (Backend/Frontend/DevOps/QA/Node.js/Go/React/Next.js). The **model answer** shown to the user in
> the Review screen (`011`) is **not** produced here — it is the question's stored `answer` from the
> bank (`004`).

---

## Field types & rules

| Field | Type | Notes |
|---|---|---|
| `version` | string | Schema version, e.g. `"2.0"`. Required. |
| `score` | integer (0–100) | This answer's overall score. Required. Drives the per-question score chip in Review (`011`). |
| `correctness` | integer (0–100) | Rubric axis. Required. |
| `depth` | integer (0–100) | Rubric axis. Required. |
| `communication` | integer (0–100) | Rubric axis. Required. |
| `structure` | integer (0–100) | Rubric axis. Required. |
| `confidence` | enum `low`\|`medium`\|`high` | Optional; model's self-confidence. |
| `feedback` | string | Required. One short coaching paragraph — shown as the AI's chat reply after the answer. |
| `strengths` | string[] | Required (may be `[]`). Shown in Review. |
| `weaknesses` | string[] | Required (may be `[]`). Shown in Review as "To improve". |

**Validation:** valid JSON; every score in `0–100` (integers); `feedback` non-empty; arrays always
present; no Markdown; no prose outside JSON. (This required/optional split is authoritative — `005`
mirrors it.)

**Language.** The text fields (`feedback`, `strengths`, `weaknesses`) are written in the **session
language** (`en` | `ru`, `004`/`005`); scores are language-independent. `version` stays the same
across languages.

**Overall (session) score.** Computed by the backend at `complete`, not by the AI: the session
`overallScore` (0–100) and the four rubric averages are aggregated from the per-answer results
(`004`/`010`). Skipped answers score `0`.

---

## Error handling

If the AI returns invalid JSON or fails validation on a submitted answer:

1. Retry once.
2. Log the failure (with session + question id).
3. Mark that answer's evaluation `failed` (store a placeholder `QuestionResult` with `evalStatus =
   failed`, score `0`, a friendly `feedback` like "Couldn't evaluate this answer — it still counts,
   try the next one"). The chat continues; the session is never dropped.
4. Never drop the session or the user's answers. A `failed` answer can be re-submitted.

---

## Future versions (post-MVP)

English coaching brings back `grammar` / `vocabulary` axes plus `grammarCorrections`
(`{original,corrected}[]`) and `vocabularySuggestions` (`{original,better}[]`) — see `007`/`008`.
Other parked fields: `pronunciationScore`, `estimatedSeniority`, `followUpQuestions`. New fields
must bump `version` and stay backward-compatible.
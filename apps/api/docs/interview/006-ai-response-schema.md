# 006 - AI Response Schema

## Overview

The JSON contract the AI returns for **one** evaluated answer. The backend validates against this
before persisting it as a `QuestionResult` (`010`); the frontend never parses free-form AI text.
The schema is versioned (`version`) and evolves alongside the prompt (`005`).

---

## Design goals

- Predictable output, easy validation, version compatibility.
- Human-readable feedback + machine-readable structure.

---

## Response schema (v1)

```json
{
  "version": "1.0",
  "overallScore": 8.4,
  "technicalScore": 9,
  "englishScore": 8,
  "communicationScore": 8,
  "confidence": "high",
  "strengths": ["Correctly explained dependency injection."],
  "weaknesses": ["Did not mention provider scope."],
  "missingConcepts": ["Request scope", "Transient providers"],
  "grammarCorrections": [
    { "original": "NestJS have modules.", "corrected": "NestJS has modules." }
  ],
  "vocabularySuggestions": [
    { "original": "make faster", "better": "optimize performance" }
  ],
  "recommendation": "Review dependency-injection scopes."
}
```

> The example content above is illustrative only — it does not imply the app uses NestJS. Questions
> come from our own bank across all courses (Backend/Frontend/DevOps/QA/Node.js/Go/React/Next.js).

---

## Field types & rules

| Field | Type | Notes |
|---|---|---|
| `version` | string | Schema version, e.g. `"1.0"`. Required. |
| `overallScore` | number (float, 0–10) | Weighted/averaged; one decimal. Required. |
| `technicalScore` | integer (0–10) | Required. |
| `englishScore` | integer (0–10) | Required. |
| `communicationScore` | integer (0–10) | Required. |
| `confidence` | enum `low`\|`medium`\|`high` | Optional; model's self-confidence. |
| `strengths` | string[] | Required (may be `[]`). |
| `weaknesses` | string[] | Required (may be `[]`). |
| `recommendation` | string | Required. |
| `missingConcepts` | string[] | Always present, may be `[]`. |
| `grammarCorrections` | `{original, corrected}[]` | Always present, may be `[]`. |
| `vocabularySuggestions` | `{original, better}[]` | Always present, may be `[]`. |

**Validation:** valid JSON; all scores in `0–10`; arrays always present; no Markdown; no prose
outside JSON. (This required/optional split is authoritative — `005` mirrors it.)

---

## Error handling

If the AI returns invalid JSON or fails validation:

1. Retry once.
2. Log the failure (with session + question id).
3. Mark that answer's evaluation `failed` (store a placeholder `QuestionResult` with a flag) and
   continue evaluating the rest — the interview still produces a report.
4. Never drop the session or the user's answers.

---

## Future versions

`pronunciationScore`, `leadershipScore`, `systemDesignScore`, `codingScore`, `estimatedSeniority`,
`followUpQuestions`. New fields must bump `version` and stay backward-compatible.

# 005 - AI Prompts

## Overview

How the backend talks to the AI model to evaluate answers. The goal is consistent, fair, structured
evaluations.

> **Server-side only.** All OpenAI calls run in the Go backend (the `interview` service), never from
> the browser — the API key must never reach the client. This matches how the repo already uses
> OpenAI (the audio/TTS tooling). Config: an `OPENAI_API_KEY` env var read only in
> `internal/config` and passed to the service via constructor (no globals).

---

## Objectives

- Evaluate technical knowledge.
- Evaluate English communication.
- Give constructive, coaching feedback.
- Return predictable, structured data (JSON only — see `006`).

---

## AI input (per answer)

Each evaluation request includes:

- Course (slug + title)
- Difficulty
- The interview question
- The user's answer
- The ideal answer (the question's stored `answer`, when available)
- Evaluation criteria (the fixed rubric below)

Model output is requested as **structured JSON** (OpenAI structured output / JSON mode) validated
against `006`.

---

## AI responsibilities

The AI **must**:

- Evaluate only the submitted answer.
- Explain missing concepts.
- Correct grammar without rewriting the user's style.
- Suggest stronger technical wording.
- Stay objective and encouraging.

The AI **must not**:

- Invent facts.
- Penalize minor wording differences.
- Change the meaning of the user's answer.
- Return free-form text when structured output is required.

---

## Evaluation dimensions

Each answer is scored independently, **0–10** each:

- Technical Accuracy
- Completeness
- Communication
- English Grammar
- Technical Vocabulary

---

## Output requirements

The response must be valid JSON matching `006-ai-response-schema.md`. The required top-level fields
(kept in sync with `006`): `version`, `overallScore`, `technicalScore`, `englishScore`,
`communicationScore`, `strengths`, `weaknesses`, `recommendation`. Arrays that may be empty
(`missingConcepts`, `grammarCorrections`, `vocabularySuggestions`) are always present (possibly
`[]`). If validation fails, **retry once**, then degrade per `006`.

---

## Prompt design principles

- Deterministic: low temperature, the same rubric for every interview.
- Explain decisions clearly.
- Coach, don't just grade.
- Keep the system prompt versioned alongside the schema `version` (`006`).

---

## Cost & latency

- A completed interview = N answers → N evaluations. Evaluate concurrently with a bounded worker
  pool and a per-call timeout; the session sits in `evaluating` while this runs.
- Consider batching prompts later; MVP does per-answer calls for simpler validation/retry.

---

## Future improvements

- Separate prompts per interview type.
- Prompt versioning + automatic prompt-quality tests.
- Multi-model evaluation.

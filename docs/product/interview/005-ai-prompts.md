# 005 - AI Prompts

## Overview

How the backend talks to the AI model to evaluate answers. The goal is consistent, fair, structured
evaluations — one AI call per submitted answer, whose feedback is shown immediately in the chat.

> **Server-side only.** All OpenAI calls run in the Go backend (the `interview` service), never from
> the browser — the API key must never reach the client. This matches how the repo already uses
> OpenAI (the audio/TTS tooling). Config: an `OPENAI_API_KEY` env var read only in
> `internal/config` and passed to the service via constructor (no globals).

---

## Objectives

- Evaluate technical knowledge (Correctness, Depth).
- Evaluate how the answer is expressed (Communication, Structure).
- Give constructive, coaching feedback that fits in one chat bubble.
- Return predictable, structured data (JSON only — see `006`).

---

## AI input (per answer)

Each evaluation request includes:

- Course (slug + title)
- Difficulty
- **Language** (`en` | `ru`) — the session language (`004`)
- The interview question (in the session language)
- The user's answer
- The ideal answer (the question's stored `answer` for that language, when available) — used as the
  reference for Correctness. (Same text shown as the **Model answer** in Review, `011`.)
- Evaluation criteria (the fixed rubric below)

The AI **writes its `feedback`, `strengths`, and `weaknesses` in the session language** (Russian for
`ru`, English for `en`) so the chat reads naturally. Scores are language-independent.

Model output is requested as **structured JSON** (OpenAI structured output / JSON mode) validated
against `006`.

---

## When it runs

- **On submit, per answer.** The frontend submits one answer (`004`/`013`); the backend evaluates it
  right then and returns the `006` payload, which the chat renders as the AI's reply (with a
  "thinking" indicator while the call is in flight, `011`).
- `complete` does **not** call the AI — it only aggregates the per-answer results into the session
  overall score + rubric averages (`004`/`010`). This keeps `complete` fast (no long AI batch).

---

## AI responsibilities

The AI **must**:

- Evaluate only the submitted answer.
- Explain what was missing or could be deeper (in `feedback`).
- Stay objective and encouraging — coach, don't just grade.
- Return valid JSON per `006`.

The AI **must not**:

- Invent facts.
- Penalize minor wording differences.
- Change the meaning of the user's answer.
- Return free-form text or Markdown outside the JSON.

---

## Evaluation dimensions (rubric)

Each answer is scored **0–100** on four axes (matches the Results "Score breakdown", `011`/`016`):

- **Correctness** — is the answer technically right (vs. the ideal answer)?
- **Depth** — how thoroughly are the important details covered?
- **Communication** — is it clear and easy to follow?
- **Structure** — is the reasoning organized (setup → detail → conclusion)?

The per-answer `score` (0–100) is the AI's overall judgment for that answer.

---

## Output requirements

The response must be valid JSON matching `006`. Required top-level fields (kept in sync with `006`):
`version`, `score`, `correctness`, `depth`, `communication`, `structure`, `feedback`, `strengths`,
`weaknesses`. If validation fails, **retry once**, then degrade per `006`.

---

## Prompt design principles

- Deterministic: low temperature, the same rubric for every interview.
- Coach, don't just grade — the `feedback` string is what the user reads in the chat.
- Keep the system prompt versioned alongside the schema `version` (`006`).

---

## Cost & latency

- One AI call per answer, on submit — naturally spread over the interview, so there is no long batch
  at the end. Use a per-call timeout and show the chat "thinking" state while waiting.
- Consider caching/batching later; MVP does per-answer calls for simpler validation/retry.

---

## Future improvements (post-MVP)

- English-coaching prompt add-on (grammar + vocabulary axes, `007`/`008`).
- Separate prompts per interview type; prompt versioning + quality tests; multi-model evaluation;
  AI follow-up questions in the chat.
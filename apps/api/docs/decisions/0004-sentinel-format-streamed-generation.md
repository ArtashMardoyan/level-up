---
status: "Accepted"
date: "2026-07-21"
deciders:
  - "Backend Team Lead"
---

# ADR-0004 — Sentinel-delimited format for streamed AI generation

## Context

The interview question generator returns three fields: `reaction` and `question`
(user-visible, should stream token-by-token) and `modelAnswer` (not shown live; backs
the "sample answer" button and anchors grading). The blocking path uses JSON-object
mode, but streaming a single JSON object yields unrenderable partial JSON. See
`product/ai-chat/008-openai-streaming.md`.

## Decision

The streaming generation call returns **plain text in three sentinel-delimited
sections** — `reaction`, then `###QUESTION###`, then the question, then
`###ANSWER###`, then the model answer. The server streams the visible prose (reaction
+ question) as it arrives and parses the model answer off the tail. The blocking
`Generate` keeps its JSON contract unchanged.

## Alternatives considered

- **Stream the JSON object and extract the growing `question` field.** Fragile —
  partial-JSON parsing must handle escaping and field order mid-stream.
- **Two calls (stream the question, then a blocking call for the model answer).**
  Simplest parsing, but adds a second OpenAI call + latency and a race if the user
  answers very fast.

## Consequences

- Clean token-by-token streaming of exactly the visible prose; no sentinel ever leaks
  to the client (a boundary holdback guards partial separators).
- One OpenAI call, preserving the existing economy; retry only before the first token.
- A shared prompt (`questionGuidance`) keeps the blocking JSON and streaming sentinel
  prompts in sync, so the two paths can't drift.

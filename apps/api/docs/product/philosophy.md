---
status: "Approved"
owner: "Product / feature lead"
reviewers:
  - "Backend"
  - "Frontend"
  - "Mobile"
  - "Design"
last_updated: "2026-07-21"
---

# Product Philosophy

> **Derived from: Product Model §5 (Core principles), §8 (The role of AI), and the Framing section.**

The *why* behind how Level Up teaches, interviews, and uses AI. Every stance here is an
expansion of the [Product Model](PRODUCT_MODEL.md) — it introduces no new philosophy.

## Learning philosophy

**Why practice-first?** Because the principles say so: *learn by doing* and *practice
before theory* (§5). An engineer improves by rehearsing under realistic conditions and
acting on feedback, not by consuming lectures. So the platform is a **loop** — practice,
get a signal, improve, repeat — and *continuous feedback* (§5) makes every answer a step
in that loop. *Personalized learning* (§5) means the loop bends toward the individual
over time.

## Interview philosophy

**Why the interview is more than a list of questions.** In the Product Model the
interview is a **realistic rehearsal**: the AI asks one question at a time, scores each
answer on a rubric, and coaches with a model answer (§1, §8), behaving like a real
interviewer (§4). The value is in the *rehearsal + feedback*, which a static question
list cannot provide — that is why the interview is the platform's practice engine (§7),
not a static question list.

## AI philosophy

**The AI is a mentor and coach, not an answer generator** (Framing, §5). Its roles are
scoped in §8 — interviewer, evaluator, conversational partner, communication coach, voice.

- **When AI helps:** paraphrasing questions, scoring and coaching an answer, writing a
  model answer to learn from, holding a natural conversation, transcribing spoken
  practice (§8).
- **When AI must not help:** it never supplies answers for use in a *real* interview, and
  never grades out loud mid-conversation (§5, §8 guardrails).
- **How it behaves:** it degrades gracefully and never blocks the experience on a
  failure, and every AI call runs server-side with the provider key never exposed
  (§8 guardrails).

These stances protect the boundary that Level Up is a coach, not a cheating tool (§9).

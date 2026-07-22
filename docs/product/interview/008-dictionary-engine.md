# 008 - Dictionary Engine

> **Status: DEFERRED — post-MVP.** The personalized Dictionary and the English-coaching feedback it
> feeds on (grammar/vocabulary) are **not** in the MVP — the delivered design has no dictionary
> screen and the rubric is Correctness / Depth / Communication / Structure (`006`). This ships with
> the English-coaching version (`014` v2). Spec kept below for that phase; MVP does not create
> `DictionaryEntry` (`010`).

## Overview

The Dictionary Engine turns interview feedback into **personalized** learning content. The app
already ships a **static** dictionary (`level-up/src/data/dictionary*`: Vocabulary, Pronunciation,
Interview Phrases, Grammar Fixes, Leadership, Words to Use More Often, plus the daily categories).
This engine adds a **per-user layer** on top, sourced from the user's real interview mistakes.

---

## Goals

- Build vocabulary from real interview mistakes.
- Reinforce weak concepts.
- Improve English communication.
- Keep learning personalized.

---

## Per-user sections (mirror the existing categories)

**Vocabulary** — technical words the user didn't know / rarely used.
Fields: `word`, `definition`, `example`, `relatedTopic` (course/module), `priority`.

**Grammar Fixes** — from `grammarCorrections` in the evaluation (`006`).
Fields: `original`, `corrected`, `explanation`, `repetitionCount`.

**Interview Phrases** — stronger interview wording.
Example: "I make API." → "I designed and implemented the REST API."

**Words to Use More Often** — from `vocabularySuggestions` (`006`).
Examples: good → robust, make → implement, thing → component, fix → resolve, fast → efficient.

Stored per user in Postgres, keyed to the source interview/question so each entry links back to
where it came from.

---

## Update rules

After every interview:

- Add new vocabulary / phrases / fixes from the evaluation.
- Increment `repetitionCount` for repeated mistakes; raise priority.
- Deduplicate (don't add the same word/mistake twice — bump the counter instead).
- Preserve historical learning progress.

---

## Prioritization

Priority depends on: mistake frequency, interview/topic importance, and time since last review.
Higher priority surfaces first.

---

## Links

Each personalized entry links to: the weak topic, the recommended lesson (`009`), and future
interview questions on that topic.

---

## Acceptance criteria

- Dictionary updates automatically after each interview.
- No duplicate entries (counters instead).
- Priority changes over time.
- Every entry is traceable to an interview result.

---

## Surfacing in the UI

The existing Dictionary screen gains a personalized view/section for signed-in users (the static
categories stay for everyone). Reuse the current dictionary UI patterns and i18n.

---

## Future improvements

- Spaced repetition, AI-generated quizzes, pronunciation practice, daily review sessions.

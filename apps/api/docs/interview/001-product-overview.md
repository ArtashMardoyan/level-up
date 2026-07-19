# 001 - Product Overview

## Mission

Level Up helps software engineers prepare for real technical interviews through personalized AI
coaching — a chat interviewer that scores every answer and coaches on what to improve. (Dedicated
**English communication** coaching is a planned later version — see `014`.)

## Vision

Every completed interview should improve future learning. The app is not a quiz; it is an adaptive
coach that remembers progress and personalizes what comes next.

## Problem

Most interview-prep tools only score answers. They don't adapt to the user's long-term progress,
don't coach English, and don't tell the user what to study next.

## Solution

The AI Interview Coach runs a **chat** interview: the AI asks one question at a time, evaluates each
answer immediately (score /100 on Correctness / Depth / Communication / Structure) with coaching
feedback in the chat, then produces a final report (overall score + rubric + strengths/focus areas)
and **Recommendations** for what to do next. Past sessions are tracked in **History**.

> **English coaching is post-MVP.** A long-term **Learning Profile** and a personalized **Dictionary**
> built from grammar/vocabulary mistakes are deferred to a later version (`007`/`008`, `014`). The
> MVP focuses on the technical mock-interview loop above.

## Builds on what exists

This is a new feature **on top of the current app**, reusing:

- **Auth + users** (JWT) — interviews are tied to the authenticated user.
- **Course + question bank** (`courses` / `questions` / `question_translations`) — interview
  questions come from here (extended with a `difficulty` field; see `004`/`010`).
- **Per-user progress** and **notifications** modules — the same patterns (and the notifications
  feed) are reused (e.g. "your interview report is ready").

## MVP scope

- Text interviews as a **chat** (typed answers, one question at a time).
- **Bilingual (RU + EN)** — the user picks the interview language at Setup; questions, model answer,
  and AI feedback all follow it (`004`). Full multilingual + voice are future (`015`).
- Server-side AI evaluation per answer (OpenAI via the Go backend), 0–100 rubric.
- Feedback shown in the chat right after each answer.
- **Per-question scores persisted** (tied to question/topic/difficulty) — the raw data a future AI
  uses to learn each user's strong/weak areas and recommend questions (`010`/`015`).
- Final report: overall score /100 + rubric breakdown + strengths/focus areas.
- Recommendations ("next steps") on the report.
- Interview History with per-session scores.

## Non-goals (future versions)

- Live human interviewer
- Voice / speech interviews
- Video interviews
- Multiplayer / team practice

See `014-release-plan.md` and `015-future-ideas.md`.

# 001 - Product Overview

## Mission

Level Up helps software engineers prepare for real technical interviews through personalized AI
coaching — in both **technical depth** and **English communication**.

## Vision

Every completed interview should improve future learning. The app is not a quiz; it is an adaptive
coach that remembers progress and personalizes what comes next.

## Problem

Most interview-prep tools only score answers. They don't adapt to the user's long-term progress,
don't coach English, and don't tell the user what to study next.

## Solution

The AI Interview Coach evaluates every answer (technical + English), produces a final report,
updates a long-term **Learning Profile**, personalizes the **Dictionary** from real mistakes, and
generates **Recommendations** for the next lesson/interview.

## Builds on what exists

This is a new feature **on top of the current app**, reusing:

- **Auth + users** (JWT) — interviews are tied to the authenticated user.
- **Course + question bank** (`courses` / `questions` / `question_translations`) — interview
  questions come from here (extended with a `difficulty` field; see `004`/`010`).
- **Per-user progress** and **notifications** modules — the same patterns (and the notifications
  feed) are reused (e.g. "your interview report is ready").

## MVP scope

- Text interviews (typed answers).
- Server-side AI evaluation (OpenAI via the Go backend).
- Final report.
- Learning Profile (persisted in Postgres, per user).
- Personalized Dictionary updates.
- Recommendations.

## Non-goals (future versions)

- Live human interviewer
- Voice / speech interviews
- Video interviews
- Multiplayer / team practice

See `014-release-plan.md` and `015-future-ideas.md`.

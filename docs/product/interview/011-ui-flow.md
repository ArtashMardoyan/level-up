# 011 - UI Flow

## Overview

The frontend flow for the AI Interview Coach in the **existing React 19 + Vite app** (JSX, hash
routing, CSS tokens, i18n en+ru, `lucide-react`). It follows the delivered design
`AI Interview Coach.dc.html` (in Claude Design). New screens are hash routes (like `#profile` /
`#activity`), reached from the header/home.

> **This mirrors the shipped design exactly.** Five screens — **Setup → Interview (chat) → Results →
> Review → History** — a start-confirm modal, 0–100 scoring, and the rubric Correctness / Depth /
> Communication / Structure.

## Design principles

- One task per screen; minimal distraction; clear progress; fast; responsive (verify ~390px).
- Reuse existing components/patterns and tokens rather than new one-offs.

## Screen flow

```text
Home → Setup (#interview) → [confirm modal] → Interview chat (#interview/:id)
     → Results (#interview/:id/results) → Review (#interview/:id/review)
History (#interview/history) ↺ back to any past session's Results
```

Auth-gated: guests get a sign-in prompt (like the profile/notifications screens).

## Screens

**Setup (`#interview`)** — page eyebrow "New session" + H1 "Set up your mock interview".
- **1 · Choose a course** — grid of the 8 course tiles (per-course accent/icon, question count).
- **2 · Difficulty** — segmented control Easy / Medium / Hard.
- **3 · Number of questions** — segmented (e.g. 3 / 5 / 10).
- **4 · Language** — segmented control **English / Русский** (defaults to the app's i18n locale).
  Picks the interview language: questions, model answer, and AI feedback all follow it (`004`).
  > ⚠️ **Not yet in the delivered design** (`AI Interview Coach.dc.html` has no language control) —
  > add this segmented control to the Setup screen in Claude Design (`016`).
- **Start interview** button → opens the **confirm modal** ("Ready to start?", lists what to expect:
  no timer, feedback + model answer after each, overall score at the end). Confirm → `POST /interviews`.

**Interview chat (`#interview/:id`)** — focused chat, one question at a time.
- Top: course icon + title, `Difficulty · Question n of N`, progress % and a course-accent
  **ProgressBar**.
- **Chat transcript** — AI question bubbles (with the bot avatar) and the user's answer bubbles;
  after each answer the AI's **feedback** bubble appears. A **"thinking"** three-dot indicator shows
  while the answer is being evaluated (`005`).
- **Composer** (sticky bottom): textarea + **Sample answer** (inserts the question's stored model
  answer as a starting point) + **Submit**. Submit → `POST /interviews/:id/answers/:qid`, which
  returns the evaluation to render.
- On the last answer: an **"Interview complete 🎉"** card with **Review answers** / **See results**.
- Warn before leaving; resume on refresh from the backend.

**Results (`#interview/:id/results`)** — the payoff.
- **Overall score** hero — radial ring, big number **/100**, a verdict label, course · difficulty.
- **Score breakdown** — the four rubric axes (Correctness / Depth / Communication / Structure) as
  labelled bars.
- **What went well** (green) and **Focus areas** (rose) lists.
- **Recommended next steps** — numbered list (`009`).
- Actions: **Review all answers** · **New interview**.

**Review (`#interview/:id/review`)** — per-question cards.
- Each card: `Q n`, the question, a **per-question score chip** (color by band), **Your answer**,
  **Strengths** / **To improve** (two columns), and the **Model answer** (the question's stored
  `answer`).

**History (`#interview/history`)** — list of past interviews (course icon, title, date, meta,
per-row **score**, chevron → that session's Results). Empty state: "No interviews yet" + CTA.

## UI states

Every screen supports Loading / Success / Empty / Error (repo already does this for backend data).
The chat "thinking" indicator is the per-answer loading state; errors get a friendly message + Retry
(never a dead end).

## Accessibility

Keyboard navigation, visible focus, screen-reader labels, responsive layout (~390px).

## Acceptance criteria

- A signed-in user completes an interview chat without confusion.
- Feedback appears right after each answer; progress is never lost.
- Results and Review are easy to read; History lists past scores.

## Wiring notes

- Routes via `useHashRoute` (`#interview`, `#interview/:id`, `.../results`, `.../review`,
  `#interview/history`); branch in `App.jsx` like the other screens.
- API calls via new wrappers in `src/services/endpoints.js` (`interviewsCreate`, `interviewGet`,
  `interviewSubmitAnswer`, `interviewComplete`, `interviewReport`, `interviewsList`).
- Strings in `src/i18n/strings.js` (en + ru); styles/tokens in `src/index.css`.

## Future improvements

- Voice interview UI, live coding editor, AI follow-up questions in the chat, personalized
  Dictionary section (post-MVP, `008`).

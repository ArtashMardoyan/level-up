# 011 - UI Flow

## Overview

The frontend flow for the AI Interview Coach in the **existing React 19 + Vite app** (JSX, hash
routing, CSS tokens, i18n en+ru, `lucide-react`). It should feel like a real interview while staying
simple. New screens are hash routes (like `#profile` / `#activity`), reached from the header/home.

## Design principles

- One task per screen; minimal distraction; clear progress; fast; responsive (verify ~390px).
- Reuse existing components/patterns (`PrepView`, `QuestionCard`, `ProgressBar`, `ModeBar`,
  skeletons) and tokens rather than new one-offs.

## Screen flow

```text
Home  →  Interview Setup (#interview)  →  Interview (#interview/:id)
      →  Evaluating  →  Final Report  →  Updated Dictionary / Recommended next
```

Auth-gated: guests get a sign-in prompt (like the profile/notifications screens).

## Screens

**Setup (`#interview`)** — pick Course, Difficulty (`easy/medium/hard`), Number of questions.
Validate all selected → **Start Interview** (`POST /interviews`). Cancel returns home.

**Interview (`#interview/:id`)** — progress bar + `Q n / N`, the question, a text answer editor,
Skip, Next / Submit. One question at a time; each answer auto-saves
(`PATCH /interviews/:id/answers/:qid`). Warn before leaving; resume on refresh from the backend.

**Evaluating** — loading state (reuse shimmer/skeletons) while the backend evaluates; friendly
status; prevent duplicate `complete` calls.

**Final Report** — overall score, technical + English feedback, strengths, improvements,
recommended lessons, recommended interview. Actions: Review Dictionary, Start Next Interview.

## UI states

Every screen supports Loading / Success / Empty / Error (repo already does this for backend data).

## Accessibility

Keyboard navigation, visible focus, screen-reader labels, responsive layout.

## Acceptance criteria

- A signed-in user completes an interview without confusion.
- Navigation is intuitive; progress is never lost; the report is easy to read.

## Wiring notes

- Routes via `useHashRoute` (`#interview`, `#interview/:id`); branch in `App.jsx` like the other
  screens.
- API calls via new wrappers in `src/services/endpoints.js` (`interviewsCreate`, `interviewAnswer`,
  `interviewComplete`, `interviewGet`, `interviewReport`, …).
- Strings in `src/i18n/strings.js` (en + ru); styles in `src/index.css` tokens.

## Future improvements

- Voice interview UI, live coding editor, split-screen coding, AI avatar interviewer.

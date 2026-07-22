# Level Up — Interview Prep

A React + Vite single-page app for practicing technical interview questions across multiple tracks, fully offline once loaded.

## Features

- **Multiple tracks** — pick a course from the landing page (Backend, Frontend, DevOps, QA today; Node.js, Go, React, Next.js show as "Coming soon" until they get content).
- **List / Quiz / Interview modes** — read answers inline, hide them behind a "Show answer" toggle, or go through a shuffled one-question-at-a-time interview flow.
- **Bonus follow-ups** — some questions have an extra "Bonus" section you can reveal separately.
- **Text-to-speech** — read any question or answer aloud (browser `speechSynthesis`, with a voice picker in Settings), or use the course-wide audio player to autoplay through a whole module or the entire course, hands-free.
- **Global search** — search across every course at once from the landing page; clicking a result jumps straight into that course with the matching question expanded and scrolled into view.
- **Favorites & progress tracking** — star questions, filter to favorites only, and track reviewed progress per course (stored in `localStorage`, kept separate per course).
- **Collapsible modules** — collapse/expand a whole module's questions, including while filtering to favorites.
- **Light/dark theme** — toggle from the Settings panel; respects system preference on the first load.
- **Works fully offline** — no backend, no external requests; all content ships as local JSON.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  App.jsx                 top-level view switch: course picker <-> course view
  components/              UI components (QuestionCard, CoursePlayer, GlobalSearch, ...)
  hooks/                   useTheme, useSpeech, useReviewState
  data/
    courses.js             registry of all courses (title, subtitle, icon, questions)
    courses/*.json          question content, one file per course
```

## Adding or editing course content

Each course's questions live in their own JSON file under `src/data/courses/`. A course shows up as active on the landing page as soon as its file has at least one entry — otherwise the landing page marks it "Coming soon".

Schema for each question:

```json
{
  "id": "q1",
  "module": "Module 1 — Some Topic",
  "question": "Question 1. Some interview question?",
  "answer": "The main answer text.\n\nSeparate paragraphs with \\n\\n.",
  "bonus": "Optional extra follow-up shown behind a separate 'Show bonus' toggle."
}
```

- `id` must be unique and stable within the file — favorites and reviewed progress use it as their storage key.
- `module` groups questions under a collapsible header; keep the same string for every question in that module.
- `bonus` is optional — omit the field entirely if there isn't one.

To wire up a brand-new course, add its JSON file under `src/data/courses/` and register it in `src/data/courses.js` (title, subtitle, emoji/logo, and the imported questions array).

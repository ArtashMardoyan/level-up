# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical workflow rules

**NEVER commit or push without explicit user instruction.** Wait for the user to say "commit" or "commit push" before running any `git commit` or `git push` command. No exceptions — not after fixing a bug, not after the build passes, not after any change. This matters double here: **every push to `master` auto-deploys to GitHub Pages.**

**Large tasks require a plan first.** For any large or cross-cutting task (new feature, redesign, refactor touching several components): create a branch off `master`, enter plan mode, and get the plan approved before writing code.

**Run `npm run lint` before finishing any change** and fix what it reports (`npm run lint:fix` handles most of it). Prefer fixing code to satisfy a rule over disabling the rule.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint (flat config, eslint.config.mjs)
npm run lint:fix  # auto-fix lint + formatting

node scripts/validate-translations.mjs [course ...]  # check each <course>/ru.json against its en.json
```

There are no tests configured.

## Code style

Enforced by ESLint (flat config, `eslint.config.mjs`) — most violations auto-fix with `npm run lint:fix`:

- **Prettier as an ESLint rule**: no semicolons, single quotes, 2-space indent, print width 120, no trailing commas.
- **Import sorting** (`perfectionist/sort-imports`, line-length ascending): two groups separated by a blank line — builtin+external first, then internal/parent/sibling. Named imports within a statement also sorted by length.
- **Objects**: keys sorted by line length **descending** (`partitionByComment: true` — a comment inside the literal starts a new sort partition).
- **JSX props, named exports, etc.**: line-length sorted via `perfectionist` `recommended-line-length` preset.
- **React hooks**: `eslint-plugin-react-hooks` v7 with compiler-powered rules (`set-state-in-effect`, `refs`, `set-state-in-render`…). Don't sync state with props via `useEffect` — adjust state during render behind a `prev !== next` guard (see `QuestionCard.jsx`, `CoursePlayer.jsx`), and don't read `ref.current` during render.

## What this is

A React 18 + Vite SPA for practicing interview questions across multiple course tracks (Backend, Frontend, DevOps, QA, Node.js, Go, React, Next.js). No backend, no external requests — all content ships as local JSON and user state lives in `localStorage`.

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `master`. `vite.config.js` sets `base: '/level-up/'` to match the Pages URL — keep that in mind for any absolute asset paths.

`docs/` has context per feature/ticket — a single markdown file for smaller ones, or a folder with a few files for larger ones (e.g. `docs/dictionary/overview.md` for why/decisions/status, `docs/dictionary/code.md` for the technical reference). Check it for context beyond what this file covers before starting work on a feature.

## Architecture

**Routing** is hash-based (`useHashRoute`): `#<courseId>` or `#<courseId>/<questionId>`. `App.jsx` switches between the course picker (`CourseSelect`) and the course view (`PrepView`) based on the hash; the last-visited course is persisted and restored on fresh visits. Global search results navigate by setting a `#course/question` hash, and `PrepView` scrolls to and expands the `jumpToId` question.

**Content pipeline**: `src/data/courses.js` is the registry — it imports per-course JSON from `src/data/courses/<id>/en.json` (and `<id>/ru.json` for the Russian overlay, merged by question id) and exports `COURSES` (id, title, subtitle, emoji, questions). This folder-per-course/file-per-language layout mirrors the audio layout in S3 (`audio/courses/<id>/<lang>/…`). A course with zero questions renders as "Coming soon" on the landing page. To add a course: create `src/data/courses/<id>/en.json` (plus `ru.json`) and register it in `courses.js`.

Question schema (per entry in a course JSON file):

```json
{
  "id": "q1",
  "module": "Module 1 — Some Topic",
  "question": "…?",
  "answer": "Paragraphs separated with \\n\\n.",
  "bonus": "Optional; omit the field if there isn't one.",
  "audio": { "question": "audio/courses/nodejs/en/q1-question.mp3", "answer": "audio/courses/nodejs/en/q1-answer.mp3" }
}
```

- `id` must be unique and stable within the file — favorites and reviewed-progress in `localStorage` are keyed by it.
- `module` groups questions under collapsible headers; use the exact same string for every question in a module.
- Answer text is also read aloud via text-to-speech — prefer wording that pronounces well (avoid heavy symbols/abbreviations).
- `audio` is optional and **script-managed** (`scripts/upload-audio.mjs` stamps it after uploading MP3s) — don't hand-edit. Each value is an S3 object key; a phase present means that track plays a pre-generated MP3, absent means browser speech. See `docs/audio-playback.md`.

**State**: no state library. Per-course favorites/reviewed progress live in `useReviewState` (localStorage, keyed by course id). Theme (`useTheme`) and TTS voice (`useSpeech`) are global and also persisted. `PrepView` holds all in-course UI state (mode, search, collapsed modules, player).

**Text-to-speech** is built on the browser `speechSynthesis` API (`useSpeech` for voice selection, `CoursePlayer` for the auto-playing course-wide player). Per-question read-aloud is routed through `CoursePlayer` rather than ad-hoc utterances.

**Styling** is a single plain-CSS file (`src/index.css`); light/dark theme via a class/attribute toggled by `useTheme`, respecting system preference on first load.
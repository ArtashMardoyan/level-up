# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical workflow rules

**NEVER commit or push without explicit user instruction.** Wait for the user to say "commit" or "commit push" before running any `git commit` or `git push` command. No exceptions — not after fixing a bug, not after the build passes, not after any change. This matters double here: **every push to `master` auto-deploys to GitHub Pages.**

**Large tasks require a plan first.** For any large or cross-cutting task (new feature, redesign, refactor touching several components): create a branch off `master`, enter plan mode, and get the plan approved before writing code.

**Run `npm run lint` before finishing any change** and fix what it reports (`npm run lint:fix` handles most of it). Prefer fixing code to satisfy a rule over disabling the rule.

**Keep the redesign docs in sync with the UI.** When you change any UI (layout, components, or `src/index.css`), update `docs/redesign/status.md` and `docs/redesign/handoff/README.md` in the **same commit**. These docs are the design source of truth the mockup/prototype is built from; a stale spec is exactly what caused the sticky-header confusion (docs said one thing, code did another).

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint (flat config, eslint.config.mjs)
npm run lint:fix  # auto-fix lint + formatting
```

Course content and the audio/translation pipeline now live in the `level-up-backend` repo (JSON seed data + `scripts/*.mjs`). This app fetches content from the backend API.

There are no tests configured.

## Code style

Enforced by ESLint (flat config, `eslint.config.mjs`) — most violations auto-fix with `npm run lint:fix`:

- **Prettier as an ESLint rule**: no semicolons, single quotes, 2-space indent, print width 120, no trailing commas.
- **Import sorting** (`perfectionist/sort-imports`, line-length ascending): two groups separated by a blank line — builtin+external first, then internal/parent/sibling. Named imports within a statement also sorted by length.
- **Objects**: keys sorted by line length **descending** (`partitionByComment: true` — a comment inside the literal starts a new sort partition).
- **JSX props, named exports, etc.**: line-length sorted via `perfectionist` `recommended-line-length` preset.
- **React hooks**: `eslint-plugin-react-hooks` v7 with compiler-powered rules (`set-state-in-effect`, `refs`, `set-state-in-render`…). Don't sync state with props via `useEffect` — adjust state during render behind a `prev !== next` guard (see `QuestionCard.jsx`, `CoursePlayer.jsx`), and don't read `ref.current` during render.

## What this is

A React 18 + Vite SPA for practicing interview questions across multiple course tracks (Backend, Frontend, DevOps, QA, Node.js, Go, React, Next.js). Course content is fetched from the `level-up-backend` API (`GET /courses/full`). Per-user progress (reviewed/favorites) syncs to the backend when signed in; anonymous visitors fall back to `localStorage`. `VITE_API_URL` sets the API base (Pages build injects the App Runner URL).

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `master`. `vite.config.js` sets `base: '/level-up/'` to match the Pages URL — keep that in mind for any absolute asset paths.

`docs/` has context per feature/ticket — a single markdown file for smaller ones, or a folder with a few files for larger ones (e.g. `docs/dictionary/overview.md` for why/decisions/status, `docs/dictionary/code.md` for the technical reference). Check it for context beyond what this file covers before starting work on a feature.

## Architecture

**Routing** is hash-based (`useHashRoute`): `#<courseId>` or `#<courseId>/<questionId>`. `App.jsx` switches between the course picker (`CourseSelect`) and the course view (`PrepView`) based on the hash; the last-visited course is persisted and restored on fresh visits. Global search results navigate by setting a `#course/question` hash, and `PrepView` scrolls to and expands the `jumpToId` question.

**Content pipeline**: `src/data/courses.js` (`fetchCourses`) calls the backend `GET /courses/full?lang=` and normalizes each course/question so the UI keeps using human ids — a course's `id` is its `slug` (`go`), a question's `id` is its `ref` (`q1`) — while the backend uuid rides along on `uuid` for progress API calls. `useCourses` wraps this with per-language stale-while-revalidate caching (localStorage, gated on `GET /courses/version`) + loading/error state — see `docs/caching/overview.md`. A course with zero questions renders as "Coming soon". Content itself (JSON + audio/translation scripts) is authored in the `level-up-backend` repo, not here.

Each question the app renders: `{ id: <ref "q1">, uuid, module, question, answer, bonus?, audio? }`. `audio` is a single S3 object key resolved to a URL by `src/data/audio.js` (`audioUrl` = `VITE_S3_BUCKET_URL` + key); present → a pre-generated MP3 plays, absent → browser speech.

**State**: no state library. `useReviewState(courseId, questions)` is auth-aware — signed-in users read/write progress via the backend API (mapping `ref` ↔ `uuid` at the boundary), anonymous users use `localStorage` (keyed by course slug + question ref); on first sign-in `App.jsx` migrates any local progress to the backend once. Theme (`useTheme`) and TTS voice (`useSpeech`) are global and persisted. `PrepView` holds all in-course UI state (mode, search, collapsed modules, player).

**Text-to-speech** is built on the browser `speechSynthesis` API (`useSpeech` for voice selection, `CoursePlayer` for the auto-playing course-wide player). Per-question read-aloud is routed through `CoursePlayer` rather than ad-hoc utterances.

**Styling** is a single plain-CSS file (`src/index.css`); light/dark theme via a class/attribute toggled by `useTheme`, respecting system preference on first load.
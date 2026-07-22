# Knowledge Pack: Frontend Architecture (level-up)

Distilled context for agents. Load this + the one sibling component you're changing —
not the whole `src/`. Authoritative detail lives in `CLAUDE.md`; this is the map.

`last_verified: 2026-07-22`

## Shape
React 18 + Vite SPA, **JavaScript (JSX) — no TypeScript**. No state library. No test runner.

```
src/
  main.jsx        entry
  App.jsx         top-level switch: course picker vs course view, based on hash route
  components/     PascalCase.jsx views/widgets (CourseSelect, CoursePlayer, QuestionCard, ...)
  hooks/          useX.js (useHashRoute, useCourses, useReviewState, useTheme, useSpeech)
  services/       api.js (fetch wrapper), endpoints.js, authToken.js, audioPlayer.js
  data/           courses.js (fetchCourses + ref<->uuid normalize), audio.js (audioUrl)
  auth/           auth UI/flows
  i18n/           translations
  config/  utils/  site/
  index.css       single plain-CSS file; light/dark via class/attr toggled by useTheme
```

## Routing
Hash-based via `useHashRoute`: `#<courseId>` or `#<courseId>/<questionId>`. `App.jsx` picks
`CourseSelect` (picker) vs `PrepView` (course view). Global search navigates by setting a
`#course/question` hash; `PrepView` scrolls to / expands the `jumpToId` question.

## Data flow
- `data/courses.js` `fetchCourses` calls backend `GET /courses/full?lang=` and normalizes so
  the UI uses **human ids** (course `id` = slug, question `id` = ref) while the backend
  **uuid rides along** for progress calls. Map `ref ↔ uuid` only at this boundary.
- `useCourses` wraps it with per-language stale-while-revalidate caching (localStorage,
  gated on `GET /courses/version`) + loading/error state.
- API base = `VITE_API_URL` (Pages build injects the App Runner URL).

## State (no library)
- `useReviewState(courseId, questions)` is auth-aware: signed-in → backend progress API
  (`ref ↔ uuid` at the edge); anonymous → `localStorage` (course slug + question ref).
  On first sign-in, `App.jsx` migrates local progress to the backend once.
- `useTheme` (light/dark, system-aware) and `useSpeech` (TTS voice) are global + persisted.
- `PrepView` owns in-course UI state (mode, search, collapsed modules, player).

## Audio / TTS
Question `audio` = single S3 key → `data/audio.js` `audioUrl` (`VITE_S3_BUCKET_URL` + key).
Present → pre-generated MP3; absent → browser `speechSynthesis`. Read-aloud is routed through
`CoursePlayer`, not ad-hoc utterances.

## Conventions that bite (full list in CLAUDE.md)
- ESLint flat config; Prettier-as-rule: **no semicolons, single quotes, 2-space, width 120**.
- `perfectionist` sorting: imports & object keys by line length; JSX props line-length sorted.
- react-hooks v7 compiler rules: **do not** sync state from props via `useEffect` — adjust
  during render behind a `prev !== next` guard (see `QuestionCard.jsx`, `CoursePlayer.jsx`);
  don't read `ref.current` during render.
- **UI change ⇒ update `docs/redesign/status.md` + `docs/redesign/handoff/README.md`** in the
  same commit (design docs are the source of truth).

## Deploy / DoD
Push to `master` auto-deploys to GitHub Pages (base `/level-up/`). **Never push without explicit
instruction.** Automated gate is `npm run lint`; behavior is verified via the DOM (no
screenshots unless asked).

> Bump `last_verified` and flag stale references when you edit this file.

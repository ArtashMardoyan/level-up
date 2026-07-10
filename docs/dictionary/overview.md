# Interview Dictionary — overview

## Why

Artash is preparing for interviews and wants a daily-growing English/Russian vocabulary — words, interview phrases, grammar fixes, and stronger phrasing — reviewed while reading is more convenient (at work, waiting for a meeting) than going through full Q&A courses. The plan is a 30-day dictionary: roughly daily, new content gets added as a new day.

This is a second, distinct content type alongside the course Q&A decks — both languages are shown together in a table (not toggled by the language switch, unlike course answers).

See `code.md` in this folder for how it's actually implemented (file map, data schema, routing, how to extend).

## Status

- **Day 1**: shipped (2026-07-10) — 10 vocabulary, 10 phrases, 5 grammar fixes, 5 team-lead sentences, 7 words-to-use-more, 5 daily-goal sentences.
- Search integration: intentionally out of scope — `GlobalSearch.jsx` does not index dictionary content.
- Day navigation inside a day: simple prev/next only. Picking *which* day to open in the first place goes through `DictionarySelect`'s card grid.

## Decisions made along the way

- **Separate data module, not a course.** Course Q&A toggles one language at a time (`mergeQuestions`); dictionary rows show English + Russian side by side always. Reusing the course registry/merge logic would have been the wrong fit, so it's its own `src/data/dictionary.js` + `src/data/dictionary/day{N}.json` files.
- **Tables, not cards.** The user explicitly asked for tables — easier to scan than the course app's expandable Q&A cards.
- **First attempt was a single "Dictionary" card mixed into the course grid, linking straight to the latest day.** Revised (2026-07-10) to a `Courses` / `Dictionary` tab switcher on the home page, where the `Dictionary` tab shows a day-picker grid (`DictionarySelect`) instead of jumping straight into content — this scales better once there are many days, and keeps the two content types visually distinct rather than blended into one grid.
- **"Mark as learned" reuses the existing `useReviewState` hook** (same one courses use for favorites/reviewed) rather than inventing new state machinery — it was already generic enough (just an id-array toggler namespaced by a storage key).

## Improvements log

- 2026-07-10: Replaced the single "Dictionary" card mixed into the course grid with a `Courses`/`Dictionary` tab switcher on the home page; `Dictionary` tab shows a day-picker grid (`DictionarySelect`) instead of jumping straight into the latest day's content.
- 2026-07-10: Split this doc into `docs/dictionary/overview.md` (this file — why, status, decisions) and `docs/dictionary/code.md` (technical reference) instead of one flat `docs/dictionary.md`.
- 2026-07-10: Added text-to-speech "Listen" support — a per-row 🔊 icon and a whole-day "Listen" toggle, speaking English then Russian per row (reusing the course player's floating-bar pattern, `DictionaryPlayer.jsx`).

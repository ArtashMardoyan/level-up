# Interview Dictionary — overview

## Why

Artash is preparing for interviews and wants a growing English/Russian knowledge base — words, interview phrases, grammar fixes, and stronger phrasing — reviewed while reading is more convenient (at work, waiting for a meeting) than going through full Q&A courses.

Originally shipped organized **by day** (Day 1, Day 2…). After UX review that model was dropped: the dictionary is now a **permanent knowledge base organized by category**. New content is appended to the relevant category instead of creating a new day — easier to browse, easier to maintain, more useful right before an interview.

This is a second, distinct content type alongside the course Q&A decks — both languages are shown together (not toggled by the language switch, unlike course answers).

See `code.md` in this folder for how it's actually implemented (file map, category schema, routing, how to extend).

## Categories

Eight categories, each a card on the Dictionary tab. Grid order puts the two daily single-card categories first, then the reference tables:

- 🎯 **Today's Challenge** — single card, en / ru
- ⭐ **Sentence of the Day** — single card, en / ru / explanation
- 📖 **Vocabulary** — en / ru / example (table)
- 🗣️ **Pronunciation** — word / say-it-like hint / ru (table)
- 💬 **Interview Phrases** — en / ru (table)
- 📝 **Grammar Fixes** — wrong / right, shown with ❌ / ✅ (table)
- 👨‍💼 **Leadership** — en / ru (table)
- 📈 **Words to Use More** — instead / try saying (table)

Table categories support "mark as learned" + a progress bar. The two single-card categories show the newest item only (no progress) and are meant to be replaced/appended daily.

## Status

- Category refactor: shipped 2026-07-10.
- Content: 10 vocabulary, 10 pronunciation, 10 phrases, 5 grammar fixes, 5 leadership, 7 words-to-use-more, 5 sentence-of-the-day, 1 challenge (migrated from the old Day 1; pronunciation added fresh).
- Search integration: intentionally out of scope — `GlobalSearch.jsx` does not index dictionary content.

## Decisions made along the way

- **Separate data module, not a course.** Course Q&A toggles one language at a time (`mergeQuestions`); dictionary rows show English + Russian side by side always. It's its own `src/data/dictionary.js` + `src/data/dictionary/{category}.json` files.
- **Data-driven, not page-driven.** One reusable `DictionaryCategoryPage` renders itself from a category descriptor (`layout`, `columns`, `speak`). Adding a future category (e.g. AWS Vocabulary, System Design) is one registry entry + one JSON file — no new component.
- **Tables for lists, one prominent card for the daily single categories.** Tables are easier to scan; the single card highlights the one sentence/challenge of the day.
- **"Mark as learned" reuses the existing `useReviewState('dictionary')` hook** (same one courses use for favorites/reviewed) — one shared bucket across all categories, since ids are globally unique.

## Improvements log

- 2026-07-14: **In-page lesson/course switcher (`PageSwitcher`).** Added a header switcher so you can jump between dictionary categories (and between courses) without returning to the home grid. Layout: a `← {back}  ›  {current} ▾` row above the existing big title; the `{current} ▾` chip opens a dropdown (`role="listbox"`, closes on outside-click/Escape) of sibling items. The dropdown/current chip reuse `CourseIcon` so their icons match the big title (SVG logos for courses, emoji for dictionary). One shared component `src/components/PageSwitcher.jsx` drives both `DictionaryCategoryPage` and `PrepView`; `App.jsx` passes `navigate`/`courses` down. Courses with zero questions ("Coming soon") are excluded from the course dropdown. Also unified the accent-border hover on all bordered buttons (`mode-btn`, `plain-btn`, `speak-btn`, `settings-gear`, player + interview buttons).
- 2026-07-10: **Home-grid polish (from a product review).** Added a one-line description under each category card (`descKey` per descriptor → `.course-subtitle`); replaced the single categories' plain "Updated daily" text with a top-right "📅 Daily" `.course-badge` (reusing the "Coming soon" pill) and dropped their learned-count line; swapped the Words-to-Use-More icon 🔁 → 📈; changed the home headline to "Choose Your Learning Path". Deliberately *not* done: fabricated content stats ("245 words"/"+N today" — no per-item dates, not enough content), a "today's progress" widget, and the reviewer's reorder (kept the two daily cards grouped at the top). Pronunciation kept.
- 2026-07-10: **By-day → by-category refactor.** Removed day navigation entirely (`day{N}.json`, `DictionaryView`, `DictionaryGoalList`, prev/next day nav). Replaced with a category-card grid and a single data-driven `DictionaryCategoryPage`. `wordsToUseMore` became its own category; the old `dailyGoal` sentences seeded Sentence of the Day (with added ru + explanation). Item ids were re-keyed from `d1-*` to per-category prefixes (`voc-*`, `phr-*`…), which resets the previous localStorage "learned" progress.
- 2026-07-10 (earlier): Added text-to-speech "Listen" support — a per-row 🔊 icon and a whole-page "Listen" toggle (`DictionaryPlayer.jsx`).

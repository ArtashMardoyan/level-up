# Interview Dictionary — code reference

See `overview.md` in this folder for why this feature exists and the decisions behind it.

## File map

- `src/data/dictionary/day{N}.json` — one file per day. Every row has a hand-authored, stable `id` (`d{day}-{prefix}{n}`, e.g. `d1-v3`) so "mark as learned" state survives future content edits.
- `src/data/dictionary.js` — registry: `DICTIONARY_DAYS`, `getDictionaryDay(n)`, `getLatestDictionaryDay()`, `getDictionaryDayCount()`, `getDictionaryDayRowIds(day)` (flattens every section's row ids for a day, used for per-day progress).
- `src/components/DictionarySelect.jsx` — day-picker grid (reached via `#dictionary`, no day segment), one card per day showing "{done} / {total} learned", reusing `.course-card` styling. Clicking a card navigates to `#dictionary/day{N}`.
- `src/components/DictionaryView.jsx` — a specific day's content (reached via `#dictionary/day{N}`). Renders `DictionaryTable.jsx` (generic table renderer, reused for the five tabular sections with different `columns` props) and `DictionaryGoalList.jsx` (checklist for the daily-goal sentences).
- `src/components/ProgressBar.jsx` — reused as-is, now takes an optional `labelKey` prop (defaults to `'reviewedProgress'`) so `DictionaryView` can pass `labelKey="dictionaryLearnedProgress"` instead of the course-review wording.
- "Mark as learned" reuses `useReviewState('dictionary')` (the same hook courses use for favorites/reviewed) — one shared bucket across all days, since ids are globally unique.
- Home page tabs live in `App.jsx`'s home branch: a `Courses` / `Dictionary` switcher reusing `.mode-bar`/`.mode-btn` (the same pill-toggle used for list/quiz/interview mode). `Courses` tab renders the existing `CourseSelect` grid; `Dictionary` tab renders `DictionarySelect`. Not mixed into `src/data/courses.js`'s `COURSES` registry.

## Day schema

Each day file has these optional sections (omit a key entirely if a day doesn't have that section):

```json
{
  "day": 1,
  "vocabulary": [{ "id": "d1-v1", "en": "genuinely", "ru": "действительно, искренне", "example": "..." }],
  "phrases": [{ "id": "d1-p1", "en": "In my experience…", "ru": "По моему опыту…" }],
  "grammarFixes": [{ "id": "d1-g1", "wrong": "For first", "right": "First" }],
  "teamLeadSentences": [{ "id": "d1-t1", "en": "...", "ru": "..." }],
  "wordsToUseMore": [{ "id": "d1-w1", "instead": "I think", "tryThis": "In my experience…" }],
  "dailyGoal": [{ "id": "d1-goal1", "en": "..." }]
}
```

`grammarFixes` and `wordsToUseMore` are English-only (no `ru` field) — they're not translation tables. `vocabulary`/`phrases`/`teamLeadSentences` share the `en`/`ru` shape and render through the same `DictionaryTable` component with different `columns`.

## Routing

`#dictionary` (no second segment) → `DictionarySelect` day-picker grid, tab bar shows `Dictionary` active. `#dictionary/day{N}` → `DictionaryView` for that specific day, tab bar hidden (same as how picking a course hides the `Courses`/`Dictionary` tabs and shows `PrepView`).

In `App.jsx`:
```js
const isDictionary = courseId === 'dictionary'
const dictionaryDayNumber = isDictionary ? Number((jumpToId || '').replace('day', '')) || null : null
const showDictionaryDay = isDictionary && dictionaryDayNumber
```
`showDictionaryDay` gates whether `DictionaryView` renders; otherwise (when `isDictionary` is true but there's no day number) the home branch renders with the `Dictionary` tab active and `DictionarySelect` as its content.

`loadSelectedCourseId()` treats a saved `'dictionary'` value as valid on resume — landing back on the day-picker (not a remembered specific day), consistent with how resuming a course lands you in that course's `PrepView` directly but does *not* restore your exact scroll position/question.

## i18n

All `dictionary*` keys in `src/i18n/strings.js` are chrome-only (section headers, column labels, nav labels, progress text) — the actual word/phrase/sentence content is read straight from the day JSON's `en`/`ru`/`wrong`/`right`/`instead`/`tryThis` fields and never passed through `t()`. `tabCourses`/`tabDictionary` (home page tab labels) live under the `// App` partition since they're shared between both tabs, not specific to the dictionary page.

## Listen (text-to-speech)

- `src/components/DictionaryPlayer.jsx` — a trimmed-down sibling of `CoursePlayer.jsx` (same floating `.player-bar` markup/CSS, same Chrome cancel/setTimeout(50ms) and 10s pause/resume keep-alive workarounds). Instead of question/answer phases it plays `primary`/`secondary` phases per item, always in **English then Russian** regardless of the app's active UI language (unlike `CoursePlayer`, which speaks in whichever language the UI toggle is on) — dictionary content is inherently bilingual per row, so the player forces `en`/`ru` voices directly rather than deriving language from `useLanguage()`.
- `buildSpeakItems(day)` (module-level function in `DictionaryView.jsx`) flattens a day into `{ id, primary, secondary }` items in display order: vocabulary/phrases/teamLeadSentences speak `en` then `ru`; grammarFixes speaks only `right` (the corrected form, not `wrong`); wordsToUseMore speaks only `tryThis`; dailyGoal speaks `en`. `secondary` is `null` for the English-only sections — `DictionaryPlayer` skips straight to the next item instead of speaking an empty phase (checked via `currentItem.secondary` truthiness in the `onend` handler, not a separate silent-utterance).
- Two entry points into the same player: a per-row 🔊 icon (`DictionaryTable`/`DictionaryGoalList`, `onSpeak(row.id)`) that opens the player and jumps straight to that row (mirrors `QuestionCard`'s speak icon → `CoursePlayer` `startRequest` pattern), and a "🔊 Listen" toggle button in `DictionaryView` (mirrors `ModeBar`'s Listen button) that opens it at the current position.
- The player reports its currently-speaking row id back up via `onActiveChange` → `DictionaryView`'s `activeId` state → passed down to every `DictionaryTable`/`DictionaryGoalList` instance for a highlight class (`.dictionary-row-active`) and used in a `useEffect` that calls `document.getElementById(activeId)?.scrollIntoView(...)` (simpler than threading a `ref` through every row across five separate table instances — safe here because row ids are unique across the whole day).
- Voice resolution per phase: `targetLang === language ? voiceName : ''` passed into the existing `resolveVoice(voices, name, lang)` helper — if the phase's language matches the app's current UI language, honor the user's chosen voice for it; otherwise auto-pick a default voice for that language. This avoids needing to plumb separate stored voice preferences for "the other" language through `SettingsPanel`.

## How to add a new day

1. Write `src/data/dictionary/day{N}.json` with `"day": N` and ids prefixed `d{N}-...`.
2. In `src/data/dictionary.js`: add the import and append it to `DICTIONARY_DAYS`.
3. Nothing else needs to change — `DictionarySelect`'s day cards, the day-nav bounds inside `DictionaryView`, and progress all read off `DICTIONARY_DAYS`/`getDictionaryDayRowIds` automatically.
4. If a new section type is introduced (the original plan mentions "pronunciation tip" and "technical concept" starting later days), add the field to that day's JSON, to `SECTION_KEYS` in `src/data/dictionary.js`, and a small conditional render block in `DictionaryView.jsx` — don't add it speculatively before a day actually needs it.

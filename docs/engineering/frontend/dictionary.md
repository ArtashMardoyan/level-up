# Interview Dictionary — code reference

See `overview.md` in this folder for why this feature exists and the decisions behind it.

## File map

- `src/data/dictionary/{category}.json` — one file per category (`vocabulary`, `pronunciation`, `interviewPhrases`, `grammarFixes`, `leadership`, `wordsToUseMore`, `sentenceOfTheDay`, `todaysChallenge`). Each is a **plain array** of items with a hand-authored, stable `id` (per-category prefix, e.g. `voc-1`, `phr-3`) so "mark as learned" state survives content edits. Items are stored **newest-first**; display order = file order, so adding new content means prepending one object.
- `src/data/dictionary.js` — the category registry: `DICTIONARY_CATEGORIES` (array of descriptors), `getDictionaryCategory(id)`, `getDictionaryCategoryItemIds(category)`, `isDictionaryCategoryLearnable(category)` (true when `layout === 'table'`).
- `src/components/DictionarySelect.jsx` — the category-card grid (reached via `#dictionary`, no second segment), one `.course-card` per category. Table categories show "{done} / {total} learned"; single categories show a static "Updated daily" subtitle. Clicking navigates to `#dictionary/{categoryId}`.
- `src/components/DictionaryCategoryPage.jsx` — the single, data-driven page for one category (reached via `#dictionary/{categoryId}`). Branches on `category.layout`: `table` → `DictionaryTable` (columns resolved from the descriptor) + `ProgressBar`; `single` → `DictionarySingle` (newest item, no progress bar). Owns the `DictionaryPlayer`, `activeId` highlight/scroll, and per-row speak wiring.
- `src/components/DictionaryTable.jsx` — generic table renderer. Columns are `{ label, key, prefix? }`; `prefix` prepends a marker to the cell value (used for ❌ / ✅ on grammar fixes). Renders the speak 🔊 column and the "learned" checkbox. `title` is optional (the page's `<h1>` already names the category, so it's omitted).
- `src/components/DictionarySingle.jsx` — the prominent single-item card (Sentence of the Day / Today's Challenge): large `en`, optional `ru`, optional `explanation`, and a 🔊 speak button.
- `src/components/DictionaryPlayer.jsx` — the TTS player (unchanged, generic over an `items` array of `{ id, primary, secondary }`).
- `src/components/ProgressBar.jsx` — reused with `labelKey="dictionaryLearnedProgress"`.
- "Mark as learned" reuses `useReviewState('dictionary')` — one shared bucket across all categories, since ids are globally unique.
- Home page tabs live in `App.jsx`'s home branch: a `Courses` / `Dictionary` switcher reusing `.mode-bar`/`.mode-btn`. `Dictionary` tab renders `DictionarySelect`. Not mixed into `src/data/courses.js`'s `COURSES` registry.

## Category descriptor schema

Each entry in `DICTIONARY_CATEGORIES`:

```js
{
  id: 'vocabulary',              // matches the hash segment and JSON filename
  emoji: '📖',
  layout: 'table',              // 'table' | 'single'
  titleKey: 'dictionaryVocabulary',   // i18n key
  columns: [                     // table layout only
    { key: 'en', labelKey: 'dictionaryColWord' },
    { key: 'ru', labelKey: 'dictionaryColTranslation' },
    { key: 'example', labelKey: 'dictionaryColExample' }
  ],
  speak: (item) => ({ primary: item.en, secondary: item.ru }),  // secondary null = one-sided
  items: vocabulary              // imported JSON array
}
```

- `speak` maps an item to the `{ primary, secondary }` phrases the player reads (English then Russian). One-sided sections return `secondary: null` — grammar fixes speak only `right`, words-to-use-more only `tryThis`. `DictionaryPlayer` skips a null secondary.
- A `single`-layout category has no `columns`; the page renders `items[0]` via `DictionarySingle` and builds a one-item speak list.
- Item shapes per category: vocabulary `{id,en,ru,example}`, pronunciation `{id,en,hint,ru}`, interviewPhrases/leadership `{id,en,ru}`, grammarFixes `{id,wrong,right}`, wordsToUseMore `{id,instead,tryThis}`, sentenceOfTheDay `{id,en,ru,explanation}`, todaysChallenge `{id,en,ru}`.

## Routing

`#dictionary` (no second segment) → `DictionarySelect` category grid, home tab bar shows `Dictionary` active. `#dictionary/{categoryId}` → `DictionaryCategoryPage` for that category, tab bar hidden.

In `App.jsx`:
```js
const isDictionary = courseId === 'dictionary'
const dictionaryCategory = isDictionary ? getDictionaryCategory(jumpToId) : null
const showDictionaryCategory = isDictionary && dictionaryCategory
```
`showDictionaryCategory` gates whether `DictionaryCategoryPage` renders; otherwise the home branch renders with the `Dictionary` tab active and `DictionarySelect` as its content. An unknown/stale category id (e.g. an old `#dictionary/day1` bookmark) resolves to `null` → falls back to the grid.

`loadSelectedCourseId()` treats a saved `'dictionary'` value as valid on resume — landing back on the category grid.

## i18n

All `dictionary*` keys in `src/i18n/strings.js` are chrome-only (category titles, column labels, progress text, "Updated daily"). The actual word/phrase/sentence content is read straight from the JSON `en`/`ru`/`wrong`/`right`/`instead`/`tryThis`/`explanation` fields and never passed through `t()`. `tabCourses`/`tabDictionary` live under the `// App` partition.

## Listen (text-to-speech)

`DictionaryPlayer.jsx` plays `primary`/`secondary` phases per item, always **English then Russian** regardless of the app's UI language (dictionary content is inherently bilingual). The page builds `speakItems = items.map(i => ({ id: i.id, ...category.speak(i) }))` (single layout: just `items[0]`). Two entry points: a per-row/per-card 🔊 icon (`onSpeak(id)` → opens the player at that item) and the "🔊 Listen" toggle. The player reports its active item id via `onActiveChange`, which drives the `.dictionary-row-active` highlight and a `scrollIntoView`.

## How to extend

**Add an item:** prepend one object (with a fresh `id` using the category's prefix) to the top of the corresponding `{category}.json`. Nothing else changes — cards, progress, tables, and the player all read off the registry.

**Add a category:**
1. Create `src/data/dictionary/{id}.json` (array of items, ids prefixed for that category).
2. Add a descriptor to `DICTIONARY_CATEGORIES` in `src/data/dictionary.js` (import the JSON, set `id`/`emoji`/`layout`/`titleKey`/`columns?`/`speak`).
3. Add the `titleKey` (and any new column label keys) to both languages in `src/i18n/strings.js`.
4. No component changes needed — `DictionarySelect` and `DictionaryCategoryPage` render it automatically.

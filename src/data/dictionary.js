import leadership from './dictionary/leadership.json'
import vocabulary from './dictionary/vocabulary.json'
import grammarFixes from './dictionary/grammarFixes.json'
import pronunciation from './dictionary/pronunciation.json'
import wordsToUseMore from './dictionary/wordsToUseMore.json'
import todaysChallenge from './dictionary/todaysChallenge.json'
import interviewPhrases from './dictionary/interviewPhrases.json'
import sentenceOfTheDay from './dictionary/sentenceOfTheDay.json'

// Category registry. Each descriptor is self-rendering: `layout` picks the page
// shape, `columns` (table layout only) drives DictionaryTable, and `speak` maps
// an item to the { primary, secondary } phrases the player reads (secondary null
// = one-sided). Adding a category = one entry here + one JSON file.
export const DICTIONARY_CATEGORIES = [
  {
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescTodaysChallenge',
    titleKey: 'dictionaryTodaysChallenge',
    items: todaysChallenge,
    id: 'todaysChallenge',
    accent: '#fb7185',
    layout: 'single',
    emoji: '🎯'
  },
  {
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescSentenceOfDay',
    titleKey: 'dictionarySentenceOfDay',
    items: sentenceOfTheDay,
    id: 'sentenceOfTheDay',
    accent: '#fbbf24',
    layout: 'single',
    emoji: '⭐'
  },
  {
    columns: [
      { labelKey: 'dictionaryColWord', key: 'en' },
      { labelKey: 'dictionaryColTranslation', key: 'ru' },
      { labelKey: 'dictionaryColExample', key: 'example' }
    ],
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescVocabulary',
    titleKey: 'dictionaryVocabulary',
    items: vocabulary,
    accent: '#818cf8',
    id: 'vocabulary',
    layout: 'table',
    emoji: '📖'
  },
  {
    columns: [
      { labelKey: 'dictionaryColWord', key: 'en' },
      { labelKey: 'dictionaryColSayLike', key: 'hint' },
      { labelKey: 'dictionaryColTranslation', key: 'ru' }
    ],
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescPronunciation',
    titleKey: 'dictionaryPronunciation',
    items: pronunciation,
    id: 'pronunciation',
    accent: '#22d3ee',
    layout: 'table',
    emoji: '🗣️'
  },
  {
    columns: [
      { labelKey: 'dictionaryColPhrase', key: 'en' },
      { labelKey: 'dictionaryColTranslation', key: 'ru' }
    ],
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescPhrases',
    titleKey: 'dictionaryPhrases',
    items: interviewPhrases,
    id: 'interviewPhrases',
    accent: '#c084fc',
    layout: 'table',
    emoji: '💬'
  },
  {
    columns: [
      { labelKey: 'dictionaryColDontSay', key: 'wrong', prefix: '❌ ' },
      { labelKey: 'dictionaryColSayInstead', key: 'right', prefix: '✅ ' }
    ],
    speak: (item) => ({ primary: item.right, secondary: null }),
    descKey: 'dictionaryDescGrammarFixes',
    titleKey: 'dictionaryGrammarFixes',
    items: grammarFixes,
    id: 'grammarFixes',
    accent: '#4ade80',
    layout: 'table',
    emoji: '📝'
  },
  {
    columns: [
      { labelKey: 'dictionaryColPhrase', key: 'en' },
      { labelKey: 'dictionaryColTranslation', key: 'ru' }
    ],
    speak: (item) => ({ secondary: item.ru, primary: item.en }),
    descKey: 'dictionaryDescLeadership',
    titleKey: 'dictionaryLeadership',
    items: leadership,
    accent: '#38bdf8',
    id: 'leadership',
    layout: 'table',
    emoji: '👨‍💼'
  },
  {
    columns: [
      { labelKey: 'dictionaryColInsteadOf', key: 'instead' },
      { labelKey: 'dictionaryColTrySaying', key: 'tryThis' }
    ],
    speak: (item) => ({ primary: item.tryThis, secondary: null }),
    descKey: 'dictionaryDescWordsToUseMore',
    titleKey: 'dictionaryWordsToUseMore',
    items: wordsToUseMore,
    id: 'wordsToUseMore',
    accent: '#2dd4bf',
    layout: 'table',
    emoji: '📈'
  }
]

export function getDictionaryCategory(id) {
  return DICTIONARY_CATEGORIES.find((c) => c.id === id) || null
}

export function getDictionaryCategoryItemIds(category) {
  return category.items.map((item) => item.id)
}

export function isDictionaryCategoryLearnable(category) {
  return category.layout === 'table'
}

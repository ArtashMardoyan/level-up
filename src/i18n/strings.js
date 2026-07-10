// Flat UI-string dictionary. Every key must exist in both languages; plural
// entries are objects keyed by Intl.PluralRules categories (one/few/many/other).
// The "// Component" comments are partition markers for perfectionist/sort-objects —
// they keep keys grouped by component instead of sorted across the whole table.
export const STRINGS = {
  ru: {
    // App
    footer: 'Сделано для подготовки к собеседованиям · работает полностью офлайн',
    homeHeading: 'Выберите свой путь к успешному собеседованию',
    tabDictionary: 'Словарь',
    tabCourses: 'Курсы',
    // AppHeader
    brandAria: 'Level Up — все курсы',
    logoAria: 'Логотип Level Up',
    // CourseSelect
    questionsCount: { many: '{n} вопросов', other: '{n} вопроса', few: '{n} вопроса', one: '{n} вопрос' },
    comingSoon: 'Скоро',
    // ModeBar
    favoritesOnly: 'Только избранное',
    interviewMode: 'Интервью',
    quizMode: 'Самопроверка',
    listView: 'Список',
    listen: 'Слушать',
    // PrepView
    hintQuiz: 'Нажмите на вопрос, затем «Показать ответ», чтобы проверить себя',
    searchPlaceholder: 'Поиск... например redis, jwt, stripe, pagination',
    hintList: 'Нажмите на любой вопрос, чтобы увидеть ответ',
    noMatches: 'По запросу ничего не найдено.',
    expandAll: 'Развернуть все',
    collapseAll: 'Свернуть все',
    // ProgressBar
    reviewedProgress: '{done} / {total} отмечено как просмотренные',
    // QuestionCard
    favoriteAria: 'Добавить в избранное или убрать',
    playQuestionAria: 'Озвучить вопрос и ответ',
    copyAnswer: 'Копировать ответ',
    showAnswer: 'Показать ответ',
    showBonus: 'Показать бонус',
    hideAnswer: 'Скрыть ответ',
    hideBonus: 'Скрыть бонус',
    copied: 'Скопировано!',
    bonus: 'Бонус',
    // InterviewMode
    interviewDone: 'Готово! Все вопросы пройдены.',
    questionOf: 'Вопрос {n} из {total}',
    skipNext: 'Пропустить / далее',
    restart: 'Заново',
    // CoursePlayer
    playerStatusQuestion: 'Вопрос {n} из {total}',
    playerCloseAria: 'Остановить и закрыть плеер',
    playerStatusAnswer: 'Ответ {n} из {total}',
    nothingToPlay: 'Нечего воспроизводить',
    allModules: 'Все модули',
    // GlobalSearch
    showingFirst: 'Показаны первые {max} из {total} совпадений — уточните запрос.',
    globalSearchPlaceholder: 'Поиск по всем курсам...',
    globalSearchAria: 'Поиск по всем курсам',
    // SettingsPanel
    voiceAria: 'Голос для озвучивания',
    defaultVoice: 'Голос по умолчанию',
    settingsAria: 'Настройки',
    themeLight: '☀ Светлая',
    themeDark: '☾ Тёмная',
    language: 'Язык',
    voice: 'Голос',
    theme: 'Тема',
    // DictionaryView
    dictionaryWordsToUseMore: 'Слова для более частого использования',
    dictionaryLearnedProgress: '{done} / {total} изучено',
    dictionaryTeamLeadSentences: 'Сильные фразы тимлида',
    dictionaryGrammarFixes: 'Исправление грамматики',
    dictionaryMarkLearned: 'Отметить как изученное',
    dictionaryColTrySaying: 'Попробуйте сказать…',
    dictionaryTitle: 'Словарь для собеседований',
    dictionarySpeakAria: 'Озвучить эту строку',
    dictionaryPlayerStatus: '{n} из {total}',
    dictionaryPhrases: 'Фразы для интервью',
    dictionaryColSayInstead: 'Говорите так',
    dictionaryDayOf: 'День {n} из {total}',
    dictionaryDailyGoal: 'Цель на сегодня',
    dictionaryPrevDay: 'Предыдущий день',
    dictionaryNewDaily: 'Слова и фразы',
    dictionaryNextDay: 'Следующий день',
    dictionaryColTranslation: 'Перевод',
    dictionaryColDontSay: 'Не говорите',
    dictionaryColInsteadOf: 'Вместо…',
    dictionaryVocabulary: 'Словарь',
    dictionaryDayLabel: 'День {n}',
    dictionaryColExample: 'Пример',
    dictionaryColPhrase: 'Фраза',
    dictionaryColWord: 'Слово'
  },
  en: {
    // App
    footer: 'Made for interview practice · works fully offline',
    homeHeading: 'Choose your path to interview-ready',
    tabDictionary: 'Dictionary',
    tabCourses: 'Courses',
    // AppHeader
    brandAria: 'Level Up — all courses',
    logoAria: 'Level Up logo',
    // CourseSelect
    questionsCount: { other: '{n} questions', one: '{n} question' },
    comingSoon: 'Coming soon',
    // ModeBar
    interviewMode: 'Interview mode',
    favoritesOnly: 'Favorites only',
    listView: 'List view',
    quizMode: 'Quiz mode',
    listen: 'Listen',
    // PrepView
    searchPlaceholder: 'Search... e.g. redis, jwt, stripe, pagination',
    hintQuiz: 'Tap question, then "Show answer" to test yourself',
    hintList: 'Tap any question to reveal the answer',
    noMatches: 'No questions match your search.',
    collapseAll: 'Collapse all',
    expandAll: 'Expand all',
    // ProgressBar
    reviewedProgress: '{done} / {total} marked as reviewed',
    // QuestionCard
    playQuestionAria: 'Play question and answer',
    favoriteAria: 'Toggle favorite',
    showAnswer: 'Show answer',
    hideAnswer: 'Hide answer',
    copyAnswer: 'Copy answer',
    showBonus: 'Show bonus',
    hideBonus: 'Hide bonus',
    copied: 'Copied!',
    bonus: 'Bonus',
    // InterviewMode
    interviewDone: 'Done! You went through all questions.',
    questionOf: 'Question {n} of {total}',
    skipNext: 'Skip / next',
    restart: 'Restart',
    // CoursePlayer
    playerStatusQuestion: 'Q {n} of {total}',
    playerCloseAria: 'Stop and close player',
    playerStatusAnswer: 'A {n} of {total}',
    nothingToPlay: 'Nothing to play',
    allModules: 'All modules',
    // GlobalSearch
    showingFirst: 'Showing first {max} of {total} matches — refine your search.',
    globalSearchPlaceholder: 'Search all courses...',
    globalSearchAria: 'Search across all courses',
    // SettingsPanel
    voiceAria: 'Voice for read-aloud',
    defaultVoice: 'Default voice',
    settingsAria: 'Settings',
    themeLight: '☀ Light',
    language: 'Language',
    themeDark: '☾ Dark',
    theme: 'Theme',
    voice: 'Voice',
    // DictionaryView
    dictionaryTeamLeadSentences: 'Powerful Team Lead Sentences',
    dictionaryLearnedProgress: '{done} / {total} learned',
    dictionaryWordsToUseMore: 'Words to Use More Often',
    dictionaryNewDaily: 'Vocabulary & phrases',
    dictionarySpeakAria: 'Pronounce this row',
    dictionaryMarkLearned: 'Mark as learned',
    dictionaryPlayerStatus: '{n} of {total}',
    dictionaryTitle: 'Interview Dictionary',
    dictionaryGrammarFixes: 'Grammar Fixes',
    dictionaryColTranslation: 'Translation',
    dictionaryPhrases: 'Interview Phrases',
    dictionaryColSayInstead: 'Say Instead',
    dictionaryDayOf: 'Day {n} of {total}',
    dictionaryColInsteadOf: 'Instead of…',
    dictionaryColTrySaying: 'Try Saying…',
    dictionaryDailyGoal: "Today's Goal",
    dictionaryVocabulary: 'Vocabulary',
    dictionaryPrevDay: 'Previous day',
    dictionaryColDontSay: "Don't Say",
    dictionaryColExample: 'Example',
    dictionaryDayLabel: 'Day {n}',
    dictionaryNextDay: 'Next day',
    dictionaryColPhrase: 'Phrase',
    dictionaryColWord: 'Word'
  }
}

const PLURAL_RULES = {
  en: new Intl.PluralRules('en'),
  ru: new Intl.PluralRules('ru')
}

export function translate(language, key, params) {
  const table = STRINGS[language] ?? STRINGS.en
  let value = table[key] ?? STRINGS.en[key] ?? key
  if (typeof value === 'object') {
    const rules = PLURAL_RULES[language] ?? PLURAL_RULES.en
    value = value[rules.select(params.n)] ?? value.other
  }
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? ''))
}

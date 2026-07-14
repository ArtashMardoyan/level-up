// Flat UI-string dictionary. Every key must exist in both languages; plural
// entries are objects keyed by Intl.PluralRules categories (one/few/many/other).
// The "// Component" comments are partition markers for perfectionist/sort-objects —
// they keep keys grouped by component instead of sorted across the whole table.
export const STRINGS = {
  ru: {
    // App
    footer: 'Сделано для подготовки к собеседованиям · работает полностью офлайн',
    homeHeading: 'Выберите свой путь обучения',
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
    playPause: 'Воспроизведение / пауза',
    allModules: 'Все модули',
    speed: 'Скорость',
    seek: 'Перемотка',
    previous: 'Назад',
    next: 'Вперёд',
    // GlobalSearch
    showingFirst: 'Показаны первые {max} из {total} совпадений — уточните запрос.',
    globalSearchPlaceholder: 'Поиск по всем курсам...',
    globalSearchAria: 'Поиск по всем курсам',
    // SettingsPanel
    settingsAria: 'Настройки',
    themeLight: '☀ Светлая',
    themeDark: '☾ Тёмная',
    language: 'Язык',
    theme: 'Тема',
    // Dictionary
    dictionaryDescGrammarFixes: 'Частые ошибки в английском — исправленные',
    dictionaryDescPronunciation: 'Сложные IT-слова и как их произносить',
    dictionaryWordsToUseMore: 'Слова для более частого использования',
    dictionaryDescSentenceOfDay: 'Одна фраза, чтобы освоить сегодня',
    dictionaryDescVocabulary: 'Английские слова для бэкенд-интервью',
    dictionaryDescWordsToUseMore: 'Замени слабые слова на сильные',
    dictionaryDescLeadership: 'Сильные фразы для вопросов тимлиду',
    dictionaryDescPhrases: 'Готовые фразы для ответов на интервью',
    dictionaryDescTodaysChallenge: 'Маленькая цель на день',
    dictionaryLearnedProgress: '{done} / {total} изучено',
    dictionaryGrammarFixes: 'Исправление грамматики',
    dictionaryTodaysChallenge: 'Задание на сегодня',
    dictionaryMarkLearned: 'Отметить как изученное',
    dictionaryColTrySaying: 'Попробуйте сказать…',
    dictionaryTitle: 'Словарь для собеседований',
    dictionarySpeakAria: 'Озвучить эту строку',
    dictionaryPlayerStatus: '{n} из {total}',
    dictionaryPhrases: 'Фразы для интервью',
    dictionaryColSayInstead: 'Говорите так',
    dictionaryPronunciation: 'Произношение',
    dictionaryDailyBadge: '📅 Каждый день',
    dictionarySentenceOfDay: 'Фраза дня',
    dictionaryColSayLike: 'Читается как',
    dictionaryColTranslation: 'Перевод',
    dictionaryColDontSay: 'Не говорите',
    dictionaryLeadership: 'Лидерство',
    dictionaryColInsteadOf: 'Вместо…',
    dictionaryVocabulary: 'Словарь',
    dictionaryColExample: 'Пример',
    dictionaryColPhrase: 'Фраза',
    dictionaryColWord: 'Слово',
    dictionaryBack: 'Словарь'
  },
  en: {
    // App
    footer: 'Made for interview practice · works fully offline',
    homeHeading: 'Choose Your Learning Path',
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
    playPause: 'Play / pause',
    previous: 'Previous',
    speed: 'Speed',
    seek: 'Seek',
    next: 'Next',
    // GlobalSearch
    showingFirst: 'Showing first {max} of {total} matches — refine your search.',
    globalSearchPlaceholder: 'Search all courses...',
    globalSearchAria: 'Search across all courses',
    // SettingsPanel
    settingsAria: 'Settings',
    themeLight: '☀ Light',
    language: 'Language',
    themeDark: '☾ Dark',
    theme: 'Theme',
    // Dictionary
    dictionaryDescPronunciation: 'Tricky tech words and how to say them.',
    dictionaryDescVocabulary: 'English words used in backend interviews.',
    dictionaryDescLeadership: 'Strong sentences for team-lead questions.',
    dictionaryDescPhrases: 'Ready-made phrases for interview answers.',
    dictionaryDescWordsToUseMore: 'Swap weak words for stronger ones.',
    dictionaryDescGrammarFixes: 'Common English mistakes, corrected.',
    dictionaryDescTodaysChallenge: 'A small daily speaking goal.',
    dictionaryDescSentenceOfDay: 'One phrase to master today.',
    dictionaryLearnedProgress: '{done} / {total} learned',
    dictionaryWordsToUseMore: 'Words to Use More Often',
    dictionaryTodaysChallenge: "Today's Challenge",
    dictionarySentenceOfDay: 'Sentence of the Day',
    dictionarySpeakAria: 'Pronounce this row',
    dictionaryMarkLearned: 'Mark as learned',
    dictionaryPlayerStatus: '{n} of {total}',
    dictionaryPronunciation: 'Pronunciation',
    dictionaryTitle: 'Interview Dictionary',
    dictionaryGrammarFixes: 'Grammar Fixes',
    dictionaryColTranslation: 'Translation',
    dictionaryPhrases: 'Interview Phrases',
    dictionaryColSayInstead: 'Say Instead',
    dictionaryColInsteadOf: 'Instead of…',
    dictionaryColTrySaying: 'Try Saying…',
    dictionaryColSayLike: 'Say it like',
    dictionaryVocabulary: 'Vocabulary',
    dictionaryLeadership: 'Leadership',
    dictionaryColDontSay: "Don't Say",
    dictionaryDailyBadge: '📅 Daily',
    dictionaryColExample: 'Example',
    dictionaryColPhrase: 'Phrase',
    dictionaryBack: 'Dictionary',
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

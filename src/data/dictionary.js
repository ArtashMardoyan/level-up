import day1 from './dictionary/day1.json'

const SECTION_KEYS = ['vocabulary', 'phrases', 'grammarFixes', 'teamLeadSentences', 'wordsToUseMore', 'dailyGoal']

export const DICTIONARY_DAYS = [day1]

export function getDictionaryDay(day) {
  return DICTIONARY_DAYS.find((d) => d.day === Number(day)) || null
}

export function getLatestDictionaryDay() {
  return DICTIONARY_DAYS[DICTIONARY_DAYS.length - 1]
}

export function getDictionaryDayCount() {
  return DICTIONARY_DAYS.length
}

export function getDictionaryDayRowIds(day) {
  return SECTION_KEYS.flatMap((key) => day[key] || []).map((row) => row.id)
}

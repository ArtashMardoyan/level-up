import { en } from './strings.en'
import { hy } from './strings.hy'
import { ru } from './strings.ru'

// Flat UI-string dictionary, merged from the per-language files above. Every
// key must exist in all three; see strings.en.js for the partition-comment
// convention used to keep each file grouped by component.
export const STRINGS = { en, hy, ru }

const PLURAL_RULES = {
  en: new Intl.PluralRules('en'),
  hy: new Intl.PluralRules('hy'),
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

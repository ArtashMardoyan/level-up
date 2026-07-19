import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'

const coursesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'internal', 'seed', 'data')

const LANGUAGE_SCRIPTS = {
  hy: /[\u0531-\u0587]/,
  ru: /[а-яё]/i
}

function validateCourse(name, lang) {
  const errors = []
  const en = JSON.parse(readFileSync(path.join(coursesDir, name, 'en.json'), 'utf8'))
  const translated = JSON.parse(readFileSync(path.join(coursesDir, name, `${lang}.json`), 'utf8'))

  if (!Array.isArray(translated)) return [`${name}: ${lang} file is not an array`]
  if (translated.length === 0) return { skipped: true }
  if (translated.length !== en.length) errors.push(`${name}: length mismatch — en ${en.length}, ${lang} ${translated.length}`)

  const count = Math.min(en.length, translated.length)
  for (let i = 0; i < count; i++) {
    const enQ = en[i]
    const translatedQ = translated[i]
    const label = `${name}[${i}] (${enQ.id})`
    if (translatedQ.id !== enQ.id) errors.push(`${label}: id mismatch — ${lang} has "${translatedQ.id}"`)
    if (typeof translatedQ.question !== 'string' || !translatedQ.question.trim()) errors.push(`${label}: empty question`)
    if (typeof translatedQ.answer !== 'string' || !translatedQ.answer.trim()) errors.push(`${label}: empty answer`)
    if (Boolean(enQ.bonus) !== Boolean(translatedQ.bonus)) errors.push(`${label}: bonus presence mismatch`)
    if (translatedQ.module !== undefined) errors.push(`${label}: ${lang} entries must not carry "module" (labels stay English)`)
    const script = LANGUAGE_SCRIPTS[lang]
    if (script && typeof translatedQ.question === 'string' && !script.test(translatedQ.question)) {
      errors.push(`${label}: question has no ${lang} script — untranslated?`)
    }
    if (script && typeof translatedQ.answer === 'string' && !script.test(translatedQ.answer)) {
      errors.push(`${label}: answer has no ${lang} script — untranslated?`)
    }
  }
  return errors
}

const args = process.argv.slice(2)
const langIndex = args.indexOf('--lang')
const lang = langIndex === -1 ? 'ru' : args[langIndex + 1]
if (langIndex !== -1 && !lang) throw new Error('--lang needs a value')
const requested = args.filter((arg, index) => index !== langIndex && index !== langIndex + 1)
const names = requested.length
  ? requested
  : readdirSync(coursesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

let failed = false
for (const name of names) {
  let result
  try {
    result = validateCourse(name, lang)
  } catch (error) {
    result = [`${name}: ${error.message}`]
  }
  if (result.skipped) {
    console.log(`- ${name}: empty (placeholder), skipped`)
    continue
  }
  if (result.length === 0) {
    console.log(`+ ${name}: OK`)
  } else {
    failed = true
    console.error(`! ${name}: ${result.length} problem(s)`)
    for (const message of result) console.error(`    ${message}`)
  }
}

process.exit(failed ? 1 : 0)

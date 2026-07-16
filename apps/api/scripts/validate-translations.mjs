import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'

const coursesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'internal', 'seed', 'data')

const CYRILLIC = /[а-яё]/i

function validateCourse(name) {
  const errors = []
  const en = JSON.parse(readFileSync(path.join(coursesDir, name, 'en.json'), 'utf8'))
  const ru = JSON.parse(readFileSync(path.join(coursesDir, name, 'ru.json'), 'utf8'))

  if (!Array.isArray(ru)) return [`${name}: ru file is not an array`]
  if (ru.length === 0) return { skipped: true }
  if (ru.length !== en.length) errors.push(`${name}: length mismatch — en ${en.length}, ru ${ru.length}`)

  const count = Math.min(en.length, ru.length)
  for (let i = 0; i < count; i++) {
    const enQ = en[i]
    const ruQ = ru[i]
    const label = `${name}[${i}] (${enQ.id})`
    if (ruQ.id !== enQ.id) errors.push(`${label}: id mismatch — ru has "${ruQ.id}"`)
    if (typeof ruQ.question !== 'string' || !ruQ.question.trim()) errors.push(`${label}: empty question`)
    if (typeof ruQ.answer !== 'string' || !ruQ.answer.trim()) errors.push(`${label}: empty answer`)
    if (Boolean(enQ.bonus) !== Boolean(ruQ.bonus)) errors.push(`${label}: bonus presence mismatch`)
    if (ruQ.module !== undefined) errors.push(`${label}: ru entries must not carry "module" (labels stay English)`)
    if (typeof ruQ.question === 'string' && !CYRILLIC.test(ruQ.question)) {
      errors.push(`${label}: question has no Cyrillic — untranslated?`)
    }
    if (typeof ruQ.answer === 'string' && !CYRILLIC.test(ruQ.answer)) {
      errors.push(`${label}: answer has no Cyrillic — untranslated?`)
    }
  }
  return errors
}

const requested = process.argv.slice(2)
const names = requested.length
  ? requested
  : readdirSync(coursesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

let failed = false
for (const name of names) {
  let result
  try {
    result = validateCourse(name)
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

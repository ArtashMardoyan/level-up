// Pre-generate interview audio with OpenAI TTS.
//
// Writes ONE MP3 per question (question + answer read back to back) into a
// staging dir, named to match the S3 key:
// public/audio/courses/{courseId}/{lang}/{questionId}.mp3. Then
// `upload-audio.mjs` pushes these to S3 and records their keys in the course
// JSON. See docs/audio/overview.md. Safe to run incrementally.
//
// Usage:
//   node scripts/generate-audio.mjs [options] [course ...]
//
// The OpenAI key is read from OPENAI_API_KEY. A local .env file (gitignored) is
// loaded automatically, so `OPENAI_API_KEY=sk-...` in .env is enough — no need
// to pass it on the command line.
//
// Options:
//   --lang en,ru      languages to generate (default: en)
//   --voice nova      OpenAI voice (default: nova)
//   --model <id>      TTS model (default: gpt-4o-mini-tts)
//   --force           overwrite existing files instead of skipping them
//
// With no course names it processes every English course JSON. Existing files
// are skipped unless --force is passed, so re-runs only fill in what's missing.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const coursesDir = path.join(scriptDir, '..', 'src', 'data', 'courses')
const outDir = path.join(scriptDir, '..', 'public', 'audio', 'courses')

// Load a local .env (gitignored) so OPENAI_API_KEY need not be passed inline.
const envFile = path.join(scriptDir, '..', '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

// OpenAI caps a single speech request at 4096 characters — chunk below that.
const MAX_CHARS = 4000
const ENDPOINT = 'https://api.openai.com/v1/audio/speech'

function parseArgs(argv) {
  const options = { model: 'gpt-4o-mini-tts', langs: ['en'], voice: 'nova', force: false }
  const courses = []
  const value = (flag, v) => {
    if (v === undefined) throw new Error(`${flag} needs a value`)
    return v
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') options.force = true
    else if (arg === '--lang')
      options.langs = value(arg, argv[++i])
        .split(',')
        .map((s) => s.trim())
    else if (arg === '--voice') options.voice = value(arg, argv[++i])
    else if (arg === '--model') options.model = value(arg, argv[++i])
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`)
    else courses.push(arg)
  }
  return { options, courses }
}

// Data mirrors the audio layout: courses/<id>/<lang>.json.
function loadQuestions(courseId, lang) {
  const file = path.join(coursesDir, courseId, `${lang}.json`)
  if (!existsSync(file)) return []
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  return Array.isArray(parsed) ? parsed : []
}

// Split long text on paragraph, then sentence, boundaries so no chunk exceeds the cap.
function chunkText(text) {
  if (text.length <= MAX_CHARS) return [text]
  const chunks = []
  let current = ''
  for (const piece of text.split(/(\n\n+|(?<=[.!?])\s+)/)) {
    if ((current + piece).length > MAX_CHARS && current) {
      chunks.push(current)
      current = ''
    }
    current += piece
  }
  if (current.trim()) chunks.push(current)
  return chunks
}

async function synthesize(text, { voice, model }, apiKey) {
  const buffers = []
  for (const chunk of chunkText(text)) {
    const res = await fetch(ENDPOINT, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ response_format: 'mp3', input: chunk, model, voice }),
      method: 'POST'
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`)
    }
    buffers.push(Buffer.from(await res.arrayBuffer()))
  }
  return Buffer.concat(buffers)
}

async function run() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY environment variable.')
    process.exit(1)
  }

  const { options, courses } = parseArgs(process.argv.slice(2))
  const courseIds = courses.length
    ? courses
    : readdirSync(coursesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)

  let written = 0
  let skipped = 0
  const failed = []
  for (const courseId of courseIds) {
    for (const lang of options.langs) {
      const questions = loadQuestions(courseId, lang)
      if (questions.length === 0) {
        console.log(`- ${courseId} (${lang}): no questions, skipped`)
        continue
      }
      // Mirror the data layout: courses/<courseId>/<lang>/<questionId>.mp3
      const dir = path.join(outDir, courseId, lang)
      for (const q of questions) {
        // One track per question: the question, then the answer, read together.
        const text = [q.question, q.answer].filter((s) => typeof s === 'string' && s.trim()).join('\n\n')
        if (!text.trim()) continue
        const file = path.join(dir, `${q.id}.mp3`)
        // Already generated if the local file exists or the JSON already carries
        // its key (meaning it's uploaded to S3) — don't re-pay.
        if (!options.force && (existsSync(file) || q.audio)) {
          skipped++
          continue
        }
        process.stdout.write(`  ${courseId}/${lang}/${q.id}.mp3 … `)
        // One bad/transient TTS call shouldn't abort the whole run — skip it
        // (that question just falls back to speech) and report it at the end.
        try {
          const audio = await synthesize(text, options, apiKey)
          mkdirSync(dir, { recursive: true }) // create staging only when actually writing
          writeFileSync(file, audio)
          written++
          console.log(`${(audio.length / 1024).toFixed(0)} KB`)
        } catch (error) {
          failed.push({ id: `${courseId}/${lang}/${q.id}`, message: error.message })
          console.log(`FAILED`)
        }
      }
    }
  }

  console.log(`\nDone. ${written} written, ${skipped} skipped, ${failed.length} failed.`)
  if (failed.length) {
    console.log('Failed (re-run to retry; unresolved ones just fall back to speech):')
    for (const f of failed) console.log(`  ${f.id} — ${f.message.slice(0, 120)}`)
  }
}

run().catch((error) => {
  console.error(`\nFailed: ${error.message}`)
  process.exit(1)
})

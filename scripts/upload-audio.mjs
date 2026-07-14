// Upload generated course audio to S3 and record the keys in the course data.
//
// 1. Syncs public/audio/courses/**/*.mp3 to s3://$S3_BUCKET/audio/courses/.
// 2. Stamps each uploaded file's S3 key into the matching question in
//    src/data/courses/<id>/<lang>.json under `audio.{question|answer}`.
//
// The stamped key (e.g. "audio/courses/nodejs/en/q1-answer.mp3") is what the app
// reads to know a track has audio and to build its URL (base = VITE_S3_BUCKET_URL).
// Both steps are idempotent.
//
// Usage:
//   node scripts/upload-audio.mjs [course ...]
//
// Config (from .env or the environment):
//   S3_BUCKET     target bucket name (required)
//   S3_REGION     region (default: us-east-2)
//   AWS_PROFILE   aws profile (default: vyb-dev)
//
// With no course names it uploads every mp3; names filter by course folder.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const localDir = path.join(scriptDir, '..', 'public', 'audio', 'courses')
const coursesDir = path.join(scriptDir, '..', 'src', 'data', 'courses')
const S3_PREFIX = 'audio/courses'

const envFile = path.join(scriptDir, '..', '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const bucket = process.env.S3_BUCKET
if (!bucket) {
  console.error('Missing S3_BUCKET (add it to .env, e.g. S3_BUCKET=levelup-6824c358).')
  process.exit(1)
}

const profile = process.env.AWS_PROFILE || 'vyb-dev'
const region = process.env.S3_REGION || 'us-east-2'
const courses = process.argv.slice(2)

// The staging folder is created on demand by generate-audio; nothing to do without it.
if (!existsSync(localDir)) {
  console.log('Nothing to upload — run generate-audio.mjs first (public/audio/courses/ is empty).')
  process.exit(0)
}

function sync() {
  const filters = courses.length
    ? ['--exclude', '*', ...courses.flatMap((c) => ['--include', `${c}/*`])]
    : ['--exclude', '*', '--include', '*.mp3']
  const args = [
    's3',
    'sync',
    localDir,
    `s3://${bucket}/${S3_PREFIX}/`,
    '--profile',
    profile,
    '--region',
    region,
    '--content-type',
    'audio/mpeg',
    '--cache-control',
    'public, max-age=86400',
    ...filters
  ]
  console.log(`Uploading ${courses.length ? courses.join(', ') : 'all courses'} → s3://${bucket}/${S3_PREFIX}/`)
  return spawnSync('aws', args, { stdio: 'inherit' }).status ?? 1
}

// Record each local mp3's S3 key into its course JSON (audio.{question|answer}).
function stampKeys() {
  const wanted = new Set(courses)
  const mp3s = readdirSync(localDir, { recursive: true }).filter((f) => f.endsWith('.mp3'))
  // Group keys by "<course>/<lang>" so each JSON file is written once.
  const byFile = new Map()
  for (const rel of mp3s) {
    const [course, lang, filename] = rel.split(path.sep)
    if (!course || !lang || !filename) continue
    if (wanted.size && !wanted.has(course)) continue
    const base = filename.replace(/\.mp3$/, '')
    const cut = base.lastIndexOf('-')
    const questionId = base.slice(0, cut)
    const phase = base.slice(cut + 1)
    const fileKey = `${course}/${lang}`
    if (!byFile.has(fileKey)) byFile.set(fileKey, [])
    byFile.get(fileKey).push({ key: `${S3_PREFIX}/${course}/${lang}/${filename}`, questionId, phase })
  }

  let stamped = 0
  for (const [fileKey, entries] of byFile) {
    const jsonPath = path.join(coursesDir, ...fileKey.split('/')) + '.json'
    if (!existsSync(jsonPath)) continue
    const questions = JSON.parse(readFileSync(jsonPath, 'utf8'))
    const byId = new Map(questions.map((q) => [q.id, q]))
    for (const { questionId, phase, key } of entries) {
      const q = byId.get(questionId)
      if (!q) continue
      if (!q.audio) q.audio = {}
      if (q.audio[phase] !== key) {
        q.audio[phase] = key
        stamped++
      }
    }
    // 4-space indent + trailing newline matches the existing course JSON format.
    writeFileSync(jsonPath, JSON.stringify(questions, null, 4) + '\n')
  }
  console.log(`Stamped ${stamped} audio key(s) into course JSON.`)
}

const status = sync()
if (status !== 0) process.exit(status)
stampKeys()

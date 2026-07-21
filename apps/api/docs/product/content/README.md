# Audio playback (MP3 with speech fallback)

> **Status:** Approved · **Owner:** Backend · **Last updated:** 2026-07-21

## Why

Interview questions were read aloud with browser `speechSynthesis` only. Speech
quality and pronunciation vary a lot per platform/voice. This adds support for
pre-generated MP3 files that play when available, while keeping speech as an
automatic, invisible fallback so nothing breaks when an MP3 is missing.

## What

- **`src/services/audioPlayer.js`** — a framework-agnostic singleton
  (`audioPlayer`) that owns _all_ playback. Public API:
  `play(track)`, `pause()`, `resume()`, `stop()`, `isPlaying()`, `isPaused()`,
  `currentInterviewId()`, plus `subscribe()`/`getSnapshot()` for React.
  - `play({ id, url, text, voice, lang, onEnded })` stops any current playback,
    then plays `url` on a single reused `HTMLAudioElement`. When `url` is null
    (the track has no audio) or the load fails, it silently speaks `text`
    instead. Errors are never shown to the user. The service does **not** know
    about S3 keys or base URLs — the caller passes a fully-resolved `url`.
  - Browser quirks live here: Chrome's speak-after-`cancel()` delay, its ~15s
    keepalive pause/resume nudge, releasing the audio buffer on stop, and a
    `playToken` that neutralises stale async callbacks when tracks change fast.
- **`src/data/audio.js`** — `audioUrl(key)` concatenates `VITE_S3_BUCKET_URL`
  with the per-question S3 key from the course data (null when there's no key).
- **`scripts/generate-audio.mjs`** — OpenAI TTS generator (reads `.env`). Writes
  **one** MP3 per question (the question and answer read back to back) to a local
  staging dir `public/audio/courses/<id>/<lang>/<qid>.mp3`, created on demand.
  Kept locally as a cache but **gitignored** — the app never reads this folder.
- **`scripts/upload-audio.mjs`** — `aws s3 sync --delete` the staging dir to
  `$S3_BUCKET` (so obsolete S3 objects, e.g. the old per-phase files, are
  removed), then stamps each file's S3 key into the course JSON. The staging dir
  stays as a local cache; S3 + the JSON keys are the source of truth.

## How it's wired

`CoursePlayer` owns the queue (module scope, index) but no longer touches
`speechSynthesis`. One track = one question (question + answer together). An
effect maps the current question to a track id and a `url` (from
`audioUrl(currentItem.audio)`) and asks the service to play it; the ▶/⏸ button
does true pause/resume; auto-advance to the next question runs off the track's
`onEnded`. The player unmount calls `audioPlayer.stop()`. `PrepView` passes
`courseId` so ids can be built. `courses.js` merges the ru `audio` overlay so
Russian mode never inherits English audio keys.

`DictionaryPlayer` was intentionally left on plain speech — it can adopt the same
service later with no service changes.

## Availability & keys — the course JSON is the source of truth

Each question can carry an `audio` S3 **key** (not a URL) — a single string:

```json
"audio": "audio/courses/nodejs/en/q1.mp3"
```

A question with a key has audio; a missing key means speech. Storing the key (not
the full URL) keeps the base swappable via one env var and travels cleanly when
the course data moves to a backend. `upload-audio.mjs` writes these keys after a
successful S3 sync; `generate-audio.mjs` treats a present key as "already done"
and skips it (no re-paying OpenAI), so the JSON also drives idempotency.

## Storage: S3

Audio is served from a public S3 bucket (`$S3_BUCKET`, region us-east-2), under
the `audio/courses/` prefix. The bucket has Block Public Access disabled and a
policy granting `s3:GetObject` on `audio/*` only. MP3s are **not** committed to
git. Cross-origin `<audio>` playback needs no CORS config.

## Prerequisites

`.env` (gitignored, repo root):

```
OPENAI_API_KEY=sk-...     # generate-audio.mjs (OpenAI TTS)
AWS_PROFILE=vyb-dev       # upload-audio.mjs (SSO profile)
# Optional — sensible defaults exist:
# S3_BUCKET=levelup-6824c358        (upload target; else the app's fallback bucket)
# S3_REGION=us-east-2
# VITE_S3_BUCKET_URL=https://levelup-6824c358.s3.us-east-2.amazonaws.com  (read by the app)
```

AWS uses SSO — the session expires. Before any upload:

```bash
aws sso login --profile vyb-dev
aws sts get-caller-identity --profile vyb-dev   # should print an account, not an error
```

## Runbook — add or regenerate audio for a course

Everything is idempotent and safe to re-run. `generate-audio.mjs` skips questions
that already have a local file or a stamped key (so it never re-pays OpenAI);
pass `--force` to overwrite. `upload-audio.mjs` runs `aws s3 sync --delete`, so
S3 ends up exactly mirroring the local staging for the courses you pass.

```bash
# 1. Generate one MP3 per question (question + answer together) → staging dir.
node scripts/generate-audio.mjs --lang en,ru backend   # both languages
node scripts/generate-audio.mjs --lang en nodejs        # English only
#    (no course names = every course; default --lang en)

# 2. Upload to S3 and stamp the `audio` key into each course JSON.
aws sso login --profile vyb-dev            # if the SSO session expired
node scripts/upload-audio.mjs backend nodejs

# 3. Commit the changed course JSONs (the stamped `audio` keys) + push.
```

The staging dir (`public/audio/`) is kept locally as a cache but is **gitignored**
(`public/audio/courses/**/*.mp3`), so the MP3s never enter the repo — S3 + the
JSON keys stay the source of truth. Delete it freely if you want the space back;
`generate-audio.mjs` will just re-fetch from OpenAI (or skip if keys are stamped).

Naming (staging + S3 key): `{courseId}/{lang}/{questionId}.mp3`. Course ids live
in `src/data/courses.js`; languages are `en` and `ru`.

To **regenerate** an existing course after editing question text: `generate-audio.mjs
--force <course>`, then `upload-audio.mjs <course>` (the `--delete` sync replaces
the old objects). To **change the model/voice**: `--model` / `--voice` flags
(defaults: `gpt-4o-mini-tts`, `nova`).

## Coverage (which courses have MP3)

A question falls back to speech only if its key is missing. Update this table
when coverage changes.

| Course   | en | ru |
|----------|----|----|
| backend  | ✅  | ✅  |
| nodejs   | ✅  | ✅  |
| devops   | ✅  | ✅  |
| frontend | ✅  | ✅  |
| go       | ✅  | ✅  |
| nextjs   | ✅  | ✅  |
| qa       | ✅  | ✅  |
| react    | ✅  | ✅  |

All 8 courses have full en+ru audio (one MP3 per question).

## Changing where audio is served from

The base URL is `VITE_S3_BUCKET_URL` (`.env`), read in `src/data/audio.js` with a
committed fallback so production still works if the var is unset. Point it at a
different bucket or a CloudFront/custom domain — no data or service changes, since
the JSON stores only relative keys. (Vite exposes only `VITE_`-prefixed vars to
the client.)

## Status

Scope: `CoursePlayer` only. Model is **one MP3 per question** (question + answer
together) — a single `audio` key string per question. Courses/languages without a
generated+uploaded key fall back to browser speech. Regenerate a course with
`generate-audio.mjs` then `upload-audio.mjs` (which `--delete`s stale S3 objects).

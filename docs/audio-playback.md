# Audio playback (MP3 with speech fallback)

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
  MP3s to a throwaway staging dir `public/audio/courses/<id>/<lang>/<qid>-<phase>.mp3`,
  created on demand (not committed, gitignored). The app never reads this folder.
- **`scripts/upload-audio.mjs`** — `aws s3 sync` the staging dir to `$S3_BUCKET`,
  then stamps each file's S3 key into the course JSON. Once uploaded, the staging
  dir can be deleted freely — S3 + the JSON keys are the source of truth.

## How it's wired

`CoursePlayer` still owns the queue (module scope, index, question/answer phase)
but no longer touches `speechSynthesis`. One effect maps the current
`(question, phase)` to a track id and a `url` (from `audioUrl(currentItem.audio?.[phase])`)
and asks the service to play it; the ▶/⏸ button does true pause/resume;
auto-advance runs off the track's `onEnded`. The player unmount calls
`audioPlayer.stop()`. `PrepView` passes `courseId` so ids can be built.
`courses.js` merges the ru `audio` overlay so Russian mode never inherits English
audio keys.

`DictionaryPlayer` was intentionally left on plain speech — it can adopt the same
service later with no service changes.

## Availability & keys — the course JSON is the source of truth

Each question can carry an `audio` object of S3 **keys** (not URLs):

```json
"audio": {
  "question": "audio/courses/nodejs/en/q1-question.mp3",
  "answer":   "audio/courses/nodejs/en/q1-answer.mp3"
}
```

A phase with a key has audio; a missing key means speech. Storing the key (not
the full URL) keeps the base swappable via one env var and travels cleanly when
the course data moves to a backend. `upload-audio.mjs` writes these keys after a
successful S3 sync; `generate-audio.mjs` treats a present key as "already done"
and skips it (no re-paying OpenAI), so the JSON also drives idempotency.

## Storage: S3

Audio is served from a public S3 bucket (`$S3_BUCKET`, region us-east-2), under
the `audio/courses/` prefix. The bucket has Block Public Access disabled and a
policy granting `s3:GetObject` on `audio/*` only. MP3s are **not** committed to
git. Cross-origin `<audio>` playback needs no CORS config.

## Running the pipeline

`.env` (gitignored, repo root):

```
OPENAI_API_KEY=sk-...                                          # generator
VITE_S3_BUCKET_URL=https://<bucket>.s3.<region>.amazonaws.com  # read by the app
S3_BUCKET=<bucket>                                             # upload script
S3_REGION=<region>
AWS_PROFILE=<profile>
```

```bash
node scripts/generate-audio.mjs nodejs            # OpenAI TTS → staging (only missing phases)
node scripts/generate-audio.mjs --lang en,ru go   # both languages for a course
node scripts/upload-audio.mjs nodejs              # → S3, then stamp keys into the JSON
```

Naming (staging + S3 key): `{courseId}/{lang}/{questionId}-{phase}.mp3`.

## Changing where audio is served from

The base URL is `VITE_S3_BUCKET_URL` (`.env`), read in `src/data/audio.js` with a
committed fallback so production still works if the var is unset. Point it at a
different bucket or a CloudFront/custom domain — no data or service changes, since
the JSON stores only relative keys. (Vite exposes only `VITE_`-prefixed vars to
the client.)

## Status

Implemented on branch `feature/audio-mp3-playback`. Scope: `CoursePlayer` only.
Generated + uploaded: NodeJS course, English (100 files). Other courses/languages
fall back to browser speech until generated and uploaded.

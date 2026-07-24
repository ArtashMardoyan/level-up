# AI Interview Coach — STATUS / Handoff

> Read this first when continuing the AI Interview Coach. It records what shipped,
> what's open, the git/deploy state, and how to continue. The full spec is the
> other files in this folder (`001`–`016`); this file is the live status on top.

_Last updated: 2026-07-24._

## M3 — Onboarding placement assessment (2026-07-24, in progress)

Spec: [`017-onboarding-placement.md`](017-onboarding-placement.md). A short, optional
placement on signup seeds a new user's `topic_progress` so Insights populate from
interview #1 — the interview engine reused, marked `kind = "placement"`.

- **DB:** migration `00018` — `interview_sessions.kind TEXT NOT NULL DEFAULT 'interview'`.
- **Backend:** `Session.Kind`; `POST /interviews` accepts optional `kind`; `resolveKind`
  fixes a placement to 6 questions + uniform (non-adaptive) pick; `SummaryByUser` excludes
  placements (calibration, not performance). Completion seeds `topic_progress` unchanged.
  Placements stay visible in History (labeled "Assessment") and feed Insights/adaptive.
- **Frontend:** new-user home leads with a "Take a 6-question placement" CTA (full interview
  stays available → skippable); `InterviewSetup` gains a `placement` mode (hides the count
  picker, shows a note, sends `kind: 'placement'`); History labels placements "Assessment".
  Strings added in en/ru/hy (hy machine-translated — flag for a native review).

**Scope (MVP):** one course per placement; multi-course broad placement deferred.

## M2 — Adaptive interviews & trackable recommendations (2026-07-23)

Shipped as three reviewable PRs (DB → Backend → Frontend), closing the
practice → insight → targeted-practice loop:

- **DB (#37):** `topic_progress` table (migration `00016`) — durable per-`(user, course)`
  knowledge map (`level` 0-100, `confidence`, `samples`, `last{Practiced,Improved}At`).
- **Backend (#38):** adaptive question picker (weighted sample toward weak modules, with
  a floor for variety), gated by an optional `adaptive` flag on `POST /interviews`;
  module weights are live-computed from `question_results`. Completion blends the overall
  score into `topic_progress` via an EMA (α 0.4). Best-effort — never fails `Complete`.
- **Frontend:** the "Practice weak areas" button now deep-links into a **pre-weighted**
  interview — preselects the weakest course (from `/interviews/insights`) and sends
  `adaptive: true`; the setup shows an adaptive note.

**Scope / deferred as tech-debt:** topic = course (coarse MVP), no per-module rows;
no `learning_profiles` aggregate (derivable from `SummaryByUser`/streak); trackable
`Recommendation` rows (mark-complete) not yet built — the acceptance is met by the deep-link.
Not deployed to prod yet (backend deploy still gated).

## Since the last update (2026-07-19 evening → 2026-07-20)

- **Armenian (`feature/armenian-language`) is merged to `master`** in both repos
  (backend `51df6fd`, frontend `57acf9f`) and deployed — this superseded the
  "not merged yet" note below from the original 2026-07-19 write-up.
- **`GET /interviews/summary`** shipped (backend `c922b3d`) + a profile-page
  "Interview performance" panel + account-dropdown mini-stats (frontend `bd12047`,
  `f3bae9e`). Both deployed.
- **2026-07-20 session — committed + deployed** (backend `2deb8e9`, `448eb7d`;
  frontend `3831bcf`):
  - **Verdict bands reconciled with the design.** Pulled `Level Up.dc.html` via
    DesignSync and found the real source: `ivSC`/`ivVerdict` use **3 bands** (≥80
    green "Strong performance", ≥65 amber "Solid, with gaps", else rose "Needs
    practice") — not the 4-band placeholder (85/70/50) that shipped. Fixed
    `report.go verdict()` (now localized en/ru) and consolidated the
    3 duplicated frontend `scoreColor` functions into `src/utils/interview.js`
    with the same 80/65 bands.
  - **Fixed the "Question 39." problem.** The seed bank's question text is
    literally `"Question 39. How do you estimate tasks?"` (flashcard-style
    numbering baked into the content) — shown verbatim in the interview chat.
    Interview questions are now **AI-paraphrased live, one at a time**: the bank
    Q&A pair is still picked in Go (same diversity/no-repeat logic as before) and
    still anchors grading, but right before a question is shown, an AI call
    rewrites it into a natural interview question + a fresh model answer, cached
    on the session (`generatedQuestions` jsonb, migration `00014`) so resume/review
    always show the exact text originally asked. A nil AI client or a failed
    generation degrades to the raw bank text (same policy as answer evaluation).
  - **Difficulty is now applied at generation, not by tagging.** Discovered no
    course's seed content has a `difficulty` tag — every question defaulted to
    `medium`, so picking Easy/Hard in Setup silently fell back to the whole pool.
    Rather than hand-tagging ~50 questions × 8 courses, difficulty is now a
    generation-prompt instruction to the AI (easy/medium/hard framing), which
    actually works regardless of bank tagging. `filterByDifficulty` (dead code —
    always fell back) was removed.
  - **No more per-answer score bubbles in chat.** The chat used to show a
    separate "Great job! 100/100" feedback message after every answer — not how
    a real interviewer behaves. Evaluation still runs on submit (needed for
    per-question data + instant `complete`), but the same AI call that writes the
    next question now also writes a short, score-free `reaction` bridging from
    the previous answer (`GenResult.Reaction` / `QuestionView.Reaction`, cached
    alongside `Question`/`ModelAnswer`). The frontend folds `reaction` + `question`
    into **one** chat bubble; score/rubric feedback is exclusive to Results now.
    Reaction is a separate field from the (unchanged) clean `Question` text, so
    grading and the Review screen aren't affected.
  - **Two AI reliability gaps found + forced deterministically in Go**, not
    trusted to the prompt: the model invented a reaction to a nonexistent
    previous answer on the interview's *first* question (forced to `""` when
    there's no previous turn), and reacted as if a real answer was given after a
    *skip* (forced to a canned localized line, `skippedReaction()` in report.go).
  - Per-question score history (`QuestionResult`, keyed by the real bank
    `questionId`) is untouched by any of this — still the raw data for a future
    recommendation engine.
  - Verified live end-to-end: local API (curl) + a real browser via raw Chrome
    DevTools Protocol (`--remote-debugging-port`, no extension needed — useful
    when the `claude-in-chrome` extension won't connect). Both resume and the
    live submit path render as one natural bubble with no visible score.
- **2026-07-20 session, part 2 — committed + deployed** (backend `d04efde`;
  frontend `edf2d0d`):
  - **Personalized greeting.** The first question now opens with a deterministic
    (not AI-written), localized greeting using the candidate's name — "Hi
    Artash! Let's get started." — reusing the exact same `reaction` field/bubble
    mechanism from part 1, so no frontend change was needed for this half.
  - **Voice answers.** New `POST /interviews/transcribe` (multipart `audio` file)
    transcribes via Whisper (`openai-go`'s `Audio.Transcriptions`, fixed model
    `whisper-1`, independent of `OPENAI_MODEL`) and returns `{ transcript }`.
    Frontend composer got a Record button (`MediaRecorder` → upload → fills the
    textarea, editable before Submit) — grading stays entirely text-based and
    untouched, voice is just an alternate way to fill the same answer field.
    **Deliberately did not persist raw audio to S3**: grading doesn't need it,
    and the Go backend has neither an AWS SDK dependency nor an App Runner
    `InstanceRoleArn` configured yet — adding S3 playback would mean both, for a
    "hear your own delivery" nice-to-have, not a requirement. Revisit if wanted
    later (see "What's OPEN" below).
  - Verified live: `curl` with real spoken audio (exact transcript back), and
    the full record → stop → transcribe → fill-composer cycle through a real
    browser (Chrome DevTools Protocol with `--use-fake-device-for-media-stream`,
    since this environment has no physical mic).
- **2026-07-20 session, part 3 — frontend-only polish + cleanup, committed +
  deployed** (frontend `f6d1e95`, `18da956`, `fb7f569`, `178a8c6`, `77b9d6a`;
  no backend change):
  - **Legacy Course Interview mode removed** (`fb7f569`). The old List/Quiz/**Interview**
    flashcard mode inside course pages is gone — the AI Interview Coach is now the
    only interview experience. Deleted `InterviewMode.jsx`, dropped it from `ModeBar`
    and `PrepView` (now List/Quiz only), removed its dead CSS (`.interview-stage`,
    `.interview-actions`) and i18n keys (`interviewMode`, `interviewDone`, `questionOf`,
    `skipNext`).
  - **i18n split by language** (`fb7f569`). `src/i18n/strings.js` is now a thin barrel
    that imports + merges `strings.en.js` / `strings.ru.js` / `strings.hy.js` (one file
    per language, grouped by component) — editing one language no longer means scrolling
    past the other two. Armenian strings were rewritten for a consistent fully-Armenian
    tone (was mixed with English UI terms) and the `accountSubtitle` key added everywhere.
  - **Mobile overflow fixes** (`fb7f569`, `178a8c6`, `77b9d6a`): `.lu-nav-btn` got
    `min-width:0` so it actually shrinks in its flex row; `.segmented` (List/Quiz + setup)
    and the dictionary table now scroll-with-hidden-scrollbar instead of clipping/showing
    a bar (native swipe feel); the chat's **Record and Submit** buttons drop their text
    label below 480px (icon-only + `aria-label`) so the four composer actions fit one row.
  - **AuthDialog stale-state fix** (`18da956`). The dialog renders `null` while closed
    (stays mounted), so a previous attempt's email/password/mode lingered in state.
    Switching Login↔Signup now clears password/name (keeps email); closing does a full
    reset — using a `prevOpen !== open` render-time guard (matching `QuestionCard.jsx`),
    not a `useEffect` (barred by lint).
  - **Record button placement** (`f6d1e95`): moved next to Submit (not grouped with the
    secondary "Sample answer" helper) — voice is an alternate way to answer + send, so it
    sits by Send like WhatsApp/Telegram.
- **2026-07-20 session, part 4 — reaction prompt polish, backend-only** (backend
  `195566b`):
  - **The AI `reaction` is now strictly a bridge, never a question.** It used to
    occasionally pose a question of its own right before the separate clean
    `Question` field asked something similar (repetitive, seen once in live
    testing — the previously-OPEN item below). Tightened `questionSystemPrompt`:
    the reaction only looks back at the answer just given — it must not ask, pose,
    or preview a question, hint at what's coming, or end with a question mark; all
    questioning stays solely in the `question` field. Prompt-wording only — the
    `reaction`/`question`/`modelAnswer` JSON contract and `SchemaVersion` are
    unchanged, and the deterministic Go-side forces (empty reaction on the first
    question, `skippedReaction`) are untouched.
  - **Verified live on prod** (browser via playwright, real interview against the
    deployed backend): ran a 3-question Backend/Medium/EN session and inspected the
    raw `reaction` vs `question` split from `GET /interviews/:id`. Every AI reaction
    (turns 2–3) was a pure bridge — no `?`, ended on a period — with all questioning
    confined to the `question` field; turn 1 was the deterministic greeting as
    expected. The throwaway account created for this run was removed afterward via
    `DELETE /users` (self-delete) — prod carries no leftover test data.
- **2026-07-20 session, part 5 — reaction topic-repeat polish, backend-only**
  (backend `d5c44e5`):
  - **The `reaction` no longer names the next question's topic.** After part 4 the
    reaction still *announced* the upcoming subject ("let's talk about payment
    APIs") which the separate `question` field then repeated — the topic word
    appeared twice in a row. Tightened `questionSystemPrompt` again: the reaction
    must not name or introduce the next question's subject, and must not announce
    the next topic at all ("let's talk about X" / "let's move on to X" / "shifting
    to X"). Introducing the new subject is the `question` field's job alone.
    Prompt-wording only — JSON contract and `SchemaVersion` unchanged, Go-side
    forces untouched.
  - **Verified live on prod** (deployed backend, real OpenAI generation): ran a
    3-question Backend/Medium/EN interview and inspected the raw `reaction`/`question`
    split per turn. Every AI reaction (turns 2–3) looked back only at the previous
    answer, with **zero topic-word overlap** with its paired `question`, no
    "let's talk about X" announcement, and no `?` (the part-4 fix still holds).
    This run was driven through the prod API rather than the browser UI — the
    `claude-in-chrome`/playwright tab got stuck in a `beforeunload` dialog loop, so
    the same live check (raw `reaction`/`question` fields from the deployed backend)
    was done via `curl`/HTTP instead. Throwaway account removed afterward via
    `DELETE /users`.
- **2026-07-20 session, part 6 — achievement badges (gamification), full stack**
  (backend `42748c4`, frontend `5855de4`):
  - **Durable badges on top of the existing streak.** New backend module
    `internal/modules/badge/` with a **code-defined catalog of 15 badges** in four
    categories — completed-interview count (1/5/10/25), interview score (90/100),
    streak days (3/7/14/30/100), reviewed-question count (10/25/50/100), each with a
    bronze/silver/gold tier. Only ownership is stored: `user_badges` table
    (migration `00015`, uniq `userId+badgeId`); the catalog (id → threshold/tier)
    and the localized name/icon are code/client-side. Awarding is idempotent
    (dedup + `ON CONFLICT DO NOTHING`).
  - **Awarding hooks:** `interview.Complete` grants count + score badges on first
    completion and returns the newly earned ids in `ReportView.NewBadges` (results
    screen celebrates them); the **streak** (`user`) and **reviewed-count**
    (`course`) milestones now award durable badges. Each new badge fires a
    `badge_earned` notification. **Replaced** the old `NotifyStreak` /
    `NotifyReviewMilestone` emitters (per decision) — those events are badges now;
    the `TypeStreak`/`TypeReviewMilestone` constants stay only to classify existing
    users' notification history. `GET /badges` returns the full catalog with the
    caller's earn status.
  - **Frontend:** ProfilePage's Achievements section is now a real **trophy case**
    (earned highlighted by tier, locked greyed with the unlock hint, "n of total
    earned" counter), replacing the old client-derived `earnedAchievements`
    placeholder. Completing an interview shows a gold "Achievement unlocked!" panel
    (`newBadges` threaded `InterviewChat → InterviewCoach → InterviewResults`).
    Badge names/descriptions localized in en/ru/hy; `badge_earned` renders in the bell.
  - **Tests:** `badge` service (award/dedup/list) + a streak-milestone award test in
    `user`; notification/user tests updated. Postman synced (Badges folder).
  - **Verified live on prod** (API + browser): a fresh interview returned
    `newBadges:['interview_first']`, `GET /badges` then showed it earned (14 locked),
    a `badge_earned` notification was created, and a re-`Complete` returned no new
    badges (idempotent). The profile trophy case rendered on prod Pages ("1 of 15
    earned", four category groups). Throwaway account removed via `DELETE /users`.
    Streak/review badges are covered by unit tests but were not driven live (that
    needs course-progress activity with timezones).
- **2026-07-20 session, part 7 — voice-answer fixes (recording was broken)**
  (backend `ee66115`, frontend `a49469f`):
  - **In-chat recording effectively didn't work; two root causes, both fixed.**
    (1) The global 1 MB request-body cap (`MaxBytesReader` in `cmd/server/main.go`)
    applied to **every** route including `POST /interviews/transcribe`, so a voice
    answer longer than ~1 min of webm/opus exceeded 1 MB and the multipart parse
    400'd ("audio file is required") **before Whisper ran** — confirmed live. The
    transcribe route now gets a **25 MB** limit (Whisper's own file cap); other
    routes stay at 1 MB. (2) Whisper was called with **no language hint** so it
    guessed — short Russian speech often came back English/transliterated. The
    session language (en/ru/hy) now flows `handler → service → ai` and is set as
    Whisper's `Language` param (`ai.Transcribe(..., language)`); empty = auto-detect.
    Frontend sends it via `interviewTranscribe(blob, initial.session.language)`.
    Postman: the Transcribe request gained the `language` form field.
  - **Live recording indicator** (frontend). While recording, the composer shows a
    real UI instead of an inert disabled textarea: a pulsing red dot, an MM:SS
    timer, and a live 24-bar waveform driven by the Web Audio `AnalyserNode` (bars
    written straight to the DOM per frame; timer through state once a second; rAF /
    interval / `AudioContext` torn down on stop + unmount). New `interviewRecordingHint`
    string (en/ru/hy) + `.aic-recording*` CSS.
  - **Verified live on prod:** a >1 MB upload now reaches Whisper (500 on garbage)
    instead of the old 400 size-gate; real Russian speech (macOS `say -v Milena`)
    with `language=ru` transcribed exactly as spoken ("Привет! Как дела? …"), and
    English with `language=en` likewise. **The recording UI was driven end-to-end
    through a real headless Chrome with a fake mic** (`puppeteer-core` + system
    Chrome, `--use-file-for-fake-audio-capture=<ru.wav>`): the indicator renders
    (pulsing dot + `0:01` timer + live waveform + "Stop recording"), and after stop
    the transcript lands in the composer in **Russian** (Cyrillic — proving the
    language hint; the exact text was a Whisper-on-near-silence hallucination
    because the fake-audio clip didn't fully align with the capture window, not a
    bug). Screenshots captured. Throwaway account removed via `DELETE /users`.

## TL;DR — it's SHIPPED and live on prod

The AI Interview Coach MVP (backend + frontend) is **committed on `master` in both
repos and deployed to production**. A signed-in user can run a full mock interview
with real OpenAI scoring in EN / RU / ARM.

- **Frontend (live):** https://artashmardoyan.github.io/level-up/#interview (GitHub Pages, auto-deploys on push to `master`)
- **Backend (live):** https://iypxepsbm3.us-east-2.awsapprunner.com (App Runner, region us-east-2, AWS profile `vyb-dev`)

## What's done & deployed

**Backend** (`level-up-backend`, module `internal/modules/interview/`):
- Chat interview: `POST /interviews` (start) → `POST /interviews/:id/answers/:qid`
  (submit, evaluated on submit via OpenAI) → `POST /interviews/:id/complete`
  (aggregates the report, no AI) → `GET /interviews/:id/report`, `GET /interviews/:id`
  (resume), `GET /interviews?page&limit` (history).
- Rubric **0–100**: Correctness / Depth / Communication / Structure + overall + `feedback`.
- Migrations `00012` (`questions.difficulty`) + `00013` (`interview_sessions`,
  `question_results`, `final_reports`) + `00014` (`generatedQuestions`) + `00015`
  (`user_badges`). Ran on prod RDS.
- **Achievement badges** (`internal/modules/badge/`): `GET /badges` + a 15-badge
  code catalog; awarded on interview completion / streak / reviewed-count (see part 6).
- OpenAI eval via `openai-go`, JSON-object mode, retry once, per-answer.
- **Languages EN / RU / HY** (`hy` = Armenian): AI feedback in the session language;
  questions from `question_translations` (falls back to EN where an overlay is missing).
- `OPENAI_API_KEY` (+ `OPENAI_MODEL`) is set on App Runner (RuntimeEnvironmentVariables).
- **`POST /interviews/transcribe`** — Whisper transcription for voice answers (see above).
- Postman collection updated (`Interviews` folder).

**Frontend** (`level-up`, `src/components/Interview*.jsx`):
- `InterviewHome` — the **default landing** (empty hash → interview home): guest hero +
  "how it works"; new-user "start first"; returning dashboard (last score / streak /
  sessions, continue + recommended course, recent sessions).
- Header **nav pill** (Interview / Courses / Dictionary) with active state; on mobile the
  header is 2 rows (search collapses to an icon).
- `InterviewSetup` — course grid (4-col) + Difficulty/Questions/Language in a 3-col row +
  **language selector 🇬🇧 ENG / 🇷🇺 RUS / 🇦🇲 ARM** + confirm modal; breadcrumb + Start/History/summary.
- `InterviewChat` — proper chat: header/progress pinned, messages scroll in their own area
  (auto-scroll only when near bottom), **composer fixed at the bottom**, Enter-to-send
  (Shift+Enter = newline), autofocus per question, Submit disabled while empty. **Record
  button** (mic → Whisper transcript fills the composer, editable before Submit).
- `InterviewResults` (score ring /100, 4-axis rubric, strengths/focus, next steps) + inline
  `Review`, `InterviewHistory` (with language flag).
- Routing: `#interview` = home, `/new` = setup, `/history` = history, `/<id>` = session;
  `#courses` = course grid; AuthDialog lifted to `App` for guest sign-in.
- Styles: `.aic-*` + `.lu-nav` blocks in `src/index.css`. Strings in `src/i18n/strings.js`.

## Git / branch state (IMPORTANT)

- **All interview work is on `master`** in both `level-up` and `level-up-backend`.
  **`feature/armenian-language` (both repos) is merged to `master`** (backend `51df6fd`,
  frontend `57acf9f`, 2026-07-19) — the note in earlier versions of this doc about it
  being unmerged is stale. Work directly on `master` going forward; the isolation-dance
  steps that used to be needed here are no longer necessary now that the branches
  have converged.

## What's OPEN / next

- **Voice answers persist no audio (by design, for now).** Recorded answers are
  transcribed and discarded — only the text is kept. If "hear your own delivery"
  playback is wanted later: add an AWS SDK dependency (`aws-sdk-go-v2` + `s3`),
  create + attach an `InstanceRoleArn` to the App Runner service (one-time AWS
  step, like the OPENAI_API_KEY dance), and a migration for the S3 key column.
- **Armenian question content** exists only for the `backend` course (`hy.json`). Other
  courses: ARM interview picks from the EN bank (fallback) + AI still writes the
  paraphrased question/feedback in Armenian. To make ARM full: developer adds
  `hy.json` per course + run `cmd/seed` against prod RDS (no migration needed).
- **Deferred (post-MVP):** English coaching = Learning Profile (`007`) + personalized
  Dictionary (`008`); the AI *asking* questions via audio (reusing
  `question_translations.audio`, distinct from candidates *answering* by voice,
  which is now shipped); AI strong/weak analysis (the per-question scores are
  already persisted from day one, keyed by the real bank `questionId`/module
  regardless of the AI paraphrase).

## How to continue (for a new session)

- **Spec:** read `docs/product/interview/**` (reconciled to the delivered design) + this file.
- **Design source of truth:** pull `Level Up.dc.html` via the DesignSync MCP — Claude Design
  project "Level up Node.js review", projectId `aae5baf2-31bf-4d83-a5b5-4faf33ad95e4`. (The
  older `AI Interview Coach.dc.html` is superseded; `Level Up.dc.html` is the whole app incl.
  interview.) See the `claude-design-sync-workflow` memory.
- **Run locally:** backend `make run` (needs local Postgres + `.env` incl. `OPENAI_API_KEY`);
  seed content with `go run ./cmd/seed`. Frontend `VITE_API_URL=<App Runner URL> npm run dev`
  to drive the local UI against the prod backend (CORS allows localhost).
- **Browser-verify:** `puppeteer-core` + system Chrome (`/Applications/Google Chrome.app/...`),
  inject a token into `localStorage['interviewPrepAuthToken']`, navigate to `#interview/...`.
- **Deploy:** frontend = push to `master` (auto Pages). Backend = `make deploy` after
  `aws sso login --profile vyb-dev`. Keep the Postman collection in sync (backend CLAUDE.md).

## Key files

- Backend: `internal/modules/interview/{entity,dto,repository,repository_gorm,ai,service,report,handler}.go`
  (`ai.go` has both `Evaluator` (grades an answer) and `Generator` (paraphrases the
  next question) behind one `AI` interface/client), `migrations/00012_*`–`00015_*`,
  `internal/config/config.go` (OpenAI), `cmd/server/main.go` (wiring),
  `postman/level-up-backend.postman_collection.json`.
- Backend (badges): `internal/modules/badge/{catalog,entity,dto,repository,repository_gorm,service,handler}.go`
  (`catalog.go` = the 15-badge code catalog; awarded via best-effort `Awarder`
  interfaces from `interview`/`user`/`course`), `migrations/00015_create_user_badges.sql`.
- Frontend: `src/components/Interview{Home,Coach,Setup,Chat,Results,History}.jsx`,
  `src/utils/interview.js` (shared `scoreColor`), `src/App.jsx` (routing + AuthDialog),
  `src/components/AppHeader.jsx` (nav), `src/services/endpoints.js` (`interviews*`, `badgesList`),
  `src/index.css` (`.aic-*` / `.lu-nav` / `.badge-*`), `src/i18n/strings.{en,ru,hy}.js` (interview + badge keys;
  `strings.js` is now just the barrel that merges the three per-language files).
- Frontend (badges): `src/data/badges.js` (icon/tier/i18n helpers), `src/components/ProfilePage.jsx`
  (trophy case), `src/components/InterviewResults.jsx` (unlock celebration), `src/data/notifications.js`
  (`badge_earned`).

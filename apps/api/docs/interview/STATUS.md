# AI Interview Coach — STATUS / Handoff

> Read this first when continuing the AI Interview Coach. It records what shipped,
> what's open, the git/deploy state, and how to continue. The full spec is the
> other files in this folder (`001`–`016`); this file is the live status on top.

_Last updated: 2026-07-20._

## Since the last update (2026-07-19 evening → 2026-07-20)

- **Armenian (`feature/armenian-language`) is merged to `master`** in both repos
  (backend `51df6fd`, frontend `57acf9f`) and deployed — this superseded the
  "not merged yet" note below from the original 2026-07-19 write-up.
- **`GET /interviews/summary`** shipped (backend `c922b3d`) + a profile-page
  "Interview performance" panel + account-dropdown mini-stats (frontend `bd12047`,
  `f3bae9e`). Both deployed.
- **2026-07-20 session (backend, NOT yet committed/deployed):**
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
  - Per-question score history (`QuestionResult`, keyed by the real bank
    `questionId`) is untouched by this change — still the raw data for a future
    recommendation engine, and still correctly attributable to a real bank
    entry/module even though the *displayed* text is now AI-paraphrased.
  - `go build && golangci-lint run && go test ./...` all clean. **Not committed**
    (repo rule: wait for explicit "commit") and **not deployed** — App Runner is
    still running the `c922b3d` image.

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
  `question_results`, `final_reports`). Ran on prod RDS.
- OpenAI eval via `openai-go`, JSON-object mode, retry once, per-answer.
- **Languages EN / RU / HY** (`hy` = Armenian): AI feedback in the session language;
  questions from `question_translations` (falls back to EN where an overlay is missing).
- `OPENAI_API_KEY` (+ `OPENAI_MODEL`) is set on App Runner (RuntimeEnvironmentVariables).
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
  (Shift+Enter = newline), autofocus per question, Submit disabled while empty.
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

- **Deploy the 2026-07-20 backend changes** (verdict bands, AI-generated questions,
  migration `00014`) — commit + `make deploy` when the user says go.
- **Armenian question content** exists only for the `backend` course (`hy.json`). Other
  courses: ARM interview picks from the EN bank (fallback) + AI still writes the
  paraphrased question/feedback in Armenian. To make ARM full: developer adds
  `hy.json` per course + run `cmd/seed` against prod RDS (no migration needed).
- **Deferred (post-MVP):** English coaching = Learning Profile (`007`) + personalized
  Dictionary (`008`); voice/audio interviews (reuse `question_translations.audio`);
  AI strong/weak analysis (the per-question scores are already persisted from day one,
  keyed by the real bank `questionId`/module regardless of the AI paraphrase).

## How to continue (for a new session)

- **Spec:** read `docs/interview/**` (reconciled to the delivered design) + this file.
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
  next question) behind one `AI` interface/client), `migrations/00012_*`–`00014_*`,
  `internal/config/config.go` (OpenAI), `cmd/server/main.go` (wiring),
  `postman/level-up-backend.postman_collection.json`.
- Frontend: `src/components/Interview{Home,Coach,Setup,Chat,Results,History}.jsx`,
  `src/utils/interview.js` (shared `scoreColor`), `src/App.jsx` (routing + AuthDialog),
  `src/components/AppHeader.jsx` (nav), `src/services/endpoints.js` (`interviews*`),
  `src/index.css` (`.aic-*` / `.lu-nav`), `src/i18n/strings.js` (interview keys, en/ru/hy).

# AI Interview Coach — STATUS / Handoff

> Read this first when continuing the AI Interview Coach. It records what shipped,
> what's open, the git/deploy state, and how to continue. The full spec is the
> other files in this folder (`001`–`016`); this file is the live status on top.

_Last updated: 2026-07-19._

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

- **All interview work is on `master`** in both `level-up` and `level-up-backend`
  (committed + deployed). Nothing of the interview feature is unshipped.
- **`feature/armenian-language`** (both repos) holds the developer's **Armenian
  localization WIP** (`seed.go`, `hy.json` — only the `backend` course so far,
  `AccountMenu`, `CoursePlayer`, `useLanguage`, `useSpeech`, `index.html`, hy strings/CSS)
  **plus a redundant copy of the interview work** (already on `master`). It is behind
  `master`. This branch is the DEVELOPER's; it was snapshotted/backed up to origin but not
  merged. Don't merge it to master blindly — it's incomplete and duplicates interview files.

## How each change was shipped (the "isolation dance")

Because the interview work and the developer's Armenian work are intermixed in the
`feature/armenian-language` working tree, every deploy isolated only the interview change
onto a clean `master`:

1. Save the mine-only changed files to a temp dir.
2. `git stash push -u` (stash all WIP), `git checkout -B master origin/master`.
3. Restore the mine-only files; re-apply entangled edits (strings.js/index.css) onto master's versions.
4. `npm run lint && npm run build` (frontend) or `go build && golangci-lint run && go test` (backend).
5. Commit + `git push origin master`.
6. Frontend: GitHub Pages auto-deploys. Backend: `make deploy` (needs `aws sso login --profile vyb-dev` first; App Runner build ~5 min).
7. `git checkout feature/armenian-language && git stash pop` to restore the developer's WIP.

Working directly on `master` (now that the feature is shipped) is simpler for future changes.

## What's OPEN / next

- **Verdict bands + score-chip colors** are placeholders (`report.go verdict()` and FE
  `scoreColor`: ≥85 green / ≥70 brand / ≥50 amber / else rose). Reconcile exact thresholds with the design.
- **Armenian question content** exists only for the `backend` course (`hy.json`). Other
  courses: ARM interview shows EN questions (fallback) + AI feedback in Armenian. To make
  ARM full: developer adds `hy.json` per course + run `cmd/seed` against prod RDS (no migration needed).
- **hy interview strings on the frontend** are NOT on master yet (only en+ru shipped); add
  when the Armenian frontend work merges to master.
- **Deferred (post-MVP):** English coaching = Learning Profile (`007`) + personalized
  Dictionary (`008`); voice/audio interviews (reuse `question_translations.audio`);
  AI strong/weak analysis (the per-question scores are already persisted from day one).

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

- Backend: `internal/modules/interview/{entity,dto,repository,repository_gorm,ai,service,report,handler}.go`,
  `migrations/00012_*`, `migrations/00013_*`, `internal/config/config.go` (OpenAI),
  `cmd/server/main.go` (wiring), `postman/level-up-backend.postman_collection.json`.
- Frontend: `src/components/Interview{Home,Coach,Setup,Chat,Results,History}.jsx`,
  `src/App.jsx` (routing + AuthDialog), `src/components/AppHeader.jsx` (nav),
  `src/services/endpoints.js` (`interviews*`), `src/index.css` (`.aic-*` / `.lu-nav`),
  `src/i18n/strings.js` (interview keys, en+ru on master; hy in the dev's WIP).

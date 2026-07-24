# Redesign — dark developer UI

Full restyle of the app to match the design handoff in `docs/redesign/handoff/`
(`README.md` = spec, `Level Up.dc.html` = reference prototype), plus the header/search/
notifications/footer additions and the audio rework that followed. Presentation-only for
the restyle; data, routing, state hooks and i18n logic were not changed.

## Design system
- **Fonts:** Google Fonts (Space Grotesk / Manrope / JetBrains Mono) via `<link>` in `index.html`.
- **Icons:** `lucide-react` for UI chrome + dictionary categories; course icons are monochrome
  line icons in `CourseIcon.jsx` (currentColor, tinted by each card's accent).
- **Themes:** dark is primary (`[data-theme="dark"]`), light is `:root`; both from the handoff token
  sets. Component colors derive from tokens or `color-mix()` on a per-card `--card-accent` /
  per-page `--page-accent`.

## Shipped (all deployed to master)
- [x] **Dark redesign** — tokens, fonts, home (eyebrow/H1/subtitle/segmented tabs/card grid),
      course screen, interview mode, dictionary (table + single), players. (`index.css` rewrite.)
- [x] **Account block** — `AccountMenu` (avatar → dropdown: Guest / signed-in profile + stats +
      Theme/Language). UI-only, local demo toggle; real auth later.
- [x] **Notifications** — `NotificationBell` **wired to the backend API** with a Facebook-style
      **seen vs read** model: the badge = **unseen** count (`GET /notifications/unseen-count`),
      cleared on open via `PATCH /notifications/seen` (opening = seen, does not mark read); the
      per-row "new" dot = **unread**, cleared by a row click (`PATCH /notifications/:id/read`) or
      "Mark all read" (`PATCH /notifications/read`). List from `GET /notifications` (auth-gated).
      Server sends `type` + `params`; the client maps type → icon/accent/i18n and renders relative
      time via `Intl.RelativeTimeFormat`. Guests see a sign-in hint. The profile **Recent activity**
      block reuses the same feed (`src/data/notifications.js`). Types today: `welcome`,
      `review_milestone` (streak/daily/new_questions reserved). See backend `docs/notifications/overview.md`.
- [x] **Activity screen** (`#activity`, `ActivityPage.jsx`) — full notifications feed with
      "Load more" pagination, per-row + mark-all read, mark-all-seen on open (clears the badge).
      Reached from the bell's "View all activity" and the profile's "See all". Reuses the shared
      `notificationMeta`/`relativeTime`. Roadmap for the rest (real streak, new_questions, daily):
      backend `docs/notifications/engagement-plan.md`.
- [x] **Command palette (⌘K)** — `GlobalSearch` trigger + portal overlay, filters Courses /
      Questions / Dictionary, navigates on select.
- [x] **Rich footer** — `AppFooter` (brand + social + link columns + bottom bar), home only.
- [x] **Header polish** — 3-zone layout (logo · centered search · notif+account cluster),
      44px rounded-square buttons, inner row capped at 1160.
- [x] **Audio — one MP3 per question** (question+answer together), single `audio` key string.
      Generated + uploaded for **all 8 courses, en+ru** (OpenAI TTS → S3). Player has one
      continuous seekable track; speech fallback only when a key is missing. See
      `docs/audio/overview.md`.
- [x] **Mobile ≤560px breakpoint** — search drops to its own full-width row; notifications
      popover pinned to the viewport edge (`position: fixed`). Horizontal-scroll guard uses
      `overflow-x: clip` on `html,body` (not `hidden`, which would break the sticky header).
      (`@media (max-width: 560px)` in `index.css`.)
- [x] **Dropdown UX** — notification/account close on outside click **and** page scroll
      (non-capturing, so the notification list's own scroll keeps it open).
- [x] **Compact player (3 rows)** — head row: question **title** + a `Q n/N` **chip** (mono,
      right of the title — **not** an eyebrow above it) + `✕`; then the seek row; then one centered
      row of 5 controls (speed · prev · play · next · repeat, 40px squares). No restart button
      (prev restarts the current question when >3s in, else goes back — Spotify-style); repeat loops
      the current question. **No module `<select>`** — plays the whole course.
      `DictionaryPlayer` aligned to the same structure.
- [x] **Sticky header** — `.app-header { position: sticky; top: 0 }`. The scroll guard uses
      `overflow-x: clip` (not `hidden`, which creates a scroll container and breaks `sticky`).
- [x] **User Profile screen + Edit modal** — `ProfilePage.jsx` (identity card, stat row,
      per-course progress, saved-questions counts, achievements, danger zone) reached via `#profile`
      from `AccountMenu` (clickable avatar/name row is the sole entry point — the separate
      "View profile" button was removed as redundant). `EditProfileDialog.jsx` saves
      name/email/bio/track + password change via `PATCH /users`; `updateUser` in `useAuth` keeps the
      header in sync. Real data from `useAuth().user` + `/progress/summary`; streak + recent-activity
      are marked placeholders. **Backend extended**: `User.bio`/`track` (migration `00007`),
      `PATCH /users` now takes email/bio/track/current+new password (409 on email clash, 401 on wrong
      password). See `docs/redesign/handoff/README.md` → "Profile & edit".
- [x] **App icons + lock screen** — bolder favicon/app-icon set (`public/*.png/.svg`) + PWA
      `manifest.webmanifest` + `<head>` tags; `CoursePlayer` sets `navigator.mediaSession.metadata`
      so the logo + question title show on the iPhone lock screen while an MP3 plays. Icon/manifest
      paths use the `/level-up/` base. See `docs/redesign/handoff/ICONS_AND_LOCKSCREEN.md`.
- [x] **Armenian UI locale** — the account-menu selector and persisted language state support
      `en`, `ru`, and `hy`; Armenian-browser locales default to `hy`. All UI strings have an
      Armenian translation and browser speech uses `hy-AM` when no matching installed voice is found.
      Course content/audio translation is tracked separately in the backend.

## Gotchas (fixed)
- A `transform` entrance animation on `.wrap` created a containing block that broke the player's
  `position: fixed`; `.wrap` now uses opacity-only `lu-fade` (`.home` keeps `lu-rise`).
- The command palette overlay was trapped by the header's `backdrop-filter` containing block →
  rendered via `createPortal` into `document.body`.
- The global `footer {}` rule (mono + centered) leaked into `.site-footer` → scoped font/text-align.

## Verified
`npm run lint` clean, `npm run build` OK. Rendered via headless Chrome across desktop (1440/1024)
and mobile (390, device-emulated): home / course / dictionary / palette / notifications / footer /
player, in dark + light themes.

- [x] **Real streak** — `AccountMenu` + `ProfilePage` now show `currentStreak` from
      `/progress/summary` (no more `DEMO_STREAK`). The backend counts consecutive days with a
      reviewed question, with the day boundary in the **user's timezone** (the client sends its
      IANA tz on the review upsert). Milestones (3/7/14/30/100) emit a `streak` notification.
      Roadmap: backend `docs/notifications/engagement-plan.md`.

## Not wired (intentional, backend later)
Footer links (most are placeholders); the reference's "glow on/off" and "compact density"
design-tool props. The `new_questions` notification now fans out on a content reseed
(`cmd/seed`); the only generator still pending is `daily` (see the engagement plan).

## AI Interview Coach (MVP frontend)
New feature screens under `#interview`, built to the delivered Claude Design
`AI Interview Coach.dc.html` (spec: `level-up-backend/docs/interview/**`):
- `InterviewCoach` (container + auth gate + `key={sessionId}` session loader), `InterviewSetup`
  (course/difficulty/count/**language** + confirm modal), `InterviewChat` (chat bubbles, composer,
  sample answer, per-answer feedback, thinking dots), `InterviewResults` (score ring /100, 4-axis
  rubric breakdown, strengths/focus, next steps, + inline Review), `InterviewHistory`.
- Entry: a CTA on the home screen (`.home-interview-cta`) → `#interview`.
- Styles: `.aic-*` block appended to `index.css` (reuses tokens; light+dark). Strings added in
  `strings.js` for en/ru/hy. Endpoints in `endpoints.js` (`interviews*`).
- **Language selector was added here** (en/ru) — the delivered `.dc.html` had none; flagged in the
  interview design docs to add in Claude Design.
- Verified: `npm run lint` clean, `npm run build` OK. End-to-end needs the interview backend
  running (the `interview` Go module is built but not yet deployed).

## Interview performance (profile + header), per Claude Design update
- **Account dropdown** (`AccountMenu.jsx`): mini-stats replaced Reviewed/Saved with
  **Interviews** (`totalCompleted`) and **Avg score** (dynamically colored by `scoreColor`),
  fetched from the new `GET /interviews/summary` alongside `progressSummary()`.
- **`ProfilePage.jsx`**: the 3-tile stat row became a 4-tile `auto-fit` grid — Streak,
  Interviews, Avg score, **Best score** (new). Added a new **"Interview performance"** card:
  a highlighted latest-session box (big score + course/difficulty + language flag+code pill,
  e.g. 🇦🇲 ARM) and a recent-3 list (reuses `.aic-recent-*` from the Interview Coach dashboard),
  each row also showing its language flag+code. "See all" → `#interview/history`.
- New CSS: `.profile-iv-latest*`, `.profile-iv-lang`, `.profile-iv-meta`,
  `.profile-iv-recent-lang`; `.account-stat-value.indigo`; `.profile-stats` grid changed from
  `repeat(3, 1fr)` to `repeat(auto-fit, minmax(140px, 1fr))`.
- Endpoint: `interviewsSummary()` in `endpoints.js` → backend `GET /interviews/summary`
  (`level-up-backend`, no migration — aggregates existing `interview_sessions` columns).
- Verified end-to-end: seeded 3 completed sessions (en/ru/hy) against a local backend +
  Postgres, confirmed via screenshot that stats, colors, and language flags render correctly
  in both the header dropdown and the profile page.

## Removed — old Course "Interview" mode
The `List / Quiz / Interview` mode inside `PrepView` (per-course shuffled Q&A flashcard flow,
`src/components/InterviewMode.jsx` + `.interview-stage`/`.interview-actions`) was removed now that
**AI Interview Coach** (`#interview`) covers that need with a much better experience. `ModeBar` is
now `List / Quiz` only. This is unrelated to AI Interview Coach, which is untouched — see that
section above. Line 18's "interview mode" mention above is a historical record of the original
dark-redesign restyle and no longer reflects current UI.

## M3 — Onboarding placement (2026-07-24)
Presentation-only additions, no new CSS (reuses existing `.aic-*` classes):
- New-user interview home leads with a "Take a 6-question placement" primary button
  (`.aic-primary-btn`), with "Start your first interview" demoted to a `.aic-ghost-btn`
  (skippable). `InterviewHome` gains an `onStartPlacement` prop.
- `InterviewSetup` gains a `placement` mode: hides the question-count segment, shows a
  `.aic-focus-body` note, and sends `kind: 'placement'` to `POST /interviews`.
- `InterviewHistory` appends an "Assessment" label to a row when `session.kind === 'placement'`.
- Strings `interviewPlacementNote` / `interviewPlacementCta` / `interviewAssessmentLabel`
  added in en/ru/hy (hy machine-translated — flag for a native review).

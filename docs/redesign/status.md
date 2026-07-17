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
      `review_milestone` (streak/daily/new_questions reserved). See backend `docs/notifications.md`.
- [x] **Activity screen** (`#activity`, `ActivityPage.jsx`) — full notifications feed with
      "Load more" pagination, per-row + mark-all read, mark-all-seen on open (clears the badge).
      Reached from the bell's "View all activity" and the profile's "See all". Reuses the shared
      `notificationMeta`/`relativeTime`. Roadmap for the rest (real streak, new_questions, daily):
      backend `docs/engagement-features-plan.md`.
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
      from `AccountMenu` (clickable profile row + View profile). `EditProfileDialog.jsx` saves
      name/email/bio/track + password change via `PATCH /users`; `updateUser` in `useAuth` keeps the
      header in sync. Real data from `useAuth().user` + `/progress/summary`; streak + recent-activity
      are marked placeholders. **Backend extended**: `User.bio`/`track` (migration `00007`),
      `PATCH /users` now takes email/bio/track/current+new password (409 on email clash, 401 on wrong
      password). See `docs/redesign/handoff/README.md` → "Profile & edit".
- [x] **App icons + lock screen** — bolder favicon/app-icon set (`public/*.png/.svg`) + PWA
      `manifest.webmanifest` + `<head>` tags; `CoursePlayer` sets `navigator.mediaSession.metadata`
      so the logo + question title show on the iPhone lock screen while an MP3 plays. Icon/manifest
      paths use the `/level-up/` base. See `docs/redesign/handoff/ICONS_AND_LOCKSCREEN.md`.

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

## Not wired (intentional, backend later)
Real auth/user, notification feed, streak, footer links (most are placeholders); the reference's
"glow on/off" and "compact density" design-tool props.

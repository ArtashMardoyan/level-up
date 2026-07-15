# Redesign — dark developer UI

Full restyle of the app to match the design handoff in `docs/design_handoff_level_up/`
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
- [x] **Notifications** — `NotificationBell` (badge + dropdown, 3 seed items, mark-all-read).
      Static feed; wire to real data later.
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
      popover pinned to the viewport edge (`position: fixed`); player status wraps to a centered
      line under the transport. (`@media (max-width: 560px)` in `index.css`.)
- [x] **Dropdown UX** — notification/account close on outside click **and** page scroll
      (non-capturing, so the notification list's own scroll keeps it open).

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

# Redesign — dark developer UI

Full restyle of the app to match the design handoff in `docs/design_handoff_level_up/`
(`README.md` = spec, `Level Up.dc.html` = reference prototype). Presentation only —
data, routing, state hooks, i18n logic and speech were not touched.

## Decisions
- **Fonts:** Google Fonts (Space Grotesk / Manrope / JetBrains Mono), loaded via `<link>` in `index.html`.
- **Icons:** `lucide-react` for UI chrome + dictionary category icons; course icons are monochrome
  line icons in `CourseIcon.jsx` (currentColor, tinted by each card's accent).
- **Themes:** dark is primary (`[data-theme="dark"]`), light is `:root`. Both use the exact token
  sets from the handoff. All component colors derive from tokens or `color-mix()` on a per-card /
  per-page accent, so both themes stay correct.
- Shipped as one branch: `feature/redesign-dark-ui`.

## Accent wiring
- Per course: `accent` added to the registry in `src/data/courses.js` (flows through `getLocalizedCourse(s)`).
- Per dictionary category: `accent` added in `src/data/dictionary.js`; lucide icon mapped in `DictionaryIcon.jsx`.
- Cards set `--card-accent` inline; detail pages set `--page-accent` on the `.wrap`. CSS reads those.

## Done (all screens)
- [x] Tokens + fonts + base (`index.css` full rewrite, `index.html`)
- [x] Home: eyebrow / H1 / subtitle / segmented tabs / card grid (`App.jsx`, `CourseSelect`, `DictionarySelect`)
- [x] Cards: accent icon tile, glow blob, mono meta, arrow; DAILY badge + "Start now"; learn progress bar
- [x] Header: gradient logo tile, search w/ icon, gear + segmented settings panel (`AppHeader`/`Logo`/`GlobalSearch`/`SettingsPanel`)
- [x] Course screen: breadcrumb switcher, accent title tile, progress, search, ModeBar (segment + Favorites/Listen chips), question cards (`PrepView`/`PageSwitcher`/`ModeBar`/`ProgressBar`/`QuestionCard`)
- [x] Interview mode: centered card, mono counter, primary/ghost buttons (`InterviewMode`)
- [x] Dictionary detail: table (mono headers, learned checkbox) + single card w/ glow (`DictionaryCategoryPage`/`DictionaryTable`/`DictionarySingle`)
- [x] Players: fixed glassy bottom bar, lucide transport (`CoursePlayer`/`DictionaryPlayer`)
- [x] i18n: added `homeEyebrow`, `homeSubtitle`, `reviewedLabel`, `learnedLabel`, `themeLightLabel`,
      `themeDarkLabel`, `dictionaryDailyShort`, `dictionaryStartNow` (en + ru)

## Verified
`npm run lint` clean, `npm run build` OK. Rendered via headless Chrome: home / course / dictionary
in dark + light themes, plus tablet width — all match the reference.

## Gotcha (fixed)
- A `transform` entrance animation on `.wrap` created a containing block that broke the
  player's `position: fixed` (bar fell into document flow instead of sticking to the viewport).
  `.wrap` now uses an opacity-only `lu-fade`; `.home` keeps the `transform`-based `lu-rise`
  because it has no fixed descendants.

## Not yet
- Manual pass on a real phone (< 500px) — headless Chrome clamps window width so sub-500px couldn't be
  screenshotted here; layout is fluid (clamp / auto-fill / flex-wrap) so it should collapse cleanly.
- Optional: the reference's "glow on/off" and "compact density" toggles were design-tool props; not wired.

# Handoff: Level Up — Landing (Courses + Dictionary)

## Overview
Redesign of the "Level Up" interview-prep home screen. One screen with a segmented
tab switch between two grids of cards: **Courses** (learning tracks) and
**Dictionary** (English / speaking practice). Dark developer aesthetic.

## About the Design Files
The file in this bundle (`Level Up.dc.html`) is a **design reference created in HTML** —
a prototype showing the intended look and behavior. It is **not** production code to
copy directly. Your task is to **recreate this design inside the existing Level Up
codebase** (React) using its established components, routing, and styling patterns.
Match the visual spec below; wire it to the app's real data.

`support.js` is only the runtime that lets the `.dc.html` render in a browser for
reference — ignore it when implementing.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate
pixel-close using the codebase's own libraries.

## Screens / Views

### Home (single screen, two tab views)
- **Purpose:** user picks a learning track (Courses) or a practice module (Dictionary).
- **Layout:**
  - Sticky top **header** (blurred), full width.
  - Centered content column: `max-width: 1160px`, horizontal padding
    `clamp(16px, 4vw, 28px)`, top padding `clamp(30px, 5vw, 52px)`.
  - Eyebrow → H1 → subtitle → tab switch → card grid.
  - **Grid:** `grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr))`,
    `gap: 18px`. Collapses to 1 column on mobile automatically (no media queries needed).
    "Compact" density uses `250px` instead of `330px`.

#### Header
- `position: sticky; top: 0; z-index: 20`
- `background: rgba(9,10,14,0.72)`, `backdrop-filter: blur(14px)`,
  `border-bottom: 1px solid rgba(255,255,255,0.07)`
- `display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; padding: 12px clamp(14px,4vw,26px)`
- **Logo:** 30×30 rounded (radius 9) tile, `linear-gradient(150deg, #818cf8, #6366f1)`,
  white chevrons-up icon, shadow `0 4px 14px rgba(99,102,241,0.4)`. Label "Level Up",
  Space Grotesk 700, 17px, `#f4f6fb`.
- **Search:** `flex: 1 1 200px; max-width: 540px`. Input height 42, radius 11,
  `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.09)`,
  left search icon at 15px, placeholder `#626a7e`, text `#eceef4`, 14.5px.
- **Settings:** 42×42 button, radius 11, same bg/border as search, gear icon `#9198ac`
  (→ `#eceef4` on hover).

#### Hero
- **Eyebrow:** JetBrains Mono 12px, weight 500, `letter-spacing: 0.22em`, uppercase,
  color `#818cf8`. Text: `INTERVIEW PREP · 8 PATHS`.
- **H1:** Space Grotesk 600, `font-size: clamp(30px, 4vw, 44px)`, `line-height: 1.05`,
  `letter-spacing: -0.025em`, color `#f6f8fc`. Text: "Choose Your Learning Path".
- **Subtitle:** Manrope 16px, `line-height: 1.55`, color `#8b92a6`, `max-width: 540px`.

#### Tab switch (segmented control)
- Container: `inline-flex; gap: 4px; padding: 4px; border-radius: 13px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)`.
- Each tab: Space Grotesk 600, 14px, `padding: 8px 20px; border-radius: 10px`,
  transition on bg/color 0.16s.
- **Active** tab: `background: rgba(129,140,248,0.18); color: #b9c1ff`.
- **Inactive** tab: `background: transparent; color: #8b92a6`.
- Clicking a tab swaps which grid is visible (state, see below).

#### Card (used by both grids)
- `border-radius: 16px; padding: 24px; background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07)`; flex column, `gap: 15px`;
  `position: relative; overflow: hidden; isolation: isolate`.
- **Accent glow blob** (first child): absolute `top:-50; right:-50; 170×170;
  border-radius:50%; background: radial-gradient(circle, <accent @0.22>, transparent 68%);
  filter: blur(8px)`. Toggleable (opacity 1/0 via a "glow" setting).
- **Icon tile:** 46×46, `border-radius: 13px`, flex-center,
  `background: color-mix(in oklab, <accent> 15%, transparent)`,
  `border: 1px solid color-mix(in oklab, <accent> 30%, transparent)`, icon color `<accent>`.
  Icons are 22px inline SVG, stroke `currentColor`, `stroke-width: 1.8`, round caps/joins.
- **Title (h3):** Space Grotesk 600, 18px, `#f3f5f9`.
- **Desc (p):** Manrope 14px, `line-height: 1.5`, `#868da0`.
- **Footer row:** space-between. Left = JetBrains Mono 12.5px weight 500 in `<accent>`
  (e.g. "51 questions", "0 / 10 learned", or "Start now"). Right = arrow-right icon 18px, `#5c6377`.
- **Progress bar** (Dictionary learn cards): 5px track, radius 99px,
  `background: rgba(255,255,255,0.07)`, fill = `<accent>` at `width = learned/total * 100%`.
- **Hover:** `transform: translateY(-3px)`, border-color = `<accent> @0.35`,
  `background: rgba(255,255,255,0.045)`, transition 0.18s ease.

## Content & accent colors

### Courses grid (8 cards)
| Title | Description | Meta | Accent |
|---|---|---|---|
| Backend Developer | Node.js, APIs, databases, AWS & infrastructure | 51 questions | `#fbbf24` |
| Frontend Developer | React, browser internals, performance | 50 questions | `#c084fc` |
| DevOps Engineer | CI/CD, containers, cloud infrastructure | 50 questions | `#38bdf8` |
| QA Engineer | Testing strategy, automation, bug reports | 50 questions | `#fb7185` |
| Node.js | Runtime internals, streams, npm ecosystem | 50 questions | `#4ade80` |
| Go | Goroutines, channels, standard library | 50 questions | `#22d3ee` |
| React | Hooks, state management, component patterns | 50 questions | `#818cf8` |
| Next.js | SSR/SSG, App Router, API routes | 50 questions | `#e2e8f0` |

### Dictionary grid (8 cards)
| Title | Description | Meta | Accent |
|---|---|---|---|
| Today's Challenge | A small daily speaking goal. | DAILY badge · "Start now" | `#fb7185` |
| Sentence of the Day | One phrase to master today. | DAILY badge · "Start now" | `#fbbf24` |
| Vocabulary | English words used in backend interviews. | 0 / 10 learned | `#818cf8` |
| Pronunciation | Tricky tech words and how to say them. | 0 / 10 learned | `#22d3ee` |
| Interview Phrases | Ready-made phrases for interview answers. | 0 / 10 learned | `#c084fc` |
| Grammar Fixes | Common English mistakes, corrected. | 0 / 5 learned | `#4ade80` |
| Leadership | Strong sentences for team-lead questions. | 0 / 5 learned | `#38bdf8` |
| Words to Use More Often | Swap weak words for stronger ones. | 0 / 7 learned | `#2dd4bf` |

- **DAILY badge:** JetBrains Mono 10.5px weight 600, `letter-spacing: 0.14em`, `#cbd3e1`,
  `padding: 5px 9px; border-radius: 8px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08)`. Sits top-right, icon tile top-left.

## Interactions & Behavior
- **Tab switch:** clicking Courses/Dictionary toggles which grid renders. Keep one
  active view in state; hide the other (`display: none`).
- **Card hover:** lift + accent border + slightly lighter bg (0.18s ease).
- **Responsive:** grid auto-collapses via `auto-fill / minmax`; header wraps via
  `flex-wrap: wrap`; hero type scales via `clamp()`. No fixed breakpoints required.
- Cards are links (`<a>`), navigate to the track/module detail page.

## State Management
- `view: 'courses' | 'dictionary'` (default `'courses'`).
- Dictionary learn cards need `learned` / `total` counts to drive the progress bar
  and label. Daily cards have no progress (show a "Start now" CTA instead).
- Wire card lists and counts to the app's real data source.

## Design Tokens
- **Base bg:** `#090a0e` + two radial glows:
  `radial-gradient(1100px 560px at 82% -12%, rgba(129,140,248,0.12), transparent 60%)`,
  `radial-gradient(900px 480px at -5% 108%, rgba(34,211,238,0.07), transparent 55%)`.
- **Surfaces:** card `rgba(255,255,255,0.025)`, hover `rgba(255,255,255,0.045)`,
  control `rgba(255,255,255,0.04)`.
- **Borders:** hairline `rgba(255,255,255,0.07)`–`0.09`; accent hover `<accent> @0.35`.
- **Text:** primary `#f6f8fc` / `#f3f5f9`, secondary `#8b92a6` / `#868da0`, muted `#5c6377`.
- **Brand accent:** `#818cf8` (with `#6366f1` for the logo gradient / active states).
- **Radii:** card 16, icon tile / control 11–13, badge 8, pill/track 99.
- **Spacing:** card padding 24, grid gap 18, card inner gap 15.
- **Type:** Space Grotesk (display/headings, 600), Manrope (body, 400/500),
  JetBrains Mono (labels, counts, badges).
- **Icons:** inline SVG line icons, 22px, `stroke-width: 1.8`, `currentColor`.
  (In React, use `lucide-react`: server, app-window, infinity, bug, hexagon,
  arrow-right-left, atom, triangle, target, star, book-open, volume-2,
  message-square, square-pen, user, trending-up, arrow-right, chevrons-up, search, settings.)

## Assets
No image assets — all icons are inline SVG (map to `lucide-react` per list above).
Fonts load from Google Fonts (Space Grotesk, Manrope, JetBrains Mono).

## Mapping to the Level Up codebase (React)
This is a **restyle**, not a rewrite — keep the existing data flow, routing, and
component structure. Only touch presentation. Target files:

- **`src/App.jsx` (home branch):** the header (logo / search / settings gear) and the
  `Courses` / `Dictionary` tab bar (`.mode-bar` / `.mode-btn`). Restyle the header per
  the Header spec above; restyle `.mode-bar`/`.mode-btn` per the Tab-switch spec
  (active = `rgba(129,140,248,0.18)` bg + `#b9c1ff`; inactive transparent + `#8b92a6`).
  Add the eyebrow line (`INTERVIEW PREP · 8 PATHS`) above the "Choose Your Learning Path"
  headline, plus the subtitle.
- **`src/components/DictionarySelect.jsx`** and the Courses grid — restyle `.course-card`,
  `.course-subtitle`, `.course-badge`, and the learned-count line per the Card spec.
  Grid → `repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 18px`.
- **Icon tiles:** each `.course-card` gets a 46×46 tinted icon tile. Courses already use
  SVG logos via `CourseIcon`; keep those but wrap them in the accent tile. Dictionary
  cards currently use emoji (`📖`, `🎯`…) — replace with `lucide-react` line icons
  (map per the icon list below) in the accent tile, OR keep the emoji inside the tile if
  you prefer minimal change. Accent color per card is in the two tables above.
- **`src/components/ProgressBar.jsx`** — restyle to the 5px track spec (accent fill).
- **Daily categories** (`todaysChallenge`, `sentenceOfTheDay`, `layout: 'single'`):
  the home card shows the `📅 Daily` badge top-right (`.course-badge`) and a "Start now"
  footer instead of a progress line — matches your 2026-07-10 home-grid change.
- **CSS:** wherever `.course-card`, `.mode-btn`, `.course-badge`, `.course-subtitle`,
  the header, and `ProgressBar` are styled (global stylesheet / CSS modules). Apply the
  Design Tokens below. Add the three Google fonts to `index.html`.
- **Do NOT change:** `src/data/dictionary*`, JSON content, `useReviewState`, routing
  (`#dictionary/{categoryId}`), `DictionaryPlayer`, i18n keys, or `PageSwitcher` logic —
  only their styling.

Responsive: the `auto-fill / minmax` grid + `flex-wrap` header + `clamp()` type give
mobile for free; verify at ~390px (single column, header wraps).

## Additional screens (restyle these too)
The reference now also covers the in-course screens. Click any course card to open them.

### Course Q&A view → `src/components/PrepView.jsx` (+ `PageSwitcher`, `ModeBar`, `ProgressBar`, `QuestionCard`)
- **Breadcrumb** (`PageSwitcher`): `← Courses  /  {course}` — back button `#9198ac`→`#eceef4`,
  current title `#c8cdda` 600.
- **Title row:** 48×48 accent icon tile (course accent, `color-mix 16%/32%`) + `<h1>`
  (Space Grotesk 600, `clamp(24px,3.4vw,34px)`) + subtitle `{subtitle} · {n} questions`.
- **`ProgressBar`:** label row (mono, `Reviewed` / `{done} / {total}` in course accent) + 6px
  track (`rgba(255,255,255,0.07)`), fill = **course accent**, `transition: width .3s`.
- **`.search-box`:** 44px, radius 12, left search icon, same field styling as the header.
- **`ModeBar`:** segmented `List / Quiz / Interview` (active `rgba(129,140,248,0.18)`/`#b9c1ff`)
  + standalone `★ Favorites` and `🔊 Listen` chips (radius 11, own border) that highlight when on.
- **`QuestionCard`** (`.card` / `.q-header` / `.a-body` / `.a-inner`): radius 14 card,
  header button = question (Manrope 600 15.5px) + `✓` reviewed check in `#4ade80` + `🔊` speak
  + `☆/★` favorite (active `#fbbf24`) + chevron rotating 180° on open. Body animates via
  `max-height` 0↔3000px, `transition .3s`. `.copy-btn` = 13px, radius 8, `rgba(255,255,255,0.03)`
  bg + hairline border. `.bonus-box` = indigo-tinted (`rgba(129,140,248,0.08)`/`0.2` border) with
  a mono `BONUS` tag `#a5b0ff`. Quiz mode gates the answer behind a "Show answer" button.
- **Module labels** (`.module-label`): mono 11.5px uppercase `#6b7285`, collapsible.

### Interview mode → `src/components/InterviewMode.jsx` (`.interview-stage`)
Centered card (radius 18): mono `QUESTION n OF total` `#818cf8`, big question (Space Grotesk 600,
`clamp(20px,2.6vw,26px)`), primary `Show answer` (indigo gradient) + ghost `Skip →`; revealed
answer sits under a hairline divider.

### Audio player → `src/components/CoursePlayer.jsx` (`.player-bar`)
Fixed bottom bar, `rgba(13,14,19,0.9)` + blur, top border hairline. Rows: title + `✕` close;
time / seek track (fill `#818cf8`) / duration; transport (restart, prev, **play** = 48px indigo
gradient, next, `1×` speed). Toggled by the `🔊 Listen` chip.

### Also restyle
- **`src/components/AppHeader.jsx`** / `Logo` / `GlobalSearch` / `SettingsPanel` — the shared header
  per the Header spec (logo gradient tile, search field, gear button).
- **`src/index.css`** — this is where nearly all of the above classes live; apply the Design Tokens
  there. Keep the light theme working (`useTheme`).

## Theming (light / dark)
The reference implements both themes with **CSS custom properties** on the root, swapped by the
`theme` value — mirror this in `index.css` (e.g. `:root` = dark defaults, `[data-theme="light"]` or
a `.light` class = overrides). Token names and values used:

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#090a0e` | `#eef0f5` |
| `--surface` | `rgba(255,255,255,0.025)` | `rgba(20,25,45,0.04)` |
| `--surface-hover` | `rgba(255,255,255,0.045)` | `rgba(20,25,45,0.065)` |
| `--control` | `rgba(255,255,255,0.04)` | `rgba(20,25,45,0.05)` |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(20,25,45,0.1)` |
| `--text` | `#f3f5f9` | `#181b24` |
| `--text-2` | `#868da0` | `#55607a` |
| `--text-3` | `#5c6377` | `#97a0b3` |
| `--header-bg` | `rgba(9,10,14,0.72)` | `rgba(255,255,255,0.82)` |
| `--panel-solid` | `#14161d` | `#ffffff` |

Accent colors (per course/category, brand indigo `#818cf8`) are the same in both themes; the active
tab/segment uses `rgba(129,140,248,0.18)`/`#b9c1ff` in dark and `rgba(99,102,241,0.13)`/`#4f46e5` in light.

## Files
- `Level Up.dc.html` — the design reference (open in a browser to view; toggle the
  Dictionary tab, and click any course card to see the course / quiz / interview / player screens).
- `support.js` — runtime needed only to render the reference file. Not for production.

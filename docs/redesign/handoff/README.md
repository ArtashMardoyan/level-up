# Handoff: Level Up — Landing (Courses + Dictionary)

## Changelog
- **2026-07-16** — Added **loading skeletons** (shimmer) for the course/dictionary grids and the
  course question list, driven by async backend fetches. See **Loading states (backend data)**.
- **2026-07-16** — Added **full-bleed media artwork** (`media-art-192/512.png`) for CarPlay /
  lock screen. The rounded home-screen icons showed white corners inside CarPlay's tile;
  the media session now uses edge-to-edge gradient art. See `ICONS_AND_LOCKSCREEN.md`.
- **2026-07-16** — Added global **horizontal-scroll guard** (`html,body{overflow-x:hidden;max-width:100%}`)
  to `index.css`. Fixes the mobile "content cut off at the right edge / sideways scroll" report
  on iPhone. See **Mobile responsive** section.
- **2026-07-16** — Added **Auth modal** (login / signup / registration). The header
  account "Sign in" now opens a modal instead of instantly logging in. See
  **Auth (login / signup)** section below. Files: `AppHeader.jsx` / new `AuthModal.jsx`.
- Earlier: global search palette, notifications, footer, mobile breakpoint, app icons
  + iPhone lock-screen artwork (see respective sections).

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
- Inner row: `display: flex; flex-wrap: wrap; align-items: center; gap: 12px 14px; max-width: 1160px; margin: 0 auto`; padding `12px clamp(14px,4vw,28px)`.
- **3-zone layout:** logo (left, `flex-shrink:0`) · centered search (`flex: 1 1 280px; display:flex; justify-content:center`, inner button `width:100%; max-width:520px`) · account cluster (right, `display:flex; gap:10px; flex-shrink:0`). Search stays visually centered between the two side groups; on narrow widths it wraps to a full-width row. Do **not** stretch the search edge-to-edge or `margin-left:auto` the cluster only.
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
Fixed bottom bar, `rgba(13,14,19,0.9)` + blur, top border hairline. Rows, top → bottom:
1. **Meta row:** module `<select>` (left) + `✕` close (right).
2. **Status eyebrow:** `Q n of N` in mono 10.5px, uppercase, `--text-3` — sits ABOVE the title
   (not in the control row).
3. **Title:** current question, 13.5px 600, ellipsised to one line.
4. **Seek row:** current time / seek track (fill `#818cf8`) / duration.
5. **Transport — one centered row of 5 controls** (`.player-controls`, `justify-content:center`,
   `gap`), in this order so **play sits dead-centre** (2 left · play · 2 right):
   `speed` · `prev` · **`play/pause`** (48px indigo gradient) · `next` · `repeat`.
   - Secondary controls (`speed` pill showing `0.75×–1.5×`, `repeat` toggle) are the same 40px
     square size as prev/next — NOT pulled to the bar edges.
   - `repeat` active state = indigo tint (`rgba(129,140,248,0.18)` bg, `#b9c1ff` fg, indigo border).
   - No standalone **restart** button — `prev` restarts the current question when >3s in, else goes
     to the previous one (Spotify-style).
Toggled by the `🔊 Listen` chip. Speed cycles `[0.75, 1, 1.25, 1.5]`; play/pause swaps its glyph.

### Device preview toggle (reference-only helper — do NOT ship)
The reference file has a small **Desktop / Mobile** switcher pinned bottom-**right** (out of the
player's way); Mobile renders the app inside a 390px iPhone frame. It's a preview aid for viewing
the responsive layout — it is not part of the product UI and has no place in the React app.

### Also restyle
- **`src/components/AppHeader.jsx`** / `Logo` / `GlobalSearch` / `SettingsPanel` / `NotificationBell` — the shared header
  per the Header spec (logo gradient tile, search trigger, notification bell, gear/account button).
- **`src/index.css`** — this is where nearly all of the above classes live; apply the Design Tokens
  there. Keep the light theme working (`useTheme`).

### Global search — command palette → `src/components/GlobalSearch.jsx`
The header search is a **trigger button**, not an inline input. Recreate as a ⌘K command palette.
- **Trigger:** centered in the header's middle zone — `width: 100%; max-width: 520px`, height 44, radius 12, `--control` bg + `--border-2`
  border. Left search icon (17px), placeholder text "Search courses, questions, terms…" in `--text-3`,
  and a right-aligned `⌘K` `<kbd>` (JetBrains Mono 11px, radius 7, hairline bg). Hover lightens bg/border.
  Lives in a centered flex zone (see Header); the account cluster (bell + account) sits to its right, not `margin-left:auto` on the account alone.
- **Open:** click the trigger OR press ⌘K / Ctrl+K anywhere. Close on `Esc`, on backdrop click, or the `Esc` kbd.
- **Overlay:** `position: fixed; inset: 0; z-index: 100`, `rgba(4,5,8,0.6)` + `backdrop-filter: blur(6px)`,
  top-aligned (`padding-top: clamp(56px,11vh,120px)`). Panel: `width: min(640px,100%)`, radius 18,
  `--panel-solid` bg, `--border-strong`, `box-shadow: 0 30px 80px rgba(0,0,0,0.6)`, `max-height: min(70vh,620px)`.
- **Input row:** 20px search icon + borderless autofocus input (16px) + clickable `Esc` kbd; hairline bottom border.
- **Results:** live filter across **Courses** (title+desc), **Questions** (question+module+answer), and
  **Dictionary** terms (all fields). Grouped with mono uppercase group labels. Each row: 36×36 accent icon tile
  (course=hexagon / question=help-circle / term=book), title + sub (both truncated), optional right badge
  (e.g. `51 Q` / category name). Row hover = `--surface-hover`, radius 11.
- **Empty query:** show Courses (all) + "Popular questions" (first 3) as a jump list ("Jump to anything" hint).
- **No match:** centered `No matches for "{q}"` + hint line.
- **Selecting a result** navigates: course→course view, question→course view with that question open,
  term→that dictionary category. Clears query and closes.

### Notifications → `src/components/NotificationBell.jsx`
Sits left of the account button in the header cluster.
- **Bell button:** 44×44 rounded-square (radius 12), `--control` bg + `--border-2`, bell icon 19px `--text-2`→`--text` on hover. Matches the 44×44 account button beside it (both in the right-hand cluster, `gap:10px`).
- **Unread badge:** top-right pill, `min-width 15 / height 15`, `#fb7185` bg, 2px `--panel-solid` ring,
  white mono count 9px. Hidden when no unread.
- **Dropdown:** `absolute; right:0; top:50px; z-index:50`, width 328, radius 16, `--panel-solid`,
  `--border-strong`, shadow `0 18px 44px rgba(0,0,0,0.5)`.
  - Header: "Notifications" (Space Grotesk 600 14.5) + "Mark all read" text button (`#818cf8`).
  - List (`max-height: 340; overflow-y:auto`): each item = 34×34 accent icon tile + title (13.5 600) +
    body (12.5, `--text-2`) + mono uppercase time (10px `--text-3`) + unread dot (`#fb7185` 7px). Unread
    rows get `--surface-hover` bg; each row hairline-separated.
  - Footer: full-width "View all activity" button (12.5 600 `--text-2`), hairline top border.
- **Seed data** (3): "Streak milestone" (`#fbbf24`, flame), "Today's Challenge is ready" (`#818cf8`, target),
  "New questions added" (`#4ade80`, hexagon). Wire to the app's real activity feed; "Mark all read" clears unread.
- Opening the bell closes the settings panel (and vice-versa) — one popover at a time.

### Footer → `src/components/AppFooter.jsx` (home view, inside the content column)
Replaces the old "works fully offline" line (the app is no longer offline-only).
- `margin-top: 64px; padding-top: 36px; border-top: 1px solid --border`. Two rows.
- **Top row** (`flex; flex-wrap; justify-content: space-between; gap: 40px 56px`):
  - **Brand block** (max-width 300): 28×28 logo gradient tile + "Level Up", a `--text-2` tagline
    ("Structured question banks and daily drills…"), and a row of 3 social icon buttons (GitHub / X /
    Telegram) — 34×34, radius 9, `--control` + `--border-2`, `--text-2`→`--text` hover.
  - **Link columns** (3): mono uppercase headings (`Practice` / `Resources` / `Company`) + vertical link
    lists (13.5px `--text-2`→`--text`). Practice: All courses, Dictionary, Daily challenge, Saved questions.
    Resources: Study guide, Roadmaps, Changelog. Company: About, Contact, Feedback.
- **Bottom bar** (`margin-top: 40; padding-top: 22; border-top: 1px solid --hairline`;
  space-between, wraps): `© 2026 Level Up · Made for interview practice` (12.5 `--text-3`) +
  Privacy / Terms links on the right.
- Uses tokens only → works in both themes. `--border-2` = `rgba(255,255,255,0.09)` dark /
  `rgba(20,25,45,0.13)` light; `--border-strong` = `rgba(255,255,255,0.12)` dark /
  `rgba(20,25,45,0.16)` light; `--hairline` = `rgba(255,255,255,0.06)` dark.

### `src/index.css`
This is where nearly all of the above classes live; apply the Design Tokens there. Keep the light
theme working (`useTheme`).

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

## Mobile responsive (≤ 560px)
The reference now includes an explicit mobile breakpoint. Add these rules to `src/index.css`
(the base layout is otherwise fluid). Verify at ~390px.

> **Horizontal-scroll guard (required).** The #1 mobile bug is a single wide child (a fixed bar,
> a `100vw` element, an un-wrapped row) forcing the whole page to scroll sideways — content gets
> cut off at the right edge. Add this global guard so it can never happen:
> ```css
> html, body { overflow-x: hidden; max-width: 100%; }
> ```
> The reference already ships this. If your deployed build still scrolls sideways, your build is
> **stale** — redeploy from the latest source and confirm this rule is present.

```css
@media (max-width: 560px) {
  /* Header: search drops to its own full-width row below logo + icons */
  .lu-search-wrap { order: 3; flex-basis: 100%; }        /* search trigger wrapper */
  .lu-actions     { margin-left: auto; }                  /* bell + account pushed to right edge */

  /* Notifications popover: pin to the viewport's right edge, not the bell wrapper */
  .notif-menu { position: fixed; top: 124px; right: 10px; left: auto;
                width: min(340px, calc(100vw - 20px)); }
}
```
> Real app class names: `.lu-search-wrap` → `.header-search-zone`, `.lu-actions` →
> `.header-cluster`, `.lu-notif` → `.notif-menu` (already applied in `src/index.css`).
> The audio player needs **no** mobile rule now — the transport is one row of five 40px controls
> with the `Q n of N` status moved above the title, so it fits 390px without wrapping.
Layout intent per element:
- **Header** — three flex children (logo / search / actions). On mobile the search wrapper
  reorders below (`order:3; flex-basis:100%`) so row 1 is **logo left + icons right**
  (`.lu-actions { margin-left:auto }`), row 2 is the full-width search pill. Header height ≈ 125px.
- **NotificationBell popover** — on desktop it's `position:absolute` off the bell; on mobile it
  overflowed the narrow viewport, so switch to `position:fixed` pinned 10px from the right edge,
  124px from top (just under the header).
- **CoursePlayer transport** — the `Q n of N` label lives above the title (mono eyebrow), and the
  five transport controls stay on one centered row on mobile too — no wrap needed.

## Loading states (backend data)
Courses, dictionary entries, and questions now come from the **backend** (async), so every list
has a real loading state. The reference implements shimmer **skeletons** — never a spinner or a
blank screen, and never a layout jump when data arrives (skeletons match the final layout).

**Shimmer primitive** — one reusable style; apply it to any grey block:
```css
@keyframes lu-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.skeleton {
  background: linear-gradient(90deg, var(--control) 25%, var(--control-2) 50%, var(--control) 75%);
  background-size: 200% 100%;
  animation: lu-shimmer 1.4s ease infinite;
  border-radius: 7px;
}
```

**Where it goes**
- **Course / Dictionary grid** (home): while `courses`/`dictionary` are loading, render **6** skeleton
  cards using the *same* grid (`repeat(auto-fill, minmax(min(100%,330px),1fr))`, `gap:18px`). Each
  card mirrors the real one: 48×48 icon block + a small meta pill (top row), a ~58%-width title bar,
  two body lines (100% + 80%), and a 40%-width footer bar. Same `padding:24px; border-radius:16px;
  background:var(--surface); border:1px solid var(--border)` shell so nothing shifts on load.
- **Course question list**: while a course's questions load, render **5** skeleton rows — each the
  question-card shell (`padding:16px 18px; border-radius:14px; --surface` + `--border`) with a
  flex-1 title bar + an 18×18 trailing block. Hidden in Interview mode.
- **Dictionary table**: same idea — a few skeleton rows matching the table row height.

**Wiring**
- Gate each grid/list on its own loading flag (`loading` for home, `courseLoading` per course).
  Show the skeleton **only** while that flag is true; swap to real data when the fetch resolves.
- Keep skeleton counts small (5–6) — enough to fill the first viewport, not the whole list.
- On fetch **error**, show a short retry row (not a skeleton). The reference doesn't mock errors;
  add a `--text-2` message + a small “Retry” button styled like the ghost buttons.
- The reference simulates the fetch with a timer (~1.1s home, ~0.8s course) purely so the skeleton
  is visible — replace with your real `fetch`/query state (`isLoading` from React Query/SWR/etc.).

## App icons + iPhone lock-screen artwork
See **`ICONS_AND_LOCKSCREEN.md`** and the **`assets/`** folder. Bolder favicon/app-icon set
(SVG + PNGs + web manifest) plus the `navigator.mediaSession.metadata` wiring so the Level Up
logo + question title show on the iPhone lock screen while a question plays in the background.

### Auth (login / signup) → new `src/components/AuthModal.jsx` (+ `AppHeader.jsx`)
The account button's **Sign in** opens a centered modal overlay (not a one-click login).
- **Overlay:** `position: fixed; inset: 0; z-index: 120`, `rgba(4,5,8,0.68)` + `blur(7px)`;
  click on backdrop or `Esc` closes. Card `width: min(410px,100%)`, radius 20, `--panel-solid`
  + `--border-strong`, `padding: 26px`.
- **Header row:** indigo gradient logo tile (44×, radius 13) + `✕` close button (34×, `--control`).
- **Title/sub:** swap by mode — login: “Welcome back” / “Sign in to sync your streak & progress”;
  signup: “Create your account” / “Start tracking your interview prep”.
- **Tabs:** segmented Log in / Sign up (same segmented-control style as the theme switch;
  active = `rgba(129,140,248,0.18)`/`#b9c1ff` dark).
- **Fields:** Name (signup only), Email, Password. Labels are mono 10.5px uppercase `--text-3`;
  inputs `--control` bg + `--border-2`, radius 11, focus border `#818cf8`.
- **Validation (client-side):** valid email regex; password ≥ 6 chars; name required on signup.
  Errors render inline in `#f87171` above the submit button.
- **Submit:** indigo-gradient full-width button (“Sign in” / “Create account”). On success sets
  `loggedIn`, stores `{ name, email }`, closes modal. Login derives a display name from the
  email local-part when no name is on file.
- **Mode switch link:** under the button — “Don't have an account? **Sign up**” / “Already have an
  account? **Log in**”.
- **Logged-in state:** header avatar + settings panel show the user's initial and name/email
  from stored `user`. **Sign out** clears `user` and `loggedIn`.
- **Production note:** wire submit to the real auth endpoint; keep the validation and the
  derived-initial/name display. `user` shape: `{ name: string, email: string }`.

## Files
- `Level Up.dc.html` — the design reference (open in a browser to view; toggle the
  Dictionary tab, and click any course card to see the course / quiz / interview / player screens).
- `support.js` — runtime needed only to render the reference file. Not for production.

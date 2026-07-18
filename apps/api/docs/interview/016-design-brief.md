# 016 - Design Brief (for Claude Design)

## Purpose

A visual brief to mock up the **AI Interview Coach** screens in Claude Design **before** coding.
Feed this to Claude Design together with the existing design system so the mockup is on-brand.

> **Reuse the existing design system — do not invent a new look.** The whole app is built from
> `docs/redesign/handoff/Level Up.dc.html` + its README (tokens, components). The interview screens
> must look like the rest of Level Up (same header, cards, buttons, progress bar, dark theme).

---

## Design system to reuse (from the handoff)

**Theme:** dark-first (`--bg: #090a0e`) with the two radial glows; light theme via tokens. Support
both.

**Tokens:** `--surface rgba(255,255,255,0.025)`, `--surface-hover`, `--control`, `--border`
`0.07`, `--border-2`, `--border-strong`, `--text #f3f5f9`, `--text-2 #868da0`, `--text-3 #5c6377`,
`--panel-solid #14161d`, brand `--brand #818cf8`, active `rgba(129,140,248,0.18)` / `#b9c1ff`.

**Type:** Space Grotesk (headings/display, 600), Manrope (body), JetBrains Mono (labels, counts,
badges, eyebrows).

**Components / patterns already in the app (reuse, don't recreate):**
- **Header** (sticky, blurred): logo · centered ⌘K search · bell + account cluster.
- **Card:** radius 16, padding 24, `--surface`, hairline border; optional accent glow blob.
- **Page title row:** 48×48 accent icon tile (`color-mix` of a per-page accent) + H1
  `clamp(24px,3.4vw,34px)` + subtitle.
- **Segmented control** (`.segmented`) for tab-like choices; **chips** for toggles.
- **ProgressBar:** 6px track `--border`, fill = page accent, `transition: width .3s`.
- **Search box:** 44px, radius 12, left icon.
- **Modal:** overlay `rgba(4,5,8,.68)` + blur, card radius 20, `--panel-solid`, z-index ~130.
- **Skeletons:** shimmer (`.skeleton`) for all loading states.
- **Icons:** `lucide-react` line icons.

**Per-course accent** (use for the chosen course throughout an interview):
Backend `#fbbf24` · Frontend `#c084fc` · DevOps `#38bdf8` · QA `#fb7185` · Node.js `#4ade80` ·
Go `#22d3ee` · React `#818cf8` · Next.js `#e2e8f0`.

**Layout:** centered content column (~900px, like the profile screen), page padding
`clamp(16px,4vw,28px)`. Responsive; verify ~390px. Hash route `#interview`.

---

## Entry point

Add an **Interview** entry reachable from home / the header (and later a home card). Guests see a
sign-in prompt (same pattern as profile/notifications).

---

## Screens

### 1 — Interview Setup  (`#interview`)
Card-based setup, page title row ("AI Interview", target icon).
- **Course** — pick from the 8 courses (reuse course tiles/accents).
- **Difficulty** — segmented control: Easy / Medium / Hard.
- **Number of questions** — segmented or stepper (e.g. 3 / 5 / 10).
- Primary **Start Interview** button (indigo gradient, like auth submit); secondary Cancel.
- Empty/validation: Start disabled until course + difficulty chosen.

### 2 — Interview  (`#interview/:id`)
Focused, one question at a time.
- Top: **ProgressBar** (course accent) + `Q n / N` mono chip + course name.
- **Question** card (Space Grotesk, ~20–24px), module label (mono, uppercase, `--text-3`).
- **Answer editor** — large textarea, `--control` bg, `--border-2`, radius 12, autofocus,
  char/auto-save hint ("Saved").
- Footer: **Skip** (ghost) · **Submit / Next** (primary). On last question: **Finish interview**.
- Auto-save indicator; "warn before leaving" is behavior, not visual.

### 3 — Evaluating
Loading screen while the AI evaluates (server-side).
- Centered: animated indicator (reuse shimmer/spinner style), friendly status
  ("Evaluating your answers…"), maybe per-answer tick list.
- No actions; prevent double-submit.

### 4 — Final Report
The payoff screen. Sections (stacked cards, like the profile page):
- **Overall score** hero — big number /10 + one-line verdict + a radial/label per dimension
  (Technical / English / Communication) using mono labels + small bars.
- **Strengths** and **Improvements** — two lists (green `#4ade80` / rose `#fb7185` accents).
- **Missing concepts** — chips.
- **English feedback** — grammar fixes (original → corrected) + vocabulary swaps
  (weak → stronger), styled like the dictionary rows.
- **Recommendations** — "Next lesson" + "Next interview" cards with course accent + CTA.
- Actions: **Review Dictionary** · **Start Next Interview**.

### 5 — Personalized Dictionary (secondary)
A per-user section on the existing Dictionary screen: cards for Vocabulary / Grammar Fixes /
Interview Phrases / Words to Use More Often, each with priority + repetition count. Match the
current dictionary visual language.

### 6 — Recommendations (secondary)
A "what's next" list (ranked Critical / Recommended / Optional) — reuse card + accent + chips.

---

## Global states & a11y

- Every screen: **Loading / Success / Empty / Error** (the app already does this).
- Error (e.g. AI failed): friendly message + Retry (ghost button); never a dead end.
- Keyboard navigation, visible focus, screen-reader labels, responsive at ~390px.

---

## Data → UI mapping (so nothing's invented)

- Scores/strengths/weaknesses/missingConcepts/grammarCorrections/vocabularySuggestions come from the
  AI response schema (`006`). Report summaries from `FinalReport` (`010`).
- Recommendations from `009`. Dictionary entries from `008`.

## Out of scope for this mockup

Voice / live-coding / video / avatar interviewer (future — `015`). Design text interviews only.

---

## Handoff loop

1. Build these screens in Claude Design, reusing the tokens/components above.
2. Say "прокачай изменения" — the design is pulled into `docs/redesign/` and implemented
   (Go backend per `013` + JSX screens per `011`). See the sync workflow.

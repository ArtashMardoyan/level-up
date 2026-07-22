# 016 - Design Reference (delivered)

## Purpose

Reference for the **AI Interview Coach** screens **as delivered** in Claude Design
(`AI Interview Coach.dc.html`, project "Level up Node.js review"). Implement the JSX screens (`011`)
to match this. Pull it via the DesignSync flow when it changes.

> **Reuse the existing design system — do not invent a new look.** The whole app is built from
> `docs/redesign/handoff/Level Up.dc.html` + its README (tokens, components). The interview screens
> use the same header, cards, buttons, progress bar, and dark theme.

> **Delivered flow:** Setup (+ start-confirm modal) → Interview **chat** → Results → Review →
> History. Scores are **0–100**; the Results breakdown is **Correctness / Depth / Communication /
> Structure**. No personalized-Dictionary screen (English coaching is post-MVP, `008`).

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

### 1 — Setup  (`#interview`)
Eyebrow "New session" + H1 "Set up your mock interview".
- **1 · Choose a course** — grid of the 8 course tiles (per-course accent/icon + question count).
- **2 · Difficulty** — segmented control: Easy / Medium / Hard.
- **3 · Number of questions** — segmented (3 / 5 / 10).
- **4 · Language** — segmented control: **English / Русский**. ⚠️ **To add in Claude Design** — the
  current `.dc.html` has no language control. Reuse the same `.aic-seg` segmented style as difficulty.
  The interview runs bilingually (questions, model answer, AI feedback follow this choice — `004`).
- Primary **Start interview** button (indigo gradient) → opens the confirm modal.

### 1b — Start-confirm modal
Overlay + blur, `--panel-solid` card. Course icon, "Ready to start?", a summary ("N {difficulty}
questions on {course}"), a 3-item expectations list (no timer · feedback + model answer after each ·
overall score at the end). Buttons: **Cancel** · **Begin interview**.

### 2 — Interview chat  (`#interview/:id`)
Conversational, one question at a time.
- Top: course icon + `{Course} interview`, `{Difficulty} · Question n of N`, `progress %`, and a
  course-accent **ProgressBar**.
- **Chat transcript** — AI question bubbles (bot avatar) + user answer bubbles; the AI **feedback**
  bubble appears after each answer. A **"thinking"** three-dot indicator while evaluating.
- **Composer** (sticky bottom, `--panel-solid`): textarea + **Sample answer** (ghost) + **Submit**
  (primary). On finish: an **"Interview complete 🎉"** card with **Review answers** / **See results**.

### 3 — Results  (`#interview/:id/results`)
The payoff. Stacked cards:
- **Overall score** hero — radial ring, big number **/100**, verdict label, course · difficulty.
- **Score breakdown** — four labelled bars: **Correctness / Depth / Communication / Structure**.
- **What went well** (green `#4ade80`) and **Focus areas** (rose `#fb7185`) lists.
- **Recommended next steps** — numbered list.
- Actions: **Review all answers** · **New interview**.

### 4 — Review  (`#interview/:id/review`)
Per-question cards: `Q n`, the question, a **per-question score chip** (color by band), **Your
answer**, **Strengths** / **To improve** (two columns), and the **Model answer** (the question's
stored answer).

### 5 — History  (`#interview/history`)
List of past interviews (course icon, title, date, meta, per-row **score**, chevron → Results).
Empty state: "No interviews yet" + CTA.

---

## Global states & a11y

- Every screen: **Loading / Success / Empty / Error** (the app already does this).
- Error (e.g. AI failed): friendly message + Retry (ghost button); never a dead end.
- Keyboard navigation, visible focus, screen-reader labels, responsive at ~390px.

---

## Data → UI mapping (so nothing's invented)

- Per-answer chat feedback + per-question score + strengths/weaknesses come from the AI response
  schema (`006`). The **Model answer** (Review) and **Sample answer** (composer) are the question's
  stored `answer` from the bank (`004`).
- Results overall score /100, the four rubric averages, verdict, and recommendations come from
  `FinalReport` (`010`) / `009`. History rows from the sessions list (`013`).

## Out of scope

Voice / live-coding / video / avatar interviewer (future — `015`). English-coaching / personalized
Dictionary screen (post-MVP — `008`). Text interviews only.

---

## Handoff loop

1. The design lives in Claude Design (`AI Interview Coach.dc.html`), reusing the tokens/components
   above.
2. Say "прокачай изменения" — the design is pulled via DesignSync and implemented (Go backend per
   `013` + JSX screens per `011`). See the sync workflow.

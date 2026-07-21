---
status: "Review"
owner: "Backend"
last_updated: "2026-07-21"
visibility: "internal"
---

# Planning doc — engagement features (streak, activity screen, new_questions, daily)

Cross-repo: `level-up-backend` (Go/Gin) + `level-up` (React).
Builds on the notifications module (`docs/product/notifications/README.md`). Ship in phases; each phase is
independently deployable and reviewable.

## Context

We have a per-user notifications feed with a seen/read model, wired to the bell and the profile.
Three notification types are **reserved but not generated** (`streak`, `daily`, `new_questions`),
and streak is still a hard-coded `DEMO_STREAK = 5` placeholder in the UI. This doc plans the four
features that make the feed (and the profile) fully real, plus a dedicated activity screen.

Recommended order (low risk → high infra): **Phase 1 Activity screen → Phase 2 Streak →
Phase 3 new_questions → Phase 4 daily**.

---

## Phase 1 — "View all activity" screen (frontend only) — ✅ DONE (2026-07-17)

**Goal:** the bell's "View all activity" and the profile's Recent-activity open a full feed screen.

- **Route:** hash `#activity` (same pattern as `#profile`). `App.jsx` branches
  `courseId === 'activity'` → `<ActivityPage>`. Thread nav from `NotificationBell` ("View all
  activity" → `navigate('activity')`) and optionally a "See all" on the profile block.
- **`ActivityPage.jsx`:** full-width `<main>` (~720px), back-home, title, the full notifications
  list with **pagination** ("Load more" using `notificationsList(page, limit)` + `meta.total`).
  Rows reuse the shared `notificationMeta` + `relativeTime` (`src/data/notifications.js`); a row
  click marks read; a "Mark all read" action. On open → `mark-all-seen` (clears the badge).
- **API:** already exists — no backend change. Auth-gated; guests get a sign-in prompt.
- **Docs/i18n:** add activity-screen strings (en+ru); update `status.md` + handoff README.

Effort: small, frontend-only, no migration.

---

## Phase 2 — Real streak (backend + frontend) — ✅ DONE (2026-07-17)

> Shipped simpler than drafted below: timezone is **not** stored on `users` — the client sends
> its IANA timezone with the review upsert (`UpsertProgressDTO.timezone`) and the backend computes
> the day boundary from that (fallback UTC), embedding `time/tzdata`. Streak lives on `users`
> (`currentStreak`/`longestStreak`/`lastActiveOn`, migration `00011`), updated in
> `user.Service.RecordActivity` (called from `course.UpsertProgress` via a `StreakService`
> interface), surfaced in `/progress/summary` (`currentStreak`/`longestStreak`), and milestones
> (3/7/14/30/100) emit a `streak` notification. Frontend replaced `DEMO_STREAK` in `AccountMenu`
> + `ProfilePage`. The stored-timezone + auto-sync approach below is deferred to when Phase 4b
> (scheduled daily) actually needs a server-side timezone.


**Goal:** replace `DEMO_STREAK` everywhere with a real consecutive-day streak, and generate
`streak` notifications at milestones.

**Definition (decisions — confirm on review):**
- A **day = the user's local calendar day** (not UTC). We store instants in UTC but the streak
  boundary is computed in the user's timezone, so a late-night review counts as *their* today.
- A day **counts** when the user marks ≥1 question reviewed (`UpsertProgress` reviewed
  transition — the existing hook we use for `review_milestone`).
- **currentStreak** = consecutive counting days ending today or yesterday (a gap resets to 1 on
  the next active day). **longestStreak** tracked too.

**Timezone plumbing:** add `timezone TEXT NOT NULL DEFAULT 'UTC'` (IANA, e.g. `Asia/Yerevan`) to
`users`. The frontend auto-syncs it: on app load / login, if
`Intl.DateTimeFormat().resolvedOptions().timeZone` differs from `user.timezone`, it PATCHes
`/users { timezone }` (extend `UpdateDTO`; invisible to the user). Backend embeds the tz database
via a blank `import _ "time/tzdata"` so `time.LoadLocation` works in the scratch/Alpine image.

**Storage (O(1), no scan):** add to `users`: `currentStreak int`, `longestStreak int`,
`lastActiveOn date NULL` (migration `00011`, alongside `timezone`). Update rule in the review
hook: compute `today := time.Now().In(loc)` where `loc` = the user's timezone (fallback UTC);
compare its date with `lastActiveOn` (stored as the user-local date) — same day → no-op; the
user-local yesterday → `currentStreak++`; older/null → `currentStreak = 1`; then
`lastActiveOn = today`, bump `longestStreak`. Best-effort, never fails the progress save.

**Surface to the client:** add `currentStreak` (+`longestStreak`) to `ProgressSummaryDTO`
(`GET /progress/summary`) — both `AccountMenu` and `ProfilePage` already fetch it. Frontend
replaces `DEMO_STREAK` in `AccountMenu.jsx` + `ProfilePage.jsx` with `summary.currentStreak`.

**Notification:** when `currentStreak` crosses a threshold (`3/7/14/30/100`), emit a `streak`
notification (params `{ days }`) via the existing `Notifier` pattern. Update `notifStreakBody`
to be param-based (`{days}`).

**Backfill:** start everyone at 0 (streaks begin fresh) — simplest and honest. (Deriving from
historic `reviewedAt` is possible but out of scope.)

Effort: medium. Migration + service hook + DTO + 2 frontend swaps. No scheduler.

---

## Phase 3 — `new_questions` generator (backend, reseed) — ✅ DONE (2026-07-17)

> `internal/seed` snapshots existing question ids before seeding (the upsert uses `DoUpdates`, so
> `RowsAffected` can't tell new from updated), counts genuinely-new questions, and if `> 0` fans
> out one `new_questions` notification (params `{count}`) to **every** user via `CreateInBatches`.
> No-op reseed → 0 new → no fan-out; fresh DB → all "new" but no users yet → no fan-out. Fires
> only when `cmd/seed` runs against a DB that gains questions (a manual content step, not
> `make deploy`). Frontend `notifNewQuestionsBody` is now `{count}`-based.


**Goal:** when a reseed adds genuinely new questions, notify every user.

- **Detect new:** `internal/seed` already upserts via `OnConflict … Create`; use `RowsAffected`
  per question to count **newly inserted** rows (0 on a no-op reseed → no spam). Aggregate the
  new count (optionally per course).
- **Fan-out:** after seeding, if `newCount > 0`, insert one `new_questions` notification per
  existing user (params `{ count }`), via a batch insert. `cmd/seed` gains access to the user +
  notification repos (constructed from `db`).
- **Frontend:** make `notifNewQuestionsBody` param-based (`{count} new questions added`).
- **Guard/log:** print how many users were notified; skip cleanly when `newCount = 0`.

Effort: medium. Touches `internal/seed` + a fan-out insert. No migration. Runs offline via
`cmd/seed`, not on every request.

---

## Phase 4 — `daily` (Today's Challenge) — 4a ✅ DONE (2026-07-17); 4b deferred

> **4a shipped:** `user.Service.RecordActivity` emits a `daily` notification on the user's first
> qualifying activity of a new local day. It reuses the streak's "new day" signal — the same-day
> path returns early, so reaching the emit branch *is* "first activity today", giving free dedupe
> (no scheduler, no extra query). Backend-only; the frontend already maps the `daily` type. **4b**
> (a scheduled morning push to all users, which would need stored per-user timezones + a cron /
> EventBridge trigger) remains deferred.


**Goal:** a daily "Today's Challenge is ready" notification.

App Runner has **no built-in scheduler**, so a true global cron is infra work. Two options:

- **4a (recommended MVP, no infra):** *lazy per-user* — the first time a user is active on a new
  UTC day (piggyback the streak hook), ensure a `daily` notification for today exists (dedupe by
  `type='daily' + DATE(createdAt)`). No scheduler; notification appears as they start using the
  app that day.
- **4b (proper, later):** a scheduled job (external cron / EventBridge → an internal endpoint, or
  a `cmd/daily` run by a scheduler) that emits the daily notification to all users each morning.

Recommend shipping **4a** now and leaving **4b** as a documented follow-up. Confirm on review.
Dedupe is essential either way so a user never gets two dailies in a day.

Effort: small (4a) once the streak/activity hook exists; large (4b, infra).

---

## Cross-cutting: time & timezone
- **Store UTC, display local.** All timestamps persist as UTC (`TIMESTAMPTZ`); the client renders
  every date in the **user's local timezone** — relative via `Intl.RelativeTimeFormat`, absolute
  via `Intl.DateTimeFormat(language)` (both default to the browser tz, which is the user's).
  No raw UTC strings are ever shown.
- **Day-boundary logic** (streak, daily dedupe) is computed in the **user's timezone** (stored
  `users.timezone`, auto-synced from the client), never in UTC. Backend embeds `time/tzdata`.

## Cross-cutting conventions

- **Backend:** goose migrations on startup; sentinel errors; `shared.OK/Error`; best-effort
  notification generators (never fail the parent op); `go test` + `golangci-lint` green; keep
  Postman + `docs/` in sync.
- **Frontend:** `npm run lint`/`build` green; tokens-only styling both themes; i18n en+ru; update
  `docs/redesign/status.md` + handoff README in the same commit.
- **Deploy:** phases with a migration (2) or reseed (3) need a backend redeploy; frontend pushes
  auto-deploy to Pages. **Never commit/push without explicit instruction.**

## TODO / remaining (deferred)

Phases 1, 2, 3 and 4a are **shipped**. Everything below is intentionally deferred — pick up here
in a future pass.

- [ ] **4b — scheduled daily push.** Emit `daily` to all users each local morning (instead of
      lazily on first activity). Needs a scheduler App Runner doesn't provide: EventBridge → an
      internal auth'd endpoint, or a `cmd/daily` binary run by cron. Must dedupe by user-local day
      so it never doubles up with the 4a lazy path.
- [ ] **Persist per-user timezone** (`users.timezone`, IANA) — prerequisite for 4b (a cron has no
      request to read tz from). Auto-sync from the client on load/login. Today tz is only sent
      per-request on the review upsert (enough for streak/4a, not for a scheduled job). Sketch in
      the Phase 2 note above.
- [ ] **Streak backfill** — everyone currently starts at 0. Optional: derive an initial
      `currentStreak`/`lastActiveOn` from historic `user_question_progress.reviewedAt`.
- [ ] **`new_questions` polish** — it only fires when `cmd/seed` runs against a DB that gains
      questions (a manual content step, not `make deploy`). Optional: group by course (params
      `{course, count}`), or limit fan-out to recently-active users instead of everyone.
- [ ] **`daily` content link** — the notification is generic ("Today's Challenge is ready"); wire
      it to the real daily-challenge/dictionary content when that exists.
- [ ] **Client freshness** — badge/unseen count is fetched on mount + on open; consider a light
      poll or refetch-after-review so a new streak/milestone badge appears without a reload.

## Verification per phase

- **P1:** open `#activity`, paginate, mark read, badge clears on open (dark+light, ~390px).
- **P2:** review on consecutive UTC days → `currentStreak` grows in profile/account; milestone
  emits a `streak` notification; unit test the day-transition logic (same/next/gap day).
- **P3:** seed with a new question locally → all users get one `new_questions`; no-op reseed →
  none. E2E against local Postgres.
- **P4a:** first activity on a new day creates exactly one `daily`; second activity same day
  creates none.

## Open decisions to confirm
1. Store UTC, display in the **user's timezone**; streak/daily day-boundaries use the user's tz
   (stored `users.timezone`, auto-synced from the client). **Confirmed by user.**
2. Streak counting action = **reviewed a question** (vs any progress/app-open). Default: reviewed.
3. Streak milestone thresholds: **3/7/14/30/100**.
4. Daily = **4a lazy MVP** now, 4b scheduler later. Default: 4a. Daily dedupe key uses the
   user-local day.
5. Backfill streak = **0 for everyone**. Default: yes.
6. Daily dedupe by user-local day (from #1).

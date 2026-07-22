---
status: "Review"
owner: "Principal Engineer (review)"
last_updated: "2026-07-22"
visibility: "internal"
---

# Level Up — Foundation Architecture Review

A single-system review of the architecture-first foundation, from the standpoint of "tomorrow we
start building real features and head toward first production deployment."

## Verdict (read this first)

**Yes — it is time to stop designing and start building.** The foundation is coherent, well-reasoned,
and sufficient to begin implementation. The dominant risk now is **the opposite of under-design**:
one more "framework before the framework" (Agent Model, Workflow Model, …) would be architecture for
its own sake. Resist it until a real feature proves the need.

Before/at the moment implementation starts, resolve **3 Critical items** — all of them *decisions or
persistence*, not new design (hours, not weeks). Everything else is Important-soon or Future.

**Reviewed as one system:** ADR-0006 (repo/platform), the Documentation Migration Map, ADR-0007
(contracts), ADR-0008 (AI workspace), the Harness Framework, and the P1 `.ai/` pilot
(`level-up-ai` + per-repo routers). Current reality: backend deploys (App Runner + RDS), frontend
deploys (Pages); frontend is still JS (no TS/Tailwind/tests).

---

## Critical — resolve before/at the start of implementation

### C1 — Decide the build surface: current repos *now* vs monorepo-first
**Scenario.** Tomorrow you open an editor to add a feature. If it's unclear whether work happens in
today's `level-up` / `level-up-backend` or in a future `level-up` monorepo, you either stall
or start in a place you'll have to migrate.
**Recommendation.** **Build in the current two repos now.** They already work, deploy, and carry good
conventions. The monorepo is a *convergence at privatization* (ADR-0006), **not** a prerequisite for
feature work. Do not block a single feature on the monorepo migration.
**Trade-off.** You forgo monorepo DX (shared packages, one `.ai/`) for a while — acceptable, because
the alternative (migrate first) delays real value for infrastructure you can add later without rework.

### C2 — Resolve the Harness-Framework ↔ P1-harness contradiction
**Scenario.** You decide to run the `backend-api` harness on the first endpoint. The Harness Framework
§13 says a harness missing `framework_version`, `capabilities`, `evidence`, etc. is "non-conforming and
MUST NOT be run." The P1 harnesses (written before the framework) are exactly that. Your own rule now
forbids your only harnesses.
**Recommendation.** Pick one: (a) bring **one** harness (`backend-api`) up to the framework interface
and use it as the reference implementation, or (b) explicitly label the P1 harnesses "pre-framework /
legacy, not governed" until updated. Do **not** leave the contradiction implicit.
**Trade-off.** (a) is a few hours and gives you a proven template; (b) is free but leaves you with no
runnable governed harness. Prefer (a).

### C3 — Persist volatile deliverables as durable files
**Scenario.** The revised **root monorepo `CLAUDE.md`** exists only inside `DISCUSSION.md`, which is
**overwritten every turn** — its content has already been replaced by later answers. When you create
the monorepo you'll find the entry point isn't saved anywhere.
**Recommendation.** Save the root `CLAUDE.md` as a real file (e.g. `CLAUDE.md.draft` at the workspace
root or in the monorepo when created). Treat `DISCUSSION.md` as a scratch view, never as storage. The
ADRs and specs are already durable files — good; this closes the one gap.
**Trade-off.** None. This is pure hygiene.

---

## Important — fix soon (not blocking the first feature)

### I1 — ADR numbering vs file names are inconsistent
ADR-0007 and ADR-0008 reference **"ADR-0006"** for the repository architecture, but that document is
still the file `ADR-0001-repository-and-platform-architecture.md` with an internal "ADR-0001" header.
**Scenario:** a new engineer follows "see ADR-0006", finds no such file. **Fix:** either rename now, or
add a one-line note in the ADR-0001 file ("this is logically ADR-0006; renamed at monorepo creation").
Cheap; removes real confusion.

### I2 — Decide when ADR-0007 (contracts) becomes *active*, and bootstrap the spec
**Scenario:** tomorrow you add an endpoint. ADR-0007 says "start in the OpenAPI spec" — but no spec
exists. You either violate the ADR on day one or block on building the whole pipeline. **Fix:** state
that ADR-0007 activates at contract-bootstrap time; schedule a one-time spec capture of the *current*
Go API early (bootstrap exception is already allowed in ADR-0007 §P2). Until then, the existing
Postman collection remains the interim contract record.

### I3 — Frontend stack gap blocks frontend feature work *and* harness validation
Frontend is JS, no Tailwind, **no test runner**. Harness Framework §6 requires an executable
behavioral stage; on the frontend there's nothing to run. **Scenario:** a `frontend-ui` harness run
can't satisfy §6. **Fix:** before serious FE feature work, introduce a test runner (even minimal) and
plan the JS→TS + Tailwind adoption as its own tracked effort. Trade-off: TS migration is real work;
don't gate all FE features on it — introduce TS incrementally at the edges you touch.

### I4 — Make a lightweight path first-class (process must scale *down*)
**Scenario:** a solo dev fixes a typo. The full apparatus (context budget → agents → validation stages
→ bounded review loop → evidence record) is heavier than the change. If the only path is the heavy one,
people route around the process entirely. **Fix:** the framework should bless a minimal path for
trivial/low-risk tasks (e.g. static+lint validation, no review loop, no evidence file). This is a small
addition to the framework's guidance, and it's what keeps the process *used*.

### I5 — Minimal Agent + Workflow definitions are needed to actually run a review loop
The Harness Framework references agents (allow/deny) and review loops, and ADR-0008 lists Reviewer/
Security/etc., but no concrete (even minimal) agent or workflow definition exists. **Scenario:** you
try to run new-feature end-to-end and there's no Reviewer role to invoke. **Fix:** define the *minimum*
— a couple of agent roles and one workflow — when you build the first harness (C2). **Do not** write
full parallel "Agent Model"/"Workflow Model" specs yet (that's Future; see below).

### I6 — Loose docs at the workspace root hurt onboarding
`ADR-0001…`, `ADR-0007`, `ADR-0008`, `HARNESS-FRAMEWORK`, `DOCS-MIGRATION-MAP` all sit loose in the
workspace root, not in the `docs/decisions/` IA we designed. **Scenario:** a new engineer opens the
repo and sees scattered MD, not the clean structure. **Fix:** at monorepo creation, `git mv` them into
`docs/decisions/` (and the framework into `docs/standards/`) per the Migration Map. Fine to defer to
that moment.

### I7 — Don't over-invest in the `level-up-ai` subtree mechanism
The P1 cross-repo sharing (shared repo + git subtree) solves a problem the **monorepo removes**.
**Scenario:** you spend time syncing subtree for 3 checklist files across 2 repos, weeks before merging
them into one repo anyway. **Fix:** keep P1 as-is as a bridge, but **stop adding** to the subtree
machinery; new `.ai/` work should assume the monorepo end-state. Trade-off: minor single-source-of-truth
convenience now vs wasted effort on soon-to-be-obsolete plumbing.

### I8 — Secret-leak discipline before committing new code to the public repo
The public bridge means new backend/config code committed to a public repo is exposed. **Scenario:** an
`.env` or key slips into a commit. **Fix:** a secret-scan hook + `.gitignore` review as a precondition
of the first new commits (this is operational, do it when building starts, not before).

---

## Future Enhancement — intentionally wait

- **Full Agent Model & Workflow Model specifications** — parity with the Harness Framework. Wait until
  ≥2 real workflows exist and reveal the actual shape; specifying them now is guessing.
- **MCP integrations** — real value, but only once a concrete need appears (e.g. a read-only DB pack).
- **Framework-versioning tooling & the self-improvement loop** — the `framework_version` field is enough
  for now; build tooling around it only when you have multiple harnesses to migrate.
- **CI sophistication** — Turbo remote cache, per-PR ephemeral API preview envs, drift-guard automation.
  Add when the monorepo and contract pipeline exist.
- **Mobile / admin / dashboard / ai-services apps** — folders when the need is real (ADR-0006 already
  says "grow by adding a folder").

---

## What is already good enough (no changes needed)

- **The three-ADR spine (0006 / 0007 / 0008)** is internally consistent and complete for v1. The
  repeated "green is executed, not claimed" across them is *reinforcement via cross-reference*, not
  harmful duplication.
- **Documentation IA** — already mature in the backend repo and correctly *reused* (lift-and-shift),
  not reinvented. This is a genuine strength most startups lack.
- **OpenAPI contract workflow** — tool-agnostic, consumer-perspective breaking-change rule,
  expand→migrate→contract. Solid for 5+ years.
- **Polyglot decision + Go retention** — correct; the biggest risk (a NestJS rewrite) was removed.
- **Harness Framework** — thorough and coherent; its only weakness (heaviness for small tasks) is I4,
  not a redesign.

---

## Scores

### Architecture — **88 / 100**
Coherent, justified, model-agnostic, and slightly *ahead* of current team size (a good problem).
Deductions: internal numbering inconsistency (I1), the harness/framework conformance contradiction
(C2), and a mild tendency to specify before implementing. Design-complete for v1.

### Production Readiness — **55 / 100**
Nuanced: the **current apps deploy and run today** (backend App Runner + RDS via `make deploy`;
frontend Pages) — the *ability to ship exists*, which is why this isn't low. But the **target
platform** — CI gates, contract pipeline, monorepo, preview environments, rollback runbooks,
monitoring — is entirely unbuilt. You can ship; you cannot yet ship *the way the architecture
describes*.

### AI Engineering Maturity — **72 / 100**
The *design* is top-tier (~90): context engineering, model-agnostic harness interface, evidence,
promotion rules, permanent-vs-session separation. The *operational* reality (~50) pulls it down:
nothing is running yet, and the only existing harnesses don't conform to the framework (C2). Maturity
converges on the design score the moment one conforming harness runs on a real task.

---

## Top 10 remaining improvements (priority order)
1. **(C1)** Decide build surface — build in current repos now; monorepo at privatization.
2. **(C2)** Make one conforming reference harness (`backend-api`); resolve the framework contradiction.
3. **(C3)** Persist the root `CLAUDE.md` as a durable file; stop trusting `DISCUSSION.md` for storage.
4. **(I2)** Bootstrap the OpenAPI spec of the current Go API; state when ADR-0007 goes active.
5. **(I4)** Add a blessed lightweight path for trivial/low-risk tasks.
6. **(I5)** Define the *minimum* agent roles + one workflow to make the review loop runnable.
7. **(I3)** Add a frontend test runner; plan incremental JS→TS + Tailwind.
8. **(I1)** Reconcile ADR numbering vs file names.
9. **(I8)** Secret-scan hook + `.gitignore` review before first new commits.
10. **(I7)** Freeze the subtree machinery; new `.ai/` work assumes the monorepo end-state.

## Freeze as v1 architecture (stop editing these; treat as stable)
- ADR-0006 (repo & platform), ADR-0007 (contracts), ADR-0008 (`.ai/`) — the decision spine.
- The Documentation IA + Migration Map.
- The **Harness Framework interface** (freeze the *interface*; the harnesses that implement it are free
  to evolve).
- The polyglot boundary rule (Go island ↔ TS workspace; contract is the only coupling).

## Wait for real production experience (do not build now)
Full Agent/Workflow specs · MCP integrations · framework-versioning tooling · the self-improvement loop
· CI remote cache & ephemeral preview envs · mobile/admin/dashboard apps.

---

## Roadmap: "Architecture Complete" → "First Production Deployment"

**Phase 0 — Unblock (this week).** C1 (build surface), C3 (persist CLAUDE.md), I1 (numbering note).
Outcome: no ambiguity about where/how work starts.

**Phase 1 — Prove the harness on one real feature.** Do C2 + I4 + I5 by implementing **one** real
backend feature *through* a conforming `backend-api` harness with a minimal Reviewer role and a
lightweight path available. Outcome: the AI process is validated against reality, not theory. This is
the single most important step — it tells you if the framework helps or hinders.

**Phase 2 — Contract bootstrap (I2).** When that feature touches the API, capture the current API as an
OpenAPI spec and stand up the simplest generation + drift check. Outcome: ADR-0007 becomes real on a
small surface, not big-bang.

**Phase 3 — Frontend readiness (I3).** Add a test runner; adopt TS/Tailwind incrementally on the parts
you touch for the next FE feature. Outcome: FE feature work and FE harness validation become possible.

**Phase 4 — Ship it the architected way.** Add the minimal CI gate (lint/test/build + the drift check),
branch protection, and one smoke test to the existing deploy path (App Runner / Pages already work).
Outcome: **first production deployment under the new process** — without waiting for the monorepo.

**Phase 5 — Converge (at privatization).** Create the private monorepo, `git mv` docs into
`docs/decisions/`, absorb both apps (history preserved), mount `.ai/` at root. Outcome: the target
structure, reached only after real features and a real deployment have de-risked it.

**Guiding principle:** every phase ships something real; the monorepo and the heavier AI apparatus are
*earned* by usage, not front-loaded.

---

*Final call: the architecture phase is done. Build Phase 1. Let one real feature and one real
deployment tell you what to formalize next — not another design document.*

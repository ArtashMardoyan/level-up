# Level Up — AI Development Platform

**A technical design document for `.ai/`**

Status: Draft / Design-only — nothing is implemented yet
Author: AI Platform design pass
Scope: Workspace root (`level-up/` frontend + `level-up-backend/` backend + docs)

---

## 0. Context & goals

The Level Up workspace is a monorepo-style root containing two deployable apps and their docs:

| Area | Stack | Notes |
|------|-------|-------|
| `level-up/` | Vite + React + TypeScript, ESLint | AI Interview Coach UI, SSE chat streaming |
| `level-up-backend/` | Go + Gin, RDS/Postgres, migrations | App Runner (us-east-2/vyb-dev), MkDocs docs, Postman |
| `docs` | Per-app `docs/` + MkDocs Material | Product/engineering/decisions/standards |
| `CLAUDE.md` | One at root-ish + one per app | Existing agent instructions |

**The problem this design solves.** Today, engineering knowledge for *how work gets done* (how we add a feature, how we review, how we ship a migration) lives in people's heads and in scattered `CLAUDE.md` prose. Both humans and Claude Code re-derive process every time. That produces inconsistent PRs, forgotten checklist steps, and context that has to be rebuilt on each task.

**The goal.** Introduce a single, version-controlled `.ai/` workspace that encodes *repeatable engineering process* as reusable, composable assets — so that a human or Claude Code executing the same kind of task follows the same path, reads the same context, and produces the same shape of output.

### Design principles

1. **Process as data, not prose.** Workflows, harnesses, and checklists are structured files an agent can load and follow deterministically — not paragraphs it has to interpret.
2. **Composition over duplication.** Small building blocks (agents, prompts, checklists) are referenced by larger ones (harnesses, workflows). Write a rule once.
3. **Context is engineered, not dumped.** Each task declares the *minimum* set of files it needs. We never load the whole repo "just in case."
4. **Human-readable, agent-executable.** Every file is useful to a new engineer reading it and to Claude Code executing it.
5. **CLAUDE.md stays the entry point.** `.ai/` doesn't replace `CLAUDE.md` — the root `CLAUDE.md` becomes a thin router that points into `.ai/`.
6. **Start small, grow by evidence.** Ship the 4–5 workflows we actually use weekly. Don't build 20 harnesses nobody runs.

---

## 1. `.ai/` directory architecture

```
.ai/
├── README.md              # Index + "how to use this workspace" (human + agent onboarding)
├── config.yml             # Workspace map: apps, paths, commands, conventions
│
├── harnesses/             # Reusable execution scaffolds for a *type of task*
├── workflows/             # Multi-step, multi-agent orchestrations (compose harnesses)
├── agents/                # Role definitions (persona, scope, boundaries)
├── prompts/               # Parameterized prompt templates
├── reviews/               # Review runbooks + per-review reports/outputs
├── checklists/            # Atomic pass/fail lists referenced by harnesses & reviews
├── templates/             # Boilerplate for produced artifacts (PR, ADR, migration…)
└── knowledge/             # Durable, distilled context ("context packs")
```

### Folder purposes

**`harnesses/` — "how to do one kind of task, safely."**
A harness is a self-contained scaffold for a *category* of work (feature, bug fix, migration…). It defines objective, inputs, required context, ordered steps, validation, and expected outputs. A harness is the unit an agent "wears" to execute a single task well. It is *task-typed*, not process-wide.

**`workflows/` — "how a change moves end-to-end."**
A workflow orchestrates *multiple* agents and harnesses across a change's lifecycle (plan → build → review → ship), including review loops and hand-offs. Where a harness is one runway, a workflow is the whole flight plan.

**`agents/` — "who does what, and what they must not touch."**
Role definitions. Each agent has responsibilities, an allow-list of files to read, a deny-list of files it must never modify, and collaboration rules. These map onto Claude Code subagents.

**`prompts/` — "reusable, parameterized instructions."**
Copy-paste-ready templates with `{{placeholders}}`. These are what a human pastes into Claude Code, or what a workflow step references, to invoke a harness with concrete inputs.

**`reviews/` — "how we review + the record of reviews."**
Runbooks for each review type (PR review, security review, arch review) plus an output location for review reports so decisions are auditable.

**`checklists/` — "atomic, reusable pass/fail gates."**
Small lists (naming, security, testing, a11y…). They are the leaf nodes referenced by harnesses and review runbooks. One source of truth per concern.

**`templates/` — "boilerplate for what we produce."**
Skeletons for output artifacts: PR description, ADR, migration file, test file, RFC. Keeps deliverables consistent.

**`knowledge/` — "distilled, durable context packs."**
Curated summaries an agent loads instead of re-reading raw code: backend architecture pack, frontend architecture pack, domain glossary, deploy topology, coding conventions. This is the context-engineering layer — the antidote to loading the whole repo.

> **Why these eight and not more?** Every folder answers a distinct question (*how / when / who / say-what / gate-with-what / produce-what / grounded-in-what*). The original proposal's ideas are all preserved; `reviews` absorbs review outputs, and `knowledge` is added because context engineering is the single biggest lever on agent quality.

### `config.yml` — the workspace map (the one file everything else reads)

A small machine-readable map so agents don't hardcode paths or guess commands:

```yaml
apps:
  frontend:
    path: level-up
    stack: [vite, react, typescript]
    install: npm ci
    dev: npm run dev
    lint: npm run lint
    test: npm run test
    build: npm run build
  backend:
    path: level-up-backend
    stack: [go, gin, postgres]
    test: go test ./...
    lint: go vet ./... && golangci-lint run
    build: make build
    migrate: make migrate-up
    docs: mkdocs build
conventions:
  frontend: level-up/CLAUDE.md
  backend: level-up-backend/CLAUDE.md
deploy:
  backend: { platform: app-runner, region: us-east-2, env: vyb-dev }
```

Every harness/workflow references `config.yml` keys (`{{apps.backend.test}}`) rather than literal commands — change a command once, everywhere updates.

---

## 2. Harnesses

**File shape.** Every harness is one Markdown file with YAML front-matter and six fixed sections. Uniform shape = an agent can parse any harness the same way.

```markdown
---
id: feature-development
title: Feature Development
applies_to: [frontend, backend]
agents: [planner, architect, backend, frontend, testing, reviewer]
checklists: [naming, testing, security, documentation]
---
## Objective
## Inputs
## Required Context
## Execution Steps
## Validation
## Expected Outputs
```

Below, each harness is specified against the real Level Up stack.

### 2.1 `feature-development`
- **Objective:** Ship a vertical slice of new user-facing capability across backend and/or frontend.
- **Inputs:** Feature brief / ticket, acceptance criteria, target app(s), affected domain area.
- **Required context:** `knowledge/domain-glossary`, relevant architecture pack, the app's `CLAUDE.md`, existing sibling module for pattern-matching.
- **Execution steps:** (1) Planner decomposes into tasks. (2) Architect confirms boundaries/contracts. (3) Backend implements handler→service→repo + migration if needed. (4) Frontend implements UI + API client + state. (5) Testing adds unit/integration tests. (6) Reviewer runs PR checklist. (7) Documentation updates docs if API/behavior changed.
- **Validation:** `{{apps.*.lint}}` + `{{apps.*.test}}` green; acceptance criteria met; checklists `naming`, `testing`, `security`, `documentation` pass.
- **Expected outputs:** Working slice, tests, PR from `templates/pr.md`, doc updates, updated Postman/API contract if backend.

### 2.2 `bug-fix`
- **Objective:** Resolve a defect with a regression test proving it stays fixed.
- **Inputs:** Repro steps, expected vs actual, logs/stack trace, severity.
- **Required context:** The failing module + its tests; relevant architecture pack.
- **Execution steps:** (1) Reproduce. (2) Write a failing test that captures the bug. (3) Locate root cause (not just symptom). (4) Minimal fix. (5) Confirm test passes + no regressions. (6) Reviewer verifies root-cause, not band-aid.
- **Validation:** New test fails before / passes after; full suite green; no scope creep.
- **Expected outputs:** Fix, regression test, short root-cause note in PR.

### 2.3 `refactoring`
- **Objective:** Improve internal structure with **zero behavior change**.
- **Inputs:** Target module, smell/motivation, safety net (existing tests).
- **Required context:** Module + all its callers; architecture pack; `checklists/naming`.
- **Execution steps:** (1) Establish/confirm test coverage as a safety net. (2) Make the change in small commits. (3) Keep public contracts identical. (4) Run tests after each step. (5) Reviewer confirms no behavioral diff.
- **Validation:** Test suite identical pass set before/after; no API/signature drift; diff is structure-only.
- **Expected outputs:** Refactored code, unchanged tests still green, note on what improved.

### 2.4 `documentation`
- **Objective:** Create or update docs so they match reality.
- **Inputs:** What changed, audience (dev/product), target doc location.
- **Required context:** MkDocs structure, `documentation-system` conventions, the code being documented.
- **Execution steps:** (1) Identify affected docs. (2) Update prose + code samples. (3) Verify samples compile/run. (4) `mkdocs build` clean (no broken links). (5) Reviewer checks accuracy against code.
- **Validation:** `mkdocs build` succeeds; samples valid; `checklists/documentation` passes.
- **Expected outputs:** Updated Markdown, passing MkDocs build.

### 2.5 `code-review`
- **Objective:** Assess a diff for correctness, quality, security, and standards before merge.
- **Inputs:** Diff/PR, related ticket, target branch.
- **Required context:** Changed files + their tests; relevant checklists.
- **Execution steps:** (1) Understand intent. (2) Run all relevant `checklists/*`. (3) Classify findings by severity. (4) Verify each finding (no false positives). (5) Emit report to `reviews/`.
- **Validation:** Every finding has a concrete failure scenario; checklist coverage recorded.
- **Expected outputs:** Ranked findings report from `templates/review-report.md`.

### 2.6 `backend-api`
- **Objective:** Add/modify a Gin endpoint following the handler→service→repository pattern.
- **Inputs:** Endpoint spec (method, path, request/response), auth requirements.
- **Required context:** `knowledge/backend-architecture`, an existing sibling endpoint, `level-up-backend/CLAUDE.md`, migrations dir if schema changes.
- **Execution steps:** (1) Define request/response DTOs. (2) Handler (validation, auth, error mapping). (3) Service (business logic). (4) Repository (DB access, parameterized). (5) Migration if schema changes. (6) Wire route. (7) Tests. (8) Update Postman + MkDocs API docs.
- **Validation:** `go test ./...` + `go vet`; auth enforced; SQL parameterized (`checklists/security`); consistent error envelope.
- **Expected outputs:** Endpoint, tests, migration, updated Postman collection + API docs.

### 2.7 `frontend-ui`
- **Objective:** Build/modify a React component or view matching the design system.
- **Inputs:** Design reference (Claude Design/DesignSync), component spec, API dependencies.
- **Required context:** `knowledge/frontend-architecture`, existing sibling component, `level-up/CLAUDE.md`, design tokens.
- **Execution steps:** (1) Confirm design + tokens. (2) Build component (typed props, states: loading/error/empty). (3) Wire API client + state. (4) Handle SSE/streaming if chat-related. (5) Accessibility pass. (6) Tests. (7) Verify via DOM (per QA preference — no screenshots unless asked).
- **Validation:** `npm run lint` + tests; `checklists/accessibility`; responsive light/dark; DOM-verified behavior.
- **Expected outputs:** Component, tests, wired data flow.

### 2.8 `migration`
- **Objective:** Evolve the Postgres schema safely with forward + rollback paths.
- **Inputs:** Schema change intent, data-migration needs, backfill strategy.
- **Required context:** `migrations/` history, affected repository code, deploy topology (`config.yml`).
- **Execution steps:** (1) Write `up` + `down` migrations. (2) Ensure backward-compat with running code (expand→contract for breaking changes). (3) Update repository/queries. (4) Test on a scratch DB. (5) Plan rollout order (migrate before or after deploy). (6) Reviewer checks reversibility + lock impact.
- **Validation:** `make migrate-up` and `migrate-down` both clean on scratch DB; no long locks on hot tables; app boots on new schema.
- **Expected outputs:** Paired migration files, updated repo code, rollout note in PR.

### 2.9 `release`
- **Objective:** Ship to App Runner (backend) / deploy frontend, safely and observably.
- **Inputs:** Release scope, changelog, migration presence, rollback plan.
- **Required context:** `config.yml` deploy block, migration status, prior release notes.
- **Execution steps:** (1) Confirm main green (lint+test+build both apps). (2) Order migrations vs deploy. (3) Tag/changelog from `templates/release-notes.md`. (4) Deploy. (5) Smoke-test key paths (auth, chat SSE). (6) Watch metrics/logs. (7) Rollback if smoke fails.
- **Validation:** CI green; smoke tests pass post-deploy; SSE streaming verified live; rollback rehearsed.
- **Expected outputs:** Deployed release, changelog, release record in `reviews/` (or `knowledge/releases`).

> **Hotfix** is intentionally *not* a separate harness — it's the `bug-fix` harness run through the `hotfix` **workflow** (expedited path, review loop preserved). Harnesses = *what*; workflows = *how urgently and in what order*.

---

## 3. Agents

**File shape.** One Markdown file per agent, mappable to a Claude Code subagent definition:

```markdown
---
id: backend
model: opus | sonnet
tools: [read, edit, bash, grep]        # least-privilege
---
## Responsibilities
## Reads (allow-list)
## Never Modifies (deny-list)
## Collaborates With
```

The **deny-list is the load-bearing part** — it's what makes multi-agent work safe.

| Agent | Responsibilities | Reads | Never modifies | Collaborates with |
|-------|------------------|-------|----------------|-------------------|
| **Planner** | Decompose a request into ordered, right-sized tasks; pick the harness + workflow; identify unknowns. | Ticket, `knowledge/*`, `config.yml`, both `CLAUDE.md`. | **Nothing** (read-only; produces a plan only). | Hands plan to Architect; sequences all others. |
| **Architect** | Own module boundaries, contracts, data flow; approve cross-cutting changes; write ADRs. | Architecture packs, interfaces/DTOs, migration history, `docs/decisions`. | Application/business logic, tests. | Advises Backend/Frontend; escalates from Planner; writes to `templates/adr`. |
| **Backend** | Implement Go/Gin handler→service→repo, migrations, backend tests. | `level-up-backend/**`, backend pack, backend `CLAUDE.md`. | `level-up/**` (frontend), infra/deploy config, other app's docs. | Consumes Architect contracts; pairs with Testing; feeds Reviewer. |
| **Frontend** | Implement React/TS components, API clients, state, SSE handling. | `level-up/**`, frontend pack, design tokens, frontend `CLAUDE.md`. | `level-up-backend/**`, migrations, backend docs. | Consumes API contract from Backend; pairs with Testing; feeds Reviewer. |
| **Testing** | Author unit/integration/regression tests; guard coverage; write the failing test in bug-fix. | Code under test + sibling tests, both stacks' test setup. | Production/source code (writes *tests* only, not fixes). | Pairs with Backend/Frontend; blocks Reviewer if coverage gaps. |
| **Reviewer** | Run checklists, classify + verify findings, gate merges. | The diff, changed files' tests, all `checklists/*`. | **Nothing** (advisory; opens findings, doesn't edit code). | Receives from all builders; loops back to them; writes to `reviews/`. |
| **Documentation** | Keep `docs/` + MkDocs + API docs true to code. | `docs/**`, MkDocs config, the documented code, Postman. | Source code, tests, migrations. | Triggered by Backend/Frontend/Architect after behavior/API/contract changes. |
| **Security** | Threat-model changes; check authz, input validation, secrets, SQL injection, SSE auth. | Diff, auth middleware, repo queries, config/secrets handling. | **Nothing** (advisory findings only). | Sub-reviewer under Reviewer; escalates blockers to Architect. |
| **Performance** | Spot N+1 queries, missing indexes, unbounded loops, wasteful re-renders, streaming backpressure. | Hot-path code, queries, migrations, React render paths. | **Nothing** (advisory). | Sub-reviewer under Reviewer; feeds index needs to Backend/Architect. |

**Cross-cutting rules for every agent**

- **Least privilege:** an agent's tool set and read allow-list are the minimum for its job.
- **Advisory agents never edit** (Planner, Reviewer, Security, Performance, Architect-for-code). They produce plans/findings/decisions; builders apply them. This keeps a clean separation between *deciding* and *doing*.
- **App isolation:** Backend never touches frontend and vice-versa — the deny-lists enforce the monorepo boundary.
- **One writer per file per task:** two building agents never edit the same file concurrently; the Planner sequences them.

---

## 4. Workflows

**File shape.** YAML/Markdown describing ordered stages, the agent + harness per stage, and explicit **review loops** (a gate that can send flow backward).

```markdown
---
id: new-feature
harnesses: [feature-development, backend-api, frontend-ui]
loops: [review->build]
---
## Stages
```

### 4.1 New Feature
1. **Intake** (Planner) — clarify scope, acceptance criteria; select harnesses.
2. **Design** (Architect) — contracts, boundaries; ADR if cross-cutting. → *gate: design sign-off.*
3. **Build-BE** (Backend + Testing) — `backend-api` harness.
4. **Build-FE** (Frontend + Testing) — `frontend-ui` harness, against BE contract.
5. **Review** (Reviewer + Security + Performance) — checklists. **↺ loop:** findings → back to Build until clean.
6. **Docs** (Documentation) — update docs/API if behavior changed.
7. **Merge/PR** — PR from template; ready for `release` workflow.

### 4.2 Bug Fix
1. **Reproduce** (Planner/Testing).
2. **Failing test** (Testing) — encode the bug.
3. **Root cause + fix** (Backend/Frontend) — `bug-fix` harness.
4. **Verify** — test passes, suite green.
5. **Review** (Reviewer) — confirms root cause not band-aid. **↺ loop** if symptom-only.
6. **PR** with root-cause note.

### 4.3 Refactoring
1. **Safety net** (Testing) — confirm/raise coverage first. → *gate: no green net, no refactor.*
2. **Restructure** (Backend/Frontend) — `refactoring` harness, small steps.
3. **Continuous test** — suite after each step.
4. **Review** (Reviewer) — verify zero behavior change. **↺ loop** on any contract drift.
5. **PR** — structure-only diff.

### 4.4 Migration
1. **Design** (Architect) — expand→contract strategy, rollout order.
2. **Write up/down** (Backend) — `migration` harness.
3. **Test on scratch DB** (Testing).
4. **Review** (Reviewer + Security + Performance) — reversibility, locks, injection. **↺ loop.**
5. **Sequence into release** — hand to `release` workflow with ordering note.

### 4.5 Hotfix (expedited, loops preserved)
1. **Triage** (Planner) — confirm severity justifies hotfix.
2. **Reproduce + failing test** (Testing) — abbreviated but not skipped.
3. **Minimal fix** (Backend/Frontend) — `bug-fix` harness.
4. **Fast review** (Reviewer + Security *only*) — narrowed checklist, **still a gate**. **↺ loop.**
5. **Direct release** (`release` workflow, hotfix lane) — smoke test mandatory.
6. **Back-merge** to main; post-incident note.

### 4.6 Release
1. **Pre-flight** — both apps lint+test+build green (`config.yml` commands).
2. **Migration ordering** — if present, decide migrate-before vs after deploy.
3. **Changelog** (Documentation) — `templates/release-notes.md`.
4. **Deploy** — backend → App Runner; frontend → host.
5. **Smoke** — auth + chat SSE + one core path. **↺ loop:** fail → rollback → back to Build.
6. **Observe** — metrics/logs window.
7. **Record** — release note in `reviews/`.

> **Every workflow that changes code has at least one review loop** — the arrow that can send work *backward*. That loop is the quality mechanism; without it a "workflow" is just a checklist.

---

## 5. Prompt templates

`prompts/` holds parameterized, copy-ready templates. Each names the harness/agent it invokes and declares required inputs so nothing is under-specified.

**`implement-feature.md`**
```
Act as the {{agent}} agent. Execute the `feature-development` harness.
Feature: {{brief}}
Acceptance criteria: {{criteria}}
Target app(s): {{apps}}
Load context: {{knowledge packs}} + {{sibling module}}.
Follow the New Feature workflow; stop at the review gate for my sign-off.
```

**`review-pr.md`**
```
Act as the Reviewer agent. Run the `code-review` harness on this diff: {{diff/PR}}.
Apply checklists: {{list}}. Rank findings by severity; give a concrete
failure scenario for each; no speculative nits. Output to reviews/{{name}}.md.
```

**`generate-tests.md`**
```
Act as the Testing agent. For {{module/endpoint/component}}, add {{unit|integration}}
tests covering happy path, error paths, and edge cases: {{edges}}.
Do not modify source code. Match existing test style in {{sibling test}}.
```

**`refactor.md`**
```
Act as {{agent}}. Execute the `refactoring` harness on {{target}}.
Motivation: {{smell}}. Constraint: zero behavior change; public contracts stable.
Confirm the safety-net tests before starting; run the suite after each step.
```

**`architecture-discussion.md`**
```
Act as the Architect agent. Problem: {{problem}}. Options considered: {{options}}.
Evaluate against: boundaries, coupling, data flow, migration cost, reversibility.
Recommend one and justify. If cross-cutting, draft an ADR from templates/adr.md.
```

**`api-design.md`**
```
Act as Architect + Backend. Design endpoint(s) for {{capability}}.
Produce: method+path, request/response DTOs, auth, error envelope, status codes,
and the migration (if any). Follow the `backend-api` harness conventions.
Output a contract I can hand to the Frontend agent.
```

**Template convention:** every prompt (a) names an agent, (b) names a harness/workflow, (c) lists required inputs, (d) states a stop/hand-off point. That's what makes them reusable instead of one-off.

---

## 6. Review checklists

`checklists/` are atomic pass/fail lists. Harnesses and the Reviewer reference them by id; they're the single source of truth per concern.

- **`architecture.md`** — Change respects module boundaries? New coupling justified? Contracts stable or versioned? Reversible? ADR needed and written?
- **`naming.md`** — Names reveal intent? Consistent with the app's convention (`CLAUDE.md`)? No abbreviations/misleaders? Files/dirs match pattern?
- **`performance.md`** — No N+1 queries? Indexes for new query patterns? No unbounded loops/allocations on hot paths? React: no needless re-renders, memo where warranted? SSE backpressure handled?
- **`security.md`** — AuthN/AuthZ enforced on new endpoints? Input validated + output encoded? SQL parameterized (no string-built queries)? Secrets not logged/committed? SSE endpoints authenticated? Least-privilege data access?
- **`testing.md`** — Happy + error + edge paths covered? Regression test for each bug? Tests deterministic (no time/order flakiness)? Meaningful assertions, not just "no throw"?
- **`accessibility.md`** — Semantic HTML/roles? Keyboard navigable? Focus management on dynamic/streamed content? Color contrast (light + dark)? Labels/alt text? Live-region for streaming chat?
- **`documentation.md`** — Public API/behavior changes documented? Code samples run? MkDocs builds with no broken links? Postman collection updated? Glossary/decision records touched if concepts changed?

Each item is phrased as a yes/no gate so a run produces a clear pass/fail, not a vibe.

---

## 7. How it all works together

The layers compose bottom-up; each higher layer *references* lower ones rather than duplicating them.

```
config.yml + knowledge/     →  ground truth (paths, commands, distilled context)
        ↓ referenced by
checklists/  +  templates/   →  atomic gates & output boilerplate
        ↓ referenced by
harnesses/                   →  how to do ONE task type (uses checklists + templates)
        ↓ worn by
agents/                      →  WHO executes, with read/deny boundaries
        ↓ orchestrated by
workflows/                   →  end-to-end lifecycle with review loops
        ↓ invoked via
prompts/  ←──────────────────  the human/agent entry point
        ↓ produces records in
reviews/                     →  auditable output of review & release runs
```

**A concrete trace — "add a saved-answers endpoint + UI":**
1. Human pastes `prompts/implement-feature.md` with the brief.
2. **Planner** reads `config.yml` + `knowledge/` → picks *New Feature* workflow, harnesses `backend-api` + `frontend-ui`.
3. **Architect** defines the contract (ADR from `templates/adr.md` if needed) → design gate.
4. **Backend** (+**Testing**) runs `backend-api`: handler→service→repo + migration, tests, Postman/API docs.
5. **Frontend** (+**Testing**) runs `frontend-ui` against that contract.
6. **Reviewer** runs `code-review` with **Security** + **Performance** applying `checklists/*` → **review loop** back to builders until clean; report lands in `reviews/`.
7. **Documentation** updates docs; **PR** from `templates/pr.md`.
8. Later, `release` workflow ships it, ordering the migration and smoke-testing SSE.

**`CLAUDE.md`'s new role.** The root `CLAUDE.md` becomes a thin router: "For any task, load `.ai/config.yml`, pick the workflow in `.ai/workflows/`, wear the agent(s) in `.ai/agents/`, follow the harness in `.ai/harnesses/`." The per-app `CLAUDE.md` files stay as the *conventions* source that `knowledge/` packs distill and agents load. No duplication — `.ai/` is process, `CLAUDE.md` is convention.

**Why this is maintainable.** A rule lives in exactly one place: a command in `config.yml`, a gate in a checklist, a boundary in an agent file. Changing "how we review security" means editing `checklists/security.md` once — every harness, workflow, and prompt that references it updates for free.

---

## 8. Improvements inspired by current Claude Code concepts

Adopt these incrementally — each is optional polish on the core design, not a prerequisite.

**Dynamic workflows.** Don't hardcode every path. Let the Planner *select and adapt* the workflow from signals: size of diff, apps touched, migration present, severity. A one-line CSS fix skips the Architect gate; a schema change auto-inserts the Migration workflow and pulls in Security + Performance. Encode this as a small decision table in `workflows/README.md` rather than branching prose — the workflow becomes data the Planner reads.

**Agent orchestration.** Map each `agents/*.md` onto a real Claude Code **subagent** (own model, own least-privilege tools, own context window). The Planner is the orchestrator that spawns builders and gathers Reviewer/Security/Performance in parallel, then merges findings. Parallel advisory review (Security ∥ Performance ∥ Reviewer) is both faster and keeps each reviewer's context focused. Use synchronous spawns when the Planner needs a result before the next stage, background for independent fan-out.

**Harnesses as the safety unit.** The value of a harness is the *validation* + *deny-list* pairing: an agent "wearing" `migration` literally cannot merge without `up`+`down` both green, and "wearing" `backend-api` cannot touch frontend files. Encode validation as runnable commands (from `config.yml`) so "green" is checked, not claimed. This is where correctness comes from — not the prose steps but the enforced gates.

**Context engineering (the highest-leverage investment).** `knowledge/` context packs are the difference between an agent that re-reads 200 files and one that loads a 2-page architecture summary and the *three* files it actually needs. Concretely:
- Keep packs short, current, and hand-curated (`backend-architecture`, `frontend-architecture`, `domain-glossary`, `deploy-topology`).
- Each harness's **Required Context** section is an explicit context budget — load *that*, nothing more.
- Add a lightweight "context freshness" check: packs carry a `last_verified` date; agents flag when a pack references a file/flag that no longer exists (mirrors the memory-verification discipline already in this workspace).
- Prefer *pointers* (file\:line, doc anchors) over pasted code so context stays small and self-updating.

**Two more worth stealing:**
- **Self-improving loop.** After each `code-review`, if a finding reveals a gap in a checklist, the Reviewer proposes a one-line checklist addition. The platform gets sharper from real defects instead of guesswork.
- **Skills/commands surface.** Expose the common prompts as slash-style entry points (a thin `prompts/README.md` index) so humans invoke `implement-feature` / `review-pr` without remembering the file path — the prompts *are* the reusable command surface.

---

## 9. Suggested rollout (don't build all of it at once)

| Phase | Ship | Why first |
|-------|------|-----------|
| **P1** | `config.yml`, `knowledge/` (2 packs), `checklists/` (security, testing, naming), root `CLAUDE.md` router | Ground truth + gates; immediate value, low effort |
| **P2** | Harnesses `backend-api`, `frontend-ui`, `bug-fix`; agents Backend, Frontend, Testing, Reviewer | The tasks you do weekly |
| **P3** | Workflows New Feature, Bug Fix, Release; `templates/` (pr, adr); `reviews/` | End-to-end orchestration + audit trail |
| **P4** | `migration` + Migration/Hotfix workflows; Security/Performance/Architect agents; dynamic workflow table | Higher-risk paths + optimization once the base is proven |

Build P1–P2, run them for two weeks, and let real usage tell you which of the rest you actually need. A `.ai/` that 3 workflows use every day beats a complete one nobody opens.
```

---

*End of design document. Nothing has been implemented — this is the architecture for review. On approval, P1 is the natural first build.*

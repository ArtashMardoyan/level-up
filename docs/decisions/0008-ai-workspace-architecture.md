---
status: "Proposed"
owner: "Backend Team Lead"
reviewers:
  - "Frontend"
  - "Product"
last_updated: "2026-07-22"
visibility: "internal"
---

# ADR-0008 — The AI Workspace (`.ai/`) as a First-Class Architectural Component

> **Scope.** This ADR establishes the **AI Workspace** (`.ai/`) as a permanent, first-class part of
> the Level Up platform architecture, and defines the **engineering philosophy** that governs it. It
> is deliberately **not** an implementation: it defines no directories, harness files, agent
> definitions, workflows, or prompts. Those are engineering documentation and future work. The
> decision here must remain valid for many years even as AI models, IDEs, and agent tools change.

- **Relates to:** ADR-0006 (repository & platform architecture — the polyglot monorepo), ADR-0007
  (OpenAPI contract workflow), and the accepted **Documentation Migration Map** (which defines the
  `.ai/`-references-`docs/` boundary this ADR formalizes).

---

## 1. Context

Level Up is built with an **AI-first engineering workflow**: AI agents (Claude Code today; possibly
Codex, GPT, Gemini, or successors tomorrow) are expected to do real engineering work across the
platform, not merely answer questions. That only produces high-quality, maintainable software if AI
is held to the **same process and quality gates as human engineers** — it selects the right
workflow, works within bounded authority, loads the right context, and passes the same validation.

Forces:

- **AI capability is volatile; the platform must be stable.** Models, context windows, IDEs, and
  agent frameworks will change repeatedly over five years. The way we *organize AI's work* must not
  be rebuilt every time the underlying model changes.
- **Ad-hoc prompting does not scale.** Pasting instructions per task yields inconsistent results,
  re-derives context every time, and leaves no reusable engineering process.
- **Documentation is already the source of truth** (the Documentation Constitution, ADR-0007).
  Whatever governs AI must *consume* that truth, not fork it.
- **Two kinds of "knowledge" must not be confused.** Durable, reviewed project knowledge is an
  asset; a single conversation's transient state is not, and must never leak into the repository.

Without a defined home and philosophy, AI usage becomes a drawer of prompts — model-specific,
un-reviewed, and drifting from the docs. This ADR prevents that.

---

## 2. Decision

**Establish `.ai/` as a first-class architectural component of the platform** — versioned with the
code, reviewed like code, and treated as part of the engineering platform, not an afterthought.
`.ai/` is the layer that **orchestrates how AI consumes and applies** the knowledge that lives in
`docs/`. The following principles are binding; the tools and file formats that realize them are not.

### P1 — Purpose: the AI Workspace is an engineering platform
`.ai/` exists to turn AI from an ad-hoc assistant into a **governed participant in the software
development lifecycle**. It encodes *how work is done here* — which workflow fits a task, what
context to load, what an actor is allowed to touch, and what "done" means — as reusable, reviewable
assets. It is explicitly **not**:
- a prompt collection (prompts are one small part, and they reference process, not replace it);
- another documentation folder (it holds *process and orchestration*, not the source-of-truth
  content — see P2/P3);
- a model-specific configuration (see P4).

The workspace embodies three engineering pillars from the platform charter:
**Prompt Engineering** = *what the AI should do*; **Context Engineering** = *what the AI knows*;
**Harness Engineering** = *what the AI can do*.

### P2 — Relationship between `.ai/` and `docs/`
`docs/` and `.ai/` are **complementary layers with different jobs**:
- `docs/` is the **source of truth** — *what the product is and why*, *how the system is built*,
  *why decisions were made*. It is authored for humans first and is authoritative (ADR-0007's
  Documentation Constitution governs it).
- `.ai/` is the **execution and orchestration layer** — *how an AI actor should navigate, apply, and
  be held accountable to* that truth when doing a task.

`docs/` answers "what is true"; `.ai/` answers "how do we act on it, safely and consistently." The
authority always flows **from `docs/` into `.ai/`**, never the reverse.

### P3 — `.ai/` references documentation, it never duplicates it
A fact about the system exists in **exactly one place**: `docs/` (or the code, or the OpenAPI
contract). `.ai/` **points at** that place; it does not copy it. Duplication is prohibited because a
copy is a second source of truth that silently drifts — the precise anti-pattern the Documentation
Constitution forbids. Concretely: knowledge packs cite `docs/` and code by pointer; templates in
`.ai/` reference the authoritative document templates in `docs/standards/`; harnesses reference the
process rules in `docs/process/`. The value `.ai/` adds is **distillation and orchestration**
(what to load, in what order, for which task), not restatement.

### P4 — Model-agnostic by design
The AI Workspace must remain usable by **any** current or future AI agent — Claude Code, Codex, GPT,
Gemini, or successors. Therefore:
- Its content is **plain, portable text** (Markdown and declarative metadata), readable by any agent.
- Any **model- or tool-specific entry point is a thin adapter**, not the substance. A router file
  (e.g. `CLAUDE.md`) may be named for one tool, but it only *points into* `.ai/`; the reusable
  engineering assets it points to are tool-neutral. A different agent gets its own thin router over
  the same workspace.
- The workspace depends on **capabilities**, not products (a "context loader," a "subagent," a
  "validation runner," a "tool-access channel"), so swapping the underlying agent changes the
  adapter, not the architecture.

This mirrors ADR-0007's stance on contracts: the *principle* is durable; the *tool* is replaceable.

### P5 — The building blocks (defined by role, not implementation)
The AI Workspace is composed of a small set of orchestration primitives. This ADR defines **what
each is and why it exists**; their concrete definitions live in engineering documentation and future
work.

- **Knowledge Packs** — the **Context Engineering** layer. Curated, distilled context for a task
  area: pointers into `docs/`/code plus the minimum summary an actor needs, carrying a freshness
  marker. They are *what the AI knows* for a task — deliberately small, never the whole repository.
- **Harnesses** — the **Harness Engineering** layer. Executable scaffolds for a *type* of task
  (objective, inputs, required-context budget, steps, validation, expected outputs). They define
  *what the AI can do* for that task and bound it safely.
- **Agents** — **role definitions** with responsibilities, a read allow-list, and an explicit
  deny-list (what the role must never modify). They give AI **bounded authority**; they map onto
  whatever "subagent" mechanism a tool provides.
- **Workflows** — **orchestration** of agents and harnesses across a change's lifecycle
  (plan → build → review → ship), including **review loops** that can send work backward. Where a
  harness is one task, a workflow is the end-to-end path.
- **Checklists** — **atomic quality gates**, one authoritative list per concern (naming, security,
  testing, etc.), referenced by harnesses and reviews. They are the leaf-level pass/fail criteria.
- **Templates** — **boilerplate for produced artifacts** (PR, changeset, review report). They
  reference — never fork — the authoritative documentation templates in `docs/standards/`.
- **Hooks** — the **enforcement layer**. Automation that binds validation to events (pre-commit, CI,
  an agent finishing an edit) so that quality gates run automatically rather than by memory. Hooks
  are what make validation *happen* instead of being *hoped for*.
- **MCP (and equivalent) integrations** — a **governed capability surface** through which AI reaches
  live systems (e.g. read-only database access, documentation search, internal APIs). Declared
  centrally, scoped by least privilege, and treated as architecture: capabilities are *granted*
  deliberately, not improvised per session. The Model Context Protocol is an open, model-neutral
  channel, consistent with P4; the principle holds for any successor protocol.

### P6 — Validation philosophy: conformance is executable
Consistent with ADR-0007, **"green is executed, not claimed."** Every harness embeds **runnable,
stack-specific** validation (Go checks for the Go island; workspace checks for TypeScript — per
ADR-0006), and hooks enforce it. AI-produced work is **not "done" until the same checks that gate
human work pass**. There is no privileged path for AI: its output flows through the identical
quality gates (checklists + executable validation), so AI cannot lower the platform's standards.

### P7 — Context Engineering strategy: minimum necessary context
Quality of AI work is bounded by the quality — and *restraint* — of its context. The strategy:
- **Never load the whole repository.** Each harness declares an explicit **context budget**; an
  actor loads that and nothing more.
- **Pointers over dumps.** Reference `docs/`/code by location; embed only distilled summaries, so
  context stays small and self-updating.
- **Freshness is tracked.** Knowledge packs carry a `last_verified` marker; a pack that cites a file
  or contract that no longer exists is flagged, not trusted.
- **Scope by change.** Use the platform's own signals (the monorepo's affected-graph for TypeScript;
  the touched module for Go) to bound what a task needs to see.

Context engineering is the highest-leverage investment in AI quality — higher than prompt wording.

### P8 — Permanent project knowledge vs session-specific context
A hard boundary separates two things that must never be confused:
- **Permanent project knowledge** — durable, reviewed, reusable: it lives in `docs/` (truth) and
  `.ai/` (orchestration), is versioned in Git, and is reviewed like code.
- **Session-specific context** — the transient state of a single task or conversation (an actor's
  working memory, intermediate reasoning, one-off instructions). It lives **only in the agent's
  session** and is discarded or *distilled* when the task ends.

The rule: **only durable, reviewed, reusable knowledge earns a place in the repository.** Session
ephemera never pollute `.ai/` or `docs/`. When a session produces something worth keeping, it is
*promoted* — through review — into a doc, a knowledge pack, or an ADR; it does not silently
accumulate. This keeps the workspace a curated asset, not a transcript dump.

### P9 — How AI becomes part of the engineering process (not just answering prompts)
The AI Workspace changes AI's relationship to the codebase from *responding to prompts* to
*participating in engineering*:
- AI **selects a workflow** appropriate to the task rather than improvising an approach;
- it **acts within an agent role** with explicit, bounded authority (allow/deny), so it cannot stray
  outside its lane;
- it **executes a harness** with a defined context budget and defined steps;
- its output is **gated by the same checklists and executable validation** as human output (P6);
- durable outputs are **promoted through review** (P8), so the AI's work compounds into the platform.

AI is thereby a **first-class, governed actor in the SDLC** — subject to the same process, boundaries,
and quality bar as any engineer. That governance, not the cleverness of any single prompt, is what
makes AI-assisted development trustworthy at scale.

### P10 — `.ai/` is versioned, reviewed, and evolves with the platform
Because it is architecture, the AI Workspace is committed to the repository, changes through review,
and grows evidence-first (add the workflows actually used; don't front-load unused ones). Cross-repo
sharing of common conventions is a distribution detail (as piloted with the shared conventions
repository), not a change to this decision. `.ai/` is maintained with the same discipline as the
code and the docs it serves.

---

## 3. Alternatives considered

- **No AI Workspace — rely on ad-hoc prompts and a single instructions file.** Rejected: inconsistent
  results, context re-derived each task, no reusable process, and instructions that drift from the
  docs. This is the status quo the ADR replaces.
- **Fold AI assets into `docs/`.** Rejected: conflates *truth* (`docs/`) with *orchestration*
  (`.ai/`), and would tempt duplication of source-of-truth content into AI-facing copies (violates
  P3 and the Documentation Constitution).
- **A model-specific configuration (tie the workspace to one agent).** Rejected: couples a durable
  platform component to a volatile tool; violates P4. Model-specificity is confined to a thin router.
- **Store session context in the repo for "reuse."** Rejected: transcripts are not reviewed,
  reusable knowledge; they rot and mislead (violates P8). Worthwhile findings are promoted, not
  dumped.

---

## 4. Consequences

**Positive**
- AI is a governed participant held to the same process and quality bar as humans (P6/P9); its work
  compounds into the platform rather than evaporating per session.
- One coherent, model-agnostic surface for AI across the whole polyglot monorepo (P4), surviving
  model/tool churn.
- No duplication of truth: `docs/` stays authoritative, `.ai/` orchestrates (P2/P3).
- Context is engineered, not dumped (P7), improving quality and reducing cost.
- A clean permanent-vs-session boundary keeps the repository a curated asset (P8).

**Negative / costs**
- The workspace is real engineering surface to design, review, and maintain (P10). Mitigated by
  evidence-first growth and by referencing (not forking) existing docs.
- Discipline is required to keep `.ai/` pointing at `docs/` and to promote — not dump — session
  findings. Mitigated by review and by hooks that enforce validation automatically.

**Risks**
- *Drift between `.ai/` and `docs/`* if pointers are not maintained. Mitigated by freshness markers
  (P7) and reviewing `.ai/` like code.
- *Over-engineering* (harnesses/agents nobody uses). Mitigated by P10's evidence-first rule.
- *Tool lock-in creeping past the router.* Mitigated by P4's capability-not-product stance.

---

## 5. Relationship to other documents & the overall architecture
- **ADR-0006 (repository & platform architecture)** — `.ai/` lives at the root of the monorepo and
  spans both the Go island and the TypeScript workspace; its validation is stack-specific per
  ADR-0006. The AI Workspace is what lets a single AI actor reason across the whole platform in one
  working tree.
- **ADR-0007 (OpenAPI contract workflow)** — shares this ADR's core philosophy ("conformance is
  executable"); a contract change is exactly the kind of cross-cutting task an AI workflow
  orchestrates (edit spec → regenerate → implement → validate), gated by executable checks.
- **Documentation Migration Map (accepted)** — defines the `.ai/`-references-`docs/` boundary (P3):
  doc templates stay in `docs/standards/`; engineering READMEs are distilled into knowledge packs;
  the Documentation Constitution is referenced by the documentation harness. This ADR formalizes
  that boundary as architecture.

Together, ADR-0006 (structure), ADR-0007 (contract), and ADR-0008 (`.ai/`) complete the platform
foundation: **where code lives, how its boundaries agree, and how AI does engineering within it.**

*Design only. No directory scaffolding, harness/agent/workflow definitions, prompts, or repository
changes are part of this ADR.*

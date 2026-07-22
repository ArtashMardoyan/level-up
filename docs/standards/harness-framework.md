---
status: "Proposed"
owner: "Backend Team Lead"
reviewers:
  - "Frontend"
  - "Product"
last_updated: "2026-07-22"
visibility: "internal"
---

# Level Up — Harness Framework Specification

> **What this is.** The stable **interface** that every Level Up harness must implement — the
> architectural foundation defined *before* any concrete harness (Backend Feature, Bug Fix,
> Documentation, Release, Security Review, …). Think of it as an interface defined ahead of its
> concrete classes: harnesses are the implementations; this document is the contract they conform to.
>
> **What this is not.** Not a harness. It defines no concrete harness, no prompts, no directory
> scaffolding, no tool configuration. It is architecture only, and it is **tool- and model-agnostic**
> (per ADR-0008 §P4): it depends on *capabilities* — a context loader, a subagent, a validation
> runner, a tool-access channel — never on named products.
>
> **Normative language.** **MUST / MUST NOT** = a conformance requirement; **SHOULD** = strong
> default, deviation must be justified; **MAY** = optional.

- **Operationalizes:** ADR-0008 §P1 (the *Harness Engineering* pillar — "what the AI can do").
- **Bound by:** ADR-0008 (workspace philosophy), ADR-0006 (polyglot monorepo; stack-specific
  validation), ADR-0007 (executable conformance; contract-change tasks).

---

## 1. Definitions

- **Harness** — a reusable, executable scaffold for one *type* of task. It bounds an actor's work
  and makes "done" checkable.
- **Actor** — whoever executes the harness: an AI agent or a human. The framework treats both
  identically; there is no privileged path (ADR-0008 §P6).
- **Capability** — an ability an actor may use (read a path, edit a path, run a validator, reach a
  tool/MCP channel). Capabilities are *granted*, not assumed.
- **Gate** — a pass/fail check that a run must clear (a validation stage or a checklist).
- **Evidence** — the durable record of what a run did and proved.
- **Run** — a single execution of a harness against concrete inputs.

---

## 2. The Harness Interface — reusable metadata

Every harness **MUST** declare the following, in a machine-readable header, so any actor can parse
any harness the same way. This is the *interface*; concrete values are supplied by each harness.

| Field | Req. | Meaning |
|---|---|---|
| `id`, `title` | MUST | Stable identity. |
| `framework_version` | MUST | Which version of *this* spec the harness targets (§13). |
| `applies_to` | MUST | Which apps/packages/stacks it is valid for (e.g. Go island, TS workspace — ADR-0006). |
| `objective` | MUST | **Exactly one** goal. A harness with two goals is two harnesses. |
| `non_goals` | SHOULD | Explicit out-of-scope, to bound creep. |
| `agents` | MUST | The role(s) that execute it, each with its allow/deny authority (§5). |
| `required_context` | MUST | The **context budget** — pointers to load, and nothing more (§4). |
| `capabilities` | MUST | The allow-list and deny-list of capabilities the run may use (§5). |
| `steps` | MUST | Ordered execution steps (§3). |
| `validation` | MUST | The ordered, **executable**, stack-specific gates (§6). |
| `checklists` | MUST | One or more atomic quality gates it must pass (§6). |
| `expected_outputs` | MUST | The artifacts a successful run produces, incl. which are promotion candidates (§9). |
| `review` | SHOULD | Which reviewers/loops apply (§7). |
| `evidence` | MUST | What the run records (§11). |
| `success_criteria` / `failure_handling` | MAY | Overrides of the framework defaults (§8, §10). |

Harnesses **MUST NOT** restate source-of-truth content in these fields; `required_context` and
`checklists` are **pointers** into `docs/`, code, or the OpenAPI contract (ADR-0008 §P3).

---

## 3. Lifecycle of a harness run

A run moves through a fixed set of states. Every transition has an **entry condition** (what must be
true to enter) and an **exit condition** (what the state must produce). No state MAY be skipped;
**validation and review MUST NOT be bypassed** (charter: "never skip validation").

```
SELECTED → CONTEXTUALIZED → EXECUTED → VALIDATED → REVIEWED → COMPLETED → RECORDED
                                                       │
              (blocking findings ────────loop─────────┘)          terminal off-ramps:
                                                                   ABORTED · FAILED
```

- **SELECTED** — the right harness is chosen for the task (by a planner/human). Exit: inputs bound,
  `applies_to` satisfied.
- **CONTEXTUALIZED** — only the declared `required_context` is loaded (§4). Exit: context budget
  loaded, freshness checked.
- **EXECUTED** — the `steps` run under the granted capabilities (§3–§5). Exit: intended change made
  (or a plan produced, for dry runs).
- **VALIDATED** — every validation stage and checklist runs and passes (§6). Exit: all gates green.
- **REVIEWED** — advisory review runs; blocking findings loop back to EXECUTED (§7). Exit: no
  blocking findings (or a recorded human waiver).
- **COMPLETED** — success criteria met (§8).
- **RECORDED** — evidence written; promotion candidates surfaced for review (§9, §11).
- **ABORTED** — stopped deliberately before completion (e.g. wrong harness). **FAILED** — a gate or
  step failed unrecoverably (§10). Both are terminal and **MUST** still record evidence.

---

## 4. Context loading strategy (ADR-0008 §P7)

- A run **MUST** load only its declared `required_context`; it **MUST NOT** load the whole
  repository "just in case."
- Context **MUST** be expressed as **pointers** (paths, doc anchors, contract locations) plus minimal
  distilled summaries — never bulk copies (ADR-0008 §P3).
- Knowledge referenced **MUST** be freshness-aware: a pointer to a file/contract that no longer
  exists **MUST** be flagged, not trusted.
- Context **SHOULD** be scoped by the change using platform signals (the monorepo affected-graph for
  TypeScript; the touched module for Go).
- The context budget is part of the harness's design and is reviewed like any other interface field.

---

## 5. Execution model & capability boundaries

**Execution model.**
- Steps are **ordered and deterministic**; a run follows them, and **MUST NOT** silently reorder or
  skip mandatory steps.
- **Decide vs. do are separated.** Advisory roles (planning, review, security, performance) produce
  plans/findings and **MUST NOT** mutate code; building roles apply changes (ADR-0008 §P5, agents).
- **Single-writer per file per run** — two roles **MUST NOT** edit the same file concurrently; the
  orchestration sequences them.
- Harnesses **SHOULD** support a **plan (dry) phase** before a mutating phase for non-trivial or
  irreversible work, so the intended change can be reviewed before it is applied.
- Steps **SHOULD** be idempotent where feasible, so a re-run converges rather than duplicates.

**Capability boundaries.**
- **Least privilege.** A run may use only the capabilities its harness declares; everything else is
  denied by default. Tool/MCP access is **granted per harness**, never ambient (ADR-0008 §P5).
- Operations **MUST** be classified by side-effect and reversibility:
  1. **read-only** — always allowed within the allow-list;
  2. **reversible write** — allowed under the harness's authority;
  3. **irreversible or outward-facing** (deploys, deletions, publishing, external calls) — **MUST**
     require explicit human authorization at run time, and **MUST NOT** be performed on implicit
     approval carried over from an earlier step or run.
- Deny-lists are load-bearing: they encode the boundaries (e.g. the Go island MUST NOT edit the TS
  workspace and vice-versa — ADR-0006).

---

## 6. Validation stages (executable, layered, stack-specific)

Validation is **executed, not asserted** (ADR-0007/0008: "green is executed, not claimed"). Each
harness declares the **minimal** set of stages for its task; stages run in order and are
**fail-closed** — a failed stage stops the run.

Canonical stage order (a harness uses the subset that applies):
1. **Static** — format, lint, type-check (stack-specific: Go tools for the Go island; workspace
   tools for TypeScript — ADR-0006).
2. **Behavioral** — unit/behavior checks for the changed logic.
3. **Integration / contract** — cross-boundary checks, including the OpenAPI **drift guard** and
   server-conformance checks for contract-touching work (ADR-0007 §P5).
4. **Checklist gates** — the referenced atomic checklists (naming, security, testing, …), each a
   pass/fail.

Rules: a run **MUST NOT** be reported successful with any stage failing; validation **MUST** be
runnable by a machine (no stage may depend on a human asserting "it matches"); harnesses that touch
the contract **MUST** include stage 3.

---

## 7. Review loops

- After validation, **advisory review** runs (a reviewer role, plus specialized reviewers such as
  security/performance when the harness declares them). Review produces **findings**, each ranked by
  severity with a concrete failure scenario.
- **Blocking** findings loop the run back to EXECUTED; the loop repeats until no blocking findings
  remain **or** a human records an explicit waiver with a reason.
- Review loops **MUST** be **bounded**: after a declared maximum number of iterations without
  convergence, the run escalates to a human rather than looping indefinitely.
- Reviewers are advisory (they do not edit — §5); the building role applies fixes.

---

## 8. Success criteria (the definition of done for a run)

A run reaches **COMPLETED** only when **all** hold:
- the single `objective` is met;
- **every** validation stage passed (§6);
- **every** referenced checklist passed;
- the review loop exited with no blocking findings (or a recorded waiver);
- all `expected_outputs` exist;
- evidence has been (or is about to be) recorded (§11).

Anything short of this is **not** success. A harness **MUST NOT** define success criteria weaker than
these; it MAY define stricter ones.

---

## 9. Promotion rules (session → durable) (ADR-0008 §P8)

- A run distinguishes **durable outputs** (code, docs, a knowledge-pack update, an ADR) from
  **session ephemera** (intermediate reasoning, transient state). Ephemera **MUST NOT** be written
  into the repository.
- Outputs a harness marks as **promotion candidates** (e.g. a lesson that should become a knowledge
  pack, or a decision that should become an ADR) are **promoted only through review** — never
  silently accumulated.
- Promotion is explicit: the run surfaces the candidate; a human/reviewer accepts it into `docs/`,
  `.ai/knowledge/`, or `docs/decisions/`. This is how a run's value compounds into the platform.

---

## 10. Failure handling

- **Fail closed.** A run **MUST NEVER** report success when a step or gate failed. Failures are
  surfaced with their actual output, not summarized away.
- **No silent partial state.** On failure a run **MUST** either complete the safe portion and clearly
  report what remains, or revert to a clean state — it **MUST NOT** leave ambiguous half-applied
  changes unreported.
- **Bounded retries.** Only **transient, idempotent** steps MAY be retried, a bounded number of
  times; non-idempotent or ambiguous failures **MUST NOT** be blindly retried.
- **Escalate on ambiguity or irreversibility.** Any need for an irreversible/outward-facing action
  (§5), or any ambiguous state, **MUST** escalate to a human rather than guess.
- A failed or aborted run **MUST** still record evidence (§11), so failures are auditable and become
  input to improvement.

---

## 11. Evidence collection

Every run — success **or** failure — **MUST** record a durable, reproducible evidence record
containing at least:
- the harness `id` + `framework_version`, and the inputs;
- the context actually loaded (pointers), and capabilities used;
- validation results per stage, and review findings + their resolution/waivers;
- the outputs produced and the final state (COMPLETED / FAILED / ABORTED);
- for irreversible actions: what was authorized, by whom, and the prior good state to revert to.

Evidence is written to the workspace's audit location (the `reviews/` record area of `.ai/`), is
**reproducible** (someone can trace what happened and why), and is the raw material for the
platform's self-improvement (recurring findings inform new checklist items or harness refinements).

---

## 12. Extensibility principles

- **Open for harnesses, closed for the framework.** Adding or changing a *harness* **MUST NOT**
  require changing this framework. New task types are new harnesses that implement this interface.
- **Composition over duplication.** Harnesses **compose** shared checklists, knowledge packs, agents,
  and templates by reference; they **MUST NOT** copy them (ADR-0008 §P3).
- **Versioned framework.** This spec is versioned; harnesses declare the `framework_version` they
  target. Framework changes **SHOULD** be backward-compatible; a breaking change to the interface
  follows an expand → migrate → contract path (consistent with ADR-0007 §P6) so existing harnesses
  keep working during transition.
- **Evidence-first growth.** Add a harness when a task type is proven recurrent; do not front-load
  harnesses nobody runs (ADR-0008 §P10).
- **Tool- and model-agnostic.** The interface names capabilities, not products; swapping the agent,
  IDE, or validation tool changes an adapter, not this spec (ADR-0008 §P4).

---

## 13. Conformance (what makes a valid harness)

A document is a conforming Level Up harness **iff** it:
1. declares every MUST field of the interface (§2) and targets a `framework_version`;
2. has **exactly one** `objective`;
3. declares a **bounded `required_context`** expressed as pointers (§4);
4. declares a capability **allow-list and deny-list** (§5);
5. embeds **executable, ordered, fail-closed** validation stages and references **≥1 checklist**
   (§6), including the contract stage if it touches the API (ADR-0007);
6. defines `expected_outputs`, and marks any **promotion candidates** (§9);
7. meets the framework **success criteria** (§8) and **failure-handling** rules (§10);
8. records **evidence** on every run (§11).

A harness failing any of these is non-conforming and **MUST NOT** be run as a governed harness.

---

## 14. Relationship to the platform
- **ADR-0006** — harnesses are stack-aware; validation and boundaries follow the polyglot split
  (Go island vs TS workspace).
- **ADR-0007** — contract-touching harnesses embed the drift-guard/conformance stage; a "change the
  API" harness is the canonical multi-step, spec-first flow.
- **ADR-0008** — this framework *is* the Harness Engineering pillar made concrete-yet-abstract: it
  defines the interface; individual harnesses, agents, workflows, and prompts (future work) implement
  and orchestrate it. `.ai/` references `docs/`; harnesses inherit that rule (§4, §12).

*Architecture only. No concrete harness, prompt, scaffold, or tool configuration is part of this
specification.*

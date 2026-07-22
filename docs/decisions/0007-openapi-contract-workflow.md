---
status: "Proposed"
owner: "Backend Team Lead"
reviewers:
  - "Frontend"
  - "Product"
last_updated: "2026-07-22"
visibility: "internal"
---

# ADR-0007 — OpenAPI as the Single Source of Truth for API Contracts

> **Scope.** This ADR records the **architecture** of Level Up's API-contract workflow — the
> principles that govern how our HTTP API is specified, owned, shared, evolved, and validated. It
> deliberately does **not** name generators, libraries, or CI products; those are implementation
> details that live in engineering documentation (`docs/engineering/contracts/`) and may change
> without changing this decision. The goal is a decision that survives 5+ years even if every tool
> is replaced.

- **Relates to:** ADR-0006 (repository & platform architecture — the polyglot monorepo).
- **Feeds from:** the accepted **Documentation Migration Map**, which identifies "no contracts
  documentation exists yet" as a gap this ADR opens.
- **Adjacent:** ADR-0003 (SSE for text streaming) and ADR-0004 (sentinel-delimited streamed
  generation) — streaming endpoints are part of the contract (see §Streaming).

---

## 1. Context

ADR-0006 establishes Level Up as a **polyglot monorepo**: a Go service (`apps/api`) and a
TypeScript workspace (frontend apps + shared packages) coexist but are **separate toolchains**, and
we **never share runtime code** across the language boundary. That decision creates one open
question it explicitly defers to this ADR:

> If Go and TypeScript never share code, how do the server and its clients agree on the shape of
> the API — and stay in agreement as the API evolves?

Constraints and forces:

- **The contract outlives the implementation.** The server may be rewritten, split, or scaled; a
  client may be replaced (web today; mobile, admin, internal tools, and possibly third parties
  later). The agreement about *what the API is* must be a durable artifact independent of any one
  side's code.
- **Language-neutral by necessity.** The contract must be consumable by Go, TypeScript, and any
  future language, so it cannot live *inside* either language.
- **Small team.** The workflow must be low-ceremony and mostly automated; humans should review
  *intent and compatibility*, not hand-maintain parallel type definitions.
- **AI-native.** Per the platform charter, "green is executed, not claimed": conformance to the
  contract must be *checkable*, not asserted.

---

## 2. Decision

**OpenAPI is the single source of truth (SSOT) for the Level Up HTTP API.** The OpenAPI document is
the authoritative, human-reviewed, version-controlled definition of the API. Server code and client
code are **derived from** it; they never define the contract themselves. The following principles
are binding; the tools that realize them are not.

### P1 — Why OpenAPI is our Single Source of Truth
The API is a **boundary**, and a boundary needs exactly one authority that all sides submit to.
OpenAPI is chosen as that authority because it is:
- **Language-neutral** — it describes HTTP semantics (paths, methods, status codes, media types,
  schemas), not Go or TypeScript, so every current and future client speaks it equally;
- **Transport-appropriate** — Level Up's API is HTTP/REST (+ SSE), which OpenAPI models natively;
- **Machine-readable** — it can be linted, diffed, validated, and used to generate code, making
  conformance *provable* rather than *hoped for*;
- **A durable artifact** — versioned in Git alongside the code, it becomes the historical record of
  the API's shape and evolution.

Having one authority is the whole point: it structurally eliminates the anti-pattern of *multiple
sources of truth* (hand-written Go structs and hand-written TS types drifting apart).

### P2 — The contract is authored, not derived (spec-first)
The OpenAPI document is **written and reviewed as the source**, and the implementation is produced
to satisfy it — not the reverse. We do **not** treat the spec as a byproduct emitted from server
code annotations, because that would make the implementation the real authority and reduce the
contract to documentation-after-the-fact. Contract changes are *designed in the spec first*, where
producers and consumers can review them before code exists.
*(Migration exception: when first capturing the existing Go API, the initial spec may be
bootstrapped from current behavior. That is a one-time migration step, not the steady state.)*

### P3 — Ownership of the contract
A single authority requires a single **owner**:
- The **Backend team owns the contract** — it is accountable for the spec's accuracy, because the
  server is the component that must honor it and is the authority on what capability exists.
- **Consumers are required reviewers.** Any change that affects a client's surface (a request shape,
  a response shape, an error, an auth requirement) requires review by the affected client owners
  (Frontend, and future clients). The producer proposes; consumers must be able to object *before*
  merge.
- The contract lives in a **neutral, shared location** in the monorepo (a contracts package under
  `packages/`, per ADR-0006), not inside the Go service and not inside a client — so no single
  consumer can quietly fork it. Ownership is by team, not by folder.

This mirrors the documentation ownership model already in force (every doc has an owner and
reviewers): the contract is a first-class document with the same governance.

### P4 — How Go and TypeScript stay synchronized
Synchronization is achieved by **generation from the one spec, never by hand-authoring the contract
surface on either side**:
- The **Go server** derives its request/response models (and, where useful, its handler interfaces)
  from the spec, and implements the behavior behind them.
- The **TypeScript clients** derive their request/response types and a typed client from the *same*
  spec.
- Both are regenerated **from the same source in the same change**. A contract change is one atomic
  edit — spec → regenerate both sides → implement — reviewable in a single pull request.

Because both sides are *outputs of one input*, they cannot disagree about the contract by
construction. The only hand-written code is the *behavior* (Go logic; client usage), never the
*shape*.

### P5 — How contract drift is prevented
Drift — the state where the spec, the server, and the clients no longer describe the same API — is
prevented by three mechanisms, in order of authority:
1. **Spec-first is mandatory (P2).** There is no supported path to change the API without changing
   the spec, so the spec cannot fall behind by process.
2. **A generation drift guard in CI.** Continuous integration regenerates both sides from the spec
   and **fails if the committed generated code differs** from the regenerated output. This makes it
   impossible to merge hand-edited or stale generated types.
3. **The server is bound to the contract at runtime and/or by contract tests.** The server
   validates that its actual requests/responses conform to the spec (runtime validation and/or
   automated contract tests). This closes the gap between "the spec says X" and "the server does X"
   — the implementation cannot silently diverge from the contract it was generated from.

Together these make drift a *build failure*, not a production surprise.

### P6 — What qualifies as a breaking change
Compatibility is judged **from the consumer's perspective**: a change is breaking if it can break a
correct client that was written against the previous contract. The producer may *add capability*;
it may not *remove or tighten* what consumers already rely on.

**Backward-compatible (non-breaking):**
- adding a new endpoint or operation;
- adding an **optional** request field, or a new optional query parameter/header;
- adding a field to a response (consumers must ignore unknown fields — see §Validation);
- relaxing an input constraint the server enforces (accepting more than before).

**Breaking (requires a version increment and a migration path):**
- removing or renaming an endpoint, field, parameter, or enum value;
- making an optional request field **required**, or tightening input validation;
- changing a field's type, semantics, status code, or error contract;
- changing authentication/authorization requirements;
- narrowing a response guarantee consumers depend on;
- adding a value to a response enum **when** clients are expected to handle enums exhaustively
  (treat as breaking unless the contract explicitly requires clients to tolerate unknown values).

**Evolution rule.** Breaking changes follow an **expand → migrate → contract** sequence, never a
hard swap: introduce the new shape additively, move consumers over, then remove the old shape in a
later, separately-versioned change. This is the same discipline ADR-0006 mandates for database
migrations, applied to the API surface. The contract carries a **version**, and breaking changes
increment it; the version and a changelog are part of the contract artifact.

### P7 — Validation philosophy
Validation is layered, and each layer answers a different question:
- **Is the contract itself well-formed and consistent?** The spec is linted/validated as an
  artifact (style, completeness, internal consistency) before anything is generated from it.
- **Is this change backward-compatible?** The spec is diffed against its previous version by a
  compatibility check that classifies the change per P6; a breaking change without a version bump
  fails.
- **Does the server actually honor the contract?** The server enforces conformance at runtime
  (request/response validation) and/or via contract tests — the server is *bound by* the spec, not
  merely accompanied by it.
- **Do the clients match the contract?** Because client types are generated, a mismatch is a
  **compile-time** error in the TypeScript workspace, not a runtime bug.

The philosophy: **conformance must be executable.** No layer relies on a human asserting "it
matches"; each is a check a machine runs and a build can fail. Clients tolerate unknown/added
fields (forward-compatibility) so that additive server changes never break older clients.

### P8 — The generation workflow at a conceptual level
Tool-independent, the steady-state loop is:
1. **Design in the spec.** Author or modify the OpenAPI document (P2).
2. **Validate the spec** as an artifact and **check compatibility** against the previous version
   (P7), classifying the change (P6).
3. **Generate both sides** deterministically from the single spec (P4): Go contract models/
   interfaces and TypeScript types/client.
4. **Implement behavior** — Go logic behind the generated interfaces; client code consuming the
   generated client. Never hand-write the contract surface.
5. **Prove conformance** — drift guard clean (P5.2), server conformance checks pass (P5.3), both
   sides compile.
6. **Version & record** — bump the contract version for breaking changes; update the contract
   changelog.

Every step is a *capability* (author, lint, diff, generate, verify), independent of which product
provides it. Replacing a generator changes only step 3's tooling, not this ADR.

### P9 — How this supports the polyglot monorepo (ADR-0006)
This workflow is what makes the polyglot decision *safe*:
- It provides the **single, language-neutral coupling** between the Go island and the TypeScript
  workspace, honoring ADR-0006's rule that they share **no runtime code** — they share only the
  generated contract.
- It keeps the two toolchains **decoupled at the code level and coupled only at the contract**, so
  each can evolve, build, and deploy independently (ADR-0006's independent-deploy goal).
- It makes **new clients cheap**: mobile, admin, internal tools, or a third party consume the same
  contract with no new agreement to negotiate — the monorepo's "grow by adding a folder" property
  extends to "grow by adding a consumer of the contract."
- It gives Claude Code and humans **one place** to reason about the API: an API change is one
  reviewable edit to the spec that fans out to every consumer, executed through a stack-aware
  harness with stack-specific validation.

### Streaming endpoints are part of the contract
Level Up streams AI text over SSE (ADR-0003) using a sentinel-delimited format (ADR-0004).
Streaming endpoints are **still governed by this contract**: the OpenAPI document describes them
(their path, auth, `text/event-stream` media type) and references the schema of the streamed
events, even where code generators offer limited streaming support. The contract documents the
streaming surface regardless of tool capability; generator gaps are handled in engineering
documentation, not by exempting streaming from the SSOT.

---

## 3. Alternatives considered

- **Code-first (generate the spec from server annotations).** Rejected as the steady state (P2):
  it makes the implementation the real authority, turns the contract into after-the-fact
  documentation, and couples the contract's existence to Go. Acceptable only as a one-time
  bootstrap during migration.
- **No shared contract — hand-written types on each side.** Rejected: guarantees drift and creates
  multiple sources of truth (P1/P5); it is the exact failure this ADR exists to prevent.
- **A binary/RPC schema (e.g. an IDL for service-to-service).** Not chosen for the client-facing
  API because the transport is HTTP/REST + SSE, which OpenAPI models directly. This ADR does not
  forbid a separate schema for future internal service-to-service traffic; it governs the HTTP API
  that clients consume. The *principle* — one language-neutral authoritative contract per boundary
  — would apply there too.

---

## 4. Consequences

**Positive**
- One authoritative, versioned, language-neutral definition of the API; no parallel type
  maintenance.
- Go and TypeScript cannot disagree about the contract by construction (P4); drift is a build
  failure (P5).
- Compatibility is defined and enforced (P6/P7), so the API can evolve safely for years.
- The polyglot monorepo is safe and extensible: adding a consumer is cheap; the language boundary
  is crossed only by a contract (P9).
- The ADR is tool-independent: swapping generators or CI does not invalidate any decision here.

**Negative / costs**
- **Spec-first discipline is required.** Changing the API means editing the spec first; teams used
  to editing code directly must adapt. Mitigated by the drift guard making the alternative fail.
- **Generation and conformance tooling must exist and be maintained** in CI. Mitigated by keeping
  the *choice* of tools in engineering docs, replaceable without touching this ADR.
- **Some surfaces (streaming) exceed common generator support.** Mitigated by documenting them in
  the contract regardless and handling generation gaps in engineering docs.

**Risks**
- *Compatibility subtleties* (e.g. response enum additions) can be misclassified. Mitigated by an
  automated compatibility check (P7) and the consumer-perspective rule (P6).
- *Bootstrap drift* if the migration-time spec is captured code-first and then not corrected to
  spec-first. Mitigated by treating bootstrap as explicitly one-time and switching to P2 immediately
  after.

---

## 5. Relationship to other documents
- **ADR-0006** — establishes the polyglot monorepo and the "no shared runtime code" rule this ADR
  operationalizes; the contracts package location is defined there.
- **Documentation Migration Map (accepted)** — lists `docs/engineering/contracts/` as a gap; this
  ADR opens it. Tool choices, spec file layout, generator configuration, and CI wiring belong in
  that engineering documentation, **not** here.
- **ADR-0003 / ADR-0004** — the streaming transport and format that the contract must also describe.

*Design only. No implementation, scaffolding, generator configuration, or repository changes are
part of this ADR.*

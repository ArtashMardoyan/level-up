---
status: "Review"
owner: "Backend Team Lead"
reviewers:
  - "Product"
  - "Frontend"
  - "Mobile"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Visibility Classification — Proposal

**Status: Review — not yet applied.** This proposes which documents are `public`,
`internal`, or `private`. It is separate from the P3 mechanism (which is built and
proven): today **everything defaults to `internal`**, so nothing is public until this
classification is approved and the `visibility` fields are updated in a small follow-up.

Tiers (from the portal build filter):

- **public** — anyone on the internet (the public site).
- **internal** — the team, behind authentication (the gated internal site). *Default.*
- **private** — excluded from both standard builds.

Guiding rule: **default to internal; make public only what is deliberately outward-
facing and contains no strategy, implementation detail, or secrets.** When in doubt,
internal.

## Recommendation at a glance

| Area | Proposed | Confidence |
|---|---|---|
| Product narrative (vision, principles, philosophy) | **public** | high |
| Product model, audience, feature map | **public** | medium — judgment call |
| Product roadmap | **internal** | medium — judgment call |
| Product feature specs (interview, ai-chat, notifications, content + chapters) | **internal** | high |
| Engineering (architecture, backend, security, caching) | **internal** | high |
| Engineering — deployment | **internal** (never public) | high — contains infra IDs |
| Decisions (ADRs) | **internal** | high |
| Standards & process | **internal** | high |
| _Private tier_ | _currently unused_ | — |

## Detail & rationale

### Proposed PUBLIC

The outward-facing product story — aspirational, contains no implementation detail or
secrets, and is useful to candidates, partners, or a curious reader:

- `product/vision.md` — mission and long-term direction; pure narrative.
- `product/principles.md` — product principles; no internals.
- `product/philosophy.md` — learning/interview/AI philosophy; no internals.

**Judgment calls (proposed public, but flag for decision):**

- `product/PRODUCT_MODEL.md` — the constitution. Compelling and secret-free, but it is
  the fullest single statement of strategy. Public if we're comfortable stating the
  strategy openly; internal if we'd rather not.
- `product/audience.md` — who it's for; market-positioning, no secrets.
- `product/feature-map.md` — the module map. Describes *what exists*, not *how*; public
  is reasonable, but it does sketch the system's shape.

### Proposed INTERNAL (the default — the bulk)

- **`product/roadmap.md`** — *future* direction. Roadmaps are usually kept internal
  (competitive signalling, and plans change). Proposed internal despite its siblings
  being public. **Decision point.**
- **Product feature specs** — `interview/`, `ai-chat/`, `notifications/`, `content/`
  and all their chapters. These carry implementation detail: data models, AI prompts,
  API contracts, file references. Internal.
- **Engineering** — `architecture/`, `backend/`, `security/`, `caching/`. System design
  and (for security) the auth/threat surface. Internal.
- **Decisions (ADRs)** — architectural rationale and trade-offs; internal history.
- **Standards & process** — how the team documents and ships (including this file, the
  portal plan, requirements, and hosting). Internal working material.

### Never public (call-out)

- **`engineering/deployment/README.md`** — contains AWS account ID, App Runner/ECR ARNs,
  and endpoints. Stays **internal** (the team needs it) and must **never** be `public`.
  Flagged explicitly so it can't be swept into a public batch by mistake.

### PRIVATE tier

Currently **unused** — nothing needs to be hidden from the authenticated team. Reserved
for future material that is sensitive even internally (e.g. incident write-ups, security
findings). No document is proposed `private` today.

## If approved

A small, scripted follow-up sets `visibility: public` on the approved public set (and
`roadmap`/`PRODUCT_MODEL`/etc. per your decisions); everything else stays `internal` by
default. That change is mechanical and reviewable — same discipline as P2/P3 — and only
then would enabling the public deploy publish anything.

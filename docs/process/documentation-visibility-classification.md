---
status: "Approved"
owner: "Backend Team Lead"
reviewers:
  - "Product"
  - "Frontend"
  - "Mobile"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Visibility Classification

**Status: Approved — applied.** This records which documents are `public`, `internal`,
or `private`. The classification below was approved and applied: `vision`, `principles`,
`philosophy`, `audience`, and `user-journey` are `public`; everything else is `internal`
by default; nothing is `private`. Changing a document's tier means updating its
`visibility` front matter and re-checking the build (cross-tier links to filtered pages
are neutralized automatically — see the hosting doc).

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

## Applied

`visibility: public` was set on the approved public set (`vision`, `principles`,
`philosophy`, `audience`, `user-journey`); everything else remains `internal` by default;
nothing is `private`. Publishing still requires enabling the guarded public deploy once
hosting is provisioned (see the hosting doc).

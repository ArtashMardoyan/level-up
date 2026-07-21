---
status: "Approved"
owner: "Backend Team Lead"
last_updated: "2026-07-21"
visibility: "internal"
---

# Process

How we build and ship — and how documentation itself works.

- [`DOCUMENTATION_ARCHITECTURE.md`](DOCUMENTATION_ARCHITECTURE.md) — the authority:
  philosophy, principles, information architecture, ownership, status/versioning,
  the development lifecycle, and the Definition of Done.
- [`documentation-portal-requirements.md`](documentation-portal-requirements.md) —
  finalized, technology-agnostic requirements for publishing the docs as a website
  (M3, requirements phase). Tool selection is deferred.
- [`documentation-portal-implementation-plan.md`](documentation-portal-implementation-plan.md) —
  the implementation design for the portal on MkDocs Material (M4 plan). Design only;
  implementation begins after this plan is approved.
- [`documentation-portal-hosting.md`](documentation-portal-hosting.md) — how the portal
  is built and published (M4 · P4): the live CI build/validate pipeline and the guarded,
  yet-to-be-provisioned deployment for the public and gated-internal sites.
- [`documentation-visibility-classification.md`](documentation-visibility-classification.md) —
  **approved:** which docs are public / internal / private, with rationale. Applied
  (5 product-narrative docs public; everything else internal).

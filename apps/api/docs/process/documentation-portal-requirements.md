---
status: "Approved"
owner: "Backend Team Lead"
reviewers:
  - "Frontend"
  - "Product"
last_updated: "2026-07-21"
visibility: "internal"
---

# Documentation Portal — Requirements

The finalized, **technology-agnostic** requirements for publishing Level Up's
documentation as a browsable website. This document defines *what the portal must do*,
not *which tool builds it*. **Technology evaluation happens only after these
requirements are approved** — and is deliberately out of scope here (see the closing
note).

This is the requirements phase of **M3 — Documentation Publishing**. It follows the
Documentation Foundation (M1) and Product Model (M2).

## Source of truth

- **Markdown in this repository is the single source of truth.** The published site,
  and any HTML / PDF / other format, are **outputs only**.
- **No generated artifact is ever editable or authoritative.** The lifecycle is
  `Artifact → Review → Approved → Markdown → Git → Docs website` (principle P9 in
  [`DOCUMENTATION_ARCHITECTURE.md`](DOCUMENTATION_ARCHITECTURE.md)).

## Documentation metadata

- Every document exposes standardized, machine-readable metadata: **Status · Owner ·
  Last Updated**, and optionally **Version** and **Reviewers**.
- This metadata is reusable by any future portal.

## Documentation quality

- The portal **surfaces document metadata (Status, Owner, Last Updated) consistently
  on every page**, so a reader always knows how much to trust a document and who owns it.

## Access control

- Support multiple visibility levels: **Public · Internal · Private**.
- The publishing solution exposes only the documentation appropriate to the audience
  (e.g. public product overview vs. internal engineering detail).

## Navigation

- Full-text search
- Sidebar navigation (mirrors the `docs/` tree)
- Breadcrumb navigation
- Previous / Next navigation
- Cross-document linking
- Automatic table of contents (per page)
- Mobile-friendly layout

## Rich documentation

- Mermaid diagrams
- Images and architecture diagrams
- Tables
- Code blocks
- Callouts / notes
- Collapsible sections

## Presentation

- Light / dark theme.

## Performance & operations

- Builds automatically from Git
- Fast to navigate
- Minimal maintenance
- Scales to hundreds of documents

## Sharing

- Browsable by Product Managers, Designers, Frontend, Backend, Mobile, QA, and
  stakeholders **without cloning the repository**; shareable links.

## Future-proofing

- The publishing solution remains **independent of any specific static-site
  generator**. The project can migrate to another tool in the future **without changing
  the Markdown source**. Requirements are never bent to fit a chosen tool; the tool is
  chosen to fit these requirements.

---

## Out of scope (for now)

- **Technology selection.** No static-site generator, framework, or host is chosen in
  this document. Candidate tools will be evaluated **against these requirements** in a
  later phase, only after this list is approved. Requirements first; technology second.

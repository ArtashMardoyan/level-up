---
status: "Accepted"
date: "2026-07-21"
deciders:
  - "Backend Team Lead"
  - "Frontend"
  - "Product"
---

# ADR-0005 — Documentation Portal Platform

## Context

M1 established the documentation foundation; M2 the Product Model and its derived
documents. M3 chooses **how the Markdown in this repository is published as a browsable
website** — the Documentation Portal. This ADR is an **architecture-first evaluation and
recommendation**; it configures and implements nothing (implementation is a later,
separately-approved step).

The evaluation is bound entirely by the frozen
[Documentation Portal Requirements](../process/documentation-portal-requirements.md).
Requirements come first; a tool is chosen to fit them — never the reverse.

## 1. Evaluation criteria (derived from the frozen requirements)

Each criterion maps directly to a requirement section. No criterion is invented here.

| # | Criterion | From requirement |
|---|---|---|
| C1 | **Markdown is the source of truth**; the site is a build output only | Source of truth |
| C2 | **Machine-readable metadata** (Status/Owner/Last Updated, opt. Version/Reviewers) **surfaced consistently on every page** | Documentation metadata + Documentation quality |
| C3 | **Access control** — publish Public / Internal / Private audiences from one source | Access control |
| C4 | **Full-text search** | Navigation |
| C5 | **Navigation** — sidebar, breadcrumbs, previous/next, cross-links, automatic TOC, mobile-friendly | Navigation |
| C6 | **Rich content** — Mermaid, images, architecture diagrams, tables, code, callouts, collapsible | Rich documentation |
| C7 | **Light / dark theme** | Presentation |
| C8 | **Performance & operations** — builds from Git, fast, minimal maintenance, scales to hundreds of docs | Performance & operations |
| C9 | **Sharing** — browsable without cloning; shareable links | Sharing |
| C10 | **Future-proofing** — SSG-independent; migrate tools without changing the Markdown source | Future-proofing |

## 2. Candidates

Shortlisted (Markdown-native, self-hostable, static-output):

- **MkDocs Material** (Python; MkDocs + Material theme)
- **VitePress** (Vue + Vite)
- **Docusaurus** (React + MDX)
- **Astro Starlight** (Astro)

Considered and excluded up front, with reason:

- **GitBook, Mintlify** — SaaS-first; the hosted product tends to become the editable
  source, conflicting with C1/C10 (Markdown-as-source, no lock-in). Excluded.
- **Sphinx / Read the Docs** — reStructuredText-centric; Markdown is second-class.
  Conflicts with C1/C10. Excluded.
- **Docsify** — renders Markdown client-side at runtime (no build step, no static
  pre-render); weaker search/SEO and scaling story vs. C4/C8. Excluded.
- **Nextra** — viable (Next.js/MDX) but shares Docusaurus's MDX-lock-in profile (C10)
  without a differentiating advantage for our case. Not shortlisted.

## 3. Evaluation matrix

Legend: ✅ strong / native · ◑ partial, or needs a plugin/config · ⚠️ weak or lock-in risk.

| Criterion | MkDocs Material | VitePress | Docusaurus | Astro Starlight |
|---|---|---|---|---|
| C1 Markdown source | ✅ plain Markdown | ✅ Markdown (+opt. Vue) | ◑ MDX (React in md) | ✅ Markdown (+opt. MDX) |
| C2 Metadata + surfacing | ✅ front matter · ◑ theme override to surface | ✅ front matter · ◑ theme | ✅ front matter · ◑ theme | ✅ typed frontmatter schema · ◑ theme |
| C3 Access control | ◑ build-time filter | ◑ build-time filter | ◑ build-time filter | ◑ build-time filter |
| C4 Search | ✅ built-in (instant, client-side) | ✅ built-in (local) | ◑ Algolia (hosted) or local plugin | ✅ built-in (Pagefind) |
| C5 Navigation | ✅ sidebar/TOC/prev-next/**breadcrumbs**/mobile | ◑ sidebar/TOC/prev-next/mobile; **no breadcrumbs** | ✅ full incl. breadcrumbs | ◑ full; breadcrumbs via customization |
| C6 Rich content | ✅ Mermaid, admonitions, collapsible native | ✅ Mermaid (plugin), custom containers | ✅ Mermaid, admonitions (MDX) | ✅ Mermaid (plugin), asides |
| C7 Light/dark | ✅ | ✅ | ✅ | ✅ |
| C8 Performance/maintenance | ✅ mature, very low churn, proven at scale | ✅ very fast; smaller ecosystem | ◑ heavier (React); higher dep churn | ✅ fast; newer, smaller track record |
| C9 Sharing | ✅ static, any host | ✅ | ✅ | ✅ |
| C10 Future-proof source | ✅ plain `.md`, no JSX (admonition-syntax caveat) | ◑ Vue-in-md/containers | ⚠️ MDX pervades content | ◑ MDX optional |

## 4. Cross-cutting findings (true for all candidates)

These shape the decision more than any single feature:

- **F1 — Access control (C3) is a pipeline/hosting concern, not an SSG feature.** None of
  the four offer native Public/Internal/Private gating. The portable pattern is
  **metadata-driven build filtering**: a `visibility:` field in each doc's front matter
  drives *which* docs go into a Public build vs. an Internal build, with the Private/
  Internal site placed behind hosting-level auth. This is tool-agnostic and satisfies C3
  regardless of SSG — so C3 does **not** differentiate the tools.
- **F2 — Future-proofing (C10) is primarily a source-discipline concern.** Every tool has
  a *non-portable callout syntax* (Material `!!! note`, VitePress `::: tip`, Docusaurus/
  Starlight `:::note`). True portability comes from keeping the **source** to a portable
  subset — CommonMark + tables + fenced code + fenced ```mermaid + YAML front matter — and
  treating callouts as the one bounded, mechanically-convertible coupling. The tool that
  best preserves this is the one whose *content* is plain `.md` with **no components in
  Markdown** (no MDX/JSX). That is MkDocs Material; MDX-centric tools (Docusaurus, and
  Starlight when MDX is used) carry the highest C10 risk because components embedded in
  content do not migrate.
- **F3 — Metadata surfacing (C2) requires adopting YAML front matter.** Our docs currently
  carry metadata as a `> **Status:** …` blockquote — human-readable but not
  machine-readable. To surface Status/Owner/Last Updated consistently and reusably (C2),
  docs should adopt **YAML front matter**, which is portable across all four tools (so it
  also serves C10). This is a small, tool-neutral source migration, deferred to
  implementation.

## 5. Per-candidate analysis

- **MkDocs Material** — purpose-built for large technical/product documentation.
  Satisfies the most criteria out-of-the-box with the least configuration (C4, C5 incl.
  breadcrumbs, C6, C7 native), which directly serves **minimal maintenance (C8)**. Content
  is plain Markdown with **no components**, the strongest position on **C10**. Extremely
  stable release history (low churn). Caveats: introduces a Python toolchain (isolated to
  the docs pipeline); admonition/collapsible use Material-specific syntax (the bounded
  C10 coupling from F2).
- **VitePress** — fast (Vite), clean, low-config, built-in local search; aligns with the
  team's existing Vite familiarity. Weaker on C5 (**no built-in breadcrumbs**) and relies
  on plugins/containers for C6, and introduces Vue for any interactive content. Solid but
  assembles a few things Material gives natively.
- **Docusaurus** — most feature-complete navigation and first-class doc *versioning*, and
  a very large ecosystem. But **MDX pervades content**, the weakest **C10** position
  (highest lock-in), and the React/plugin stack carries the most maintenance/churn (**C8**).
  Its headline versioning advantage is **not a frozen requirement** (only optional
  per-doc `Version` metadata is), so it does not offset the C10/C8 costs.
- **Astro Starlight** — modern, fast, excellent static search (Pagefind), typed
  frontmatter (good for C2). Flexible (embed any framework). Younger project with a
  smaller track record for "hundreds of docs, minimal maintenance" (**C8**), and MDX use
  reintroduces C10 risk. Strong runner-up-of-the-future, less proven today.

## 6. Decision (proposed)

**Adopt MkDocs Material as the Documentation Portal platform**, with **VitePress as the
documented fallback** if the team later prioritizes staying within a single JS/Vite
ecosystem over out-of-the-box completeness.

## 7. Rationale (architectural, long-term)

1. **Best fit to the highest-weighted requirements.** Level Up has repeatedly prioritized
   **future-proofing (C10)** and **minimal maintenance (C8)**. MkDocs Material's
   plain-Markdown-no-components content is the most portable (C10, per F2), and its
   out-of-box completeness minimizes ongoing configuration and dependency churn (C8).
2. **Most requirements satisfied natively.** C4, C5 (including breadcrumbs), C6, C7 are
   built in — fewer moving parts to maintain and fewer plugins to track than the
   alternatives.
3. **Purpose-built for exactly this.** It is the de-facto standard for large, long-lived
   technical/product documentation — our precise use case (a knowledge base that scales to
   hundreds of docs).
4. **Source stays tool-neutral.** Combined with the source discipline (F2) and YAML front
   matter (F3), the Markdown remains publishable by any tool — so this decision is
   reversible at low cost, which is itself the point of C10.
5. **The one trade-off is contained.** A Python docs toolchain sits isolated in CI; the
   team edits Markdown, not the SSG. This does not spread Python into the app stacks.

## 8. Consequences

**Positive**
- A low-maintenance, fast, searchable portal meeting C1–C9 with minimal config.
- Markdown source stays portable (C10); the platform choice is reversible.
- Access control achieved by metadata-driven build filtering + hosting auth (F1), a
  pattern that outlives any single SSG.

**Negative / accepted costs**
- A second language toolchain (Python) for docs, isolated to the docs pipeline.
- Callout/collapsible syntax is Material-specific — the bounded C10 coupling (F2);
  mitigated by using it sparingly and by a convertible convention.
- Metadata must migrate from blockquote to YAML front matter (F3) — a small, tool-neutral
  source change.

**To confirm at implementation time (deferred, out of scope here)**
- Exact plugins/versions for Mermaid, front-matter surfacing, and build-time visibility
  filtering.
- Hosting + auth for the Internal/Private builds (C3).
- The precise YAML front-matter schema (aligns with the metadata standard).
- CI wiring to build from Git on change (C8) and publish shareable links (C9).

## 9. Alternatives and why not (summary)

- **VitePress** — strong and JS-native, but lacks built-in breadcrumbs and assembles more
  for C5/C6; documented as the fallback.
- **Docusaurus** — feature-rich, but MDX lock-in (C10) and higher maintenance (C8); its
  versioning edge is not a required criterion.
- **Astro Starlight** — promising and fast, but less proven at scale (C8) and MDX
  reintroduces C10 risk.
- **SaaS (GitBook/Mintlify), Sphinx/RTD, Docsify, Nextra** — excluded in §2 for conflicts
  with C1/C10 (source-of-truth, portability) or C4/C8 (search/scale).

## 10. Future migration strategy

The platform is chosen to be **replaceable**. The documentation must outlive any tooling
(principle **P9** — the repository is the source of truth; artifacts are temporary). These
rules keep the documentation architecture independent of MkDocs Material, or any successor:

1. **Markdown remains the single source of truth.** Content lives as Markdown in this
   repository. The generated site is a build output — never edited, never authoritative.
2. **Front matter is platform-neutral.** Document metadata is YAML front matter, a format
   every candidate (and most future tools) reads. Metadata is never expressed in a
   tool-proprietary form.
3. **Structure does not depend on any specific SSG.** The `docs/` tree, file names, and
   cross-links use plain relative Markdown paths — not generator-specific routing,
   sidebar-as-code, or path aliases baked into content. A different tool re-reads the same
   tree unchanged.
4. **Custom content is minimized.** Content stays within the portable subset — CommonMark,
   tables, fenced code, fenced ```mermaid, images by relative path. No MDX/JSX or components
   in content. Tool-specific callout/collapsible syntax is the single permitted coupling —
   used sparingly, mechanically convertible, and preferably degrading to a plain blockquote
   when unrendered.
5. **Platform-specific configuration stays isolated.** All generator configuration (theme,
   plugins, navigation config, build scripts) lives in a dedicated, clearly-labelled
   location **separate from `docs/` content** — so swapping tools touches configuration,
   not documents.
6. **Replacement is low-cost by construction.** Because rules 1–5 hold, replacing the
   generator requires **little or no change to the documentation itself**: point a new tool
   at the same `docs/` tree and front matter, re-implement the isolated configuration, and
   rebuild. The content does not move.

This is the operational meaning of **C10** and of **P9**: the documentation is permanent;
the generator is disposable.

## 11. Status & next step

This ADR is **Accepted**: MkDocs Material is the chosen Documentation Portal platform,
governed by the migration strategy in §10. Acceptance unblocks a **separate,
explicitly-approved implementation milestone** (build the portal per §8's deferred items).
**This document configures and implements nothing** — implementation has not begun.

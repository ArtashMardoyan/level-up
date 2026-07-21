# ADR-0001 — Product documentation lives in the backend repository

> **Status:** Accepted · **Date:** 2026-07-21 · **Deciders:** Backend Team Lead, Product

## Context

Level Up spans a backend (`level-up-backend`) and a web frontend (`level-up`), with
Mobile planned. Product features are full-stack, so their documentation has no obvious
single home. Today docs are split: interview and ai-chat are specced in the backend
repo; dictionary and profile only in the frontend repo. This fragments discovery and
invites duplication.

## Decision

All product and platform documentation lives in **one** `docs/` tree inside the
**backend repository**. Web, Mobile, and future clients consume it from there and do
not keep their own copies. A standalone documentation repository is intentionally out
of scope at this stage.

## Alternatives considered

- **A standalone `level-up-docs` repo / monorepo `/docs`.** Cleanest for a
  multi-client future, but premature now: it adds repo overhead and a sync burden for
  a small team, before Mobile even exists.
- **Docs split per app repo.** The status quo — fragments full-stack features and
  produces cross-repo duplication (e.g. `auth`, `caching` documented twice).

## Consequences

- One source of truth; product specs are platform-independent and read by every stack.
- The frontend repo keeps only a thin `docs/` that links back here.
- Revisit a dedicated docs repo **before** Mobile work begins, if the project has
  grown enough to justify it (superseding ADR would record that).

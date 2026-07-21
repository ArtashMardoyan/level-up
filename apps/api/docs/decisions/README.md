# Architecture Decision Records (ADRs)

> **Status:** Approved · **Owner:** Backend Team Lead · **Last updated:** 2026-07-21

An ADR records **why** a significant or hard-to-reverse decision was made — the
context, the choice, the alternatives, and the consequences. It answers *Why?*, not
*How?* (the "how" lives in `engineering/` and technical designs). ADRs are the
project's long-term memory: in two years, this is where "why did we do it this way?"
is answered.

## Rules

- One decision per file: `NNNN-short-title.md`, zero-padded, sequential.
- **Immutable once Accepted.** Don't rewrite an ADR to change the decision — write a
  new ADR that supersedes it, and link them both ways.
- Add an ADR whenever a decision is significant, cross-cutting, or expensive to
  reverse. The Definition of Done requires it.
- Start from [`../standards/templates/adr.md`](../standards/templates/adr.md).

## Index

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-product-docs-in-backend-repo.md) | Product documentation lives in the backend repository | Accepted |
| [0002](0002-english-canonical-docs.md) | English is the canonical documentation language | Accepted |
| [0003](0003-sse-for-text-streaming.md) | SSE for text streaming; WebSocket reserved for voice | Accepted |
| [0004](0004-sentinel-format-streamed-generation.md) | Sentinel-delimited format for streamed AI generation | Accepted |
| [0005](0005-documentation-portal-platform.md) | Documentation portal platform (MkDocs Material) | Accepted |

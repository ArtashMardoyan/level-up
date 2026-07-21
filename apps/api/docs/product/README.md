# Product Documentation

> **Status:** Approved · **Owner:** Product / feature leads · **Last updated:** 2026-07-21

Full-stack, **platform-independent** specs for *what* we build and *why*. Web and
Mobile read these; they carry no stack-specific detail (that lives in
[`../engineering/`](../engineering/)).

## Start here — the Product Model

**[`PRODUCT_MODEL.md`](PRODUCT_MODEL.md)** is the single source of truth for what Level
Up is and why. Every document in this folder is **derived from** it — read it first.
When the product changes, update the model first, then the docs derived from it.

## Domains

Each domain's spec traces back to the Product Model (which section it realizes noted where useful).

- [`interview/`](interview/) — AI Interview Coach (README + STATUS + chapters `001`–`016`).
- [`ai-chat/`](ai-chat/) — chat streaming migration (README + STATUS + chapters `001`–`014`).
- [`notifications/`](notifications/) — per-user notification feed.
- [`content/`](content/) — course content & audio pipeline.

Planned: `dictionary/`, `profile/` (in the frontend repo today, consolidate here when
migrated), `learning/`. Add a domain via the lifecycle in
[`../process/DOCUMENTATION_ARCHITECTURE.md`](../process/DOCUMENTATION_ARCHITECTURE.md) §9.

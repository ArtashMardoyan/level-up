---
status: "Approved"
owner: "Product / feature leads"
last_updated: "2026-07-21"
visibility: "internal"
---

# Product Documentation

Full-stack, **platform-independent** specs for *what* we build and *why*. Web and
Mobile read these; they carry no stack-specific detail (that lives in
[`../engineering/`](../engineering/)).

## Start here — the Product Model

**[`PRODUCT_MODEL.md`](PRODUCT_MODEL.md)** is the single source of truth for what Level
Up is and why. Every document in this folder is **derived from** it — read it first.
When the product changes, update the model first, then the docs derived from it.

## Foundation documents (derived from the model)

Each states its `Derived from: Product Model §…` and adds no concept not in the model:

- [`vision.md`](vision.md) — mission & long-term direction (§1, §2, §10)
- [`principles.md`](principles.md) — the principles that constrain decisions (Framing, §5)
- [`philosophy.md`](philosophy.md) — why we teach, interview, and use AI this way (Framing, §5, §8)
- [`audience.md`](audience.md) — who it's for and their problems (§3, §4)
- [`user-journey.md`](user-journey.md) — the stages a user moves through (§6)
- [`feature-map.md`](feature-map.md) — the modules and how they connect (§1, §7)
- [`roadmap.md`](roadmap.md) — the platform-level long-term roadmap (§6, §10)

## Domains

Each domain's spec traces back to the Product Model (which section it realizes noted where useful).

- [`interview/`](interview/) — AI Interview Coach (README + STATUS + chapters `001`–`016`).
- [`ai-chat/`](ai-chat/) — chat streaming migration (README + STATUS + chapters `001`–`014`).
- [`notifications/`](notifications/) — per-user notification feed.
- [`content/`](content/) — course content & audio pipeline.

Planned: `dictionary/`, `profile/` (in the frontend repo today, consolidate here when
migrated), `learning/`. Add a domain via the lifecycle in
[`../process/DOCUMENTATION_ARCHITECTURE.md`](../process/DOCUMENTATION_ARCHITECTURE.md) §9.

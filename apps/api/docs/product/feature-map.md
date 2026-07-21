---
status: "Approved"
owner: "Product / feature lead"
reviewers:
  - "Backend"
  - "Frontend"
  - "Mobile"
  - "Design"
last_updated: "2026-07-21"
---

# Feature Map

> **Derived from: Product Model §1 (What is Level Up), §7 (How the modules relate).**

The platform's modules and how they connect into one ecosystem. The canonical ecosystem
diagram lives in the [Product Model §7](PRODUCT_MODEL.md#7-how-the-modules-relate-one-ecosystem);
this document names each module and points to its spec. It introduces no module beyond §7.

## Modules

| Module | Role (from §7) | Spec |
|---|---|---|
| **Content** | Course & question bank + audio; feeds Interview and self-study | [`content/`](content/) |
| **Interview** | AI mock interview; emits per-question rubric scores | [`interview/`](interview/) |
| **AI Chat** | The Interview's conversational engine (HTTP → streaming → voice → realtime) | [`ai-chat/`](ai-chat/) |
| **Dictionary** | English-communication coaching — delivery, not correctness | *frontend repo today; consolidates here* |
| **Profile** | The user's home: progress, performance, achievements, saved | *frontend repo today; consolidates here* |
| **Gamification** | Badges & streaks | *within Interview/Profile today* |
| **Notifications** | Engagement loop | [`notifications/`](notifications/) |
| **Learning** *(future)* | Adaptive paths from per-question history | *future* |

## How they connect

One connected ecosystem (§7): **Content** feeds **Interview** (powered by **AI Chat**);
Interview's scores flow to **Profile**, **Gamification**, and future **Learning**;
**Dictionary** coaches communication; **Gamification + Notifications** close the
engagement loop; **Learning** (future) feeds back into what the Interview asks next. The
boundaries of the platform — what is deliberately *not* a module — are in §9.

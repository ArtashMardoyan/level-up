---
status: "Approved"
owner: "Backend"
last_updated: "2026-07-21"
---

# Engineering Documentation

*How* the platform is built — per stack and per cross-cutting concern. Audience is
that stack's engineers; product behavior lives in [`../product/`](../product/).

## Areas

- [`architecture/`](architecture/) — system shape, module pattern, dependency rules.
- [`backend/`](backend/) — Go/Gin/GORM engineering hub.
- [`security/`](security/) — auth, JWT, CORS.
- [`caching/`](caching/) — content caching (ETag + version).
- [`deployment/`](deployment/) — AWS App Runner + RDS.

Planned (created when their first real content lands): `frontend/`, `mobile/`,
`data/`, `observability/`.

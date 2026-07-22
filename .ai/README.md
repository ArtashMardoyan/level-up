# .ai/ — Level Up AI Workspace (monorepo, single source of truth)

The one AI workspace for the whole `level-up` monorepo. Consolidated in Phase 5 from the P1 pilot
(a shared conventions set + the per-repo `.ai/` folders). **No git subtree, no `.ai/shared/`, no
second repo** — everything lives here as plain files.

```
.ai/
├── config.yml            # monorepo map: apps/web (TS) + apps/api (Go), stack-specific commands
├── harnesses/            # execution scaffolds — PRE-FRAMEWORK (legacy) pending conformance
│   ├── backend-api.md    #   applies_to: api
│   ├── frontend-ui.md    #   applies_to: web
│   └── bug-fix.md        #   applies_to: web, api
├── checklists/           # atomic quality gates: naming · security · testing
├── knowledge/            # context packs (pointers into docs/ + code)
│   ├── domain-glossary.md        # shared / cross-stack
│   ├── frontend-architecture.md  # apps/web
│   └── backend-architecture.md   # apps/api
└── reviews/              # review & release records (audit trail)
```

## Authority & scope
- `docs/` is the **source of truth**; `.ai/` **references** it (never duplicates) — see
  [`docs/decisions/0008-ai-workspace-architecture.md`](../docs/decisions/0008-ai-workspace-architecture.md).
- The root [`CLAUDE.md`](../CLAUDE.md) is the model-agnostic **router** into this workspace; each app
  has a thin `apps/*/CLAUDE.md` with its own conventions.
- The harness **interface** every harness must implement is
  [`docs/standards/harness-framework.md`](../docs/standards/harness-framework.md).

## Legacy note
The three harnesses here were written in the P1 pilot **before** the Harness Framework. They are
**legacy / pre-framework** and must be brought to conformance (review item C2) before being run as
governed harnesses. Not part of the migration.

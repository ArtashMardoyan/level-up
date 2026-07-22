---
status: legacy-pre-framework   # P1 pilot; predates docs/standards/harness-framework.md — bring to conformance before governed use
id: frontend-ui
title: Frontend UI Component
applies_to: [level-up]
checklists: [naming, security, testing]
---

# Harness: Frontend UI Component

## Objective
Build or modify a React component/view in `level-up` that matches existing patterns,
handles all UI states, and stays lint-clean — verified via the DOM in the running app.

## Inputs
- Component/view spec and where it mounts (which page/route).
- Design reference (if a redesign is involved).
- API dependency: which endpoint(s) via `services/endpoints.js` + `services/api.js`.

## Required Context
- `.ai/knowledge/frontend-architecture.md` (local pack).
- `CLAUDE.md` (code style, hooks rules, architecture, redesign-doc sync rule).
- The nearest sibling component in `src/components/` to pattern-match.
- `docs/` entry for the feature, if one exists.

## Execution Steps
1. Confirm the API contract (endpoint, request/response) with the backend side.
2. Build the component: typed-by-convention props, handle loading / error / empty / success.
3. Wire data via `services/api.js`; map `ref ↔ uuid` at the boundary if progress-related.
4. Manage state without a state library — hooks; do **not** sync state from props via `useEffect`
   (adjust during render behind a `prev !== next` guard).
5. Handle SSE/streaming through the existing player/stream path if chat-related.
6. Accessibility pass: semantic elements, keyboard nav, focus on dynamic content, light+dark.
7. If any UI/layout/`src/index.css` changed, update `docs/redesign/status.md` and
   `docs/redesign/handoff/README.md` in the same change (per `CLAUDE.md`).
8. Verify behavior via the DOM in the running app across all states (no screenshots unless asked).

## Validation
- `npm run lint` clean (fix code, don't disable rules).
- Checklists `naming`, `security`, `testing` (manual/DOM section) pass.
- Import & object-key sort rules satisfied; no semicolons / single quotes / width 120.
- Redesign docs synced if UI changed.

## Expected Outputs
- Component + wired data flow, redesign-doc updates if applicable, DOM-verified behavior.

---
status: legacy-pre-framework   # P1 pilot; predates docs/standards/harness-framework.md — bring to conformance before governed use
id: bug-fix
title: Bug Fix
applies_to: [level-up, level-up-backend]
checklists: [testing, security]
---

# Harness: Bug Fix

## Objective
Resolve a defect at its root cause, proven by a regression test (backend) or a
DOM-verified reproduction (frontend, until a test runner exists).

## Inputs
- Repro steps, expected vs actual behavior, severity.
- Logs / stack trace / failing request if available.

## Required Context
- The failing module and its existing tests.
- The relevant local architecture pack (`.ai/knowledge/*-architecture.md`).

## Execution Steps
1. Reproduce the bug reliably.
2. **Backend:** write a failing test that captures the bug.
   **Frontend:** capture the exact repro (route, state, steps) since no test runner exists.
3. Find the root cause — trace it, don't patch the first symptom.
4. Apply the minimal fix; avoid scope creep.
5. Confirm: backend test now passes and the full suite is green (`make test`);
   frontend repro no longer occurs across states and `npm run lint` is clean.
6. Note the root cause in the PR description.

## Validation
- Regression test fails before / passes after (backend).
- No regressions in the rest of the suite / no new lint errors.
- Fix addresses cause, not symptom (checklist `testing`; `security` if input/auth touched).

## Expected Outputs
- Fix + regression test (backend) or documented DOM verification (frontend),
  plus a one-line root-cause note in the PR.

# Checklist: Testing

Atomic pass/fail gates. Apply the subset relevant to the change.

## Both apps
- [ ] Each bug fix ships with a regression test that fails before the fix and passes after.
- [ ] Tests assert meaningful outcomes, not just "did not throw".
- [ ] Tests are deterministic — no reliance on wall-clock time, ordering, or network flakiness.
- [ ] Happy path **and** at least one error/edge path are covered for new logic.

## Backend (`level-up-backend`)
- [ ] New service/handler logic has table-driven tests next to it (`*_test.go` in the module).
- [ ] `make test` (`go test ./...`) passes.
- [ ] Repository interaction is tested against the interface, not the GORM struct, where practical.
- [ ] Auth-gated endpoints have both an authorized and an unauthorized case.

## Frontend (`level-up`)
- [ ] **No test runner is configured today.** Until one exists, verification is done via the
      DOM/behavior in the running app (project QA preference: no screenshots unless asked).
- [ ] The change is manually exercised in happy, loading, error, and empty states.
- [ ] If a test setup is introduced, it starts with the component/util changed in this PR.
- [ ] `npm run lint` passes (the current automated gate).

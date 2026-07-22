# Checklist: Security

Atomic pass/fail gates. Apply the subset relevant to the change. A "no" blocks merge
until fixed or explicitly waived with a reason.

## Both apps
- [ ] No secrets, tokens, or credentials in code, logs, or committed config.
- [ ] User input is validated at the boundary before use.
- [ ] Errors returned to clients don't leak stack traces, SQL, or internal paths.
- [ ] New dependencies are reputable and pinned; no unreviewed transitive risk.

## Backend (`level-up-backend`)
- [ ] Every new/changed route enforces the correct auth: public vs JWT-protected is deliberate.
- [ ] Protected handlers read the user via two-value assertion (`u, ok := val.(T)`) — never one-value.
- [ ] All DB access goes through GORM with parameters/struct binding — no string-built SQL.
- [ ] `os.Getenv` is read only inside `config/config.go`; secrets passed via constructor, never globals.
- [ ] Logout/revocation honored: revoked `jti` cannot be used (denylist path unbroken).
- [ ] Response uses `shared.Error` with a safe message; internal detail logged, not returned.

## Frontend (`level-up`)
- [ ] Auth token stored/handled via `services/authToken.js`; never logged or placed in the DOM/URL.
- [ ] No `dangerouslySetInnerHTML` with unsanitized content; user text rendered as text.
- [ ] API base comes from `VITE_API_URL`; no hardcoded hosts or credentials.
- [ ] External links use `rel="noopener noreferrer"` where `target="_blank"`.

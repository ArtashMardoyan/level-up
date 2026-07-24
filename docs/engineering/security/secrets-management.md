---
status: "Draft"
owner: "Backend"
reviewers:
  - "DevOps"
last_updated: "2026-07-24"
visibility: "internal"
---

# Secrets management — known debt & remediation plan

Tracked tech-debt item. **Deferred by decision (2026-07-24):** medium severity, not a
blocker — remediate alongside other infra work, not ahead of product milestones.

## Current state (the debt)

The App Runner service `level-up-backend` carries **all** runtime configuration as
**plaintext** `RuntimeEnvironmentVariables` set directly on the service — including the
real secrets:

- `JWT_SECRET`
- `DB_PASSWORD`
- `OPENAI_API_KEY`

These are visible to anyone with `apprunner:DescribeService` on the account (and are shown
verbatim in the App Runner console's Configuration tab). Non-secret config
(`SEED_ON_START`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_SSLMODE`, `OPENAI_MODEL`)
is fine as plaintext env — it is not sensitive.

## Severity & why deferred

- **Medium, not high.** Exposure is limited to principals who already hold AWS access to
  this account (the team) — there is no public exposure. No evidence of leakage.
- Per the engineering principle "don't stop features for Low/Med tech debt", product
  milestones (M3+) take priority; this is remediated when convenient (e.g. bundled with the
  Terraform Phase-2 work below).

## Remediation — Phase 2 (SSM SecureString + IaC)

The fix is already designed in the `infra/aws` Terraform module (from #33): secrets live as
**SSM Parameter Store SecureString** parameters and are injected via App Runner
`RuntimeEnvironmentSecrets` (ARN references resolved at runtime by the instance role, with
`ssm:GetParameters` scoped to just those ARNs). Secrets then never appear in the service
definition, `DescribeService`, the console, the image, or git.

Steps (a dedicated PR — see [`docs/devops/aws-setup.md`](../../devops/aws-setup.md) "Phase 2"):

1. Extend `infra/aws/main.tf` to model **`OPENAI_API_KEY`** (SSM SecureString) and
   **`OPENAI_MODEL`** (plaintext env) — currently unmodelled; without this, adopting the
   service would delete them and break AI features.
2. Set `manage_runtime = true` and `terraform import` the live ECR repo + App Runner service.
3. Populate the SSM parameters out-of-band with the real values
   (`aws ssm put-parameter --overwrite --type SecureString ...` for `JWT_SECRET`,
   `DB_PASSWORD`, `OPENAI_API_KEY`) — never through Terraform state.
4. `terraform plan` → review drift carefully → apply. The service flips from plaintext
   secrets to SSM references; `SEED_ON_START=true` and other config become IaC-managed.

## What is NOT the fix

- **GitHub Secrets** — only available inside CI runs, not readable by the running service;
  wiring them to runtime would mean CI writing env on each deploy (anti-pattern). With OIDC
  we intentionally keep **zero** GitHub secrets.
- **`.env.prod` in the repo** — real secrets must never be committed; App Runner does not
  read a repo `.env` at runtime.
- **AWS Secrets Manager** — works technically (same `RuntimeEnvironmentSecrets` mechanism)
  but costs more than SSM SecureString for no benefit we need here; SSM is the choice.

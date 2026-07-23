# Deployment pipeline

Workflow: [`.github/workflows/backend-deploy.yml`](../../.github/workflows/backend-deploy.yml).

## Trigger & gate
- Runs on push to `master` touching `apps/api/**` (or the workflow file), and on manual dispatch.
- The `deploy` job runs only when repo variable `BACKEND_DEPLOY_ENABLED == 'true'` → safe to merge
  the workflow while still off.
- Runs in the `production` GitHub environment. Add **required reviewers** to that environment for a
  manual approval gate; the OIDC trust is scoped to this environment's subject.

## Steps (what the job does)
1. `configure-aws-credentials` assumes `AWS_DEPLOY_ROLE_ARN` via OIDC (temporary creds).
2. ECR login → `docker build` → push `:<sha>` and `:latest`.
3. `apprunner start-deployment` on `SERVICE_ARN`.
4. Poll `describe-service` until `RUNNING` (fails on `*_FAILED`/`PAUSED` or timeout).
5. Health check: `GET $SERVICE_URL/ready` until `200` (fails otherwise).

## Migrations & seed (automatic, in the container)
- **Migrations**: `goose.Up` runs on startup (`cmd/server/main.go`) before serving.
- **Seed**: if `SEED_ON_START=true`, the idempotent seed runs after migrations. It **inserts** new
  rows, **updates only changed** rows, is a **no-op when nothing changed**, and **never deletes**
  (see `internal/seed`). Set `SEED_ON_START` on the App Runner service (Terraform `seed_on_start`).

## Repository variables (set by `infra/github`, no secrets)
| Variable | Example | Meaning |
|---|---|---|
| `BACKEND_DEPLOY_ENABLED` | `true` | Master switch for the deploy job |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::…:role/gha-level-up-backend-deploy` | Role assumed via OIDC |
| `AWS_REGION` | `us-east-2` | Region |
| `ECR_REPO` | `level-up-backend` | Image repository name |
| `SERVICE_ARN` | `arn:aws:apprunner:…:service/level-up-backend/…` | Deploy target |
| `SERVICE_URL` | `https://….awsapprunner.com` | Health-check + environment URL |

**GitHub secrets required: none.** OIDC replaces them.

## App Runner environment variables
Non-secret (`runtime_environment_variables`): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
`DB_SSLMODE`, `SEED_ON_START`.
Secret (`runtime_environment_secrets` → SSM SecureString): `JWT_SECRET`, `DB_PASSWORD`.

## Frontend (unchanged)
`master` pushes also run `deploy.yml` (GitHub Pages) for `apps/web`. Independent of the backend.

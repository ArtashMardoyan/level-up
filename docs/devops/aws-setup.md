# AWS setup — step by step (Terraform)

Everything is in [`infra/`](https://github.com/ArtashMardoyan/level-up/tree/master/infra). Reproducible; no undocumented console clicks.

## Two phases (`manage_runtime`)

The App Runner service + ECR repo **already run in production** (created earlier via
`apps/api/scripts/`). Terraform adopts the platform in two phases so a first apply can never disturb
the live service:

- **Phase 1 — control-plane only (`manage_runtime = false`, the default).** Terraform creates ONLY
  the OIDC deploy role + GitHub repo config, pointed at the existing runtime (its ARNs/URL passed as
  variables). It does **not** manage the App Runner service or ECR repo. This alone enables
  merge-to-master autodeploy, because the service already has `AutoDeploymentsEnabled = true`. Plan is
  `9 to add, 0 to change, 0 to destroy` — zero blast radius on prod. **Start here.**
- **Phase 2 — full IaC (`manage_runtime = true`, later, separate PR).** Terraform also adopts the
  runtime (`module.aws`). Requires `terraform import`ing the live ECR + App Runner first and
  reconciling drift carefully (the live service today carries `OPENAI_API_KEY`/`OPENAI_MODEL` and
  keeps secrets as plaintext env vars — the module must model those before any apply). See
  [Phase 2](#phase-2--adopt-the-runtime-later) below.

## Prerequisites
- Terraform ≥ 1.4, AWS CLI, an AWS session (`aws sso login --profile vyb-dev`).
- `gh auth login` (or `GITHUB_TOKEN` with `repo` + `workflow` scopes) for the GitHub provider.

## 1. Configure inputs
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit db_host etc. (git-ignored)
```
Secrets are **not** Terraform inputs (they must never enter state).

## 2. Plan & apply (Phase 1 — control-plane only)
`terraform.tfvars` ships with `manage_runtime = false`, `create_oidc_provider = false` (the account
already has the GitHub OIDC provider), and the existing prod ARNs/URL.
```bash
terraform init
terraform plan           # expect: 9 to add, 0 to change, 0 to destroy
terraform apply          # keep backend_deploy_enabled=false for the first apply
```
Creates: IAM role `gha-level-up-backend-deploy` (+ least-privilege policy), the `production`
environment, and 6 repo variables. Outputs: `deploy_role_arn`, `apprunner_service_arn`,
`apprunner_service_url`.

## 3. Go live (enable autodeploy)
The service is already `RUNNING` with an image, so there is no bootstrap image step in Phase 1.
After confirming the role + repo variables exist, flip the master switch:
```bash
terraform apply -var backend_deploy_enabled=true    # updates the BACKEND_DEPLOY_ENABLED repo var
```
From now on, merging to `master` (touching `apps/api/**`) deploys the backend automatically — CI
builds the image, pushes `:latest`, App Runner AutoDeployments picks it up, and the workflow waits
for `SUCCEEDED` + a `/ready` 200.

## Phase 2 — adopt the runtime (later, separate PR)
Bring the live ECR + App Runner under Terraform. Set `manage_runtime = true` and import the existing
resources first so nothing is duplicated or recreated:
```bash
cd infra
terraform import 'module.aws[0].aws_ecr_repository.backend' level-up-backend
terraform import 'module.aws[0].aws_apprunner_service.backend' <apprunner-service-arn>
terraform plan     # review drift CAREFULLY before applying — see caveats below
```
**Caveats — the module must match the live service before any apply, or the apply breaks prod:**
- The running service carries `OPENAI_API_KEY` (secret) and `OPENAI_MODEL` (non-secret) — **not yet
  modelled** in `infra/aws/main.tf`. Add them (OpenAI key as an SSM SecureString) first, or the apply
  will delete them and break AI features.
- The live service keeps `JWT_SECRET`/`DB_PASSWORD` (and the OpenAI key) as **plaintext env vars**;
  the module wants them as SSM SecureStrings. Populate the SSM parameters with the real values
  **before** apply, or the service will boot without them:
  ```bash
  aws ssm put-parameter --overwrite --type SecureString --name /level-up-backend/JWT_SECRET   --value '<...>'
  aws ssm put-parameter --overwrite --type SecureString --name /level-up-backend/DB_PASSWORD  --value '<...>'
  aws ssm put-parameter --overwrite --type SecureString --name /level-up-backend/OPENAI_API_KEY --value '<...>'
  ```
If the account already has a GitHub OIDC provider, keep `create_oidc_provider = false` (the module
reads it via a data source) — this repo's account already does.

## AWS resources created
**Phase 1 (control-plane only):**
- IAM role `gha-level-up-backend-deploy` (+ inline least-privilege policy) — see [github-oidc.md](github-oidc.md)
- GitHub `production` environment + 6 repo variables

**Phase 2 (when `manage_runtime = true`):**
- ECR repo `level-up-backend` + lifecycle (keep last 15)
- App Runner service `level-up-backend` (health check `/ping`, auto-deploy on)
- IAM roles `…-apprunner-access` (ECR pull) and `…-apprunner-instance` (SSM read)
- SSM SecureString `/level-up-backend/JWT_SECRET`, `/level-up-backend/DB_PASSWORD`, `/level-up-backend/OPENAI_API_KEY`

## CLI equivalent (if you cannot use Terraform)
The same result via AWS CLI (abridged — Terraform is preferred):
```bash
# OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f2df264fcd
# Role with the trust policy from github-oidc.md, then attach the least-privilege policy.
aws iam create-role --role-name gha-level-up-backend-deploy --assume-role-policy-document file://trust.json
aws iam put-role-policy --role-name gha-level-up-backend-deploy --policy-name backend-deploy --policy-document file://deploy.json
```

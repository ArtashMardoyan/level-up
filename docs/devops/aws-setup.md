# AWS setup — step by step (Terraform)

Everything is in [`infra/`](https://github.com/ArtashMardoyan/level-up/tree/master/infra). One `terraform apply` provisions the AWS runtime, the OIDC
deploy role, and the GitHub repo configuration. Reproducible; no undocumented console clicks.

## Prerequisites
- Terraform ≥ 1.4, AWS CLI, an AWS session (`aws sso login --profile vyb-dev`).
- `gh auth login` (or `GITHUB_TOKEN` with `repo` + `workflow` scopes) for the GitHub provider.

## 1. Configure inputs
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit db_host etc. (git-ignored)
```
Secrets are **not** Terraform inputs (they must never enter state).

## 2. Plan & apply
```bash
terraform init
terraform plan
terraform apply          # keep backend_deploy_enabled=false for the first apply
```
Outputs: `deploy_role_arn`, `ecr_repository_url`, `apprunner_service_arn`, `apprunner_service_url`.

## 3. Set the real secrets (once, out-of-band — never in state)
Terraform created the SSM parameters with placeholders and ignores their value. Set the real values:
```bash
aws ssm put-parameter --overwrite --type SecureString \
  --name /level-up-backend/JWT_SECRET  --value '<long-random-string>'
aws ssm put-parameter --overwrite --type SecureString \
  --name /level-up-backend/DB_PASSWORD --value '<rds-password>'
```

## 4. First image + go live
App Runner needs an image before it can run. Push once (locally or via `apps/api/scripts/deploy.sh`),
confirm the service is `RUNNING` and `/ready` returns 200, then enable auto-deploy:
```bash
terraform apply -var backend_deploy_enabled=true
```
From now on, merging to `master` deploys automatically.

## Reusing the EXISTING service / repo (no duplication)
A `level-up-backend` ECR repo and App Runner service already exist (created earlier via
`apps/api/scripts/`). To let Terraform manage them instead of creating duplicates, import them once:
```bash
cd infra
terraform import module.aws.aws_ecr_repository.backend level-up-backend
terraform import module.aws.aws_apprunner_service.backend <apprunner-service-arn>
# then: terraform plan   # reconcile drift, apply
```
If the account already has a GitHub OIDC provider, set `create_oidc_provider = false` (the module
reads it via a data source).

## AWS resources created (summary)
- OIDC provider `token.actions.githubusercontent.com`
- IAM role `gha-level-up-backend-deploy` (+ inline least-privilege policy) — see [github-oidc.md](github-oidc.md)
- ECR repo `level-up-backend` + lifecycle (keep last 15)
- App Runner service `level-up-backend` (health check `/ping`, auto-deploy on)
- IAM roles `…-apprunner-access` (ECR pull) and `…-apprunner-instance` (SSM read)
- SSM SecureString `/level-up-backend/JWT_SECRET`, `/level-up-backend/DB_PASSWORD`

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

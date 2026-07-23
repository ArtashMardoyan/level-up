# infra — deployment platform (Terraform)

Keyless, OIDC-based deploy of the Go API to AWS App Runner. One state, three modules:

```
infra/
  main.tf, variables.tf, outputs.tf, versions.tf   # root: providers + module wiring
  aws/     # ECR, App Runner, access/instance roles, SSM secrets, health check
  oidc/    # GitHub OIDC provider + least-privilege deploy role + trust policy
  github/  # repo variables + `production` environment (no secrets — OIDC)
```

Quick start and the reuse/import path for the existing ECR repo + App Runner service are in
[`docs/devops/aws-setup.md`](../docs/devops/aws-setup.md). Security/trust in
[`docs/devops/github-oidc.md`](../docs/devops/github-oidc.md). Pipeline in
[`docs/devops/deployment.md`](../docs/devops/deployment.md).

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars      # edit; git-ignored
export TF_VAR_jwt_secret=... TF_VAR_db_password=...
terraform init && terraform plan
terraform apply                                    # first run: backend_deploy_enabled=false
```

State: use a remote backend (S3 + DynamoDB lock) for team use before real applies.

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

Two phases via `manage_runtime` (default `false`): **Phase 1** creates only the OIDC deploy role +
GitHub repo config against the *existing* prod App Runner/ECR — it never touches the live service
(plan: `9 to add, 0 to change, 0 to destroy`). **Phase 2** (later PR, `manage_runtime = true`) adopts
the runtime via `terraform import`. Full steps in [`docs/devops/aws-setup.md`](../docs/devops/aws-setup.md).

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars      # fill ARNs/URL; git-ignored
terraform init && terraform plan                  # expect 9 to add, 0 to change, 0 to destroy
terraform apply                                    # Phase 1: backend_deploy_enabled=false
terraform apply -var backend_deploy_enabled=true   # flip on when ready → autodeploy on merge
```

State: use a remote backend (S3 + DynamoDB lock) for team use before real applies.

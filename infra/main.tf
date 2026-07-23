# infra — root. Applies as one state: AWS runtime (aws) → OIDC deploy role scoped
# to it (oidc) → GitHub repo configuration (github). Order is linear, no cycles.
#
#   aws  ── ecr/service ARNs ──▶ oidc ── role ARN ──▶ github
#
# Secrets are provided out-of-band (TF_VAR_*). No secret ever lands in GitHub.
#
# TWO PHASES (var.manage_runtime):
#   false (default) — CONTROL-PLANE ONLY. The App Runner service + ECR repo
#     already run in prod; do NOT let Terraform own them yet (an apply would
#     reconcile the live service and could drop env vars / restart it). We only
#     create the OIDC deploy role + GitHub repo config, pointing at the EXISTING
#     runtime via var.ecr_repository_arn / var.apprunner_service_arn / _url.
#     This alone is enough for merge-to-master autodeploy (the service already
#     has AutoDeploymentsEnabled=true).
#   true — full IaC: Terraform also creates/adopts the runtime (module.aws).
#     Reached later via a dedicated PR that `terraform import`s the live ECR +
#     App Runner first (see docs/devops/aws-setup.md).

provider "aws" {
  region = var.aws_region
}

# Auth: gh CLI token or GITHUB_TOKEN env with repo + workflow scopes.
provider "github" {
  owner = var.github_owner
}

module "aws" {
  source = "./aws"
  count  = var.manage_runtime ? 1 : 0

  aws_region    = var.aws_region
  service_name  = var.service_name
  ecr_repo_name = var.ecr_repo_name

  db_host       = var.db_host
  db_name       = var.db_name
  db_user       = var.db_user
  db_sslmode    = var.db_sslmode
  seed_on_start = var.seed_on_start
}

# The runtime ARNs/URL the OIDC + GitHub modules need: from module.aws when we
# manage it, otherwise the existing prod resources supplied as variables.
locals {
  ecr_repository_arn    = var.manage_runtime ? module.aws[0].ecr_repository_arn : var.ecr_repository_arn
  apprunner_service_arn = var.manage_runtime ? module.aws[0].apprunner_service_arn : var.apprunner_service_arn
  apprunner_service_url = var.manage_runtime ? module.aws[0].apprunner_service_url : var.apprunner_service_url
}

module "oidc" {
  source = "./oidc"

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  aws_region            = var.aws_region
  create_oidc_provider  = var.create_oidc_provider
  ecr_repository_arn    = local.ecr_repository_arn
  apprunner_service_arn = local.apprunner_service_arn
}

module "github" {
  source = "./github"

  github_owner           = var.github_owner
  github_repo            = var.github_repo
  aws_region             = var.aws_region
  ecr_repo_name          = var.ecr_repo_name
  deploy_role_arn        = module.oidc.deploy_role_arn
  apprunner_service_arn  = local.apprunner_service_arn
  apprunner_service_url  = local.apprunner_service_url
  backend_deploy_enabled = var.backend_deploy_enabled
}

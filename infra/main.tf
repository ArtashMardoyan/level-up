# infra — root. Applies as one state: AWS runtime (aws) → OIDC deploy role scoped
# to it (oidc) → GitHub repo configuration (github). Order is linear, no cycles.
#
#   aws  ── ecr/service ARNs ──▶ oidc ── role ARN ──▶ github
#
# Secrets are provided out-of-band (TF_VAR_*). No secret ever lands in GitHub.

provider "aws" {
  region = var.aws_region
}

# Auth: gh CLI token or GITHUB_TOKEN env with repo + workflow scopes.
provider "github" {
  owner = var.github_owner
}

module "aws" {
  source = "./aws"

  aws_region    = var.aws_region
  service_name  = var.service_name
  ecr_repo_name = var.ecr_repo_name

  db_host       = var.db_host
  db_name       = var.db_name
  db_user       = var.db_user
  db_sslmode    = var.db_sslmode
  seed_on_start = var.seed_on_start
}

module "oidc" {
  source = "./oidc"

  github_owner          = var.github_owner
  github_repo           = var.github_repo
  aws_region            = var.aws_region
  create_oidc_provider  = var.create_oidc_provider
  ecr_repository_arn    = module.aws.ecr_repository_arn
  apprunner_service_arn = module.aws.apprunner_service_arn
}

module "github" {
  source = "./github"

  github_owner           = var.github_owner
  github_repo            = var.github_repo
  aws_region             = var.aws_region
  ecr_repo_name          = var.ecr_repo_name
  deploy_role_arn        = module.oidc.deploy_role_arn
  apprunner_service_arn  = module.aws.apprunner_service_arn
  apprunner_service_url  = module.aws.apprunner_service_url
  backend_deploy_enabled = var.backend_deploy_enabled
}

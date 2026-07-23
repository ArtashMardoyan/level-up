# infra/github — repository configuration as code. With OIDC there are NO GitHub
# secrets to manage; everything the deploy workflow needs is non-secret repo
# variables plus a `production` environment (which the OIDC trust is scoped to).

variable "github_owner" { type = string }
variable "github_repo" { type = string }
variable "aws_region" { type = string }
variable "ecr_repo_name" { type = string }
variable "deploy_role_arn" { type = string }
variable "apprunner_service_arn" { type = string }
variable "apprunner_service_url" { type = string }

# Master gate for the deploy workflow. Keep false until you are ready to go live.
variable "backend_deploy_enabled" {
  type    = bool
  default = false
}

# Deploys run through this environment; the OIDC role trusts only its subject.
resource "github_repository_environment" "production" {
  repository  = var.github_repo
  environment = "production"
}

locals {
  vars = {
    BACKEND_DEPLOY_ENABLED = var.backend_deploy_enabled ? "true" : "false"
    AWS_DEPLOY_ROLE_ARN    = var.deploy_role_arn
    AWS_REGION             = var.aws_region
    ECR_REPO               = var.ecr_repo_name
    SERVICE_ARN            = var.apprunner_service_arn
    SERVICE_URL            = var.apprunner_service_url
  }
}

resource "github_actions_variable" "repo" {
  for_each      = local.vars
  repository    = var.github_repo
  variable_name = each.key
  value         = each.value
}

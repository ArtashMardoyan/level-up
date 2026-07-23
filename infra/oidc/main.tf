# infra/oidc — GitHub OIDC identity provider + the IAM role GitHub Actions assumes.
# No long-lived AWS keys and no GitHub secrets: CI exchanges a short-lived GitHub
# OIDC token for temporary AWS credentials, scoped to this repo's `production`
# environment only.

variable "github_owner" { type = string }
variable "github_repo" { type = string }
variable "aws_region" { type = string }
variable "ecr_repository_arn" { type = string }
variable "apprunner_service_arn" { type = string }

# Reuse an existing GitHub OIDC provider if the account already has one; otherwise
# create it. Toggle with `create_oidc_provider`.
variable "create_oidc_provider" {
  type    = bool
  default = true
}

locals {
  oidc_url  = "token.actions.githubusercontent.com"
  oidc_fqdn = "https://token.actions.githubusercontent.com"
  # Only the `production` environment of this repo may assume the role.
  oidc_sub = "repo:${var.github_owner}/${var.github_repo}:environment:production"
}

resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_oidc_provider ? 1 : 0
  url            = local.oidc_fqdn
  client_id_list = ["sts.amazonaws.com"]
  # GitHub's OIDC intermediate CA thumbprints (both current roots).
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 0 : 1
  url   = local.oidc_fqdn
}

locals {
  provider_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

# --- The role GitHub Actions assumes via OIDC ---
data "aws_iam_policy_document" "trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.provider_arn]
    }

    # Audience must be sts.amazonaws.com.
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_url}:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Subject must be exactly this repo's production environment.
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_url}:sub"
      values   = [local.oidc_sub]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name                 = "gha-${var.github_repo}-backend-deploy"
  description          = "Assumed by GitHub Actions (OIDC) to deploy the backend."
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

# --- Least-privilege deploy permissions: push to ONE ECR repo, deploy ONE service ---
data "aws_iam_policy_document" "deploy" {
  # ECR auth token is account-wide by API design.
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  # Push/pull only to the backend repository.
  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = [var.ecr_repository_arn]
  }

  # Observe the auto-triggered deployment of only the backend service. No write
  # actions: AutoDeployments starts the deploy when the new :latest is pushed, so
  # CI never needs apprunner:StartDeployment.
  statement {
    sid    = "AppRunnerObserve"
    effect = "Allow"
    actions = [
      "apprunner:DescribeService",
      "apprunner:ListOperations",
    ]
    resources = [var.apprunner_service_arn]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "backend-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

output "deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "oidc_provider_arn" {
  value = local.provider_arn
}

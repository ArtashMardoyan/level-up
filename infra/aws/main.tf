# infra/aws — the runtime: ECR repository, App Runner service, its IAM roles, and
# secrets in SSM Parameter Store. App Runner auto-deploys when a new :latest image
# is pushed. Secrets never appear in the service definition — they are SSM
# SecureString references resolved at runtime by the instance role.

variable "aws_region" { type = string }
variable "service_name" { type = string }
variable "ecr_repo_name" { type = string }
variable "container_port" {
  type    = number
  default = 3000
}
variable "cpu" {
  type    = string
  default = "256"
}
variable "memory" {
  type    = string
  default = "512"
}
variable "health_check_path" {
  type    = string
  default = "/ping"
}

# Non-secret runtime config.
variable "db_host" { type = string }
variable "db_name" {
  type    = string
  default = "levelup"
}
variable "db_user" {
  type    = string
  default = "postgres"
}
variable "db_sslmode" {
  type    = string
  default = "require"
}
variable "seed_on_start" {
  type    = bool
  default = true
}

# Secrets (marked sensitive; stored in SSM SecureString, not in the service def).
variable "jwt_secret" {
  type      = string
  sensitive = true
}
variable "db_password" {
  type      = string
  sensitive = true
}

data "aws_caller_identity" "current" {}

# --- ECR ---
resource "aws_ecr_repository" "backend" {
  name                 = var.ecr_repo_name
  image_tag_mutability = "MUTABLE" # :latest moves; immutable :SHA tags also pushed
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 15 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 15 }
      action       = { type = "expire" }
    }]
  })
}

# --- Secrets in SSM (SecureString) ---
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.service_name}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.service_name}/DB_PASSWORD"
  type  = "SecureString"
  value = var.db_password
}

# --- IAM: access role (pull image from ECR) ---
data "aws_iam_policy_document" "apprunner_access_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_access" {
  name               = "${var.service_name}-apprunner-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_access_trust.json
}

resource "aws_iam_role_policy_attachment" "apprunner_access_ecr" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# --- IAM: instance role (app runtime; reads secrets from SSM) ---
data "aws_iam_policy_document" "apprunner_instance_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_instance" {
  name               = "${var.service_name}-apprunner-instance"
  assume_role_policy = data.aws_iam_policy_document.apprunner_instance_trust.json
}

data "aws_iam_policy_document" "instance_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameters"]
    resources = [aws_ssm_parameter.jwt_secret.arn, aws_ssm_parameter.db_password.arn]
  }
}

resource "aws_iam_role_policy" "instance_secrets" {
  name   = "read-secrets"
  role   = aws_iam_role.apprunner_instance.id
  policy = data.aws_iam_policy_document.instance_secrets.json
}

# --- App Runner service ---
resource "aws_apprunner_service" "backend" {
  service_name = var.service_name

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = tostring(var.container_port)

        runtime_environment_variables = {
          DB_HOST       = var.db_host
          DB_PORT       = "5432"
          DB_NAME       = var.db_name
          DB_USER       = var.db_user
          DB_SSLMODE    = var.db_sslmode
          SEED_ON_START = var.seed_on_start ? "true" : "false"
        }

        runtime_environment_secrets = {
          JWT_SECRET  = aws_ssm_parameter.jwt_secret.arn
          DB_PASSWORD = aws_ssm_parameter.db_password.arn
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.cpu
    memory            = var.memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = var.health_check_path
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }
}

output "ecr_repository_url" { value = aws_ecr_repository.backend.repository_url }
output "ecr_repository_arn" { value = aws_ecr_repository.backend.arn }
output "apprunner_service_arn" { value = aws_apprunner_service.backend.arn }
output "apprunner_service_url" { value = "https://${aws_apprunner_service.backend.service_url}" }

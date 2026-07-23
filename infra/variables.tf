variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "github_owner" {
  type    = string
  default = "ArtashMardoyan"
}

variable "github_repo" {
  type    = string
  default = "level-up"
}

variable "service_name" {
  type    = string
  default = "level-up-backend"
}

variable "ecr_repo_name" {
  type    = string
  default = "level-up-backend"
}

# --- Runtime ownership ---------------------------------------------------------
# false (default): control-plane only — don't manage the live App Runner/ECR;
# reference the existing prod resources via the *_arn/_url vars below.
# true: Terraform also creates/adopts the runtime (module.aws). See main.tf.
variable "manage_runtime" {
  type    = bool
  default = false
}

# Existing prod runtime, used only when manage_runtime = false. The OIDC deploy
# role scopes ECR-push to this repo ARN and App Runner-observe to this service
# ARN; the workflow health-checks this URL.
variable "ecr_repository_arn" {
  type    = string
  default = ""
}
variable "apprunner_service_arn" {
  type    = string
  default = ""
}
variable "apprunner_service_url" {
  type    = string
  default = ""
}

# RDS connection (non-secret parts). Required only when manage_runtime = true.
variable "db_host" {
  type    = string
  default = ""
}
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

# Note: JWT_SECRET / DB_PASSWORD are NOT Terraform variables — they never pass
# through TF or its state. Set them once via `aws ssm put-parameter --overwrite`
# (see docs/devops/aws-setup.md).

# Run the idempotent seed on every deploy (server SEED_ON_START).
variable "seed_on_start" {
  type    = bool
  default = true
}

# Flip to true when ready for merge-to-master to auto-deploy the backend.
variable "backend_deploy_enabled" {
  type    = bool
  default = false
}

# Set false if the account already has a GitHub OIDC provider.
variable "create_oidc_provider" {
  type    = bool
  default = true
}

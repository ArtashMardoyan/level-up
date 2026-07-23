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

# RDS connection (non-secret parts).
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

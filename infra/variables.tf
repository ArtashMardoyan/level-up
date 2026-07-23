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

# Secrets — pass via TF_VAR_jwt_secret / TF_VAR_db_password or a non-committed
# *.auto.tfvars. Never commit real values.
variable "jwt_secret" {
  type      = string
  sensitive = true
}
variable "db_password" {
  type      = string
  sensitive = true
}

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

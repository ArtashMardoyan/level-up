terraform {
  required_version = ">= 1.4"

  # Remote state (STRONGLY recommended before any real apply): shared, locked,
  # encrypted. Bootstrap the bucket + lock table once, then uncomment and
  # `terraform init -migrate-state`. Local state is fine only for a dry `plan`.
  #
  # backend "s3" {
  #   bucket         = "level-up-tfstate"
  #   key            = "infra/terraform.tfstate"
  #   region         = "us-east-2"
  #   dynamodb_table = "level-up-tflock"
  #   encrypt        = true
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

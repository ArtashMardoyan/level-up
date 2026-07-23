output "deploy_role_arn" {
  description = "IAM role GitHub Actions assumes via OIDC (repo variable AWS_DEPLOY_ROLE_ARN)."
  value       = module.oidc.deploy_role_arn
}

output "ecr_repository_url" {
  description = "ECR repository the CI pushes images to."
  value       = module.aws.ecr_repository_url
}

output "apprunner_service_arn" {
  value = module.aws.apprunner_service_arn
}

output "apprunner_service_url" {
  description = "Public HTTPS URL of the API (health-check target)."
  value       = module.aws.apprunner_service_url
}

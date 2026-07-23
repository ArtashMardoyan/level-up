output "deploy_role_arn" {
  description = "IAM role GitHub Actions assumes via OIDC (repo variable AWS_DEPLOY_ROLE_ARN)."
  value       = module.oidc.deploy_role_arn
}

# Runtime coordinates: from module.aws when managed, else the existing prod
# resources passed in as variables (manage_runtime = false).
output "ecr_repository_url" {
  description = "ECR repository the CI pushes images to."
  value       = var.manage_runtime ? module.aws[0].ecr_repository_url : "(unmanaged: ${var.ecr_repository_arn})"
}

output "apprunner_service_arn" {
  value = local.apprunner_service_arn
}

output "apprunner_service_url" {
  description = "Public HTTPS URL of the API (health-check target)."
  value       = local.apprunner_service_url
}

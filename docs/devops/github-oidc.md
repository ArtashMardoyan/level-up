# GitHub OIDC → AWS (security & trust)

## Why OIDC (no keys, no SSO)

Traditional CI stores long-lived AWS access keys as GitHub secrets — a standing credential that can
leak. OIDC removes them entirely. On each run, GitHub issues a short-lived, signed JSON Web Token
describing *which* repo/branch/environment is running. AWS STS verifies that token against the GitHub
OIDC provider and returns **temporary** credentials (≤ 1 hour). Nothing is stored.

AWS **SSO is unrelated** to this: SSO authenticates humans locally. CI never uses SSO — it federates
through OIDC. That is precisely why full automation is possible.

**Result: zero GitHub secrets for deployment.** Only non-secret repo *variables* are needed.

## Trust relationship

The role `gha-level-up-backend-deploy` trusts the GitHub OIDC provider with two conditions:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:ArtashMardoyan/level-up:environment:production"
    }
  }
}
```

- `aud = sts.amazonaws.com` — the token was minted for AWS STS.
- `sub = repo:…:environment:production` — **only** the `production` environment of **this** repo can
  assume the role. A fork, another repo, a different branch, or a non-`production` job cannot. Using
  `StringEquals` on the exact subject (not a wildcard) is the tightest scoping.

Because the subject is pinned to the `production` environment, adding **required reviewers** to that
environment (see [deployment.md](deployment.md)) becomes a human approval gate in front of AWS.

## Least-privilege permissions

The role can do only what a deploy needs (`infra/oidc/main.tf`):

- `ecr:GetAuthorizationToken` on `*` (required by the API; cannot be resource-scoped).
- ECR push/pull (`PutImage`, `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`,
  `BatchCheckLayerAvailability`, `BatchGetImage`, `GetDownloadUrlForLayer`) **only** on the
  `level-up-backend` repository ARN.
- `apprunner:StartDeployment`, `DescribeService`, `ListOperations` **only** on the backend service ARN.

No IAM write, no S3, no broad `apprunner:*`, no access to other services.

## Runtime secrets (separate from deploy)

The deploy role never sees app secrets. `JWT_SECRET` and `DB_PASSWORD` live as **SSM SecureString**
parameters and are injected by App Runner via `runtime_environment_secrets`, resolved by the
**instance role** (`ssm:GetParameters` on just those two ARNs). Secrets never appear in the service
definition, the image, the workflow, or GitHub.

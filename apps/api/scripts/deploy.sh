#!/usr/bin/env bash
#
# One-command deploy to AWS App Runner.
#
#   ./scripts/deploy.sh
#
# Steps: build (linux/amd64) -> push to ECR (:latest + git SHA) -> App Runner
# auto-redeploys on the new :latest.
#
# Config is overridable via env vars. The ECR repo and App Runner service must
# exist first — see docs/001-deploy-aws-apprunner-rds.md for the one-time setup.

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-2}"
AWS_PROFILE="${AWS_PROFILE:-vyb-dev}"
ECR_REGISTRY="${ECR_REGISTRY:-813021164486.dkr.ecr.us-east-2.amazonaws.com}"
ECR_REPO="${ECR_REPO:-level-up-backend}"
SERVICE_ARN="${SERVICE_ARN:-arn:aws:apprunner:us-east-2:813021164486:service/level-up-backend/644ec0493c08485e82f25b91588a7e2c}"
SERVICE_URL="${SERVICE_URL:-https://iypxepsbm3.us-east-2.awsapprunner.com}"

REPO="${ECR_REGISTRY}/${ECR_REPO}"
SHA="$(git rev-parse --short HEAD)"

# repo root, regardless of cwd
cd "$(dirname "$0")/.."

aws() { command aws --region "$AWS_REGION" --profile "$AWS_PROFILE" "$@"; }

# 0. verify AWS session (SSO)
echo "==> Checking AWS credentials ($AWS_PROFILE / $AWS_REGION)"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "error: no valid AWS session. Run: aws sso login --profile $AWS_PROFILE" >&2
  exit 1
fi

# 1. build for App Runner's architecture
echo "==> Building image (linux/amd64)"
docker build --platform linux/amd64 -t "${ECR_REPO}:local" .

# 2. login to ECR
echo "==> Logging in to ECR"
aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# 3. tag + push (latest drives the auto-deploy; SHA tag keeps history)
echo "==> Pushing ${REPO}:latest and :${SHA}"
docker tag "${ECR_REPO}:local" "${REPO}:latest"
docker tag "${ECR_REPO}:local" "${REPO}:${SHA}"
docker push "${REPO}:latest"
docker push "${REPO}:${SHA}"

# 4. App Runner auto-redeploys on the new :latest. Wait until it settles.
if [[ -z "$SERVICE_ARN" ]]; then
  echo "==> SERVICE_ARN not set — image pushed, skipping redeploy wait."
  echo "    Create the App Runner service once, then set SERVICE_ARN/SERVICE_URL."
  exit 0
fi

echo "==> Waiting for App Runner to finish redeploy"
for _ in $(seq 1 60); do
  status="$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query 'Service.Status' --output text 2>/dev/null || echo UNKNOWN)"
  echo "    status: $status"
  if [[ "$status" == "RUNNING" ]]; then break; fi
  if [[ "$status" == "CREATE_FAILED" || "$status" == "DELETE_FAILED" ]]; then
    echo "error: App Runner in $status" >&2
    exit 1
  fi
  sleep 10
done

echo "==> Done. ${SERVICE_URL:-(set SERVICE_URL to print the API URL)}"

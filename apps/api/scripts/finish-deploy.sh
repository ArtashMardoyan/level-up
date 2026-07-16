#!/usr/bin/env bash
#
# One-time finish of the AWS bring-up: create the target database on RDS and
# create the App Runner service. Driven entirely by .env.prod, so no secrets are
# passed on the command line.
#
#   ./scripts/finish-deploy.sh
#
# Requires: aws, psql, jq, an active SSO session (aws sso login --profile vyb-dev),
# and a .env.prod with DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / DB_SSLMODE.

set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
PROFILE="${AWS_PROFILE:-vyb-dev}"
SERVICE_NAME="level-up-backend"

cd "$(dirname "$0")/.."

if [[ ! -f .env.prod ]]; then
  echo "error: .env.prod not found in $(pwd)" >&2
  exit 1
fi

# Load prod config. The password stays in the file and this process; it is never
# echoed or passed as a command-line argument.
set -a
# shellcheck disable=SC1091
source .env.prod
set +a

: "${DB_HOST:?DB_HOST missing in .env.prod}"
: "${DB_PASSWORD:?DB_PASSWORD missing in .env.prod}"
: "${JWT_SECRET:?JWT_SECRET missing in .env.prod}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-levelup}"

# 0. verify AWS session
if ! aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1; then
  echo "error: no AWS session — run: aws sso login --profile $PROFILE" >&2
  exit 1
fi

# 1. create the target database (idempotent), via the always-present 'postgres' db
echo "==> ensuring database '$DB_NAME' exists on $DB_HOST"
export PGPASSWORD="$DB_PASSWORD"
maint="postgres://${DB_USER}@${DB_HOST}:5432/postgres?sslmode=require"
if [[ "$(psql "$maint" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")" == "1" ]]; then
  echo "    already exists"
else
  psql "$maint" -c "CREATE DATABASE \"${DB_NAME}\";"
  echo "    created"
fi
unset PGPASSWORD

# 2. create the App Runner service (skip if it already exists)
existing="$(aws apprunner list-services --profile "$PROFILE" --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text)"

if [[ -n "$existing" ]]; then
  echo "==> App Runner service already exists, skipping create"
else
  echo "==> creating App Runner service"
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  jq --arg pw "$DB_PASSWORD" --arg jwt "$JWT_SECRET" \
    '.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables.DB_PASSWORD = $pw
     | .SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables.JWT_SECRET = $jwt' \
    scripts/apprunner-service.json > "$tmp"
  aws apprunner create-service --cli-input-json "file://$tmp" \
    --profile "$PROFILE" --region "$REGION" --query 'Service.Status' --output text
fi

# 3. wait for RUNNING and report
arn="$(aws apprunner list-services --profile "$PROFILE" --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text)"

echo "==> waiting for RUNNING ($arn)"
for _ in $(seq 1 90); do
  st="$(aws apprunner describe-service --service-arn "$arn" --profile "$PROFILE" --region "$REGION" \
    --query 'Service.Status' --output text 2>/dev/null || echo UNKNOWN)"
  echo "    status: $st"
  [[ "$st" == "RUNNING" ]] && break
  case "$st" in
    CREATE_FAILED|DELETE_FAILED) echo "error: App Runner in $st" >&2; exit 1;;
  esac
  sleep 10
done

url="$(aws apprunner describe-service --service-arn "$arn" --profile "$PROFILE" --region "$REGION" \
  --query 'Service.ServiceUrl' --output text)"

echo
echo "SERVICE_ARN=$arn"
echo "SERVICE_URL=https://$url"

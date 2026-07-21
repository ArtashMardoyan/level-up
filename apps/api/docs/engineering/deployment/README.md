---
status: "Approved"
owner: "Backend"
last_updated: "2026-07-21"
---

# Deployment — AWS (App Runner + RDS PostgreSQL)

Region: **us-east-2** · AWS CLI profile: **vyb-dev**

Architecture: `App Runner (container from ECR) → over the internet (SSL) → RDS
PostgreSQL`. goose migrations run automatically on container start.

## What's deployed (current)

| Resource | Value |
|---|---|
| **API URL** | https://iypxepsbm3.us-east-2.awsapprunner.com |
| **App Runner** | `level-up-backend` · ARN `arn:aws:apprunner:us-east-2:813021164486:service/level-up-backend/644ec0493c08485e82f25b91588a7e2c` |
| **ECR** | `813021164486.dkr.ecr.us-east-2.amazonaws.com/level-up-backend` |
| **RDS** | `level-up-backend-db` · DB `levelup` · user `postgres` · SSL required |
| **IAM role** | `AppRunnerECRAccessRole-gofirstapi` (reused) |

Env vars (`JWT_SECRET`, `DB_*`, `OPENAI_*`) are set on the App Runner service config.
First-time creation of the DB + service is done by `./scripts/finish-deploy.sh`
(reads `.env.prod`).

> Same pattern as `go-first-api`. Resources for `level-up-backend` are created **once**
> (steps 1–3); after that, a release is a single `make deploy`.

---

## Prerequisites

- AWS CLI v2 + Docker installed.
- Sign in to AWS via SSO:
  ```bash
  aws sso login --profile vyb-dev
  aws sts get-caller-identity --profile vyb-dev --region us-east-2
  ```

## Step 1 — ECR repository

```bash
aws ecr create-repository --repository-name level-up-backend \
  --region us-east-2 --profile vyb-dev --image-scanning-configuration scanOnPush=true
```

## Step 2 — RDS PostgreSQL (public, cheapest tier)

```bash
# default VPC
VPC=$(aws ec2 describe-vpcs --region us-east-2 --profile vyb-dev \
  --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)

# security group + open 5432
SG=$(aws ec2 create-security-group --region us-east-2 --profile vyb-dev \
  --group-name level-up-backend-db-sg --description "level-up-backend RDS public access" \
  --vpc-id "$VPC" --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --region us-east-2 --profile vyb-dev \
  --group-id "$SG" --protocol tcp --port 5432 --cidr 0.0.0.0/0

# instance (generate + save the password beforehand)
aws rds create-db-instance \
  --region us-east-2 --profile vyb-dev \
  --db-instance-identifier level-up-backend-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password "<GENERATED_PASSWORD>" \
  --allocated-storage 20 --storage-type gp3 \
  --db-name levelup \
  --vpc-security-group-ids "$SG" \
  --publicly-accessible \
  --backup-retention-period 1 --no-multi-az --no-deletion-protection
```

RDS requires SSL by default (`rds.force_ssl=1`) — set `DB_SSLMODE=require` on App
Runner. Locally the variable can be omitted (defaults to `disable`).

## Step 3 — App Runner service

Create the service from image `…/level-up-backend:latest` (push the image first:
`ECR_REPO=level-up-backend ./scripts/deploy.sh`). Service env vars:

```
DB_HOST=<RDS endpoint>   DB_PORT=5432   DB_NAME=levelup
DB_USER=postgres         DB_PASSWORD=<password>   DB_SSLMODE=require
```

App Runner health check → path `/ping`. Port `3000`. After creation, save the service
ARN and URL and set them in `scripts/deploy.sh` (`SERVICE_ARN`, `SERVICE_URL`) or pass
via env.

## Regular release

```bash
aws sso login --profile vyb-dev   # if the session expired
make deploy                       # build (linux/amd64) → push ECR → App Runner redeploy
```

`:latest` triggers an App Runner auto-redeploy; a git-SHA tag keeps history.

## Tearing down resources

```bash
aws apprunner delete-service --service-arn "<ARN>" --region us-east-2 --profile vyb-dev
aws rds delete-db-instance --db-instance-identifier level-up-backend-db \
  --skip-final-snapshot --region us-east-2 --profile vyb-dev
aws ecr delete-repository --repository-name level-up-backend --force \
  --region us-east-2 --profile vyb-dev
# delete the security group after it detaches from RDS
```

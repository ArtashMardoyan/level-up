# 001 — Деплой на AWS (App Runner + RDS PostgreSQL)

Регион: **us-east-2** · Профиль AWS CLI: **vyb-dev**

Архитектура: `App Runner (контейнер из ECR) → по интернету (SSL) → RDS PostgreSQL`.
Миграции goose накатываются автоматически при старте контейнера.

## Что развёрнуто (актуально)

| Ресурс | Значение |
|---|---|
| **URL API** | https://iypxepsbm3.us-east-2.awsapprunner.com |
| **App Runner** | `level-up-backend` · ARN `arn:aws:apprunner:us-east-2:813021164486:service/level-up-backend/644ec0493c08485e82f25b91588a7e2c` |
| **ECR** | `813021164486.dkr.ecr.us-east-2.amazonaws.com/level-up-backend` |
| **RDS** | `level-up-backend-db` · БД `levelup` · юзер `postgres` · SSL required |
| **IAM роль** | `AppRunnerECRAccessRole-gofirstapi` (переиспользована) |

Env-переменные (`JWT_SECRET`, `DB_*`) заданы в конфиге App Runner-сервиса.
Первичное создание БД + сервиса делает `./scripts/finish-deploy.sh` (берёт значения из `.env.prod`).

> Это тот же паттерн, что и в `go-first-api`. Ресурсы для `level-up-backend`
> создаются **один раз** (шаги 1–3), дальше выкат — одной командой `make deploy`.

---

## Предусловия

- AWS CLI v2 + Docker установлены.
- Вход в AWS через SSO:
  ```bash
  aws sso login --profile vyb-dev
  aws sts get-caller-identity --profile vyb-dev --region us-east-2
  ```

## Шаг 1. ECR — репозиторий

```bash
aws ecr create-repository --repository-name level-up-backend \
  --region us-east-2 --profile vyb-dev --image-scanning-configuration scanOnPush=true
```

## Шаг 2. RDS PostgreSQL (публичный, самый дешёвый)

```bash
# default VPC
VPC=$(aws ec2 describe-vpcs --region us-east-2 --profile vyb-dev \
  --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)

# security group + открыть 5432
SG=$(aws ec2 create-security-group --region us-east-2 --profile vyb-dev \
  --group-name level-up-backend-db-sg --description "level-up-backend RDS public access" \
  --vpc-id "$VPC" --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --region us-east-2 --profile vyb-dev \
  --group-id "$SG" --protocol tcp --port 5432 --cidr 0.0.0.0/0

# инстанс (пароль сгенерировать заранее и сохранить)
aws rds create-db-instance \
  --region us-east-2 --profile vyb-dev \
  --db-instance-identifier level-up-backend-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password "<СГЕНЕРИРОВАННЫЙ_ПАРОЛЬ>" \
  --allocated-storage 20 --storage-type gp3 \
  --db-name levelup \
  --vpc-security-group-ids "$SG" \
  --publicly-accessible \
  --backup-retention-period 1 --no-multi-az --no-deletion-protection
```

RDS по умолчанию требует SSL (`rds.force_ssl=1`) — в App Runner выставляем
`DB_SSLMODE=require`. Локально переменную можно не задавать (по умолчанию `disable`).

## Шаг 3. App Runner — сервис

Создать сервис из образа `…/level-up-backend:latest` (сначала запушить образ:
`ECR_REPO=level-up-backend ./scripts/deploy.sh`). Env-переменные сервиса:

```
DB_HOST=<endpoint RDS>   DB_PORT=5432   DB_NAME=levelup
DB_USER=postgres         DB_PASSWORD=<пароль>   DB_SSLMODE=require
```

Health check App Runner → путь `/ping`. Порт `3000`.

После создания сохранить ARN и URL сервиса и прописать их в `scripts/deploy.sh`
(`SERVICE_ARN`, `SERVICE_URL`) или передавать через env.

## Регулярный выкат

```bash
aws sso login --profile vyb-dev   # если сессия протухла
make deploy                       # build (linux/amd64) → push ECR → App Runner redeploy
```

`:latest` триггерит авто-редеплой App Runner; тег с git SHA хранит историю.

## Удаление ресурсов

```bash
aws apprunner delete-service --service-arn "<ARN>" --region us-east-2 --profile vyb-dev
aws rds delete-db-instance --db-instance-identifier level-up-backend-db \
  --skip-final-snapshot --region us-east-2 --profile vyb-dev
aws ecr delete-repository --repository-name level-up-backend --force \
  --region us-east-2 --profile vyb-dev
# security group удалить после того, как отвяжется от RDS
```

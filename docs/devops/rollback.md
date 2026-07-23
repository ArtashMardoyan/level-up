# Rollback

## Backend (App Runner)
Every deploy pushes an immutable `:<git-sha>` tag alongside `:latest`. To roll back, re-point
`:latest` at a known-good SHA and redeploy:
```bash
SHA=<good-sha>
aws ecr batch-get-image --repository-name level-up-backend \
  --image-ids imageTag=$SHA --query 'images[0].imageManifest' --output text > m.json
aws ecr put-image --repository-name level-up-backend --image-tag latest --image-manifest "$(cat m.json)"
# App Runner AutoDeployments redeploys automatically on the moved :latest tag.
```
Or simply `git revert` the offending commit on `master`; the pipeline builds and deploys the revert.
App Runner keeps the previous running version until the new one passes its health check.

## Migrations
Goose migrations run on boot. Roll back a schema change with a down migration in `apps/api/migrations`
(deploy a revert that includes it). Prefer **backward-compatible** migrations so an image rollback
never conflicts with the live schema.

## Seed / data
The seed **never deletes** and only writes changed rows, so a redeploy cannot wipe data. To remove a
course's content, delete its rows explicitly (isolated by course slug). Re-running the seed restores
content to match the committed JSON.

## Infrastructure (Terraform)
Roll back infra by reverting the change in `infra/` and `terraform apply`. `terraform plan` shows the
exact diff before anything changes. State should live in a remote backend (e.g. S3 + DynamoDB lock)
for team use.

## Emergency stop
- Set repo variable `BACKEND_DEPLOY_ENABLED=false` to halt further auto-deploys immediately.
- Pause the App Runner service (`aws apprunner pause-service`) to stop serving without deleting it.

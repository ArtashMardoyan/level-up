-- +goose Up
-- Backfill a welcome notification for every existing user that doesn't have one
-- (welcome is otherwise only created at sign-up, so accounts predating the
-- notifications feature had none). Dated to each account's creation time.
INSERT INTO notifications ("id", "userId", "type", "params", "read", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'welcome', '{}', false, u."createdAt", u."createdAt"
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n."userId" = u."id" AND n."type" = 'welcome'
);

-- +goose Down
-- Intentionally not reversed: we can't distinguish backfilled welcomes from
-- ones created at sign-up, so a down-migration would risk deleting real data.
SELECT 1;

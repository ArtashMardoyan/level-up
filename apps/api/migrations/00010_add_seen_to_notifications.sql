-- +goose Up
-- Facebook-style two-state model: `seen` (surfaced to the user, clears the
-- badge) is distinct from `read` (acted on). Reading implies seen, so backfill
-- seen = read for existing rows; unread rows stay unseen so the badge shows them.
ALTER TABLE notifications ADD COLUMN "seen" BOOLEAN NOT NULL DEFAULT false;
UPDATE notifications SET "seen" = true WHERE "read" = true;

-- +goose Down
ALTER TABLE notifications DROP COLUMN "seen";

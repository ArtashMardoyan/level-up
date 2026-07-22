-- +goose Up
-- Real streak: consecutive days with ≥1 reviewed question. Day boundaries are
-- computed in the user's timezone (sent by the client on the review request);
-- streaks start fresh (backfill defaults to 0 / NULL).
ALTER TABLE users ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN "lastActiveOn"  DATE;

-- +goose Down
ALTER TABLE users DROP COLUMN "currentStreak";
ALTER TABLE users DROP COLUMN "longestStreak";
ALTER TABLE users DROP COLUMN "lastActiveOn";

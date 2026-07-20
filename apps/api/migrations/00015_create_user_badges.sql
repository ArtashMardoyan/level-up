-- +goose Up
-- Gamification: durable achievement badges (docs/interview/015). The catalog
-- (id -> category/threshold/tier) is code-defined; this table only records that
-- a user earned a badge, and when. Awarded on interview completion, streak, and
-- reviewed-count milestones.
CREATE TABLE user_badges (
    "id"       TEXT        NOT NULL PRIMARY KEY,
    "userId"   TEXT        NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "badgeId"  TEXT        NOT NULL,
    "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_badges_user_badge_unique UNIQUE ("userId", "badgeId")
);

CREATE INDEX user_badges_user_idx ON user_badges ("userId");

-- +goose Down
DROP TABLE user_badges;

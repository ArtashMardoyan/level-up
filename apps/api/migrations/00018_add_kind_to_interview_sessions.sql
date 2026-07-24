-- +goose Up
-- Distinguish onboarding placement assessments from regular interviews (M3). A
-- placement is a short, server-configured interview whose completion seeds a new
-- user's topic_progress; this flag lets stats/history treat it separately while
-- reusing the whole interview engine. Existing rows are regular interviews.
ALTER TABLE interview_sessions
    ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'interview';

-- +goose Down
ALTER TABLE interview_sessions DROP COLUMN "kind";

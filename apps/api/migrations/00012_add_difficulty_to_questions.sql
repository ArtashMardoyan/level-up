-- +goose Up
-- Interview difficulty per question (easy | medium | hard). The interview engine
-- (docs/interview/004) selects questions by it. Existing rows default to medium;
-- easy/hard tagging is enriched in the seed content later.
ALTER TABLE questions ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';

CREATE INDEX questions_difficulty_idx ON questions ("courseId", "difficulty");

-- +goose Down
DROP INDEX questions_difficulty_idx;
ALTER TABLE questions DROP COLUMN "difficulty";

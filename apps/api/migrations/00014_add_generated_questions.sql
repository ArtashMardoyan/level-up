-- +goose Up
-- Caches each slot's AI-paraphrased question + model answer (docs/interview/004),
-- parallel-indexed with "questionIds", so resume/review always show the exact
-- text the candidate was originally asked instead of re-generating it.
ALTER TABLE interview_sessions ADD COLUMN "generatedQuestions" JSONB NOT NULL DEFAULT '[]';

-- +goose Down
ALTER TABLE interview_sessions DROP COLUMN "generatedQuestions";

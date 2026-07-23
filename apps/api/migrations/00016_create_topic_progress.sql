-- +goose Up
-- Learning Profile knowledge map (docs/product/interview/007). One durable row per
-- (user, course) that carries across interviews: an EMA-smoothed "level" 0-100, a
-- coarse "confidence", and when the topic was last practiced/improved. Updated in the
-- interview completion flow (M2). Topic = course (coarse MVP); module-level bias for
-- question selection is computed live from question_results, no rows here.
CREATE TABLE topic_progress (
    "id"              TEXT        NOT NULL PRIMARY KEY,
    "userId"          TEXT        NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "courseId"        TEXT        NOT NULL REFERENCES courses ("id") ON DELETE CASCADE,
    "level"           INTEGER     NOT NULL DEFAULT 0,
    "confidence"      TEXT        NOT NULL DEFAULT 'low',
    "samples"         INTEGER     NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMPTZ,
    "lastImprovedAt"  TIMESTAMPTZ,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT topic_progress_user_course_unique UNIQUE ("userId", "courseId")
);

CREATE INDEX topic_progress_user_idx ON topic_progress ("userId");

-- +goose Down
DROP TABLE topic_progress;

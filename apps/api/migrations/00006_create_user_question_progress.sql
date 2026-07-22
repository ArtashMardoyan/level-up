-- +goose Up
CREATE TABLE user_question_progress (
    "id"         TEXT        NOT NULL PRIMARY KEY,
    "userId"     TEXT        NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "questionId" TEXT        NOT NULL REFERENCES questions ("id") ON DELETE CASCADE,
    "reviewed"   BOOLEAN     NOT NULL DEFAULT false,
    "favorite"   BOOLEAN     NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_question_progress_user_question_unique UNIQUE ("userId", "questionId")
);

CREATE INDEX user_question_progress_user_id_idx ON user_question_progress ("userId");

-- +goose Down
DROP TABLE user_question_progress;

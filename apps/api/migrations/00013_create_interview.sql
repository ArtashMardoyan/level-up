-- +goose Up
-- AI Interview Coach (docs/interview). A session is a chat interview; each answer
-- is evaluated on submit (question_results); completion aggregates a final_report.
CREATE TABLE interview_sessions (
    "id"            TEXT        NOT NULL PRIMARY KEY,
    "userId"        TEXT        NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "courseId"      TEXT        NOT NULL REFERENCES courses ("id") ON DELETE CASCADE,
    "difficulty"    TEXT        NOT NULL DEFAULT 'medium',
    "language"      TEXT        NOT NULL DEFAULT 'en',
    "status"        TEXT        NOT NULL DEFAULT 'in_progress',
    "questionCount" INTEGER     NOT NULL DEFAULT 0,
    "questionIds"   JSONB       NOT NULL DEFAULT '[]',
    "currentIndex"  INTEGER     NOT NULL DEFAULT 0,
    "overallScore"  INTEGER,
    "startedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completedAt"   TIMESTAMPTZ,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX interview_sessions_user_created_idx ON interview_sessions ("userId", "createdAt" DESC);
-- At most one active session per user (in_progress). Partial unique index.
CREATE UNIQUE INDEX interview_sessions_one_active_idx
    ON interview_sessions ("userId")
    WHERE "status" = 'in_progress';

CREATE TABLE question_results (
    "id"            TEXT        NOT NULL PRIMARY KEY,
    "interviewId"   TEXT        NOT NULL REFERENCES interview_sessions ("id") ON DELETE CASCADE,
    "questionId"    TEXT        NOT NULL REFERENCES questions ("id") ON DELETE CASCADE,
    "userAnswer"    TEXT        NOT NULL DEFAULT '',
    "skipped"       BOOLEAN     NOT NULL DEFAULT false,
    "score"         INTEGER     NOT NULL DEFAULT 0,
    "correctness"   INTEGER     NOT NULL DEFAULT 0,
    "depth"         INTEGER     NOT NULL DEFAULT 0,
    "communication" INTEGER     NOT NULL DEFAULT 0,
    "structure"     INTEGER     NOT NULL DEFAULT 0,
    "confidence"    TEXT        NOT NULL DEFAULT '',
    "feedback"      TEXT        NOT NULL DEFAULT '',
    "strengths"     JSONB       NOT NULL DEFAULT '[]',
    "weaknesses"    JSONB       NOT NULL DEFAULT '[]',
    "evalStatus"    TEXT        NOT NULL DEFAULT 'ok',
    "evalVersion"   TEXT        NOT NULL DEFAULT '',
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT question_results_interview_question_unique UNIQUE ("interviewId", "questionId")
);

CREATE INDEX question_results_interview_idx ON question_results ("interviewId");

CREATE TABLE final_reports (
    "id"              TEXT        NOT NULL PRIMARY KEY,
    "interviewId"     TEXT        NOT NULL UNIQUE REFERENCES interview_sessions ("id") ON DELETE CASCADE,
    "overallScore"    INTEGER     NOT NULL DEFAULT 0,
    "verdict"         TEXT        NOT NULL DEFAULT '',
    "correctness"     INTEGER     NOT NULL DEFAULT 0,
    "depth"           INTEGER     NOT NULL DEFAULT 0,
    "communication"   INTEGER     NOT NULL DEFAULT 0,
    "structure"       INTEGER     NOT NULL DEFAULT 0,
    "strengths"       JSONB       NOT NULL DEFAULT '[]',
    "weaknesses"      JSONB       NOT NULL DEFAULT '[]',
    "recommendations" JSONB       NOT NULL DEFAULT '[]',
    "generatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE final_reports;
DROP TABLE question_results;
DROP TABLE interview_sessions;

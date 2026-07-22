-- +goose Up
CREATE TABLE questions (
    "id"        TEXT        NOT NULL PRIMARY KEY,
    "courseId"  TEXT        NOT NULL REFERENCES courses ("id") ON DELETE CASCADE,
    "ref"       TEXT        NOT NULL,
    "module"    TEXT        NOT NULL DEFAULT '',
    "sortOrder" INTEGER     NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT questions_course_ref_unique UNIQUE ("courseId", "ref")
);

CREATE INDEX questions_course_id_idx ON questions ("courseId");

-- +goose Down
DROP TABLE questions;

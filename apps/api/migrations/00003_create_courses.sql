-- +goose Up
CREATE TABLE courses (
    "id"        TEXT        NOT NULL PRIMARY KEY,
    "slug"      TEXT        NOT NULL,
    "title"     TEXT        NOT NULL,
    "subtitle"  TEXT        NOT NULL DEFAULT '',
    "emoji"     TEXT        NOT NULL DEFAULT '',
    "accent"    TEXT        NOT NULL DEFAULT '',
    "sortOrder" INTEGER     NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT courses_slug_unique UNIQUE ("slug")
);

-- +goose Down
DROP TABLE courses;

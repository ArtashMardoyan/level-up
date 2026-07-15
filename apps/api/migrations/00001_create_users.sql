-- +goose Up
CREATE TABLE users (
    "id"        TEXT        NOT NULL PRIMARY KEY,
    "name"      TEXT        NOT NULL,
    "email"     TEXT        NOT NULL,
    "age"       INTEGER     NOT NULL DEFAULT 0,
    "status"    TEXT        NOT NULL DEFAULT 'activated',
    "password"  TEXT        NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_unique UNIQUE ("email")
);

-- +goose Down
DROP TABLE users;

-- +goose Up
CREATE TABLE revoked_tokens (
    "jti"       TEXT        NOT NULL PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX revoked_tokens_expires_at_idx ON revoked_tokens ("expiresAt");

-- +goose Down
DROP TABLE revoked_tokens;

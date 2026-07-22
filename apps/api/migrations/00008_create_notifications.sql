-- +goose Up
CREATE TABLE notifications (
    "id"        TEXT        NOT NULL PRIMARY KEY,
    "userId"    TEXT        NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "type"      TEXT        NOT NULL,
    "params"    JSONB       NOT NULL DEFAULT '{}',
    "read"      BOOLEAN     NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_created_idx ON notifications ("userId", "createdAt" DESC);

-- +goose Down
DROP TABLE notifications;

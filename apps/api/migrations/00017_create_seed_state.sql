-- +goose Up
-- Content-checksum gate for the course seed. One row per seeded course carrying a
-- hash of that course's bundled content (meta + en.json + translation overlays +
-- the seed logic version). On seed, a course whose stored hash matches the freshly
-- computed one is skipped entirely (zero writes) — so an unchanged SEED_ON_START
-- deploy does one SELECT and no row work, and only new/edited courses touch the DB.
-- Correctness still rests on the deterministic UUIDv5 upserts; this table only
-- avoids redundant work. The hash is written in the same transaction as the course's
-- rows, so a failed course never leaves a stale hash behind.
CREATE TABLE seed_state (
    "courseSlug"  TEXT        NOT NULL PRIMARY KEY,
    "contentHash" TEXT        NOT NULL,
    "seededAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE seed_state;

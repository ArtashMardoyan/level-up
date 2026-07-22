-- +goose Up
CREATE TABLE question_translations (
    "id"         TEXT        NOT NULL PRIMARY KEY,
    "questionId" TEXT        NOT NULL REFERENCES questions ("id") ON DELETE CASCADE,
    "lang"       TEXT        NOT NULL,
    "question"   TEXT        NOT NULL,
    "answer"     TEXT        NOT NULL,
    "bonus"      TEXT        NOT NULL DEFAULT '',
    "audio"      TEXT        NOT NULL DEFAULT '',
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT question_translations_question_lang_unique UNIQUE ("questionId", "lang")
);

CREATE INDEX question_translations_question_id_idx ON question_translations ("questionId");

-- +goose Down
DROP TABLE question_translations;

// Package seed loads the bundled course content (courses, questions and their
// translations) into the database. It is idempotent and deterministic: every
// id is a UUIDv5 derived from stable content keys (course slug, course+ref for
// questions), so seeding the same content into any environment produces the
// same ids. Rerunning updates existing rows instead of creating duplicates.
package seed

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"strconv"

	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/modules/notification"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

//go:embed data
var dataFS embed.FS

// seedNamespace is a fixed UUIDv5 namespace so derived ids are identical across
// every environment seeded from the same content.
var seedNamespace = uuid.NewSHA1(uuid.NameSpaceURL, []byte("level-up-backend/courses"))

// translationLanguages are optional overlays for the English source content.
// A missing file simply keeps the English fallback active for that course.
var translationLanguages = []string{"ru", "hy"}

// seedLogicVersion is folded into every content hash. Bump it whenever the way
// this package turns content into rows changes (id derivation, column mapping,
// sort logic), so the hash gate forces a full re-seed even if the JSON is
// untouched. Pure content edits don't need a bump — their bytes change the hash.
const seedLogicVersion = 1

// Options controls a seed run.
type Options struct {
	// Slugs seeds only these courses (empty = all). An unknown slug is an error.
	Slugs []string
	// Force re-seeds even when the content hash is unchanged (bypasses the gate).
	Force bool
}

func courseID(slug string) string { return uuid.NewSHA1(seedNamespace, []byte(slug)).String() }

func questionID(slug, ref string) string {
	return uuid.NewSHA1(seedNamespace, []byte(slug+"/"+ref)).String()
}

func translationID(qID, lang string) string {
	return uuid.NewSHA1(seedNamespace, []byte(qID+":"+lang)).String()
}

type courseMeta struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Subtitle  string `json:"subtitle"`
	Emoji     string `json:"emoji"`
	Accent    string `json:"accent"`
	SortOrder int    `json:"sortOrder"`
}

type rawQuestion struct {
	ID       string `json:"id"`
	Module   string `json:"module"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Bonus    string `json:"bonus"`
	Audio    string `json:"audio"`
}

// Run seeds every course, or only opts.Slugs when given (e.g. after changing a
// single course's content/audio, to avoid touching all courses on a slow remote
// DB). An unknown slug is an error, to catch typos.
//
// Each course is gated by a content hash (seed_state): a course whose stored hash
// matches the freshly computed one is skipped entirely — no queries — unless
// opts.Force is set. Seeded courses run in a transaction so the course's rows and
// its hash commit together (a failed course never leaves a stale hash behind).
func Run(db *gorm.DB, opts Options) error {
	metas, err := loadCourses()
	if err != nil {
		return err
	}

	if len(opts.Slugs) > 0 {
		metas, err = filterCourses(metas, opts.Slugs)
		if err != nil {
			return err
		}
	}

	state, err := loadSeedState(db)
	if err != nil {
		return fmt.Errorf("load seed state: %w", err)
	}

	// Snapshot the question ids that already exist so we can tell which ones this
	// run actually adds (the upsert uses DoUpdates, so RowsAffected can't).
	existing, err := existingQuestionIDs(db)
	if err != nil {
		return fmt.Errorf("load existing questions: %w", err)
	}
	newQuestions := 0

	for i := range metas {
		meta := &metas[i]

		hash, err := courseContentHash(meta)
		if err != nil {
			return fmt.Errorf("course %s hash: %w", meta.Slug, err)
		}

		if !opts.Force && state[meta.Slug] == hash {
			fmt.Printf("course %q: unchanged, skipped\n", meta.Slug)
			continue
		}

		// One transaction per course: rows + hash commit together or not at all.
		if err := db.Transaction(func(tx *gorm.DB) error {
			return seedCourse(tx, meta, hash, existing, &newQuestions)
		}); err != nil {
			return fmt.Errorf("course %s: %w", meta.Slug, err)
		}
	}

	// Only genuinely new questions (not a no-op reseed) notify users. On a fresh
	// database everything is "new" but there are no users yet, so no fan-out.
	if newQuestions > 0 {
		if err := notifyNewQuestions(db, newQuestions); err != nil {
			return fmt.Errorf("notify new questions: %w", err)
		}
	}

	return nil
}

// seedCourse upserts one course, its questions and translations, then records the
// course's content hash — all on tx. newQuestions is incremented for each question
// id not already present (per the existing snapshot).
func seedCourse(tx *gorm.DB, meta *courseMeta, hash string, existing map[string]bool, newQuestions *int) error {
	cID := courseID(meta.Slug)

	if err := upsertCourse(tx, cID, meta); err != nil {
		return err
	}

	enQuestions, err := loadQuestions(meta.Slug, "en")
	if err != nil {
		return fmt.Errorf("en: %w", err)
	}

	translationsByLang := make(map[string]map[string]rawQuestion, len(translationLanguages))
	for _, lang := range translationLanguages {
		translations, err := loadTranslationsByRef(meta.Slug, lang)
		if err != nil {
			return fmt.Errorf("%s: %w", lang, err)
		}

		translationsByLang[lang] = translations
	}

	for j := range enQuestions {
		raw := &enQuestions[j]
		qID := questionID(meta.Slug, raw.ID)

		if !existing[qID] {
			*newQuestions++
		}

		if err := upsertQuestion(tx, qID, cID, raw, j); err != nil {
			return fmt.Errorf("question %s: %w", raw.ID, err)
		}

		if err := upsertTranslation(tx, qID, "en", raw); err != nil {
			return fmt.Errorf("translation %s en: %w", raw.ID, err)
		}

		for _, lang := range translationLanguages {
			if translated, ok := translationsByLang[lang][raw.ID]; ok {
				if err := upsertTranslation(tx, qID, lang, &translated); err != nil {
					return fmt.Errorf("translation %s %s: %w", raw.ID, lang, err)
				}
			}
		}
	}

	if err := upsertSeedState(tx, meta.Slug, hash); err != nil {
		return fmt.Errorf("seed state: %w", err)
	}

	fmt.Printf("seeded course %q: %d questions\n", meta.Slug, len(enQuestions))

	return nil
}

// courseContentHash is a stable fingerprint of everything that feeds a course's
// rows: the seed logic version, the course meta, and the raw bytes of its English
// source plus each translation overlay (a missing overlay is recorded as such).
// Any content edit or logic bump changes the hash; identical content is identical.
func courseContentHash(meta *courseMeta) (string, error) {
	h := sha256.New()

	h.Write([]byte("v" + strconv.Itoa(seedLogicVersion) + "\x00"))

	metaBytes, err := json.Marshal(meta)
	if err != nil {
		return "", err
	}
	h.Write(metaBytes)
	h.Write([]byte{0})

	for _, lang := range append([]string{"en"}, translationLanguages...) {
		bytes, err := dataFS.ReadFile(fmt.Sprintf("data/%s/%s.json", meta.Slug, lang))
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				h.Write([]byte("\x00missing\x00"))

				continue
			}

			return "", err
		}

		h.Write(bytes)
		h.Write([]byte{0})
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}

// loadSeedState returns the stored content hash per course slug.
func loadSeedState(db *gorm.DB) (map[string]string, error) {
	type row struct {
		CourseSlug  string `gorm:"column:courseSlug"`
		ContentHash string `gorm:"column:contentHash"`
	}

	var rows []row
	if err := db.Table("seed_state").Find(&rows).Error; err != nil {
		return nil, err
	}

	state := make(map[string]string, len(rows))
	for _, r := range rows {
		state[r.CourseSlug] = r.ContentHash
	}

	return state, nil
}

// upsertSeedState records (or refreshes) a course's content hash on tx.
func upsertSeedState(tx *gorm.DB, slug, hash string) error {
	return tx.Exec(
		`INSERT INTO seed_state ("courseSlug", "contentHash", "seededAt") VALUES (?, ?, NOW())
		 ON CONFLICT ("courseSlug") DO UPDATE SET "contentHash" = excluded."contentHash", "seededAt" = NOW()`,
		slug, hash,
	).Error
}

// existingQuestionIDs returns the set of question ids currently in the database.
func existingQuestionIDs(db *gorm.DB) (map[string]bool, error) {
	var ids []string
	if err := db.Table("questions").Pluck("id", &ids).Error; err != nil {
		return nil, err
	}

	set := make(map[string]bool, len(ids))
	for _, id := range ids {
		set[id] = true
	}

	return set, nil
}

// notifyNewQuestions fans out one `new_questions` notification to every user.
func notifyNewQuestions(db *gorm.DB, count int) error {
	var userIDs []string
	if err := db.Table("users").Pluck("id", &userIDs).Error; err != nil {
		return err
	}

	if len(userIDs) == 0 {
		return nil
	}

	notifs := make([]notification.Notification, 0, len(userIDs))
	for _, uid := range userIDs {
		notifs = append(notifs, notification.Notification{
			UserID: uid,
			Type:   notification.TypeNewQuestions,
			Params: notification.Params{"count": count},
		})
	}

	if err := db.CreateInBatches(notifs, 500).Error; err != nil {
		return err
	}

	fmt.Printf("notified %d users of %d new question(s)\n", len(userIDs), count)

	return nil
}

func upsertCourse(db *gorm.DB, id string, meta *courseMeta) error {
	c := course.Course{
		ID:        id,
		Slug:      meta.Slug,
		Title:     meta.Title,
		Subtitle:  meta.Subtitle,
		Emoji:     meta.Emoji,
		Accent:    meta.Accent,
		SortOrder: meta.SortOrder,
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"slug", "title", "subtitle", "emoji", "accent", "sortOrder", "updatedAt"}),
		// Update only when content actually changed, so re-seeding unchanged data is
		// a true no-op (no updatedAt churn). "excluded" is the row we tried to insert.
		Where: clause.Where{Exprs: []clause.Expression{clause.Expr{SQL: `courses.slug IS DISTINCT FROM excluded.slug OR courses.title IS DISTINCT FROM excluded.title OR courses.subtitle IS DISTINCT FROM excluded.subtitle OR courses.emoji IS DISTINCT FROM excluded.emoji OR courses.accent IS DISTINCT FROM excluded.accent OR courses."sortOrder" IS DISTINCT FROM excluded."sortOrder"`}}},
	}).Create(&c).Error
}

func upsertQuestion(db *gorm.DB, id, courseID string, raw *rawQuestion, order int) error {
	q := course.Question{
		ID:        id,
		CourseID:  courseID,
		Ref:       raw.ID,
		Module:    raw.Module,
		SortOrder: order,
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"courseId", "ref", "module", "sortOrder", "updatedAt"}),
		Where:     clause.Where{Exprs: []clause.Expression{clause.Expr{SQL: `questions."courseId" IS DISTINCT FROM excluded."courseId" OR questions.ref IS DISTINCT FROM excluded.ref OR questions.module IS DISTINCT FROM excluded.module OR questions."sortOrder" IS DISTINCT FROM excluded."sortOrder"`}}},
	}).Create(&q).Error
}

func upsertTranslation(db *gorm.DB, questionID, lang string, raw *rawQuestion) error {
	t := course.QuestionTranslation{
		ID:         translationID(questionID, lang),
		QuestionID: questionID,
		Lang:       lang,
		Question:   raw.Question,
		Answer:     raw.Answer,
		Bonus:      raw.Bonus,
		Audio:      raw.Audio,
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"question", "answer", "bonus", "audio", "updatedAt"}),
		Where:     clause.Where{Exprs: []clause.Expression{clause.Expr{SQL: `question_translations.question IS DISTINCT FROM excluded.question OR question_translations.answer IS DISTINCT FROM excluded.answer OR question_translations.bonus IS DISTINCT FROM excluded.bonus OR question_translations.audio IS DISTINCT FROM excluded.audio`}}},
	}).Create(&t).Error
}

// filterCourses keeps only the metas whose slug is in slugs, preserving the
// slugs' order (not courses.json's). Errors on any slug that matches nothing.
func filterCourses(metas []courseMeta, slugs []string) ([]courseMeta, error) {
	bySlug := make(map[string]courseMeta, len(metas))
	for _, m := range metas {
		bySlug[m.Slug] = m
	}

	filtered := make([]courseMeta, 0, len(slugs))
	for _, slug := range slugs {
		meta, ok := bySlug[slug]
		if !ok {
			return nil, fmt.Errorf("unknown course slug %q (check courses.json)", slug)
		}

		filtered = append(filtered, meta)
	}

	return filtered, nil
}

func loadCourses() ([]courseMeta, error) {
	bytes, err := dataFS.ReadFile("data/courses.json")
	if err != nil {
		return nil, err
	}

	var metas []courseMeta
	if err := json.Unmarshal(bytes, &metas); err != nil {
		return nil, err
	}

	return metas, nil
}

func loadQuestions(slug, lang string) ([]rawQuestion, error) {
	bytes, err := dataFS.ReadFile(fmt.Sprintf("data/%s/%s.json", slug, lang))
	if err != nil {
		return nil, err
	}

	var questions []rawQuestion
	if err := json.Unmarshal(bytes, &questions); err != nil {
		return nil, err
	}

	return questions, nil
}

func loadTranslationsByRef(slug, lang string) (map[string]rawQuestion, error) {
	questions, err := loadQuestions(slug, lang)
	if err != nil {
		// A missing translation file is not fatal — the course just has no
		// overlay for that language.
		if errors.Is(err, fs.ErrNotExist) {
			return map[string]rawQuestion{}, nil
		}

		return nil, err
	}

	byRef := make(map[string]rawQuestion, len(questions))
	for _, q := range questions {
		byRef[q.ID] = q
	}

	return byRef, nil
}

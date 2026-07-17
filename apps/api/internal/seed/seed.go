// Package seed loads the bundled course content (courses, questions and their
// translations) into the database. It is idempotent and deterministic: every
// id is a UUIDv5 derived from stable content keys (course slug, course+ref for
// questions), so seeding the same content into any environment produces the
// same ids. Rerunning updates existing rows instead of creating duplicates.
package seed

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"

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

func Run(db *gorm.DB) error {
	metas, err := loadCourses()
	if err != nil {
		return err
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
		cID := courseID(meta.Slug)

		if err := upsertCourse(db, cID, meta); err != nil {
			return fmt.Errorf("course %s: %w", meta.Slug, err)
		}

		enQuestions, err := loadQuestions(meta.Slug, "en")
		if err != nil {
			return fmt.Errorf("course %s en: %w", meta.Slug, err)
		}

		ruByRef, err := loadTranslationsByRef(meta.Slug, "ru")
		if err != nil {
			return fmt.Errorf("course %s ru: %w", meta.Slug, err)
		}

		for j := range enQuestions {
			raw := &enQuestions[j]
			qID := questionID(meta.Slug, raw.ID)

			if !existing[qID] {
				newQuestions++
			}

			if err := upsertQuestion(db, qID, cID, raw, j); err != nil {
				return fmt.Errorf("question %s/%s: %w", meta.Slug, raw.ID, err)
			}

			if err := upsertTranslation(db, qID, "en", raw); err != nil {
				return fmt.Errorf("translation %s/%s en: %w", meta.Slug, raw.ID, err)
			}

			if ru, ok := ruByRef[raw.ID]; ok {
				if err := upsertTranslation(db, qID, "ru", &ru); err != nil {
					return fmt.Errorf("translation %s/%s ru: %w", meta.Slug, raw.ID, err)
				}
			}
		}

		fmt.Printf("seeded course %q: %d questions\n", meta.Slug, len(enQuestions))
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
	}).Create(&t).Error
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

package course

import (
	"context"

	"gorm.io/gorm"
)

type gormCourseRepository struct {
	db *gorm.DB
}

func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &gormCourseRepository{db: db}
}

func (r *gormCourseRepository) FindAllCourses(ctx context.Context) ([]Course, error) {
	var courses []Course

	err := r.db.WithContext(ctx).Order(`"sortOrder" ASC`).Find(&courses).Error

	return courses, err
}

func (r *gormCourseRepository) CountQuestionsByCourse(ctx context.Context) (map[string]int, error) {
	var rows []struct {
		CourseID string `gorm:"column:courseId"`
		Count    int    `gorm:"column:count"`
	}

	err := r.db.WithContext(ctx).
		Model(&Question{}).
		Select(`"courseId" AS "courseId", COUNT(*) AS "count"`).
		Group(`"courseId"`).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int, len(rows))
	for _, row := range rows {
		counts[row.CourseID] = row.Count
	}

	return counts, nil
}

// ContentVersion returns an opaque token that changes whenever any course,
// question or translation is updated (used for ETag / client cache validation).
func (r *gormCourseRepository) ContentVersion(ctx context.Context) (string, error) {
	var version string

	row := r.db.WithContext(ctx).Raw(`
		SELECT COALESCE(to_char(max(m), 'YYYYMMDDHH24MISSUS'), '') FROM (
			SELECT max("updatedAt") AS m FROM courses
			UNION ALL SELECT max("updatedAt") FROM questions
			UNION ALL SELECT max("updatedAt") FROM question_translations
		) t`).Row()
	err := row.Scan(&version)

	return version, err
}

func (r *gormCourseRepository) FindCourseBySlug(ctx context.Context, slug string) (Course, error) {
	var course Course

	err := r.db.WithContext(ctx).First(&course, "slug = ?", slug).Error

	return course, err
}

func (r *gormCourseRepository) FindQuestionsByCourse(ctx context.Context, courseID string) ([]Question, error) {
	var questions []Question

	err := r.db.WithContext(ctx).
		Preload("Translations").
		Where(`"courseId" = ?`, courseID).
		Order(`"sortOrder" ASC`).
		Find(&questions).Error

	return questions, err
}

func (r *gormCourseRepository) FindQuestionByID(ctx context.Context, id string) (Question, error) {
	var question Question

	err := r.db.WithContext(ctx).First(&question, "id = ?", id).Error

	return question, err
}

// FindQuestionByIDWithTranslations loads a question together with its per-language
// translations (question text + ideal answer). Used by the interview module to
// serve a question and its model answer in the session language.
func (r *gormCourseRepository) FindQuestionByIDWithTranslations(ctx context.Context, id string) (Question, error) {
	var question Question

	err := r.db.WithContext(ctx).
		Preload("Translations").
		First(&question, "id = ?", id).Error

	return question, err
}

type gormProgressRepository struct {
	db *gorm.DB
}

func NewProgressRepository(db *gorm.DB) ProgressRepository {
	return &gormProgressRepository{db: db}
}

func (r *gormProgressRepository) FindByUser(ctx context.Context, userID string) ([]UserQuestionProgress, error) {
	var rows []UserQuestionProgress

	err := r.db.WithContext(ctx).Where(`"userId" = ?`, userID).Find(&rows).Error

	return rows, err
}

func (r *gormProgressRepository) FindByUserAndCourse(ctx context.Context, userID, courseID string) ([]UserQuestionProgress, error) {
	var rows []UserQuestionProgress

	err := r.db.WithContext(ctx).
		Joins(`JOIN questions ON questions."id" = user_question_progress."questionId"`).
		Where(`user_question_progress."userId" = ? AND questions."courseId" = ?`, userID, courseID).
		Find(&rows).Error

	return rows, err
}

func (r *gormProgressRepository) SummaryByUser(ctx context.Context, userID string) ([]CourseProgressStat, error) {
	var rows []CourseProgressStat

	err := r.db.WithContext(ctx).
		Model(&UserQuestionProgress{}).
		Select(`questions."courseId" AS "courseId", `+
			`COUNT(*) FILTER (WHERE user_question_progress."reviewed") AS "reviewed", `+
			`COUNT(*) FILTER (WHERE user_question_progress."favorite") AS "favorites"`).
		Joins(`JOIN questions ON questions."id" = user_question_progress."questionId"`).
		Where(`user_question_progress."userId" = ?`, userID).
		Group(`questions."courseId"`).
		Scan(&rows).Error

	return rows, err
}

// SavedByUser returns the user's favorited questions with the text localized to
// lang (English fallback), ordered by course then question for a stable list.
func (r *gormProgressRepository) SavedByUser(ctx context.Context, userID, lang string) ([]SavedQuestionDTO, error) {
	var rows []SavedQuestionDTO

	err := r.db.WithContext(ctx).
		Model(&UserQuestionProgress{}).
		Select(`courses."slug" AS "courseSlug", courses."title" AS "courseTitle", courses."accent" AS "accent", `+
			`questions."ref" AS "ref", questions."module" AS "module", `+
			`COALESCE(tl."question", te."question") AS "question"`).
		Joins(`JOIN questions ON questions."id" = user_question_progress."questionId"`).
		Joins(`JOIN courses ON courses."id" = questions."courseId"`).
		Joins(`LEFT JOIN question_translations tl ON tl."questionId" = questions."id" AND tl."lang" = ?`, lang).
		Joins(`LEFT JOIN question_translations te ON te."questionId" = questions."id" AND te."lang" = ?`, "en").
		Where(`user_question_progress."userId" = ? AND user_question_progress."favorite"`, userID).
		Order(`courses."sortOrder", questions."sortOrder"`).
		Scan(&rows).Error

	return rows, err
}

func (r *gormProgressRepository) FindOne(ctx context.Context, userID, questionID string) (UserQuestionProgress, error) {
	var p UserQuestionProgress

	err := r.db.WithContext(ctx).
		First(&p, `"userId" = ? AND "questionId" = ?`, userID, questionID).Error

	return p, err
}

func (r *gormProgressRepository) Create(ctx context.Context, p *UserQuestionProgress) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *gormProgressRepository) Save(ctx context.Context, p *UserQuestionProgress) error {
	return r.db.WithContext(ctx).Save(p).Error
}

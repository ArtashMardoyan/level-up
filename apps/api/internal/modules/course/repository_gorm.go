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

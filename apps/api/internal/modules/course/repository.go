package course

import "context"

// CourseProgressStat is an aggregate row for the per-user progress summary.
type CourseProgressStat struct {
	CourseID  string `gorm:"column:courseId"`
	Reviewed  int    `gorm:"column:reviewed"`
	Favorites int    `gorm:"column:favorites"`
}

type CourseRepository interface {
	FindAllCourses(ctx context.Context) ([]Course, error)
	CountQuestionsByCourse(ctx context.Context) (map[string]int, error)
	ContentVersion(ctx context.Context) (string, error)
	FindCourseBySlug(ctx context.Context, slug string) (Course, error)
	FindQuestionsByCourse(ctx context.Context, courseID string) ([]Question, error)
	FindQuestionByID(ctx context.Context, id string) (Question, error)
	FindQuestionByIDWithTranslations(ctx context.Context, id string) (Question, error)
}

type ProgressRepository interface {
	FindByUser(ctx context.Context, userID string) ([]UserQuestionProgress, error)
	FindByUserAndCourse(ctx context.Context, userID, courseID string) ([]UserQuestionProgress, error)
	SummaryByUser(ctx context.Context, userID string) ([]CourseProgressStat, error)
	SavedByUser(ctx context.Context, userID, lang string) ([]SavedQuestionDTO, error)
	FindOne(ctx context.Context, userID, questionID string) (UserQuestionProgress, error)
	Create(ctx context.Context, p *UserQuestionProgress) error
	Save(ctx context.Context, p *UserQuestionProgress) error
}

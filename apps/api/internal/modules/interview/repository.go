package interview

import (
	"context"

	"level-up-backend/internal/modules/course"
	"level-up-backend/internal/shared"
)

// ContentReader reads the question bank the interview draws from. Implemented by
// the course repository (course → interview dependency through a small interface,
// like course → notification).
type ContentReader interface {
	FindCourseBySlug(ctx context.Context, slug string) (course.Course, error)
	FindQuestionsByCourse(ctx context.Context, courseID string) ([]course.Question, error)
	FindQuestionByIDWithTranslations(ctx context.Context, id string) (course.Question, error)
}

// Repository persists interview sessions, per-answer results, and final reports.
// TopicInsight aggregates a user's evaluated (non-skipped) answers for one course
// (topic) — the read-side input to the Progress & Insights view
// (docs/product/interview/009). Scores/rubric axes are 0–100 averages.
type TopicInsight struct {
	CourseSlug    string  `gorm:"column:courseSlug"`
	CourseTitle   string  `gorm:"column:courseTitle"`
	Accent        string  `gorm:"column:accent"`
	AvgScore      float64 `gorm:"column:avgScore"`
	Answered      int     `gorm:"column:answered"`
	Correctness   float64 `gorm:"column:correctness"`
	Depth         float64 `gorm:"column:depth"`
	Communication float64 `gorm:"column:communication"`
	Structure     float64 `gorm:"column:structure"`
}

type Repository interface {
	CreateSession(ctx context.Context, s *Session) error
	FindSession(ctx context.Context, id string) (Session, error)
	FindActiveByUser(ctx context.Context, userID string) (Session, bool, error)
	UpdateSession(ctx context.Context, s *Session) error

	UpsertResult(ctx context.Context, r *QuestionResult) error
	FindResults(ctx context.Context, interviewID string) ([]QuestionResult, error)

	SaveReport(ctx context.Context, r *FinalReport) error
	FindReport(ctx context.Context, interviewID string) (FinalReport, error)

	ListByUser(ctx context.Context, userID string, q shared.PaginationQuery) (shared.PaginatedResult[Session], error)

	// SummaryByUser aggregates completed sessions: count, average and best
	// overallScore. lastCompleted is the most recently completed session, or
	// nil if the user has none.
	SummaryByUser(ctx context.Context, userID string) (total int, avgScore, bestScore float64, lastCompleted *Session, err error)

	// InsightTopicsByUser aggregates the user's evaluated answers per course,
	// weakest average first. Empty when the user has no evaluated answers.
	InsightTopicsByUser(ctx context.Context, userID string) ([]TopicInsight, error)
}

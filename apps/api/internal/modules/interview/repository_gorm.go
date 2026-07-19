package interview

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"level-up-backend/internal/shared"
)

// ErrNotFound is returned when a session or report does not exist (or is not the
// caller's). Compare with errors.Is.
var ErrNotFound = errors.New("interview: not found")

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) CreateSession(ctx context.Context, s *Session) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *gormRepository) FindSession(ctx context.Context, id string) (Session, error) {
	var s Session

	err := r.db.WithContext(ctx).First(&s, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return Session{}, ErrNotFound
	}

	return s, err
}

func (r *gormRepository) FindActiveByUser(ctx context.Context, userID string) (Session, bool, error) {
	var s Session

	err := r.db.WithContext(ctx).
		Where(`"userId" = ? AND "status" = ?`, userID, StatusInProgress).
		First(&s).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return Session{}, false, nil
	}
	if err != nil {
		return Session{}, false, err
	}

	return s, true, nil
}

func (r *gormRepository) UpdateSession(ctx context.Context, s *Session) error {
	return r.db.WithContext(ctx).Save(s).Error
}

// UpsertResult inserts or updates a per-answer result, keyed by (interviewId,
// questionId) so re-submitting an answer overwrites its evaluation.
func (r *gormRepository) UpsertResult(ctx context.Context, res *QuestionResult) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "interviewId"}, {Name: "questionId"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"userAnswer", "skipped", "score", "correctness", "depth", "communication",
			"structure", "confidence", "feedback", "strengths", "weaknesses",
			"evalStatus", "evalVersion", "updatedAt",
		}),
	}).Create(res).Error
}

func (r *gormRepository) FindResults(ctx context.Context, interviewID string) ([]QuestionResult, error) {
	var results []QuestionResult

	err := r.db.WithContext(ctx).
		Where(`"interviewId" = ?`, interviewID).
		Find(&results).Error

	return results, err
}

func (r *gormRepository) SaveReport(ctx context.Context, rep *FinalReport) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "interviewId"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"overallScore", "verdict", "correctness", "depth", "communication",
			"structure", "strengths", "weaknesses", "recommendations", "generatedAt", "updatedAt",
		}),
	}).Create(rep).Error
}

func (r *gormRepository) FindReport(ctx context.Context, interviewID string) (FinalReport, error) {
	var rep FinalReport

	err := r.db.WithContext(ctx).First(&rep, `"interviewId" = ?`, interviewID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return FinalReport{}, ErrNotFound
	}

	return rep, err
}

func (r *gormRepository) ListByUser(ctx context.Context, userID string, q shared.PaginationQuery) (shared.PaginatedResult[Session], error) {
	var (
		sessions []Session
		total    int64
	)

	base := r.db.WithContext(ctx).Model(&Session{}).Where(`"userId" = ?`, userID)

	if err := base.Count(&total).Error; err != nil {
		return shared.PaginatedResult[Session]{}, err
	}

	err := base.
		Order(`"createdAt" DESC`).
		Limit(q.Limit).
		Offset(q.Offset()).
		Find(&sessions).Error
	if err != nil {
		return shared.PaginatedResult[Session]{}, err
	}

	return shared.NewPaginatedResult(sessions, total, q), nil
}

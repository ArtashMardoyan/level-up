package notification

import (
	"context"
	"errors"

	"level-up-backend/internal/shared"
)

var ErrNotFound = errors.New("notification not found")

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListByUser(
	ctx context.Context,
	userID string,
	q shared.PaginationQuery,
) (shared.PaginatedResult[Notification], error) {
	q.Normalize()

	items, total, err := s.repo.FindByUser(ctx, userID, q)
	if err != nil {
		return shared.PaginatedResult[Notification]{}, err
	}

	return shared.NewPaginatedResult(items, total, q), nil
}

func (s *Service) UnseenCount(ctx context.Context, userID string) (int64, error) {
	return s.repo.CountUnseen(ctx, userID)
}

func (s *Service) MarkAllSeen(ctx context.Context, userID string) error {
	return s.repo.MarkAllSeen(ctx, userID)
}

func (s *Service) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *Service) MarkRead(ctx context.Context, userID, id string) error {
	affected, err := s.repo.MarkRead(ctx, userID, id)
	if err != nil {
		return err
	}

	if affected == 0 {
		return ErrNotFound
	}

	return nil
}

// Create stores a notification for a user.
func (s *Service) Create(ctx context.Context, userID string, typ Type, params Params) (Notification, error) {
	n := Notification{UserID: userID, Type: typ, Params: params}
	if err := s.repo.Create(ctx, &n); err != nil {
		return Notification{}, err
	}

	return n, nil
}

// Generator helpers invoked by other modules through their own Notifier
// interfaces. Callers treat these as best-effort — a failed notification must
// never break the parent operation (registration, progress save).
func (s *Service) NotifyWelcome(ctx context.Context, userID string) error {
	_, err := s.Create(ctx, userID, TypeWelcome, Params{})

	return err
}

func (s *Service) NotifyReviewMilestone(ctx context.Context, userID string, count int) error {
	_, err := s.Create(ctx, userID, TypeReviewMilestone, Params{"count": count})

	return err
}

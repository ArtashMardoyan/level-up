package badge

import (
	"context"
)

// Notifier emits a "badge earned" notification. notification.Service satisfies
// it. Best-effort: a nil notifier or an error never blocks the award.
type Notifier interface {
	NotifyBadgeEarned(ctx context.Context, userID, badgeID string) error
}

type Service struct {
	repo     Repository
	notifier Notifier
}

func NewService(repo Repository, notifier Notifier) *Service {
	return &Service{repo: repo, notifier: notifier}
}

// ListForUser returns the full catalog with this user's earn status (earned +
// earnedAt where held, locked otherwise), in catalog order.
func (s *Service) ListForUser(ctx context.Context, userID string) ([]BadgeView, error) {
	earned, err := s.repo.FindByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	earnedAt := make(map[string]UserBadge, len(earned))
	for _, b := range earned {
		earnedAt[b.BadgeID] = b
	}

	views := make([]BadgeView, 0, len(Catalog))
	for _, d := range Catalog {
		v := BadgeView{
			ID:        d.ID,
			Category:  string(d.Category),
			Tier:      string(d.Tier),
			Threshold: d.Threshold,
		}
		if b, ok := earnedAt[d.ID]; ok {
			at := b.EarnedAt
			v.Earned = true
			v.EarnedAt = &at
		}

		views = append(views, v)
	}

	return views, nil
}

// AwardInterviewComplete grants any interview-count and score badges reached by a
// just-completed interview and returns the IDs newly earned this call (for the
// results screen). score is the session's overall score; total is the user's
// completed-interview count including this one.
func (s *Service) AwardInterviewComplete(ctx context.Context, userID string, score, total int) ([]string, error) {
	candidates := append(reached(CategoryInterview, total), reached(CategoryScore, score)...)

	return s.award(ctx, userID, candidates)
}

// AwardStreak grants any streak badges reached at the given day count.
func (s *Service) AwardStreak(ctx context.Context, userID string, days int) error {
	_, err := s.award(ctx, userID, reached(CategoryStreak, days))

	return err
}

// AwardReview grants any review-count badges reached at the given reviewed total.
func (s *Service) AwardReview(ctx context.Context, userID string, count int) error {
	_, err := s.award(ctx, userID, reached(CategoryReview, count))

	return err
}

// award persists every candidate the user does not already hold, emits a
// best-effort notification for each, and returns the newly earned IDs. Dedup is
// done here against the user's current badges so each award fires exactly once.
func (s *Service) award(ctx context.Context, userID string, candidates []string) ([]string, error) {
	if len(candidates) == 0 {
		return nil, nil
	}

	existing, err := s.repo.FindByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	held := make(map[string]bool, len(existing))
	for _, b := range existing {
		held[b.BadgeID] = true
	}

	var newly []string
	for _, id := range candidates {
		if held[id] {
			continue
		}

		if err := s.repo.Create(ctx, &UserBadge{UserID: userID, BadgeID: id}); err != nil {
			return newly, err
		}

		held[id] = true
		newly = append(newly, id)

		if s.notifier != nil {
			_ = s.notifier.NotifyBadgeEarned(ctx, userID, id)
		}
	}

	return newly, nil
}

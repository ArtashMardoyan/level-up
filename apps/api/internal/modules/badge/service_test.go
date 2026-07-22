package badge_test

import (
	"context"
	"testing"

	"level-up-backend/internal/modules/badge"
)

// stubRepo is an in-memory badge.Repository. Create honours the (userId, badgeId)
// uniqueness so the test exercises real dedup behaviour.
type stubRepo struct {
	items []badge.UserBadge
}

func (r *stubRepo) FindByUser(_ context.Context, userID string) ([]badge.UserBadge, error) {
	var out []badge.UserBadge
	for _, b := range r.items {
		if b.UserID == userID {
			out = append(out, b)
		}
	}

	return out, nil
}

func (r *stubRepo) Create(_ context.Context, b *badge.UserBadge) error {
	for _, existing := range r.items {
		if existing.UserID == b.UserID && existing.BadgeID == b.BadgeID {
			return nil // conflict -> no-op, matches OnConflict DoNothing
		}
	}
	r.items = append(r.items, *b)

	return nil
}

// spyNotifier records which badge IDs a notification was emitted for.
type spyNotifier struct{ earned []string }

func (s *spyNotifier) NotifyBadgeEarned(_ context.Context, _, badgeID string) error {
	s.earned = append(s.earned, badgeID)

	return nil
}

func TestAwardInterviewCompleteReturnsNewBadges(t *testing.T) {
	repo := &stubRepo{}
	spy := &spyNotifier{}
	svc := badge.NewService(repo, spy)

	// First completion, perfect score: first-interview + both score badges.
	got, err := svc.AwardInterviewComplete(t.Context(), "user-1", 100, 1)
	if err != nil {
		t.Fatalf("AwardInterviewComplete: %v", err)
	}

	want := map[string]bool{"interview_first": true, "score_90": true, "score_100": true}
	if len(got) != len(want) {
		t.Fatalf("want %d new badges, got %v", len(want), got)
	}
	for _, id := range got {
		if !want[id] {
			t.Errorf("unexpected badge awarded: %s", id)
		}
	}
	if len(spy.earned) != len(want) {
		t.Errorf("want %d notifications, got %d", len(want), len(spy.earned))
	}
}

func TestAwardIsIdempotent(t *testing.T) {
	repo := &stubRepo{}
	svc := badge.NewService(repo, &spyNotifier{})

	if _, err := svc.AwardInterviewComplete(t.Context(), "user-1", 80, 1); err != nil {
		t.Fatalf("first award: %v", err)
	}

	// Re-running with the same reach earns nothing new (interview_first + no score
	// badge, since 80 < 90). A second call must return no new badges.
	got, err := svc.AwardInterviewComplete(t.Context(), "user-1", 80, 1)
	if err != nil {
		t.Fatalf("second award: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("re-award must earn nothing new, got %v", got)
	}
}

func TestAwardStreakThresholds(t *testing.T) {
	repo := &stubRepo{}
	svc := badge.NewService(repo, &spyNotifier{})

	// Day 7 reaches both streak_3 and streak_7.
	if err := svc.AwardStreak(t.Context(), "user-1", 7); err != nil {
		t.Fatalf("AwardStreak: %v", err)
	}

	held, _ := repo.FindByUser(t.Context(), "user-1")
	if len(held) != 2 {
		t.Fatalf("want streak_3 + streak_7 held, got %d", len(held))
	}
}

func TestListForUserMarksEarned(t *testing.T) {
	repo := &stubRepo{}
	svc := badge.NewService(repo, &spyNotifier{})
	_ = svc.AwardStreak(t.Context(), "user-1", 3)

	views, err := svc.ListForUser(t.Context(), "user-1")
	if err != nil {
		t.Fatalf("ListForUser: %v", err)
	}
	if len(views) != len(badge.Catalog) {
		t.Fatalf("want full catalog of %d, got %d", len(badge.Catalog), len(views))
	}

	var earned int
	for _, v := range views {
		if v.Earned {
			earned++
			if v.ID != "streak_3" {
				t.Errorf("only streak_3 should be earned, got %s", v.ID)
			}
			if v.EarnedAt == nil {
				t.Errorf("earned badge %s must carry earnedAt", v.ID)
			}
		}
	}
	if earned != 1 {
		t.Fatalf("want exactly 1 earned badge, got %d", earned)
	}
}

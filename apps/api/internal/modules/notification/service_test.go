package notification_test

import (
	"context"
	"errors"
	"testing"

	"level-up-backend/internal/modules/notification"
	"level-up-backend/internal/shared"
)

// stubRepo is an in-memory notification.Repository for service tests.
type stubRepo struct {
	items []notification.Notification
}

func (r *stubRepo) Create(_ context.Context, n *notification.Notification) error {
	if n.ID == "" {
		n.ID = "n" + string(rune('0'+len(r.items)))
	}
	r.items = append(r.items, *n)

	return nil
}

func (r *stubRepo) FindByUser(
	_ context.Context,
	userID string,
	_ shared.PaginationQuery,
) ([]notification.Notification, int64, error) {
	var out []notification.Notification
	for _, n := range r.items {
		if n.UserID == userID {
			out = append(out, n)
		}
	}

	return out, int64(len(out)), nil
}

func (r *stubRepo) CountUnseen(_ context.Context, userID string) (int64, error) {
	var count int64
	for _, n := range r.items {
		if n.UserID == userID && !n.Seen {
			count++
		}
	}

	return count, nil
}

func (r *stubRepo) MarkAllSeen(_ context.Context, userID string) error {
	for i := range r.items {
		if r.items[i].UserID == userID {
			r.items[i].Seen = true
		}
	}

	return nil
}

func (r *stubRepo) MarkAllRead(_ context.Context, userID string) error {
	for i := range r.items {
		if r.items[i].UserID == userID {
			r.items[i].Read = true
			r.items[i].Seen = true
		}
	}

	return nil
}

func (r *stubRepo) MarkRead(_ context.Context, userID, id string) (int64, error) {
	for i := range r.items {
		if r.items[i].ID == id && r.items[i].UserID == userID {
			r.items[i].Read = true
			r.items[i].Seen = true
			return 1, nil
		}
	}

	return 0, nil
}

func TestNotifyWelcomeAndUnseenCount(t *testing.T) {
	repo := &stubRepo{}
	svc := notification.NewService(repo)

	if err := svc.NotifyWelcome(t.Context(), "user-1"); err != nil {
		t.Fatalf("NotifyWelcome: %v", err)
	}

	count, err := svc.UnseenCount(t.Context(), "user-1")
	if err != nil {
		t.Fatalf("UnseenCount: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 unseen, got %d", count)
	}

	if repo.items[0].Type != notification.TypeWelcome {
		t.Errorf("expected welcome type, got %q", repo.items[0].Type)
	}
}

// Seen and read are distinct: opening the list marks everything seen (badge
// clears) but leaves read untouched.
func TestMarkAllSeenDoesNotMarkRead(t *testing.T) {
	repo := &stubRepo{}
	svc := notification.NewService(repo)
	_ = svc.NotifyWelcome(t.Context(), "user-1")

	if err := svc.MarkAllSeen(t.Context(), "user-1"); err != nil {
		t.Fatalf("MarkAllSeen: %v", err)
	}

	count, _ := svc.UnseenCount(t.Context(), "user-1")
	if count != 0 {
		t.Fatalf("expected 0 unseen after mark-all-seen, got %d", count)
	}
	if repo.items[0].Read {
		t.Error("mark-all-seen must not mark read")
	}
}

func TestNotifyReviewMilestoneParams(t *testing.T) {
	repo := &stubRepo{}
	svc := notification.NewService(repo)

	if err := svc.NotifyReviewMilestone(t.Context(), "user-1", 10); err != nil {
		t.Fatalf("NotifyReviewMilestone: %v", err)
	}

	got := repo.items[0]
	if got.Type != notification.TypeReviewMilestone {
		t.Errorf("expected review_milestone type, got %q", got.Type)
	}
	if got.Params["count"] != 10 {
		t.Errorf("expected count=10 param, got %v", got.Params["count"])
	}
}

func TestMarkAllRead(t *testing.T) {
	repo := &stubRepo{}
	svc := notification.NewService(repo)
	_ = svc.NotifyWelcome(t.Context(), "user-1")
	_ = svc.NotifyReviewMilestone(t.Context(), "user-1", 10)

	if err := svc.MarkAllRead(t.Context(), "user-1"); err != nil {
		t.Fatalf("MarkAllRead: %v", err)
	}

	count, _ := svc.UnseenCount(t.Context(), "user-1")
	if count != 0 {
		t.Fatalf("expected 0 unseen after mark-all-read, got %d", count)
	}
	if !repo.items[0].Read {
		t.Error("mark-all-read must mark read")
	}
}

func TestParamsRoundTrip(t *testing.T) {
	p := notification.Params{"count": 10, "course": "Node.js"}

	v, err := p.Value()
	if err != nil {
		t.Fatalf("Value: %v", err)
	}

	var back notification.Params
	if err := back.Scan(v); err != nil {
		t.Fatalf("Scan: %v", err)
	}
	if back["course"] != "Node.js" {
		t.Errorf("course param lost in round trip: %v", back["course"])
	}
}

func TestMarkReadNotFound(t *testing.T) {
	repo := &stubRepo{}
	svc := notification.NewService(repo)
	_ = svc.NotifyWelcome(t.Context(), "user-1")

	// Another user's id (or a missing one) must not be markable.
	if err := svc.MarkRead(t.Context(), "user-2", repo.items[0].ID); !errors.Is(err, notification.ErrNotFound) {
		t.Fatalf("expected ErrNotFound for foreign notification, got %v", err)
	}

	if err := svc.MarkRead(t.Context(), "user-1", repo.items[0].ID); err != nil {
		t.Fatalf("expected owner mark-read to succeed, got %v", err)
	}
}

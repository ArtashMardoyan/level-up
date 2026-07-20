package user_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/shared"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// stubUserRepo is an in-memory user.Repository for service tests. byEmail lets a
// test seed a "different account already owns this email" collision.
type stubUserRepo struct {
	byID    map[string]user.User
	byEmail map[string]user.User
	saved   *user.User
}

func newStubUserRepo(seed *user.User) *stubUserRepo {
	return &stubUserRepo{
		byID:    map[string]user.User{seed.ID: *seed},
		byEmail: map[string]user.User{seed.Email: *seed},
	}
}

func (*stubUserRepo) FindAll(context.Context, shared.PaginationQuery) ([]user.User, int64, error) {
	return nil, 0, nil
}

func (s *stubUserRepo) FindByID(_ context.Context, id string) (user.User, error) {
	u, ok := s.byID[id]
	if !ok {
		return user.User{}, gorm.ErrRecordNotFound
	}

	return u, nil
}

func (s *stubUserRepo) FindByEmail(_ context.Context, email string) (user.User, error) {
	u, ok := s.byEmail[email]
	if !ok {
		return user.User{}, gorm.ErrRecordNotFound
	}

	return u, nil
}

func (*stubUserRepo) Create(context.Context, *user.User) error { return nil }

func (s *stubUserRepo) Save(_ context.Context, u *user.User) error {
	saved := *u
	s.saved = &saved
	s.byID[u.ID] = saved

	return nil
}

func (*stubUserRepo) Delete(context.Context, string) error { return nil }

func seedUser(t *testing.T) *user.User {
	t.Helper()

	hashed, err := bcrypt.GenerateFromPassword([]byte("current-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("hash seed password: %v", err)
	}

	return &user.User{
		ID:       "user-1",
		Name:     "Old Name",
		Email:    "old@example.com",
		Age:      30,
		Password: string(hashed),
	}
}

// spyNotifier counts notification emissions for assertions.
type spyNotifier struct{ welcome, daily int }

func (s *spyNotifier) NotifyWelcome(context.Context, string) error { s.welcome++; return nil }
func (s *spyNotifier) NotifyDaily(context.Context, string) error   { s.daily++; return nil }

// spyBadges records the streak day counts awarding was attempted for.
type spyBadges struct{ streakDays []int }

func (s *spyBadges) AwardStreak(_ context.Context, _ string, days int) error {
	s.streakDays = append(s.streakDays, days)

	return nil
}

func TestRecordActivityEmitsDailyOncePerDay(t *testing.T) {
	spy := &spyNotifier{}
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, spy, nil)

	if err := svc.RecordActivity(t.Context(), "user-1", "UTC"); err != nil {
		t.Fatalf("RecordActivity: %v", err)
	}
	if spy.daily != 1 {
		t.Fatalf("first activity of the day should emit 1 daily, got %d", spy.daily)
	}

	// Same-day activity is a no-op: no second daily.
	_ = svc.RecordActivity(t.Context(), "user-1", "UTC")
	if spy.daily != 1 {
		t.Fatalf("same-day activity must not re-emit daily, got %d", spy.daily)
	}
}

func TestRecordActivityStreak(t *testing.T) {
	dateDaysAgo := func(n int) *time.Time {
		y, m, d := time.Now().UTC().AddDate(0, 0, -n).Date()
		dt := time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
		return &dt
	}

	t.Run("first activity starts streak at 1", func(t *testing.T) {
		repo := newStubUserRepo(seedUser(t))
		svc := user.NewService(repo, nil, nil)

		if err := svc.RecordActivity(t.Context(), "user-1", "UTC"); err != nil {
			t.Fatalf("RecordActivity: %v", err)
		}
		if repo.saved.CurrentStreak != 1 {
			t.Fatalf("want streak 1, got %d", repo.saved.CurrentStreak)
		}
	})

	t.Run("active yesterday increments", func(t *testing.T) {
		u := seedUser(t)
		u.CurrentStreak, u.LongestStreak, u.LastActiveOn = 1, 1, dateDaysAgo(1)
		repo := newStubUserRepo(u)
		svc := user.NewService(repo, nil, nil)

		_ = svc.RecordActivity(t.Context(), "user-1", "UTC")
		if repo.saved.CurrentStreak != 2 {
			t.Fatalf("want streak 2, got %d", repo.saved.CurrentStreak)
		}
	})

	t.Run("reaching a milestone awards a streak badge", func(t *testing.T) {
		u := seedUser(t)
		u.CurrentStreak, u.LongestStreak, u.LastActiveOn = 2, 2, dateDaysAgo(1)
		repo := newStubUserRepo(u)
		badges := &spyBadges{}
		svc := user.NewService(repo, nil, badges)

		_ = svc.RecordActivity(t.Context(), "user-1", "UTC")
		if repo.saved.CurrentStreak != 3 {
			t.Fatalf("want streak 3, got %d", repo.saved.CurrentStreak)
		}
		if len(badges.streakDays) != 1 || badges.streakDays[0] != 3 {
			t.Fatalf("want streak badge awarded at day 3, got %v", badges.streakDays)
		}
	})

	t.Run("same day is a no-op", func(t *testing.T) {
		u := seedUser(t)
		u.CurrentStreak, u.LongestStreak, u.LastActiveOn = 5, 5, dateDaysAgo(0)
		repo := newStubUserRepo(u)
		svc := user.NewService(repo, nil, nil)

		_ = svc.RecordActivity(t.Context(), "user-1", "UTC")
		if repo.saved != nil {
			t.Fatal("same-day activity must not write")
		}
		current, _, _ := svc.Streak(t.Context(), "user-1")
		if current != 5 {
			t.Fatalf("want streak 5, got %d", current)
		}
	})

	t.Run("gap resets to 1 but keeps longest", func(t *testing.T) {
		u := seedUser(t)
		u.CurrentStreak, u.LongestStreak, u.LastActiveOn = 9, 9, dateDaysAgo(3)
		repo := newStubUserRepo(u)
		svc := user.NewService(repo, nil, nil)

		_ = svc.RecordActivity(t.Context(), "user-1", "UTC")
		if repo.saved.CurrentStreak != 1 {
			t.Fatalf("want streak reset to 1, got %d", repo.saved.CurrentStreak)
		}
		if repo.saved.LongestStreak != 9 {
			t.Fatalf("want longest 9 kept, got %d", repo.saved.LongestStreak)
		}
	})
}

func TestUpdateFields(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, nil, nil)

	got, err := svc.Update(t.Context(), "user-1", &user.UpdateDTO{
		Name:  "New Name",
		Email: "new@example.com",
		Bio:   "Backend engineer",
		Track: "Backend",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if got.Name != "New Name" || got.Email != "new@example.com" {
		t.Errorf("identity not updated: %+v", got)
	}
	if got.Bio != "Backend engineer" || got.Track != "Backend" {
		t.Errorf("bio/track not updated: bio=%q track=%q", got.Bio, got.Track)
	}
}

func TestUpdateEmailTaken(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	// A different account already owns the target email.
	repo.byEmail["taken@example.com"] = user.User{ID: "user-2", Email: "taken@example.com"}
	svc := user.NewService(repo, nil, nil)

	_, err := svc.Update(t.Context(), "user-1", &user.UpdateDTO{Email: "taken@example.com"})
	if !errors.Is(err, user.ErrEmailTaken) {
		t.Fatalf("expected ErrEmailTaken, got %v", err)
	}
}

func TestUpdatePasswordWrongCurrent(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, nil, nil)

	_, err := svc.Update(t.Context(), "user-1", &user.UpdateDTO{
		CurrentPassword: "wrong-password",
		NewPassword:     "brand-new-password",
	})
	if !errors.Is(err, user.ErrWrongPassword) {
		t.Fatalf("expected ErrWrongPassword, got %v", err)
	}
}

func TestUpdatePasswordSuccess(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, nil, nil)

	if _, err := svc.Update(t.Context(), "user-1", &user.UpdateDTO{
		CurrentPassword: "current-password",
		NewPassword:     "brand-new-password",
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.saved == nil {
		t.Fatal("expected user to be saved")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(repo.saved.Password), []byte("brand-new-password")); err != nil {
		t.Errorf("new password not hashed/stored: %v", err)
	}
}

package user

import (
	"context"
	"errors"
	"time"

	"level-up-backend/internal/shared"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrNotFound      = errors.New("user not found")
	ErrEmailTaken    = errors.New("email already in use")
	ErrWrongPassword = errors.New("current password is incorrect")
)

// streakMilestones fire a streak notification when currentStreak lands exactly
// on one of these day counts.
var streakMilestones = map[int]bool{3: true, 7: true, 14: true, 30: true, 100: true}

// Notifier lets the user service emit notifications (welcome, streak) without
// depending on the notification package (notification.Service satisfies it).
// Best-effort: a nil notifier or an error never blocks the parent operation.
type Notifier interface {
	NotifyWelcome(ctx context.Context, userID string) error
	NotifyStreak(ctx context.Context, userID string, days int) error
}

type Service struct {
	repo     Repository
	notifier Notifier
}

func NewService(repo Repository, notifier Notifier) *Service {
	return &Service{repo: repo, notifier: notifier}
}

func (s *Service) FindAll(ctx context.Context, q shared.PaginationQuery) (shared.PaginatedResult[User], error) {
	q.Normalize()

	users, total, err := s.repo.FindAll(ctx, q)
	if err != nil {
		return shared.PaginatedResult[User]{}, err
	}

	return shared.NewPaginatedResult(users, total, q), nil
}

func (s *Service) FindByID(ctx context.Context, id string) (User, error) {
	u, err := s.repo.FindByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, ErrNotFound
	}

	return u, err
}

func (s *Service) FindByEmail(ctx context.Context, email string) (User, error) {
	u, err := s.repo.FindByEmail(ctx, email)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, ErrNotFound
	}

	return u, err
}

func (s *Service) Create(ctx context.Context, dto CreateDTO) (User, error) {
	if _, err := s.repo.FindByEmail(ctx, dto.Email); !errors.Is(err, gorm.ErrRecordNotFound) {
		if err == nil {
			return User{}, ErrEmailTaken
		}

		return User{}, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, err
	}

	u := User{
		Name:     dto.Name,
		Email:    dto.Email,
		Password: string(hashed),
		Age:      dto.Age,
		Status:   StatusActivated,
	}

	if err := s.repo.Create(ctx, &u); err != nil {
		return User{}, err
	}

	// Welcome the new account. Best-effort: a failure here must not fail sign-up.
	if s.notifier != nil {
		_ = s.notifier.NotifyWelcome(ctx, u.ID)
	}

	return u, nil
}

func (s *Service) Update(ctx context.Context, id string, dto *UpdateDTO) (User, error) {
	u, err := s.FindByID(ctx, id)
	if err != nil {
		return User{}, err
	}

	if dto.Name != "" {
		u.Name = dto.Name
	}

	if dto.Age > 0 {
		u.Age = dto.Age
	}

	// Email is unique: reject a change that collides with a different account.
	if dto.Email != "" && dto.Email != u.Email {
		existing, err := s.repo.FindByEmail(ctx, dto.Email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return User{}, err
		}
		if err == nil && existing.ID != id {
			return User{}, ErrEmailTaken
		}

		u.Email = dto.Email
	}

	// Bio and Track are free-text: the edit form always sends them, so assign
	// directly (an empty value is a deliberate clear, not "unset").
	u.Bio = dto.Bio
	u.Track = dto.Track

	// Password change requires the current password to match.
	if dto.NewPassword != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(dto.CurrentPassword)); err != nil {
			return User{}, ErrWrongPassword
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(dto.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return User{}, err
		}

		u.Password = string(hashed)
	}

	if err := s.repo.Save(ctx, &u); err != nil {
		return User{}, err
	}

	return u, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	if _, err := s.FindByID(ctx, id); err != nil {
		return err
	}

	return s.repo.Delete(ctx, id)
}

// localToday returns the user's current calendar date, pinned to UTC midnight so
// it round-trips cleanly through a DATE column regardless of driver tz handling.
func localToday(tz string) time.Time {
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc = time.UTC
	}

	y, m, d := time.Now().In(loc).Date()

	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func sameDay(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()

	return ay == by && am == bm && ad == bd
}

// RecordActivity advances the user's streak for a qualifying action (a reviewed
// question), using `tz` (IANA name from the client) for the day boundary. Same
// day → no-op; the local yesterday → +1; a gap → reset to 1. Fires a streak
// notification on a milestone. Best-effort: callers ignore the error.
func (s *Service) RecordActivity(ctx context.Context, userID, tz string) error {
	u, err := s.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	today := localToday(tz)
	if u.LastActiveOn != nil {
		if sameDay(*u.LastActiveOn, today) {
			return nil
		}

		if sameDay(*u.LastActiveOn, today.AddDate(0, 0, -1)) {
			u.CurrentStreak++
		} else {
			u.CurrentStreak = 1
		}
	} else {
		u.CurrentStreak = 1
	}

	u.LastActiveOn = &today
	if u.CurrentStreak > u.LongestStreak {
		u.LongestStreak = u.CurrentStreak
	}

	if err := s.repo.Save(ctx, &u); err != nil {
		return err
	}

	if s.notifier != nil && streakMilestones[u.CurrentStreak] {
		_ = s.notifier.NotifyStreak(ctx, userID, u.CurrentStreak)
	}

	return nil
}

// Streak returns the user's current and longest streak (0/0 if unknown).
func (s *Service) Streak(ctx context.Context, userID string) (current, longest int, err error) {
	u, err := s.FindByID(ctx, userID)
	if err != nil {
		return 0, 0, err
	}

	return u.CurrentStreak, u.LongestStreak, nil
}

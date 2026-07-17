package user_test

import (
	"context"
	"errors"
	"testing"

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

func TestUpdateFields(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, nil)

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
	svc := user.NewService(repo, nil)

	_, err := svc.Update(t.Context(), "user-1", &user.UpdateDTO{Email: "taken@example.com"})
	if !errors.Is(err, user.ErrEmailTaken) {
		t.Fatalf("expected ErrEmailTaken, got %v", err)
	}
}

func TestUpdatePasswordWrongCurrent(t *testing.T) {
	repo := newStubUserRepo(seedUser(t))
	svc := user.NewService(repo, nil)

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
	svc := user.NewService(repo, nil)

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

package user

import (
	"context"
	"errors"

	"level-up-backend/internal/shared"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrNotFound      = errors.New("user not found")
	ErrEmailTaken    = errors.New("email already in use")
	ErrWrongPassword = errors.New("current password is incorrect")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
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

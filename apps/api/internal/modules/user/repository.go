package user

import (
	"context"

	"level-up-backend/internal/shared"
)

type Repository interface {
	FindAll(ctx context.Context, q shared.PaginationQuery) ([]User, int64, error)
	FindByID(ctx context.Context, id string) (User, error)
	FindByEmail(ctx context.Context, email string) (User, error)
	Create(ctx context.Context, u *User) error
	Save(ctx context.Context, u *User) error
	Delete(ctx context.Context, id string) error
}

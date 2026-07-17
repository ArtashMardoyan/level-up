package notification

import (
	"context"

	"level-up-backend/internal/shared"
)

type Repository interface {
	Create(ctx context.Context, n *Notification) error
	FindByUser(ctx context.Context, userID string, q shared.PaginationQuery) ([]Notification, int64, error)
	CountUnread(ctx context.Context, userID string) (int64, error)
	MarkAllRead(ctx context.Context, userID string) error
	// MarkRead flips one notification read and returns the affected row count so
	// the service can 404 when the id is missing or owned by another user.
	MarkRead(ctx context.Context, userID, id string) (int64, error)
}

package badge

import "context"

// Repository persists which badges a user has earned. The catalog is code-defined
// (catalog.go), so there is nothing to store for the definitions themselves.
type Repository interface {
	FindByUser(ctx context.Context, userID string) ([]UserBadge, error)
	// Create records a newly earned badge. A duplicate (userId, badgeId) is a
	// no-op, not an error — awarding is idempotent (see service.award).
	Create(ctx context.Context, b *UserBadge) error
}

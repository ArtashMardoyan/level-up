package badge

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) FindByUser(ctx context.Context, userID string) ([]UserBadge, error) {
	var items []UserBadge
	err := r.db.WithContext(ctx).
		Where(`"userId" = ?`, userID).
		Order(`"earnedAt" ASC`).
		Find(&items).Error

	return items, err
}

func (r *gormRepository) Create(ctx context.Context, b *UserBadge) error {
	// A concurrent award could race on the unique (userId, badgeId) index; treat a
	// conflict as a no-op so awarding stays idempotent even under a race.
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(b).Error
}

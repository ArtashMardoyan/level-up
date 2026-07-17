package notification

import (
	"context"

	"level-up-backend/internal/shared"

	"gorm.io/gorm"
)

type gormRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &gormRepository{db: db}
}

func (r *gormRepository) Create(ctx context.Context, n *Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *gormRepository) FindByUser(
	ctx context.Context,
	userID string,
	q shared.PaginationQuery,
) ([]Notification, int64, error) {
	var items []Notification
	var total int64

	if err := r.db.WithContext(ctx).Model(&Notification{}).Where(`"userId" = ?`, userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.WithContext(ctx).
		Where(`"userId" = ?`, userID).
		Order(`"createdAt" DESC`).
		Offset(q.Offset()).
		Limit(q.Limit).
		Find(&items).Error
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *gormRepository) CountUnread(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&Notification{}).
		Where(`"userId" = ? AND "read" = ?`, userID, false).
		Count(&count).Error

	return count, err
}

func (r *gormRepository) MarkAllRead(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&Notification{}).
		Where(`"userId" = ? AND "read" = ?`, userID, false).
		Update("read", true).Error
}

func (r *gormRepository) MarkRead(ctx context.Context, userID, id string) (int64, error) {
	res := r.db.WithContext(ctx).
		Model(&Notification{}).
		Where(`"id" = ? AND "userId" = ?`, id, userID).
		Update("read", true)

	return res.RowsAffected, res.Error
}

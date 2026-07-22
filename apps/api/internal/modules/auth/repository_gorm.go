package auth

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type gormRevokedTokenRepository struct {
	db *gorm.DB
}

func NewRevokedTokenRepository(db *gorm.DB) RevokedTokenRepository {
	return &gormRevokedTokenRepository{db: db}
}

func (r *gormRevokedTokenRepository) Revoke(ctx context.Context, jti string, expiresAt time.Time) error {
	return r.db.WithContext(ctx).Create(&RevokedToken{JTI: jti, ExpiresAt: expiresAt}).Error
}

func (r *gormRevokedTokenRepository) IsRevoked(ctx context.Context, jti string) (bool, error) {
	var count int64

	err := r.db.WithContext(ctx).Model(&RevokedToken{}).Where("jti = ?", jti).Count(&count).Error

	return count > 0, err
}

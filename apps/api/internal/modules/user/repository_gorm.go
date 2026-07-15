package user

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

func (r *gormRepository) FindAll(ctx context.Context, q shared.PaginationQuery) ([]User, int64, error) {
	var users []User
	var total int64

	if err := r.db.WithContext(ctx).Model(&User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).Offset(q.Offset()).Limit(q.Limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *gormRepository) FindByID(ctx context.Context, id string) (User, error) {
	var u User

	err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error

	return u, err
}

func (r *gormRepository) FindByEmail(ctx context.Context, email string) (User, error) {
	var u User

	err := r.db.WithContext(ctx).First(&u, "email = ?", email).Error

	return u, err
}

func (r *gormRepository) Create(ctx context.Context, u *User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *gormRepository) Save(ctx context.Context, u *User) error {
	return r.db.WithContext(ctx).Save(u).Error
}

func (r *gormRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&User{}, "id = ?", id).Error
}

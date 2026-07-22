package badge

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserBadge is the durable record that a user earned a catalog badge, and when.
// The catalog itself (id → category/threshold/tier) is code-defined in
// catalog.go; this table only tracks ownership. A unique (userId, badgeId)
// constraint keeps a badge single-award.
type UserBadge struct {
	ID       string    `json:"id"       gorm:"primaryKey"`
	UserID   string    `json:"userId"   gorm:"column:userId"`
	BadgeID  string    `json:"badgeId"  gorm:"column:badgeId"`
	EarnedAt time.Time `json:"earnedAt" gorm:"column:earnedAt"`
}

func (UserBadge) TableName() string { return "user_badges" }

func (b *UserBadge) BeforeCreate(_ *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.NewString()
	}
	if b.EarnedAt.IsZero() {
		b.EarnedAt = time.Now()
	}

	return nil
}

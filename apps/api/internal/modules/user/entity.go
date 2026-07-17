package user

import (
	"time"

	"level-up-backend/internal/shared"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	shared.Base
	ID    string `json:"id"       gorm:"primaryKey"`
	Name  string `json:"name"`
	Email string `json:"email"    gorm:"uniqueIndex"`
	Age   int    `json:"age"`
	Bio   string `json:"bio"`
	Track string `json:"track"`
	// Streak: consecutive days with ≥1 reviewed question (day boundary in the
	// user's timezone). LastActiveOn is the last counted day (a DATE).
	CurrentStreak int        `json:"currentStreak" gorm:"column:currentStreak"`
	LongestStreak int        `json:"longestStreak" gorm:"column:longestStreak"`
	LastActiveOn  *time.Time `json:"-"             gorm:"column:lastActiveOn"`
	Status        Status     `json:"status"   gorm:"default:activated"`
	Password      string     `json:"-"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}

	return nil
}

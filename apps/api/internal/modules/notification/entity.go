package notification

import (
	"level-up-backend/internal/shared"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Type is the notification kind. The client maps it to an icon, accent, and a
// localized title/body; the wording never lives on the server.
type Type string

const (
	TypeWelcome         Type = "welcome"
	TypeReviewMilestone Type = "review_milestone"
)

type Notification struct {
	shared.Base
	ID     string `json:"id"     gorm:"primaryKey"`
	UserID string `json:"userId" gorm:"column:userId"`
	Type   Type   `json:"type"`
	Params Params `json:"params" gorm:"type:jsonb"`
	Read   bool   `json:"read"`
}

func (n *Notification) BeforeCreate(_ *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.NewString()
	}

	return nil
}

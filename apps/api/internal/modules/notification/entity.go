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
	TypeWelcome      Type = "welcome"
	TypeNewQuestions Type = "new_questions"
	TypeDaily        Type = "daily"
	TypeBadgeEarned  Type = "badge_earned"

	// TypeReviewMilestone and TypeStreak are no longer emitted — reviewed-count
	// and streak milestones now award durable badges (TypeBadgeEarned) instead.
	// The constants are retained because rows of these types persist in existing
	// users' notification history and the client still renders them.
	TypeReviewMilestone Type = "review_milestone"
	TypeStreak          Type = "streak"
)

type Notification struct {
	shared.Base
	ID     string `json:"id"     gorm:"primaryKey"`
	UserID string `json:"userId" gorm:"column:userId"`
	Type   Type   `json:"type"`
	Params Params `json:"params" gorm:"type:jsonb"`
	// Seen = surfaced to the user (badge cleared when the list is opened);
	// Read = acted on (row clicked or "mark all read"). Reading implies seen.
	Seen bool `json:"seen"`
	Read bool `json:"read"`
}

func (n *Notification) BeforeCreate(_ *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.NewString()
	}

	return nil
}

package badge

import "time"

// BadgeView is one catalog badge with this user's earn status. The full catalog
// is always returned (locked + earned) so the client can render a complete
// trophy case with progress; localized name/description/icon are client-side,
// keyed by ID.
type BadgeView struct {
	ID        string     `json:"id"`
	Category  string     `json:"category"`
	Tier      string     `json:"tier"`
	Threshold int        `json:"threshold"`
	Earned    bool       `json:"earned"`
	EarnedAt  *time.Time `json:"earnedAt"`
}

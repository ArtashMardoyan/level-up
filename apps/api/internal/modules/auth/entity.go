package auth

import "time"

// RevokedToken is a single logged-out JWT, keyed by its jti claim. A token whose
// jti is present here is rejected by the auth middleware until it expires.
type RevokedToken struct {
	JTI       string    `gorm:"column:jti;primaryKey" json:"jti"`
	ExpiresAt time.Time `gorm:"column:expiresAt"      json:"expiresAt"`
	CreatedAt time.Time `gorm:"column:createdAt"      json:"createdAt"`
}

func (RevokedToken) TableName() string {
	return "revoked_tokens"
}

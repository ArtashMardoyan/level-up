package shared

const (
	// ContextUserKey holds the authenticated user.User set by the auth middleware.
	ContextUserKey = "auth_user"
	// ContextJTIKey holds the current token's jti (string).
	ContextJTIKey = "auth_jti"
	// ContextExpiryKey holds the current token's expiry (time.Time).
	ContextExpiryKey = "auth_expiry"
)

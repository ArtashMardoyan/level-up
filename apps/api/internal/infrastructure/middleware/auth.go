package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/shared"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// RevocationStore reports whether a token (by its jti) has been logged out.
// The auth module's RevokedTokenRepository satisfies this interface.
type RevocationStore interface {
	IsRevoked(ctx context.Context, jti string) (bool, error)
}

type jwtClaims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

func JWT(userRepo user.Repository, revoked RevocationStore, jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			shared.Error(c, http.StatusUnauthorized, "missing or invalid authorization header")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims := &jwtClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}

			return secret, nil
		})

		if err != nil || !token.Valid {
			shared.Error(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		isRevoked, err := revoked.IsRevoked(c.Request.Context(), claims.ID)
		if err != nil {
			shared.Error(c, http.StatusInternalServerError, "failed to verify token")
			c.Abort()
			return
		}

		if isRevoked {
			shared.Error(c, http.StatusUnauthorized, "token has been revoked")
			c.Abort()
			return
		}

		u, err := userRepo.FindByID(c.Request.Context(), claims.UserID)
		if err != nil {
			shared.Error(c, http.StatusUnauthorized, "user not found")
			c.Abort()
			return
		}

		c.Set(shared.ContextUserKey, u)
		c.Set(shared.ContextJTIKey, claims.ID)

		if claims.ExpiresAt != nil {
			c.Set(shared.ContextExpiryKey, claims.ExpiresAt.Time)
		}

		c.Next()
	}
}

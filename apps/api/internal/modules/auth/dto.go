package auth

import (
	"level-up-backend/internal/modules/user"

	"github.com/golang-jwt/jwt/v5"
)

type LoginDTO struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponseDTO struct {
	AccessToken string    `json:"accessToken"`
	User        user.User `json:"user"`
}

type Claims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

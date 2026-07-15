package auth

import (
	"context"
	"errors"
	"time"

	"level-up-backend/internal/modules/user"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const tokenTTL = 24 * time.Hour

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountDeactivated = errors.New("account is deactivated")
)

type Service struct {
	userRepo    user.Repository
	revokedRepo RevokedTokenRepository
	jwtSecret   []byte
}

func NewService(userRepo user.Repository, revokedRepo RevokedTokenRepository, jwtSecret string) *Service {
	return &Service{userRepo: userRepo, revokedRepo: revokedRepo, jwtSecret: []byte(jwtSecret)}
}

func (s *Service) Login(ctx context.Context, dto LoginDTO) (LoginResponseDTO, error) {
	u, err := s.userRepo.FindByEmail(ctx, dto.Email)
	if err != nil {
		return LoginResponseDTO{}, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(dto.Password)); err != nil {
		return LoginResponseDTO{}, ErrInvalidCredentials
	}

	if u.Status == user.StatusDeactivated {
		return LoginResponseDTO{}, ErrAccountDeactivated
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID: u.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.NewString(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
		},
	})

	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return LoginResponseDTO{}, err
	}

	return LoginResponseDTO{AccessToken: signed, User: u}, nil
}

// Logout revokes the caller's token by storing its jti until it would have expired.
func (s *Service) Logout(ctx context.Context, jti string, expiresAt time.Time) error {
	return s.revokedRepo.Revoke(ctx, jti, expiresAt)
}

package auth

import (
	"errors"
	"net/http"
	"time"

	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/shared"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, auth gin.HandlerFunc) {
	group := r.Group("/auth")
	group.POST("/login", h.Login)
	group.GET("/me", auth, h.Me)
	group.POST("/logout", auth, h.Logout)
}

func (h *Handler) Login(c *gin.Context) {
	var dto LoginDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Login(c.Request.Context(), dto)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			shared.Error(c, http.StatusUnauthorized, "invalid credentials")
		case errors.Is(err, ErrAccountDeactivated):
			shared.Error(c, http.StatusForbidden, "account is deactivated")
		default:
			shared.Error(c, http.StatusInternalServerError, "login failed")
		}

		return
	}

	shared.OK(c, result)
}

func (*Handler) Me(c *gin.Context) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	u, ok := val.(user.User)
	if !ok {
		shared.Error(c, http.StatusInternalServerError, "internal error")
		return
	}

	shared.OK(c, u)
}

func (h *Handler) Logout(c *gin.Context) {
	jti, ok := contextTokenID(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	expiresAt, ok := contextTokenExp(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.service.Logout(c.Request.Context(), jti, expiresAt); err != nil {
		shared.Error(c, http.StatusInternalServerError, "logout failed")
		return
	}

	shared.NoContent(c)
}

func contextTokenID(c *gin.Context) (string, bool) {
	val, exists := c.Get(shared.ContextJTIKey)
	if !exists {
		return "", false
	}

	jti, ok := val.(string)

	return jti, ok
}

func contextTokenExp(c *gin.Context) (time.Time, bool) {
	val, exists := c.Get(shared.ContextExpiryKey)
	if !exists {
		return time.Time{}, false
	}

	expiresAt, ok := val.(time.Time)

	return expiresAt, ok
}

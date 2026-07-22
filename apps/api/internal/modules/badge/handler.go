package badge

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"level-up-backend/internal/modules/user"
	"level-up-backend/internal/shared"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, auth gin.HandlerFunc) {
	badges := r.Group("/badges", auth)
	badges.GET("", h.List)
}

// List returns the full badge catalog with the caller's earn status.
func (h *Handler) List(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	views, err := h.service.ListForUser(c.Request.Context(), caller.ID)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch badges")
		return
	}

	shared.OK(c, views)
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}

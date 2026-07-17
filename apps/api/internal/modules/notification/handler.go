package notification

import (
	"errors"
	"net/http"

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
	notifications := r.Group("/notifications", auth)
	notifications.GET("", h.List)
	notifications.GET("/unseen-count", h.UnseenCount)
	notifications.PATCH("/seen", h.MarkAllSeen)
	notifications.PATCH("/read", h.MarkAllRead)
	notifications.PATCH("/:id/read", h.MarkRead)
}

func (h *Handler) List(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var q shared.PaginationQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.ListByUser(c.Request.Context(), caller.ID, q)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}

	shared.OK(c, result)
}

func (h *Handler) UnseenCount(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	count, err := h.service.UnseenCount(c.Request.Context(), caller.ID)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to count notifications")
		return
	}

	shared.OK(c, gin.H{"count": count})
}

func (h *Handler) MarkAllSeen(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.service.MarkAllSeen(c.Request.Context(), caller.ID); err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to update notifications")
		return
	}

	shared.NoContent(c)
}

func (h *Handler) MarkAllRead(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.service.MarkAllRead(c.Request.Context(), caller.ID); err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to update notifications")
		return
	}

	shared.NoContent(c)
}

func (h *Handler) MarkRead(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.service.MarkRead(c.Request.Context(), caller.ID, c.Param("id")); err != nil {
		if errors.Is(err, ErrNotFound) {
			shared.Error(c, http.StatusNotFound, "notification not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to update notification")
		return
	}

	shared.NoContent(c)
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}

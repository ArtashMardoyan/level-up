package user

import (
	"errors"
	"net/http"

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
	users := r.Group("/users")
	users.POST("", h.Create)

	protected := users.Group("", auth)
	protected.GET("", h.List)
	protected.GET("/:id", h.Get)
	protected.PATCH("", h.Update)
	protected.DELETE("", h.Delete)
}

func (h *Handler) List(c *gin.Context) {
	var q shared.PaginationQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.FindAll(c.Request.Context(), q)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch users")
		return
	}

	shared.OK(c, result)
}

func (h *Handler) Get(c *gin.Context) {
	u, err := h.service.FindByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			shared.Error(c, http.StatusNotFound, "user not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to fetch user")
		return
	}

	shared.OK(c, u)
}

func (h *Handler) Create(c *gin.Context) {
	var dto CreateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	u, err := h.service.Create(c.Request.Context(), dto)
	if err != nil {
		if errors.Is(err, ErrEmailTaken) {
			shared.Error(c, http.StatusConflict, err.Error())
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to create user")
		return
	}

	shared.Created(c, u)
}

func (h *Handler) Update(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var dto UpdateDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	u, err := h.service.Update(c.Request.Context(), caller.ID, &dto)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			shared.Error(c, http.StatusNotFound, "user not found")
			return
		}

		if errors.Is(err, ErrEmailTaken) {
			shared.Error(c, http.StatusConflict, err.Error())
			return
		}

		if errors.Is(err, ErrWrongPassword) {
			shared.Error(c, http.StatusUnauthorized, err.Error())
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to update user")
		return
	}

	shared.OK(c, u)
}

func (h *Handler) Delete(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := h.service.Delete(c.Request.Context(), caller.ID); err != nil {
		if errors.Is(err, ErrNotFound) {
			shared.Error(c, http.StatusNotFound, "user not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to delete user")
		return
	}

	shared.NoContent(c)
}

func contextUser(c *gin.Context) (User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return User{}, false
	}

	u, ok := val.(User)

	return u, ok
}

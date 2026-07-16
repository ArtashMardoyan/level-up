package course

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
	courses := r.Group("/courses")
	courses.GET("", h.ListCourses)
	courses.GET("/full", h.ListCoursesFull)
	courses.GET("/:id", h.GetCourse)
	courses.GET("/:id/progress", auth, h.GetCourseProgress)

	questions := r.Group("/questions", auth)
	questions.PATCH("/:id/progress", h.UpsertQuestionProgress)

	progress := r.Group("/progress", auth)
	progress.POST("/bulk", h.BulkProgress)
	progress.GET("/summary", h.Summary)
}

func (h *Handler) ListCourses(c *gin.Context) {
	courses, err := h.service.ListCourses(c.Request.Context())
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch courses")
		return
	}

	shared.OK(c, courses)
}

func (h *Handler) ListCoursesFull(c *gin.Context) {
	lang := c.DefaultQuery("lang", defaultLang)

	courses, err := h.service.ListCoursesFull(c.Request.Context(), lang)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch courses")
		return
	}

	shared.OK(c, courses)
}

func (h *Handler) GetCourse(c *gin.Context) {
	lang := c.DefaultQuery("lang", defaultLang)

	course, err := h.service.GetCourse(c.Request.Context(), c.Param("id"), lang)
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			shared.Error(c, http.StatusNotFound, "course not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to fetch course")
		return
	}

	shared.OK(c, course)
}

func (h *Handler) GetCourseProgress(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	progress, err := h.service.CourseProgress(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrCourseNotFound) {
			shared.Error(c, http.StatusNotFound, "course not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to fetch progress")
		return
	}

	shared.OK(c, progress)
}

func (h *Handler) UpsertQuestionProgress(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var dto UpsertProgressDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	state, err := h.service.UpsertProgress(c.Request.Context(), caller.ID, c.Param("id"), dto)
	if err != nil {
		if errors.Is(err, ErrQuestionNotFound) {
			shared.Error(c, http.StatusNotFound, "question not found")
			return
		}

		shared.Error(c, http.StatusInternalServerError, "failed to update progress")
		return
	}

	shared.OK(c, state)
}

func (h *Handler) BulkProgress(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var dto BulkProgressDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.BulkUpsert(c.Request.Context(), caller.ID, dto); err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to save progress")
		return
	}

	shared.NoContent(c)
}

func (h *Handler) Summary(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.service.Summary(c.Request.Context(), caller.ID)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch summary")
		return
	}

	shared.OK(c, summary)
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}

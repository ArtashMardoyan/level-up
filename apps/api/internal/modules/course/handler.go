package course

import (
	"errors"
	"fmt"
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
	courses.GET("/version", h.ContentVersion)
	courses.GET("/full", h.ListCoursesFull)
	courses.GET("/:id", h.GetCourse)
	courses.GET("/:id/progress", auth, h.GetCourseProgress)

	questions := r.Group("/questions", auth)
	questions.PATCH("/:id/progress", h.UpsertQuestionProgress)

	progress := r.Group("/progress", auth)
	progress.POST("/bulk", h.BulkProgress)
	progress.GET("/summary", h.Summary)
	progress.GET("/saved", h.Saved)
}

func (h *Handler) ListCourses(c *gin.Context) {
	courses, err := h.service.ListCourses(c.Request.Context())
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch courses")
		return
	}

	shared.OK(c, courses)
}

func (h *Handler) ContentVersion(c *gin.Context) {
	version, err := h.service.ContentVersion(c.Request.Context())
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch version")
		return
	}

	c.Header("Cache-Control", "no-cache")

	shared.OK(c, VersionDTO{Version: version})
}

func (h *Handler) ListCoursesFull(c *gin.Context) {
	lang := c.DefaultQuery("lang", defaultLang)

	// Content-version ETag: skip rebuilding the (heavy) payload when the client
	// already holds the current version. Falls through to a normal response if
	// the version lookup fails.
	if version, err := h.service.ContentVersion(c.Request.Context()); err == nil {
		etag := fmt.Sprintf(`W/"%s-%s"`, version, lang)
		c.Header("ETag", etag)
		c.Header("Cache-Control", "public, max-age=0, must-revalidate")
		if c.GetHeader("If-None-Match") == etag {
			c.Status(http.StatusNotModified)
			return
		}
	}

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

func (h *Handler) Saved(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	saved, err := h.service.SavedQuestions(c.Request.Context(), caller.ID, c.DefaultQuery("lang", defaultLang))
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch saved questions")
		return
	}

	shared.OK(c, saved)
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}

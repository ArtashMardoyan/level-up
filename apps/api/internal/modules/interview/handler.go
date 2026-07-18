package interview

import (
	"errors"
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
	interviews := r.Group("/interviews", auth)
	interviews.POST("", h.Create)
	interviews.GET("", h.List)
	interviews.GET("/:id", h.Get)
	interviews.POST("/:id/answers/:questionId", h.SubmitAnswer)
	interviews.POST("/:id/complete", h.Complete)
	interviews.GET("/:id/report", h.Report)
}

func (h *Handler) Create(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateInterviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	view, err := h.service.Start(c.Request.Context(), caller.ID, req)
	if err != nil {
		writeError(c, err)
		return
	}

	shared.Created(c, view)
}

func (h *Handler) Get(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Get(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
}

func (h *Handler) SubmitAnswer(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		shared.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.SubmitAnswer(c.Request.Context(), caller.ID, c.Param("id"), c.Param("questionId"), req)
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, resp)
}

func (h *Handler) Complete(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Complete(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
}

func (h *Handler) Report(c *gin.Context) {
	caller, ok := contextUser(c)
	if !ok {
		shared.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	view, err := h.service.Report(c.Request.Context(), caller.ID, c.Param("id"))
	if err != nil {
		writeError(c, err)
		return
	}

	shared.OK(c, view)
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

	result, err := h.service.List(c.Request.Context(), caller.ID, q)
	if err != nil {
		shared.Error(c, http.StatusInternalServerError, "failed to fetch interviews")
		return
	}

	shared.OK(c, result)
}

// writeError maps service sentinel errors to HTTP status codes.
func writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		shared.Error(c, http.StatusNotFound, "interview not found")
	case errors.Is(err, ErrCourseNotFound):
		shared.Error(c, http.StatusNotFound, "course not found")
	case errors.Is(err, ErrActiveSession):
		shared.Error(c, http.StatusConflict, "you already have an interview in progress")
	case errors.Is(err, ErrNotEditable):
		shared.Error(c, http.StatusConflict, "this interview is not in progress")
	case errors.Is(err, ErrQuestionNotIn):
		shared.Error(c, http.StatusBadRequest, "question is not part of this interview")
	case errors.Is(err, ErrNoQuestions):
		shared.Error(c, http.StatusUnprocessableEntity, "no questions available for this course")
	case errors.Is(err, ErrNoResults):
		shared.Error(c, http.StatusUnprocessableEntity, "answer at least one question first")
	default:
		shared.Error(c, http.StatusInternalServerError, "something went wrong")
	}
}

func contextUser(c *gin.Context) (user.User, bool) {
	val, exists := c.Get(shared.ContextUserKey)
	if !exists {
		return user.User{}, false
	}

	u, ok := val.(user.User)

	return u, ok
}
